import SwiftUI

@main
struct WatchApp: App {
  @WKApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
  var body: some Scene {
    WindowGroup { ContentView() }
  }
}

struct ContentView: View {
  var body: some View {
    VStack(spacing: 8) {
      Text("Heart Rate")
      Text("Waiting…").font(.footnote)
    }
  }
}
