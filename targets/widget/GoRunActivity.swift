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
      VStack {
        HStack {
          Image(.logoTint)
            .resizable()
            .frame(width: 20, height: 20)
          Spacer()
          Text(context.attributes.runType)
            .font(.system(size: 15, weight: .bold))
        }
        VStack{
          HStack {
            VStack(alignment: .center) {
              Text(context.state.distance)
                .monospacedDigit()
                .font(.system(size: 30, weight: .bold))
              Text("킬로미터")
                .font(.system(size: 12))
            }
            Spacer()
            VStack(alignment: .center) {
              Text(context.state.getFormattedElapsedTime())
                .monospacedDigit()
                .font(.system(size: 30, weight: .bold))
              Text("시간")
                .font(.system(size: 12))
            }
            Spacer()
            VStack(alignment: .center) {
              Text(context.state.recentPace)
                .monospacedDigit()
                .font(.system(size: 30, weight: .bold))
              Text("페이스")
                .font(.system(size: 12))
            }
          }
          if context.attributes.runType != "SOLO" {
            ProgressView(value: context.state.progress)
              .progressViewStyle(.linear)
              .frame(height: 4)
              .tint(Color(hex: "#E2FF00"))
          }
        }
      }
      .padding(EdgeInsets(top: 16, leading: 16, bottom: 16, trailing: 16))
      .activityBackgroundTint(Color(hex:"#090A0A"))
      .activitySystemActionForegroundColor(Color(hex: "#E2FF00"))
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Image(.logoTint)
            .resizable()
            .frame(width: 20, height: 20)
            .padding(EdgeInsets(top: 0, leading: 8, bottom: 0, trailing: 0))
        }
        DynamicIslandExpandedRegion(.trailing) {
          Text(context.attributes.runType)
            .font(.system(size: 15, weight: .bold))
            .padding(EdgeInsets(top: 0, leading: 0, bottom: 0, trailing: 8))
        }
        DynamicIslandExpandedRegion(.bottom) {
          VStack{
            HStack {
              VStack(alignment: .center) {
                Text(context.state.distance)
                  .monospacedDigit()
                  .font(.system(size: 30, weight: .bold))
                Text("킬로미터")
                  .font(.system(size: 12))
              }
              Spacer()
              VStack(alignment: .center) {
                Text(context.state.getFormattedElapsedTime())
                  .monospacedDigit()
                  .font(.system(size: 30, weight: .bold))
                Text("시간")
                  .font(.system(size: 12))
              }
              Spacer()
              VStack(alignment: .center) {
                Text(context.state.recentPace)
                  .monospacedDigit()
                  .font(.system(size: 30, weight: .bold))
                Text("페이스")
                  .font(.system(size: 12))
              }
            }
            if context.attributes.runType != "SOLO" {
              ProgressView(value: context.state.progress)
                .progressViewStyle(.linear)
                .frame(height: 4)
                .tint(Color(hex: "#E2FF00"))
            }
          }
        }
      } compactLeading: {
        Image(.logoTint)
          .resizable()
          .frame(width: 20, height: 20)
      } compactTrailing: {
        Text(context.state.getFormattedElapsedTime())
          .font(.system(size: 12, weight: .bold))
          .foregroundColor(Color(hex: "#E2FF00"))
          .monospacedDigit()
          .foregroundColor(.white)
      } minimal: {
        Image(.logoTint)
          .resizable()
          .frame(width: 20, height: 20)
      }
      .keylineTint(Color.white)
    }
  }
}
