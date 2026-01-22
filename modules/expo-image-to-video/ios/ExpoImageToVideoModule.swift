import ExpoModulesCore
import AVFoundation
import UIKit
import CoreVideo

// MARK: - Expo Module

public class ExpoImageToVideoModule: Module {
  // 스트리밍 인코더 세션 저장
  private var streamingSessions: [String: StreamingEncoder] = [:]

  public func definition() -> ModuleDefinition {
    Name("ExpoImageToVideo")

    // 1) 파일 경로 배열로부터 비디오 생성
    AsyncFunction("createVideo") { (imagePaths: [String], outputPath: String, fps: Double) in
      try await self.createVideo(fromFilePaths: imagePaths, to: outputPath, fps: fps)
      return outputPath
    }

    // 2) Base64 데이터 배열로부터 비디오 생성 (data URI 포함/미포함 모두 허용)
    AsyncFunction("createVideoFromBase64") { (base64Images: [String], outputPath: String, fps: Double) in
      try await self.createVideo(fromBase64Images: base64Images, to: outputPath, fps: fps)
      return outputPath
    }

    // 3) 스트리밍 인코더 시작 - 청크 단위로 프레임 추가 가능
    AsyncFunction("startStreamingEncoder") { (sessionId: String, outputPath: String, fps: Double, width: Int, height: Int) in
      try await self.startStreamingEncoder(sessionId: sessionId, outputPath: outputPath, fps: fps, width: width, height: height)
      return sessionId
    }

    // 4) 스트리밍 인코더에 프레임 청크 추가
    AsyncFunction("appendFrames") { (sessionId: String, base64Images: [String]) in
      try await self.appendFrames(sessionId: sessionId, base64Images: base64Images)
      return true
    }

    // 5) 스트리밍 인코더 종료 및 파일 완성
    AsyncFunction("finishStreamingEncoder") { (sessionId: String) in
      return try await self.finishStreamingEncoder(sessionId: sessionId)
    }
  }

  // MARK: - Public Creators

  /// 파일 경로 기반
  internal func createVideo(fromFilePaths imagePaths: [String], to outputPath: String, fps: Double) async throws {
    let normalized: [String] = imagePaths
      .map { stripFileScheme($0) }
      .filter { FileManager.default.fileExists(atPath: $0) }
      .filter {
        if let attrs = try? FileManager.default.attributesOfItem(atPath: $0),
           let size = attrs[.size] as? NSNumber {
          return size.intValue > 0
        }
        return false
      }

    let images: [UIImage] = normalized.compactMap { UIImage(contentsOfFile: $0) }
    try await encode(images: images, to: outputPath, fps: fps)
  }

  /// Base64 기반 (data URI or 순수 base64 모두 허용)
  internal func createVideo(fromBase64Images base64Images: [String], to outputPath: String, fps: Double) async throws {
    let images: [UIImage] = base64Images.compactMap { decodeBase64ToImage($0) }
    try await encode(images: images, to: outputPath, fps: fps)
  }

  // MARK: - Core Encoding

  /// 공통 인코딩 루틴
  private func encode(images: [UIImage], to outputPath: String, fps: Double) async throws {
    guard let first = images.first else {
      throw NSError(domain: "ExpoImageToVideo", code: 1, userInfo: [NSLocalizedDescriptionKey: "No valid images"])
    }

    // 모든 프레임을 첫 프레임 크기에 맞춤(해상도 불일치 방지)
    let targetSize = first.size
    let sizedImages: [UIImage] = images.compactMap { img in
      if img.size.equalTo(targetSize) { return img }
      return img.resized(to: targetSize)
    }

    // 출력 URL 준비
    let outputPathStr = stripFileScheme(outputPath) // "file://..." → "/var/..."
    let outputURL = URL(fileURLWithPath: outputPathStr)

    // 상위 디렉터리 생성 (없으면 생성)
    let parentDir = outputURL.deletingLastPathComponent()
    try FileManager.default.createDirectory(at: parentDir, withIntermediateDirectories: true)

    if FileManager.default.fileExists(atPath: outputURL.path) {
      try FileManager.default.removeItem(atPath: outputURL.path)
    }

    // AVAssetWriter 설정
    let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
    let settings: [String: Any] = [
      AVVideoCodecKey: AVVideoCodecType.h264,
      AVVideoWidthKey: Int(targetSize.width),
      AVVideoHeightKey: Int(targetSize.height),
    ]
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
    input.expectsMediaDataInRealTime = false

    let adaptor = AVAssetWriterInputPixelBufferAdaptor(
      assetWriterInput: input,
      sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
        kCVPixelBufferWidthKey as String: Int(targetSize.width),
        kCVPixelBufferHeightKey as String: Int(targetSize.height),
        kCVPixelBufferOpenGLESCompatibilityKey as String: true
      ]
    )

