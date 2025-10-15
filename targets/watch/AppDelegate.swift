  import SwiftUI
  import WatchKit
  import WatchConnectivity
  import HealthKit
  import os

  // MARK: - AppDelegate
  class AppDelegate: NSObject,
                     WKApplicationDelegate,
                     WCSessionDelegate,
                     HKWorkoutSessionDelegate,
                     HKLiveWorkoutBuilderDelegate {
    
    static var shared: AppDelegate?             // ContentView에서 제어용 접근
    let healthStore = HKHealthStore()
    let logger = Logger(subsystem: "WatchApp", category: "WC")
    
    var wSession: HKWorkoutSession?
    var builder: HKLiveWorkoutBuilder?
    
    let ui = WorkoutUI()
    
    fileprivate let iso: ISO8601DateFormatter = {
      let f = ISO8601DateFormatter()
      f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
      return f
    }()
    
    fileprivate func parseISO(_ v: Any?) -> Date? {
      guard let s = v as? String else { return nil }
      return iso.date(from: s)
    }
    
    private var hasActiveSession: Bool {
      guard let s = wSession, let _ = builder else { return false }
      return s.state != .ended
    }
    
    // MARK: - 공통: iPhone으로 상태 전송 + 워치 UI 갱신
    private func sendState(_ state: String, at: Date? = nil, reason: String? = nil) {
      let ts = at ?? Date()
      DispatchQueue.main.async {
        self.ui.state = state
        
        switch state {
        case "started":
          self.ui.startedAt = ts
          self.ui.pauseAccum = 0
          self.ui.pauseStartedAt = nil
          self.ui.endedAt = nil
          self.ui.state = "running"
          
        case "running":
          if self.ui.startedAt == nil { self.ui.startedAt = ts }
          if let ps = self.ui.pauseStartedAt {
            self.ui.pauseAccum += ts.timeIntervalSince(ps)
            self.ui.pauseStartedAt = nil
          }
          self.ui.endedAt = nil
          
        case "paused":
          if self.ui.pauseStartedAt == nil {
            self.ui.pauseStartedAt = ts
          }
          
        case "ended":
          if let ps = self.ui.pauseStartedAt {
            self.ui.pauseAccum += ts.timeIntervalSince(ps)
            self.ui.pauseStartedAt = nil
          }
          self.ui.endedAt = ts
          
        default:
          break
        }
      }
      
      // iPhone으로도 브로드캐스트
      let payload: [String: Any] = [
        "type": "state",
        "state": state,
        "ts": iso.string(from: ts),
        "reason": reason ?? NSNull()
      ]
      send(payload)
    }
    
    private func sendBPM(_ bpm: Double) {
      DispatchQueue.main.async { self.ui.bpm = Int(bpm.rounded()) }
      send(["type": "bpm",
            "bpm": bpm,
            "ts": iso.string(from: Date())])
    }
    
    private func send(_ dict: [String: Any]) {
      let s = WCSession.default
      if let data = try? JSONSerialization.data(withJSONObject: dict) {
        if s.isReachable {
          s.sendMessageData(data, replyHandler: nil, errorHandler: { err in
            self.logger.error("sendMessageData failed: \(err.localizedDescription)")
          })
        } else {
          s.transferUserInfo(dict) // 지연 전송 (백그라운드/끊김 대비)
        }
      }
    }
    
    // MARK: - WKApplicationDelegate
    func applicationDidFinishLaunching() {
      AppDelegate.shared = self
      if WCSession.isSupported() {
        let s = WCSession.default
        s.delegate = self
        s.activate()
      }
      sendState("ready", reason: "launch")
    }
    
    func handle(_ workoutConfiguration: HKWorkoutConfiguration) {
      sendState("ready", reason: "watchAppLaunched")
    }
    
    // MARK: - WCSessionDelegate
    func session(_ session: WCSession,
                 activationDidCompleteWith activationState: WCSessionActivationState,
                 error: Error?) {}
    
    func sessionReachabilityDidChange(_ session: WCSession) {}
    
    // iPhone → 워치 (실시간)
    func session(_ session: WCSession, didReceiveMessageData messageData: Data) {
      guard let obj = try? JSONSerialization.jsonObject(with: messageData) as? [String: Any],
            let cmd = obj["cmd"] as? String else { return }
      
      // ★ 폰이 준 절대 시각
      let eventAt = parseISO(obj["eventTs"])
      
      switch cmd {
      case "start":
        let activity = (obj["activity"] as? String) ?? "running"
        Task { try? await startWorkout(activity: activity, at: eventAt) }
      case "pause":
        pauseWorkout(at: eventAt)
      case "resume":
        resumeWorkout(at: eventAt)
      case "stop":
        stopWorkout(at: eventAt)
      default:
        break
      }
    }
    
    
    // iPhone → 워치 (지연)
    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String : Any] = [:]) {
      guard let cmd = userInfo["cmd"] as? String else { return }
      let eventAt = parseISO(userInfo["eventTs"])
      
      switch cmd {
      case "start":
        let activity = (userInfo["activity"] as? String) ?? "running"
        Task { try? await startWorkout(activity: activity, at: eventAt) }
      case "pause":
        pauseWorkout(at: eventAt)
      case "resume":
        resumeWorkout(at: eventAt)
      case "stop":
        stopWorkout(at: eventAt)
      default:
        break
      }
    }
    
    // MARK: - Workout 제어
    func startWorkout(activity: String, at eventAt: Date?) async throws {
      try await requestHKAuth()
      
      let config = HKWorkoutConfiguration()
      config.activityType = (activity == "cycling") ? .cycling : .running
      config.locationType = .outdoor
      
      let session = try HKWorkoutSession(healthStore: healthStore, configuration: config)
      let builder = session.associatedWorkoutBuilder()
      builder.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: config)
      
      self.wSession = session
      self.builder = builder
      session.delegate = self
      builder.delegate = self
      
      let t = eventAt ?? Date()
      session.startActivity(with: t)
      try await builder.beginCollection(at: t)
      
      sendState("started", at: t, reason: "startWorkout@remote")
    }
    
    func pauseWorkout(at eventAt: Date?) {
      guard hasActiveSession else {
        logger.debug("pause ignored: no active session")
        return
      }
      let t = eventAt ?? Date()
      wSession?.pause()
      sendState("paused", at: t, reason: "pauseWorkout@remote")
    }
    
    func resumeWorkout(at eventAt: Date?) {
      guard hasActiveSession else {
        logger.debug("resume ignored: no active session")
        return
      }
      let t = eventAt ?? Date()
      wSession?.resume()
      sendState("running", at: t, reason: "resumeWorkout@remote")
    }
    
    func stopWorkout(at eventAt: Date?, reason: String? = nil) {
      guard hasActiveSession, let session = wSession, let builder = builder else {
        logger.debug("stop ignored: no active session")
        return
      }
      if session.state == .ended { return }
      
      let t = eventAt ?? Date()
      session.stopActivity(with: t)
      
      Task {
        try? await builder.endCollection(at: t)
        builder.discardWorkout()
        sendState("ended", at: t, reason: reason ?? "stopWorkout@remote")
      }
      
      self.wSession = nil
      self.builder = nil
    }
    
    private func requestHKAuth() async throws {
      let toRead: Set = [HKQuantityType(.heartRate), HKQuantityType.workoutType()]
      try await healthStore.requestAuthorization(toShare: [], read: toRead)
    }
    
    // MARK: - HKWorkoutSessionDelegate
    func workoutSession(_ workoutSession: HKWorkoutSession,
                        didChangeTo toState: HKWorkoutSessionState,
                        from fromState: HKWorkoutSessionState,
                        date: Date) {
      switch toState {
      case .running:
        sendState("running", at: date, reason: "delegate")
      case .paused:
        sendState("paused",  at: date, reason: "delegate")
      case .ended:
        guard let builder = self.builder else {
          sendState("ended", at: date, reason: "delegate (already nil)")
          return
        }
        Task {
          try? await builder.endCollection(at: date) // ← Date() 대신 date
          builder.discardWorkout()
          sendState("ended", at: date, reason: "delegate")
        }
        self.wSession = nil
        self.builder = nil
      default: break
      }
    }
    
    func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
      sendState("error", reason: String(describing: error))
    }
    
    // MARK: - HKLiveWorkoutBuilderDelegate
    func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}
    
    // 심박 실시간 송신
    func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder,
                        didCollectDataOf collectedTypes: Set<HKSampleType>) {
      for type in collectedTypes {
        guard let qt = type as? HKQuantityType, qt == HKQuantityType(.heartRate),
              let st = workoutBuilder.statistics(for: qt),
              let q = st.mostRecentQuantity() else { continue }
        let bpm = q.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
        sendBPM(bpm)
      }
    }
  }

extension AppDelegate {
  func stopWatchWorkout() {
    stopWorkout(at: Date())
  }
}
