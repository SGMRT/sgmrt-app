import ExpoModulesCore
import ActivityKit

public class AppTerminateListener: ExpoAppDelegateSubscriber {
  required public init() {}

  public func applicationWillTerminate(_ application: UIApplication) {
    print("🛑 앱 종료 시도")
    endLiveActivitySync()
    print("✅ Live Activity 종료 완료")
  }

  func endLiveActivitySync() {
    if #available(iOS 16.2, *) {
      let group = DispatchGroup()

      for activity in Activity<GoRunAttributes>.activities {
        group.enter()
        Task {
          await activity.end(nil, dismissalPolicy: .immediate)
          print("✅ 종료된 Live Activity: \(activity.id)")
          group.leave()
        }
      }

      group.wait() // 모든 activity가 끝날 때까지 block
    }
  }
}