    guard writer.canAdd(input) else {
      throw NSError(domain: "ExpoImageToVideo", code: 2, userInfo: [NSLocalizedDescriptionKey: "Cannot add input to writer"])
    }

    writer.add(input)
    writer.startWriting()
    writer.startSession(atSourceTime: .zero)

    let timescale = max(1, Int32(fps))
    let frameDuration = CMTime(value: 1, timescale: CMTimeScale(timescale))
    var frameCount: Int64 = 0

    for image in sizedImages {
      autoreleasepool {
        guard let buffer = image.pixelBuffer(width: Int(targetSize.width), height: Int(targetSize.height)) else { return }

        while !input.isReadyForMoreMediaData {
          Thread.sleep(forTimeInterval: 0.003)
        }

        let pts = CMTimeMultiply(frameDuration, multiplier: Int32(frameCount))
        adaptor.append(buffer, withPresentationTime: pts)
        frameCount += 1
      }
    }

    input.markAsFinished()

    // finishWriting 비동기 종료 대기
    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      writer.finishWriting {
        continuation.resume()
      }
    }

    // 최종 상태 확인
    if writer.status != .completed {
      let reason = writer.error?.localizedDescription ?? "Unknown"
      throw NSError(domain: "ExpoImageToVideo", code: 3, userInfo: [NSLocalizedDescriptionKey: "Writer failed: \(reason)"])
    }
  }

  // MARK: - Streaming Encoder

  private func startStreamingEncoder(sessionId: String, outputPath: String, fps: Double, width: Int, height: Int) async throws {
    // 기존 세션이 있으면 정리
    if let existingEncoder = streamingSessions[sessionId] {
      do {
        _ = try await existingEncoder.finish()
      } catch {
        // 기존 세션 종료 실패해도 계속 진행
      }
      streamingSessions.removeValue(forKey: sessionId)
    }

    let outputPathStr = stripFileScheme(outputPath)
    let outputURL = URL(fileURLWithPath: outputPathStr)

    let parentDir = outputURL.deletingLastPathComponent()
    try FileManager.default.createDirectory(at: parentDir, withIntermediateDirectories: true)

    if FileManager.default.fileExists(atPath: outputURL.path) {
      try FileManager.default.removeItem(atPath: outputURL.path)
    }

    let encoder = try StreamingEncoder(outputURL: outputURL, fps: fps, width: width, height: height)
    streamingSessions[sessionId] = encoder
  }

  private func appendFrames(sessionId: String, base64Images: [String]) async throws {
    guard let encoder = streamingSessions[sessionId] else {
      throw NSError(domain: "ExpoImageToVideo", code: 10, userInfo: [NSLocalizedDescriptionKey: "Session not found: \(sessionId)"])
    }

    for base64 in base64Images {
      autoreleasepool {
        if let image = decodeBase64ToImage(base64) {
          encoder.appendFrame(image)
        }
      }
    }
  }

  private func finishStreamingEncoder(sessionId: String) async throws -> String {
    guard let encoder = streamingSessions[sessionId] else {
      throw NSError(domain: "ExpoImageToVideo", code: 10, userInfo: [NSLocalizedDescriptionKey: "Session not found: \(sessionId)"])
    }

    defer {
      streamingSessions.removeValue(forKey: sessionId)
    }

    let outputPath = try await encoder.finish()
    return outputPath
  }

  // MARK: - Utils

  private func stripFileScheme(_ path: String) -> String {
    if path.hasPrefix("file://") {
      return String(path.dropFirst("file://".count))
    }
    return path
  }

  private func decodeBase64ToImage(_ str: String) -> UIImage? {
    // data URI (e.g., data:image/jpeg;base64,XXXXX) 지원
    if let commaIdx = str.firstIndex(of: ",") {
      let base64Part = String(str[str.index(after: commaIdx)...])
      if let data = Data(base64Encoded: base64Part) { return UIImage(data: data) }
    } else if let data = Data(base64Encoded: str) {
      return UIImage(data: data)
    }
    return nil
  }
}

// MARK: - Streaming Encoder Class

class StreamingEncoder {
  private let writer: AVAssetWriter
  private let input: AVAssetWriterInput
  private let adaptor: AVAssetWriterInputPixelBufferAdaptor
  private let targetSize: CGSize
  private let frameDuration: CMTime
  private var frameCount: Int64 = 0
  private let outputURL: URL

