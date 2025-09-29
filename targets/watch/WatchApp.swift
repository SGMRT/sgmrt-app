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

extension ShapeStyle where Self == Color {
  static var brand: Color { Color("$accent") }
  static var widgetBackground: Color { Color("$widgetBackground") }
}

struct ContentView: View {
  @EnvironmentObject var ui: WorkoutUI

  var body: some View {
    ZStack {
      // 배경
      Color.widgetBackground.ignoresSafeArea()

      VStack(spacing: 10) {
        Text("고스트러너")
          .font(.footnote.weight(.semibold))
          .foregroundStyle(.brand)

        // 경과 시간
        TimelineView(.periodic(from: .now, by: 1)) { ctx in
          Text(formatHMS(ui.elapsed(at: ctx.date)))
            .font(.system(size: 36, weight: .semibold, design: .monospaced))
            .minimumScaleFactor(0.6)
        }

        // 심박
        HStack(spacing: 6) {
          Image(systemName: "heart.fill").foregroundStyle(.brand)
          Text("\(ui.bpm)").font(.title3).monospacedDigit()
          Text("bpm").foregroundStyle(.secondary)
        }

        // 상태 배지
        StatusPill(state: ui.state)

        // 안내
        HStack(spacing: 4) {
          Image(systemName: "ipod.and.applewatch")
          Text("앱에서 조작할 수 있습니다.")
        }
        .font(.caption2)
        .foregroundStyle(.secondary)
        .padding(.top, 2)
      }
      .padding(.horizontal, 12)
      .padding(.vertical, 8)
    }
  }
}

// 상태 배지
private struct StatusPill: View {
  let state: String
  var body: some View {
    let (label, color) = style(for: state)
    Text(label)
      .font(.caption2.bold())
      .padding(.horizontal, 10).padding(.vertical, 4)
      .background(Capsule().fill(color.opacity(0.18)))
      .overlay(Capsule().stroke(color.opacity(0.55), lineWidth: 1))
      .foregroundStyle(color)
  }

  private func style(for s: String) -> (String, Color) {
    switch s {
    case "running":     return ("러닝 중", .brand as Color)
    case "paused":      return ("일시정지", .yellow)
    case "ended":       return ("종료됨", .gray)
    case "error":       return ("오류", .red)
    case "ready":       return ("준비", .brand as Color)
    case "started":     return ("시작 중", .brand as Color)
    case "reachable":   return ("연결됨", .green)
    case "unreachable": return ("연결 끊김", .orange)
    default:            return ("대기", .secondary)
    }
  }
}

// 포맷터
private func formatHMS(_ t: TimeInterval) -> String {
  let s = Int(t)
  let h = s / 3600
  let m = (s % 3600) / 60
  let sec = s % 60
  return h > 0 ? String(format: "%d:%02d:%02d", h, m, sec)
               : String(format: "%02d:%02d", m, sec)
}
