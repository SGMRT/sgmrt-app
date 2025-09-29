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

    override init() {
      super.init()
      AppDelegate.shared = self
    }

    // MARK: - 공통: iPhone으로 상태 전송 + 워치 UI 갱신
    private func sendState(_ state: String, reason: String? = nil) {
      let now = Date()
      DispatchQueue.main.async {
        self.ui.state = state
        self.ui.reason = reason

        switch state {
          case "started":
            self.ui.startedAt = now
            self.ui.pauseAccum = 0
            self.ui.pauseStartedAt = nil

          case "running":
            if self.ui.startedAt == nil { self.ui.startedAt = now }
            if let ps = self.ui.pauseStartedAt {
              self.ui.pauseAccum += now.timeIntervalSince(ps)
              self.ui.pauseStartedAt = nil
            }

          case "paused":
            if self.ui.pauseStartedAt == nil {
              self.ui.pauseStartedAt = now
            }

          case "ended":
            if let ps = self.ui.pauseStartedAt {
              self.ui.pauseAccum += now.timeIntervalSince(ps)
              self.ui.pauseStartedAt = nil
            }

          default:
            break
        }
      }

      // iPhone으로도 브로드캐스트 (그대로 유지)
      let payload: [String: Any] = [
        "type": "state",
        "state": state,
        "ts": ISO8601DateFormatter().string(from: now),
        "reason": reason ?? NSNull()
      ]
      send(payload)
    }

    private func sendBPM(_ bpm: Double) {
      DispatchQueue.main.async { self.ui.bpm = Int(bpm.rounded()) }
      send(["type": "bpm",
            "bpm": bpm,
            "ts": ISO8601DateFormatter().string(from: Date())])
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
      if WCSession.isSupported() {
        let s = WCSession.default
        s.delegate = self
        s.activate()
      }
      sendState("ready", reason: "launch")
    }

    // Health 앱에서 워치로 워크아웃 넘겨줄 때 호출
    func handle(_ workoutConfiguration: HKWorkoutConfiguration) {
      Task {
        try? await startWorkout(activity: workoutConfiguration.activityType == .cycling ? "cycling" : "running")
      }
    }

    // MARK: - WCSessionDelegate
    func session(_ session: WCSession,
                 activationDidCompleteWith activationState: WCSessionActivationState,
                 error: Error?) {
      // 활성화 결과를 상태로 보낼 수도 있음
      sendState(activationState == .activated ? "reachable" : "unreachable",
                reason: error?.localizedDescription)
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
      sendState(session.isReachable ? "reachable" : "unreachable", reason: "reachability")
    }

    // iPhone → 워치 (실시간)
    func session(_ session: WCSession, didReceiveMessageData messageData: Data) {
      guard let obj = try? JSONSerialization.jsonObject(with: messageData) as? [String: Any],
            let cmd = obj["cmd"] as? String else { return }

      switch cmd {
        case "start":
          Task { try? await startWorkout(activity: (obj["activity"] as? String) ?? "running") }
        case "pause":
          pauseWorkout()
        case "resume":
          resumeWorkout()
        case "stop":
          stopWorkout()
        default:
          break
      }
    }

    // iPhone → 워치 (지연)
    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String : Any] = [:]) {
      guard let cmd = userInfo["cmd"] as? String else { return }
      switch cmd {
        case "start":
          Task { try? await startWorkout(activity: (userInfo["activity"] as? String) ?? "running") }
        case "pause":
          pauseWorkout()
        case "resume":
          resumeWorkout()
        case "stop":
          stopWorkout()
        default:
          break
      }
    }

    // MARK: - Workout 제어
    // 워치 UI에서 직접 호출하려고 private 제거 (internal)
    func startWorkout(activity: String) async throws {
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

      let start = Date()
      session.startActivity(with: start)
      try await builder.beginCollection(at: start)

      sendState("started", reason: "startWorkout")
      // 곧이어 delegate에서 running 전환 콜백이 들어옴
    }

    func pauseWorkout()  {
      wSession?.pause()
      sendState("paused", reason: "pauseWorkout")     // 체감용 즉시 갱신
    }

    func resumeWorkout() {
      wSession?.resume()
      sendState("running", reason: "resumeWorkout")   // 체감용 즉시 갱신
    }

    func stopWorkout(reason: String? = nil) {
      guard let _ = wSession, let builder = builder else { return }
      wSession?.stopActivity(with: Date())
      Task {
        try? await builder.endCollection(at: Date())
        _ = try? await builder.finishWorkout()
        sendState("ended", reason: reason ?? "stopWorkout")
      }
      self.wSession = nil
      self.builder = nil
    }

    private func requestHKAuth() async throws {
      let toShare: Set = [HKQuantityType.workoutType()]
      let toRead: Set = [HKQuantityType(.heartRate), HKQuantityType.workoutType()]
      try await healthStore.requestAuthorization(toShare: toShare, read: toRead)
    }

    // MARK: - HKWorkoutSessionDelegate
    func workoutSession(_ workoutSession: HKWorkoutSession,
                        didChangeTo toState: HKWorkoutSessionState,
                        from fromState: HKWorkoutSessionState,
                        date: Date) {
      switch toState {
        case .running: sendState("running", reason: "delegate")
        case .paused:  sendState("paused",  reason: "delegate")
        case .ended:
          Task {
            try? await builder?.endCollection(at: Date())
            _ = try? await builder?.finishWorkout()
            sendState("ended", reason: "delegate")
            self.wSession = nil
            self.builder = nil
          }
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

