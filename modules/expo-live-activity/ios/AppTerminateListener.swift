import ExpoModulesCore
import ActivityKit

public class AppTerminateListener: ExpoAppDelegateSubscriber {
    required public init() {}

    public func applicationWillTerminate(_ application: UIApplication) {
        guard #available(iOS 16.2, *) else { return }

        Task.detached(priority: .background) {
            await LiveActivityHelper.endAllImmediately()
        }
    }
}
