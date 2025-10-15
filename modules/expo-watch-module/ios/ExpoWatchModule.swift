import ExpoModulesCore
import HealthKit
import WatchConnectivity
import os

// 브리지: NSObject 상속 + WCSessionDelegate 구현
fileprivate final class WCBridge: NSObject, WCSessionDelegate {
  weak var module: ExpoWatchModule?
  private let logger = Logger(subsystem: "ExpoWatchModule", category: "WC")
  
  fileprivate let iso: ISO8601DateFormatter = {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f
  }()

  fileprivate func parseISO(_ v: Any?) -> Date? {
    guard let s = v as? String else { return nil }
    return iso.date(from: s)
  }

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
    guard s.isPaired, s.isWatchAppInstalled else { return false }

    var payload = dict
    if payload["eventTs"] == nil {
      payload["eventTs"] = iso.string(from: Date()) 
    }

    guard let data = try? JSONSerialization.data(withJSONObject: payload) else {
      return false
    }

    if s.isReachable {
      s.sendMessageData(data, replyHandler: nil) { err in
        self.logger.debug("sendMessageData failed: \(err.localizedDescription)")
      }
      return true
    } else {
      s.transferUserInfo(payload)
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
      case "state":
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
      self.wc.activate()
    }

    Events("heartRate", "watchState")
    OnStartObserving { self.hasListeners = true }
    OnStopObserving  { self.hasListeners = false }
    

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

    AsyncFunction("startWorkout") { (activity: String, eventTs: String?) -> Bool in
      await self.wc.sendCommand([
        "cmd": "start",
        "activity": activity,
        "eventTs": eventTs as Any
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
