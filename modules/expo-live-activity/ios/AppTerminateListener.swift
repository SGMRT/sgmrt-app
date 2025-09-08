import ExpoModulesCore
import ActivityKit

public class AppTerminateListener: ExpoAppDelegateSubscriber {
  required public init() {}

  public func applicationWillTerminate(_ application: UIApplication) {
    // 호출 보장 X — 호출되면 비동기로 '발사'만 하고 즉시 리턴
    print("🛑 앱 종료 시도")
    if #available(iOS 16.2, *) {
      Task.detached(priority: .background) {
        await LiveActivityHelper.endAllImmediately()
        print("✅ Live Activity 종료 완료")
      }
    }
  }
}