  init(outputURL: URL, fps: Double, width: Int, height: Int) throws {
    self.outputURL = outputURL
    self.targetSize = CGSize(width: width, height: height)

    writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)

    let settings: [String: Any] = [
      AVVideoCodecKey: AVVideoCodecType.h264,
      AVVideoWidthKey: width,
      AVVideoHeightKey: height,
    ]

    input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
    input.expectsMediaDataInRealTime = true // 스트리밍 모드

    adaptor = AVAssetWriterInputPixelBufferAdaptor(
      assetWriterInput: input,
      sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
        kCVPixelBufferWidthKey as String: width,
        kCVPixelBufferHeightKey as String: height,
      ]
    )

    guard writer.canAdd(input) else {
      throw NSError(domain: "ExpoImageToVideo", code: 11, userInfo: [NSLocalizedDescriptionKey: "Cannot add input to writer"])
    }

    writer.add(input)
    writer.startWriting()
    writer.startSession(atSourceTime: .zero)

    let timescale = max(1, Int32(fps))
    frameDuration = CMTime(value: 1, timescale: CMTimeScale(timescale))
  }

  func appendFrame(_ image: UIImage) {
    let resizedImage = image.size.equalTo(targetSize) ? image : image.resized(to: targetSize)

    guard let buffer = resizedImage.pixelBuffer(width: Int(targetSize.width), height: Int(targetSize.height)) else { return }

    while !input.isReadyForMoreMediaData {
      Thread.sleep(forTimeInterval: 0.001)
    }

    let pts = CMTimeMultiply(frameDuration, multiplier: Int32(frameCount))
    adaptor.append(buffer, withPresentationTime: pts)
    frameCount += 1
  }

  func finish() async throws -> String {
    input.markAsFinished()

    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      writer.finishWriting {
        continuation.resume()
      }
    }

    if writer.status != .completed {
      let reason = writer.error?.localizedDescription ?? "Unknown"
      throw NSError(domain: "ExpoImageToVideo", code: 12, userInfo: [NSLocalizedDescriptionKey: "Writer failed: \(reason)"])
    }

    return outputURL.path
  }
}

// MARK: - UIImage Helpers (파일 스코프에 위치해야 함)

extension UIImage {
  /// 지정 크기로 리사이즈 (aspect fill/fit 대신 정확히 지정 크기 픽셀 버퍼에 맞추기)
  func resized(to size: CGSize) -> UIImage {
    let format = UIGraphicsImageRendererFormat.default()
    format.scale = 1 // 실제 픽셀 기반 사이즈 유지
    let renderer = UIGraphicsImageRenderer(size: size, format: format)
    return renderer.image { ctx in
      self.draw(in: CGRect(origin: .zero, size: size))
    }
  }

  /// UIImage -> CVPixelBuffer (BGRA)
  func pixelBuffer(width: Int, height: Int) -> CVPixelBuffer? {
    let attrs: [String: Any] = [
      kCVPixelBufferCGImageCompatibilityKey as String: true,
      kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
      kCVPixelBufferWidthKey as String: width,
      kCVPixelBufferHeightKey as String: height,
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
    ]

    var pixelBuffer: CVPixelBuffer?
    CVPixelBufferCreate(kCFAllocatorDefault,
                        width,
                        height,
                        kCVPixelFormatType_32BGRA,
                        attrs as CFDictionary,
                        &pixelBuffer)

    guard let buffer = pixelBuffer else { return nil }

    CVPixelBufferLockBaseAddress(buffer, [])
    defer { CVPixelBufferUnlockBaseAddress(buffer, []) }

    guard let ctx = CGContext(
      data: CVPixelBufferGetBaseAddress(buffer),
      width: width,
      height: height,
      bitsPerComponent: 8,
      bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
      space: CGColorSpaceCreateDeviceRGB(),
      // BGRA: premultipliedFirst + byteOrder32Little
      bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue
                | CGBitmapInfo.byteOrder32Little.rawValue
    ) else { return nil }

    if let cg = self.cgImage {
      ctx.draw(cg, in: CGRect(x: 0, y: 0, width: width, height: height))
    } else {
      // cgImage가 없는 타입(예: CIImage only) 대비해서 fallback
      let rect = CGRect(x: 0, y: 0, width: width, height: height)
      UIColor.black.setFill()
      ctx.fill(rect)
    }

    return buffer
  }
}
