//
//  MetricsPage.swift
//  app
//
//  Created by 정윤석 on 11/11/25.
//

import SwiftUI
import WatchKit

struct MetricsPage: View {
  @EnvironmentObject var ui: WorkoutUI
  
  private var paceText: String { formatPaceText(ui.paceSecPerKm) }
  private var distanceBigText: String { formatDistanceKm(ui.distanceM) }
  
  var body: some View {
    ZStack {
      Color.widgetBackground.ignoresSafeArea()
      
      VStack() {
        // 경과 시간
        TimelineView(.periodic(from: .now, by: 1)) { ctx in
          Text(formatHMS(ui.elapsed(at: ctx.date)))
            .font(.spoqa(.regular, size: 16))
            .foregroundStyle(.gray40)
            .lineSpacing(-0.6)
            .lineHeight(1.5, fontSize: 16)
            .singleLine(scale: 0.9)
            .monoDigits()
        }
        .padding(.bottom, 6)
        
        // 거리
        Text(distanceBigText)
          .font(.spoqa(.bold, size: 50))
          .foregroundStyle(.brand)
          .lineSpacing(-0.6)
          .lineHeight(1.5, fontSize: 50)
          .singleLine(scale: 0.6)
          .monoDigits()
          .padding(.bottom, 2)
        
        // 단위
        Text("킬로미터")
          .font(.spoqa(.regular, size: 12))
          .lineSpacing(-0.6)
          .lineHeight(1.5, fontSize: 12)
          .foregroundStyle(.gray60)
          .singleLine(scale: 0.9)
        
        // 구분선
        Rectangle()
          .fill(.border)
          .frame(height: 1)
          .padding(.top, 11)
          .padding(.bottom, 10)
          .padding(.horizontal, 7)
        
        // 하단 정보: 심박 / 페이스
        HStack() {
          StatChip(icon: "heart.fill", text: "\(ui.bpm)")
          StatChip(icon: "bolt.fill", text: paceText)
        }
        .padding(.horizontal, 4)
      }
    }
  }
}
