import ExpoModulesCore
import HealthKit
import WatchConnectivity
import os

// 브리지: NSObject 상속 + WCSessionDelegate 구현
fileprivate final class WCBridge: NSObject, WCSessionDelegate {
  weak var module: ExpoWatchModule?
  private let logger = Logger(subsystem: "ExpoWatchModule", category: "WC")
  private var pending: [[String: Any]] = []

  fileprivate let iso: ISO8601DateFormatter = {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f
  }()

  func activate() {
    guard WCSession.isSupported() else { return }
    let s = WCSession.default
    if s.delegate == nil { // 중복 세팅 방지
      s.delegate = self
    }
    if s.activationState != .activated {
      s.activate()
    }
  }

  @discardableResult
  func sendCommand(_ dict: [String: Any]) async -> Bool {
    activate()
    guard WCSession.isSupported() else { return false }
    let s = WCSession.default
    guard s.isPaired, s.isWatchAppInstalled else { return false }

    var payload = dict
    if payload["eventTs"] == nil { payload["eventTs"] = iso.string(from: Date()) }

    guard let data = try? JSONSerialization.data(withJSONObject: payload) else {
      return false
    }

    // 1) reachable이면 즉시 전송
    if s.isReachable {
      s.sendMessageData(data, replyHandler: nil) { err in
        self.logger.debug("sendMessageData failed: \(err.localizedDescription)")
        // 실패 시 큐에 넣어 재시도
        self.pending.append(payload)
      }
      return true
    }

    // 2) reachable이 아니면, 최신 상태 보장용으로 applicationContext 시도
    do {
      try s.updateApplicationContext(payload)
      return true
    } catch {
      self.logger.debug("updateApplicationContext failed: \(error.localizedDescription)")
      // 3) 최후 폴백: 배달 보장(지연 가능)
      s.transferUserInfo(payload)
      return true
    }
  }

  // MARK: - 재전송 훅
  private func flushPendingIfPossible() {
    let s = WCSession.default
    guard s.isReachable, !pending.isEmpty else { return }
    let items = pending
    pending.removeAll()
    for p in items {
      if let data = try? JSONSerialization.data(withJSONObject: p) {
        s.sendMessageData(data, replyHandler: nil) { err in
          self.logger.debug("retry sendMessageData failed: \(err.localizedDescription)")
          // 다시 실패하면 applicationContext → transferUserInfo 순으로 보전
          do { try s.updateApplicationContext(p) }
          catch { s.transferUserInfo(p) }
        }
      }
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
    flushPendingIfPossible()
  }

  func sessionReachabilityDidChange(_ session: WCSession) {
    flushPendingIfPossible()
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
    print("forward", obj);
    let type = (obj["type"] as? String) ?? inferTypeFallback(obj)
    switch type {
    case "state":
      module?.emit("watchState", [
        "state": obj["state"] ?? NSNull(),
        "reason": obj["reason"] ?? NSNull(),
        "ts": obj["ts"] ?? NSNull()
      ])
    case "bpm":
      module?.emit("heartRate", [
        "bpm": obj["bpm"] ?? 0,
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
      self.wc.activate()
    }

    Events("heartRate", "watchState")
    OnStartObserving { self.hasListeners = true }
    OnStopObserving  { self.hasListeners = false }
    

    // 워치 앱 띄우고 → 즉시 start 명령
    AsyncFunction("startWatchApp") { () -> Bool in
      guard WCSession.isSupported(),
            WCSession.default.isPaired,
            WCSession.default.isWatchAppInstalled,
            HKHealthStore.isHealthDataAvailable() else { return false }

      do {
        let config = HKWorkoutConfiguration()
        config.activityType = .running
        config.locationType = .outdoor
        try await self.healthStore.startWatchApp(toHandle: config)

        // 🔽 바로 워치에 start 명령 (워치가 단독 러닝 중이면 무시됨)
        _ = await self.wc.sendCommand([
          "cmd": "start",
          "activity": "running",
          "eventTs": self.wc.iso.string(from: Date()),
          "origin": "phone"
        ])

        return true
      } catch {
        self.logger.debug("startWatchApp failed: \(error.localizedDescription)")
        return false
      }
    }

    AsyncFunction("sendSync") { (payload: [String: Any]) in
      await self.wc.sendCommand(payload)
    }

    AsyncFunction("startWorkout") { (activity: String, eventTs: String?) -> Bool in
      await self.wc.sendCommand([
        "cmd": "start",
        "activity": activity,
        "eventTs": eventTs as Any,
        "origin": "phone"
      ])
    }

    AsyncFunction("pauseWatch")  { (eventTs: String?) -> Bool in
      await self.wc.sendCommand(["cmd": "pause", "eventTs": eventTs as Any])
    }

    AsyncFunction("resumeWatch") { (eventTs: String?) -> Bool in
      await self.wc.sendCommand(["cmd": "resume", "eventTs": eventTs as Any])
    }

    AsyncFunction("stopWatch")   { (eventTs: String?) -> Bool in
      await self.wc.sendCommand(["cmd": "stop", "eventTs": eventTs as Any])
    }

    Function("activateWC") { self.wc.activate() }
  }

  // JS 이벤트 내보내기 (리스너 있을 때만)
  fileprivate func emit(_ name: String, _ body: [String: Any]) {
    guard hasListeners else { return }
    sendEvent(name, body)
  }
}
