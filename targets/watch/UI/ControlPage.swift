//
//  ControlPage.swift
//  app
//
//  Created by 정윤석 on 11/11/25.
//

import SwiftUI

struct ControlPage: View {
  @EnvironmentObject var ui: WorkoutUI
  
  private var isRunning: Bool { ui.state == "running" }
  private var isPaused: Bool { ui.state == "paused" }
  private var isEnded: Bool { ui.state == "ended" }
  private var isWatchStandalone: Bool { ui.mode == .watchStandalone }
  private var isPhoneControlled: Bool { ui.mode == .phoneControlled }
  
  // 일시정지/재개 버튼 활성화 여부
  private var canPauseResume: Bool {
    guard isWatchStandalone else { return false }
    return isRunning || isPaused
  }
  
  // 정지 버튼 활성화 여부
  private var canStop: Bool {
    guard isWatchStandalone else { return false }
    return isRunning || isPaused
  }
  
  var body: some View {
    ZStack {
      Color.widgetBackground.ignoresSafeArea()
      
      VStack(spacing: 0) {
        Spacer()
        
        if isEnded {
          ControlButton(
            icon: "xmark.circle.fill",
            label: "나가기",
            color: .gray60,
            isEnabled: true,
            action: { AppDelegate.shared?.resetToMain() }
          )
        } else {
          HStack(spacing: 16) {
            ControlButton(
              icon: isPaused ? "play.fill" : "pause.fill",
              label: isPaused ? "재개" : "일시정지",
              color: isPaused ? .green : .orange,
              isEnabled: canPauseResume,
              action: {
                if isPaused {
                  AppDelegate.shared?.resumeFromUI()
                } else {
                  AppDelegate.shared?.pauseFromUI()
                }
              }
            )
            
            ControlButton(
              icon: "stop.fill",
              label: "정지",
              color: .red,
              isEnabled: canStop,
              action: { AppDelegate.shared?.stopFromUI() }
            )
          }
          .padding(.horizontal, 20)
          
          if isPhoneControlled {
            Text("앱에서 시작됨 — 워치에서만 제어 가능")
              .font(.footnote)
              .foregroundColor(.gray60)
              .padding(.top, 8)
          }
        }
        
        Spacer()
      }
    }
  }
}

struct ControlButton: View {
  let icon: String
  let label: String
  let color: Color
  let isEnabled: Bool
  let action: () -> Void
  
  private var displayColor: Color { isEnabled ? color : .gray60 }
  private var backgroundColor: Color { isEnabled ? color.opacity(0.15) : Color.gray60.opacity(0.15) }
  
  var body: some View {
    Button(action: isEnabled ? action : {}) {
      VStack(spacing: 8) {
        Image(systemName: icon)
          .font(.system(size: 24, weight: .medium))
          .foregroundStyle(displayColor)
      }
      .frame(width: 60, height: 40)
      .background(
        RoundedRectangle(cornerRadius: 12)
          .fill(backgroundColor)
      )
    }
    .buttonStyle(.plain)
    .disabled(!isEnabled)
  }
}
