import SwiftUI

@main
struct WatchApp: App {
  @WKApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
  var body: some Scene {
    WindowGroup {
      ContentView()
        .environmentObject(appDelegate.ui)
    }
  }
}

