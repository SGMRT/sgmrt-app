import ExpoModulesCore
import HealthKit
import WatchConnectivity
import os

// 브리지: NSObject 상속 + WCSessionDelegate 구현
fileprivate final class WCBridge: NSObject, WCSessionDelegate {
  weak var module: ExpoWatchModule?
  private let logger = Logger(subsystem: "ExpoWatchModule", category: "WC")

  func activate() {
    guard WCSession.isSupported() else { return }
    let s = WCSession.default
    s.delegate = self
    s.activate()
  }

  // 워치로 명령 전송
  @discardableResult
  func sendCommand(_ dict: [String: Any]) async -> Bool {
    activate()
    guard WCSession.isSupported() else { return false }
    let s = WCSession.default

    // 페어링/설치 안됐으면 전송하지 않음(조용히 실패)
    guard s.isPaired, s.isWatchAppInstalled else { return false }

    guard let data = try? JSONSerialization.data(withJSONObject: dict) else {
      return false
    }

    if s.isReachable {
      s.sendMessageData(data, replyHandler: nil) { err in
        // 에러도 사용자에겐 조용히: 필요하면 debug 로깅
        self.logger.debug("sendMessageData failed: \(err.localizedDescription)")
      }
      return true
    } else {
      s.transferUserInfo(dict) // 지연 전송 큐에 올림
      return true
    }
  }

  // MARK: - WCSessionDelegate
  func session(_ session: WCSession,
               activationDidCompleteWith activationState: WCSessionActivationState,
               error: Error?) {
    module?.emit("watchState", [
      "state": "\(activationState.rawValue)",
      "error": error?.localizedDescription ?? NSNull()
    ])
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}
  func sessionDidDeactivate(_ session: WCSession) { WCSession.default.activate() }

  func session(_ session: WCSession, didReceiveMessageData messageData: Data) {
    guard let obj = try? JSONSerialization.jsonObject(with: messageData) as? [String: Any] else { return }
    forward(obj)
  }

  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String : Any] = [:]) {
    forward(userInfo)
  }

  private func forward(_ obj: [String: Any]) {
    let type = (obj["type"] as? String) ?? inferTypeFallback(obj)
    switch type {
      case "bpm":
        if let bpm = obj["bpm"] as? Double {
          module?.emit("heartRate", ["bpm": bpm, "ts": obj["ts"] ?? NSNull()])
        }
      case "state":
        // 상태 이벤트는 그대로 내보내되, 원본 필드를 유지
        module?.emit("watchState", [
          "state": obj["state"] ?? NSNull(),
          "reason": obj["reason"] ?? NSNull(),
          "ts": obj["ts"] ?? NSNull()
        ])
      default:
        break
    }
  }

  private func inferTypeFallback(_ obj: [String: Any]) -> String {
    if obj["bpm"] != nil { return "bpm" }
    if obj["state"] != nil { return "state" }
    return "unknown"
  }
}

// 실제 Expo 모듈: BaseModule만 상속 (NSObject 상속 금지)
public final class ExpoWatchModule: Module {
  private let healthStore = HKHealthStore()
  private let logger = Logger(subsystem: "ExpoWatchModule", category: "HK")
  private var hasListeners = false
  private let wc = WCBridge() // 델리게이트 보유

  public func definition() -> ModuleDefinition {
    Name("ExpoWatchModule")

    OnCreate {
      self.wc.module = self
      self.wc.activate() // ← 추가
    }

    Events("heartRate", "watchState")

    OnStartObserving { self.hasListeners = true }
    OnStopObserving  { self.hasListeners = false }

    // 권한 요청
    AsyncFunction("requestAuthorization") { () -> Bool in
      guard HKHealthStore.isHealthDataAvailable() else { return false }
      let toShare: Set = [HKQuantityType.workoutType()]
      let toRead: Set  = [HKQuantityType(.heartRate), HKQuantityType.workoutType()]
      do {
        try await self.healthStore.requestAuthorization(toShare: toShare, read: toRead)
        return true
      } catch {
        self.logger.debug("HK auth failed: \(error.localizedDescription)")
        return false
      }
    }
    

    // 워치 앱 띄우고 → 즉시 start 명령
    AsyncFunction("startWatchApp") { () -> Bool in
      // 사전 조건 체크(지원/페어링/설치 + HealthKit 가능)
      guard WCSession.isSupported(),
            WCSession.default.isPaired,
            WCSession.default.isWatchAppInstalled,
            HKHealthStore.isHealthDataAvailable() else { return false }
      do {
        let config = HKWorkoutConfiguration()
        config.activityType = .running
        config.locationType = .outdoor
        try await self.healthStore.startWatchApp(toHandle: config)
        return true
      } catch {
        self.logger.debug("startWatchApp failed: \(error.localizedDescription)")
        return false
      }
    }

    AsyncFunction("pauseWatch")  { () -> Bool in
      let ok = await self.wc.sendCommand(["cmd": "pause"])
      return ok // false 여도 조용히 반환
    }

    AsyncFunction("resumeWatch") { () -> Bool in
      let ok = await self.wc.sendCommand(["cmd": "resume"])
      return ok
    }

    AsyncFunction("stopWatch")   { () -> Bool in
      let ok = await self.wc.sendCommand(["cmd": "stop"])
      return ok
    }

    Function("activateWC") { self.wc.activate() }
  }

  // JS 이벤트 내보내기 (리스너 있을 때만)
  fileprivate func emit(_ name: String, _ body: [String: Any]) {
    guard hasListeners else { return }
    sendEvent(name, body)
  }
}
