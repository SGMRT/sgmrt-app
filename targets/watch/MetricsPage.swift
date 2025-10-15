//
//  MetricsPage.swift
//  app
//
//  Created by 정윤석 on 10/14/25.
//
import SwiftUI
import WatchKit

extension ShapeStyle where Self == Color {
  static var brand: Color { Color("$accent") }
  static var widgetBackground: Color { Color("$widgetBackground") }
}

struct MetricsPage: View {
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

// 포맷터
private func formatHMS(_ t: TimeInterval) -> String {
  let s = Int(t)
  let h = s / 3600
  let m = (s % 3600) / 60
  let sec = s % 60
  return h > 0 ? String(format: "%d:%02d:%02d", h, m, sec)
               : String(format: "%02d:%02d", m, sec)
}
