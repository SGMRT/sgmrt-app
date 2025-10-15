import SwiftUI

@main
struct WatchApp: App {
  @WKApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
  var body: some Scene {
    WindowGroup {
      PagerView()
        .environmentObject(appDelegate.ui)
    }
  }
}

