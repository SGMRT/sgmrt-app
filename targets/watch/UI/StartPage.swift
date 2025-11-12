//
//  StartPage.swift
//  app
//
//  Created by 정윤석 on 11/12/25.
//

import SwiftUI

struct StartPage: View {
  @EnvironmentObject var ui: WorkoutUI
  
  var body: some View {
    ZStack {
      VStack() {
        
        Spacer()
        
        // 러닝 시작 버튼
        Button(action: { AppDelegate.shared?.startOnWatch(activity: "running") }) {
          ZStack {
            Circle()
              .fill(.brand)
              .frame(width: 120, height: 120)
            Image(systemName: "play.fill")
              .font(.system(size: 40, weight: .bold))
              .foregroundStyle(.widgetBackground)
          }
        }
        .buttonStyle(.plain)
      
        
        Spacer()
      }
      .padding(.horizontal, 20)
      .padding(.bottom, 24)
    }
  }
}
