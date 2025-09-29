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

struct ContentView: View {
  @EnvironmentObject var ui: WorkoutUI

  var body: some View {
    VStack(spacing: 8) {
      // 경과 시간 - 1초 주기로 갱신
      TimelineView(.periodic(from: .now, by: 1)) { ctx in
        let t = ui.elapsed(at: ctx.date)
        Text(formatHMS(t))
          .font(.system(size: 36, weight: .semibold, design: .monospaced))
          .minimumScaleFactor(0.6)
    }

      // 심박
      HStack(spacing: 6) {
        Image(systemName: "heart.fill")
        Text("\(ui.bpm)")
          .font(.title3)
          .monospacedDigit()
        Text("bpm").foregroundStyle(.secondary)
      }

      // 상태 배지
      Text(ui.state.uppercased())
        .font(.caption2).bold()
        .padding(.horizontal, 8).padding(.vertical, 4)
        .background(Capsule().fill(color(for: ui.state).opacity(0.2)))
        .overlay(Capsule().stroke(color(for: ui.state), lineWidth: 1))
        .foregroundStyle(color(for: ui.state))
    }
    .padding()
  }
}

// MARK: - Helpers
private func formatHMS(_ t: TimeInterval) -> String {
  let s = Int(t)
  let h = s / 3600
  let m = (s % 3600) / 60
  let sec = s % 60
  return h > 0 ? String(format: "%d:%02d:%02d", h, m, sec)
               : String(format: "%02d:%02d", m, sec)
}

private func color(for state: String) -> Color {
  switch state {
    case "running": return .green
    case "paused":  return .yellow
    case "ended":   return .gray
    case "error":   return .red
    case "ready", "started": return .blue
    default: return .secondary
  }
}
