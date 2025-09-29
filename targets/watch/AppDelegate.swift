import WatchKit
import WatchConnectivity
import HealthKit
import os

class AppDelegate: NSObject, WKApplicationDelegate, WCSessionDelegate, HKWorkoutSessionDelegate, HKLiveWorkoutBuilderDelegate {
  let healthStore = HKHealthStore()
  let logger = Logger(subsystem: "WatchApp", category: "WC")
  var wSession: HKWorkoutSession?
  var builder: HKLiveWorkoutBuilder?

  func handle(_ workoutConfiguration: HKWorkoutConfiguration) {
    Task {
        try? await startWorkout(activity: workoutConfiguration.activityType == .cycling ? "cycling" : "running")
    }
}

  func applicationDidFinishLaunching() {
    if WCSession.isSupported() {
      let s = WCSession.default
      s.delegate = self
      s.activate()
    }
  }

  // MARK: - WCSessionDelegate
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}

  // iPhone → 워치 명령 수신
  func session(_ session: WCSession, didReceiveMessageData messageData: Data) {
    guard let obj = try? JSONSerialization.jsonObject(with: messageData) as? [String: Any],
          let cmd = obj["cmd"] as? String else { return }

    if cmd == "start" {
      Task { try? await startWorkout(activity: (obj["activity"] as? String) ?? "running") }
    } else if cmd == "stop" {
      stopWorkout()
    }
  }

  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String : Any] = [:]) {
    // 지연 메시지도 동일하게 처리
    if let cmd = userInfo["cmd"] as? String {
      if cmd == "start" {
        Task { try? await startWorkout(activity: (userInfo["activity"] as? String) ?? "running") }
      } else if cmd == "stop" {
        stopWorkout()
      }
    }
  }

  // MARK: - Workout
  private func startWorkout(activity: String) async throws {
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

    sendState("started")
  }

  private func stopWorkout() {
    guard let session = wSession, let builder = builder else { return }
    session.stopActivity(with: Date())
    Task {
      try? await builder.endCollection(at: Date())
      _ = try? await builder.finishWorkout()
      sendState("stopped")
    }
    self.wSession = nil
    self.builder = nil
  }

  private func requestHKAuth() async throws {
    let toShare: Set = [HKQuantityType.workoutType()]
    let toRead: Set = [HKQuantityType(.heartRate), HKQuantityType.workoutType()]
    try await healthStore.requestAuthorization(toShare: toShare, read: toRead)
  }

  // MARK: - HK Delegates
  func workoutSession(_ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState, from fromState: HKWorkoutSessionState, date: Date) {}
  func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {}

  func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}

  // 심박 실시간 송신
  func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {
    for type in collectedTypes {
      guard let qt = type as? HKQuantityType, qt == HKQuantityType(.heartRate),
            let st = workoutBuilder.statistics(for: qt),
            let q = st.mostRecentQuantity() else { continue }

      let bpm = q.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
      sendBPM(bpm)
    }
  }

  // MARK: - Send to iPhone
  private func sendBPM(_ bpm: Double) {
    let payload: [String: Any] = ["bpm": bpm]
    send(payload)
  }
  private func sendState(_ state: String) {
    send(["state": state])
  }
  private func send(_ dict: [String: Any]) {
    let s = WCSession.default
    if let data = try? JSONSerialization.data(withJSONObject: dict) {
      if s.isReachable {
        s.sendMessageData(data, replyHandler: nil, errorHandler: nil)
      } else {
        s.transferUserInfo(dict)
      }
    }
  }
}
