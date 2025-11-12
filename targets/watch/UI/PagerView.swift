//
//  PagerView.swift
//  app
//
//  Created by 정윤석 on 11/11/25.
//

import SwiftUI

struct PagerView: View {
  @EnvironmentObject var ui: WorkoutUI
  
  private var isNotStarted: Bool {
    ui.state == "idle" || ui.state == "ready"
  }
  
  private var isEnded: Bool {
    ui.state == "ended"
  }
  
  var body: some View {
    if isNotStarted {
      // 러닝 시작 전: 시작 화면
      StartPage()
    } else if isEnded {
      // 완료 화면
      CompletePage()
    } else {
      // 러닝 시작 후: 메트릭스 및 컨트롤 페이지
      TabView {
        MetricsPage().tag(0)
        ControlPage().tag(1)
      }
      .tabViewStyle(.page(indexDisplayMode: .always))
      .indexViewStyle(.page(backgroundDisplayMode: .automatic))
    }
  }
}
