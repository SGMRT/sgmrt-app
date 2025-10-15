//
//  PagerView.swift
//  app
//
//  Created by 정윤석 on 10/15/25.
//

import SwiftUI

struct PagerView: View {
  @EnvironmentObject var ui: WorkoutUI
  
  var body: some View {
    TabView {
      MetricsPage()
        .tag(0)
      
      ControlPage()
        .tag(1)
    }
    .tabViewStyle(.page(indexDisplayMode: .always))
    .indexViewStyle(.page(backgroundDisplayMode: .automatic))
  }
}
