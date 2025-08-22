//
//  GoRunActivity.swift
//  ghostrunner
//
//  Created by 정윤석 on 7/29/25.
//

import ActivityKit
import SwiftUI
import WidgetKit


struct GoRunActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: GoRunAttributes.self) { context in
      HStack(alignment: .center){
        // 페이스 인디케이터
        VStack(alignment: .center){
          PaceRingView(level: context.state.paceLevel(), pace: context.state.formattedPace())
        }
        .padding(.vertical, 13.5)
        // 좌측 여백
        Spacer(minLength: 20)
        // 러닝 상태, 거리, 시간, 진행률
        VStack(alignment: .center, spacing: 8){
          // 러닝 상태 표시
          Text(context.state.isRunning() ? context.attributes.runType.displayName + "Running" : "Stop")
            .font(.system(size: 16, weight: .regular))
            .foregroundStyle(Color(hex: context.state.isRunning() ? "#E2FF00" : "#FF3358"))
          // 러닝 정보 표시
          HStack{
            VStack(alignment: .leading){
              Text(context.state.formattedDistanceKm())
                .lineLimit(1)
                .font(.system(size: 28, weight: .bold))
                .monospacedDigit()
                .foregroundStyle(Color(hex: context.state.isRunning() ? "#E8E8E8" : "#FF3358"))
              Text("킬로미터")
                .font(.system(size: 12, weight: .regular))
                .foregroundStyle(Color(hex: "#676767"))
            }
            Spacer(minLength: 4)
            VStack(alignment: .leading){
              Text(context.state.formattedElapsedTime())
                .lineLimit(1)
                .font(.system(size: 28, weight: .bold))
                .monospacedDigit()
                .foregroundStyle(Color(hex: context.state.isRunning() ? "#E8E8E8" : "#FF3358"))
              Text("시간")
                .font(.system(size: 12, weight: .regular))
                .foregroundStyle(Color(hex: "#676767"))
            }
          }
          .padding(.bottom, context.attributes.runType == .solo ? 24 : 0)
          // 프로그래스바 + 메세지
          if context.attributes.runType != .solo {
            VStack(spacing: 4) {
              ProgressBarView(progress: context.state.progress ?? 0.0, isRunning: context.state.isRunning())
              Text(context.state.message ?? "")
                .font(.system(size: 12, weight: .regular))
                .foregroundStyle(context.state.messageColor())
            }
          }
        }
        // 우측 여백
        Spacer(minLength: 8)
        // 로고
        VStack(alignment: .trailing){
          Spacer()
          Image(.logo)
            .resizable()
            .frame(width: 20, height: 18)
        }
      }
      .padding(EdgeInsets(top: 12, leading: 13, bottom: 12, trailing: 13))
      .activityBackgroundTint(Color(hex:"#111111"))
      .activitySystemActionForegroundColor(Color(hex: "#E2FF00"))
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.bottom) {
          HStack(alignment: .center){
            // 페이스 인디케이터
            VStack(alignment: .center){
              PaceRingView(level: context.state.paceLevel(), pace: context.state.formattedPace())
            }
            .padding(.bottom, 13.5)
            Spacer(minLength: 20)
            // 러닝 상태, 거리, 시간, 진행률
            VStack(alignment: .center, spacing: 8){
              // 러닝 상태 표시
              Text(context.state.isRunning() ? context.attributes.runType.displayName + "Running" : "Stop")
                .font(.system(size: 16, weight: .regular))
                .foregroundStyle(Color(hex: context.state.isRunning() ? "#E2FF00" : "#FF3358"))
              // 러닝 정보 표시
              HStack{
                VStack(alignment: .leading){
                  Text(context.state.formattedDistanceKm())
                    .lineLimit(1)
                    .font(.system(size: 28, weight: .bold))
                    .monospacedDigit()
                    .foregroundStyle(Color(hex: context.state.isRunning() ? "#E8E8E8" : "#FF3358"))
                  Text("킬로미터")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundStyle(Color(hex: "#676767"))
                }
                Spacer(minLength: 4)
                VStack(alignment: .leading){
                  Text(context.state.formattedElapsedTime())
                    .lineLimit(1)
                    .font(.system(size: 28, weight: .bold))
                    .monospacedDigit()
                    .foregroundStyle(Color(hex: context.state.isRunning() ? "#E8E8E8" : "#FF3358"))
                  Text("시간")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundStyle(Color(hex: "#676767"))
                }
              }
              .padding(.bottom, context.attributes.runType == .solo ? 24 : 0)
              // 프로그래스바 + 메세지
              if context.attributes.runType != .solo {
                VStack(spacing: 4) {
                  ProgressBarView(progress: context.state.progress ?? 0.0, isRunning: context.state.isRunning())
                  Text(context.state.message ?? "")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundStyle(context.state.messageColor())
                }
              }
            }
            Spacer(minLength: 8)
            // 로고
            VStack(alignment: .trailing){
              Spacer()
              Image(.logo)
                .resizable()
                .frame(width: 20, height: 18)
                .padding(.bottom, 8)
            }
          }
          .padding(.top, -16)
        }
      } compactLeading: {
        Image(.logo)
          .resizable()
          .frame(width: 20, height: 18)
      } compactTrailing: {
        Text(context.state.formattedDistanceKm())
          .font(.system(size: 12, weight: .black))
          .foregroundColor(Color(hex: context.state.isRunning() ? "#E2FF00" : "#FF3358"))
      } minimal: {
        Image(.logo)
          .resizable()
          .frame(width: 20, height: 18)
      }
      .keylineTint(Color(hex: "E2FF00"))
    }
  }
}
