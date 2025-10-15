//
//  ControlPage.swift
//  app
//
//  Created by 정윤석 on 10/15/25.
//

import SwiftUI
import WatchKit

struct ControlPage: View {
  @EnvironmentObject var ui: WorkoutUI

  var body: some View {
    ZStack {
      Color.widgetBackground.ignoresSafeArea()

      VStack(spacing: 12) {
        Text("컨트롤")
          .font(.footnote.weight(.semibold))
          .foregroundStyle(.brand)

        // 상태 배지
        StatusPill(state: ui.state)

        // 설명
        Text("심박수 수집을 종료합니다.")
          .font(.caption2)
          .multilineTextAlignment(.center)
          .foregroundStyle(.secondary)
          .padding(.horizontal, 6)

        // ✅ 연결 종료 버튼 (주요 동작)
        Button(role: .destructive) {
          WKInterfaceDevice.current().play(.success)
          AppDelegate.shared?.stopWatchWorkout()
        } label: {
          VStack(spacing: 4) {
            Image(systemName: "bolt.slash.fill").font(.title3).foregroundStyle(.widgetBackground)
            Text("연결 종료").font(.caption2.bold()).foregroundStyle(.widgetBackground)
          }
          .frame(maxWidth: .infinity, minHeight: 48)
        }
        .buttonStyle(.borderedProminent)

        Spacer(minLength: 0)
      }
      .padding(.horizontal, 10)
      .padding(.top, 8)
    }
  }
}
