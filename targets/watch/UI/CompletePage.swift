//
//  CompletePage.swift
//  app
//
//  Created by 정윤석 on 11/12/25.
//

import SwiftUI
import WatchKit

struct CompletePage: View {
  @EnvironmentObject var ui: WorkoutUI
  @Environment(\.dismiss) private var dismiss

  // MARK: - Display Texts
  private var distanceKmText: String { formatDistanceKm(ui.distanceM) }
  private var elapsedText: String { formatHMS(ui.elapsed()) }
  private var paceText: String { formatPaceText(ui.paceSecPerKm) }
  private var cadenceText: String? { ui.cadenceSpm.map { "\($0) spm" } }
  private var calorieText: String? { "\(ui.calories) kcal" }

  private var statItems: [StatsGrid.Item] {
    var arr: [StatsGrid.Item] = [
      .init(icon: "clock.fill",  label: "시간",   value: elapsedText, valueColor: .white),
      .init(icon: "bolt.fill",   label: "페이스", value: paceText,    valueColor: .white),
    ]
    if let c = cadenceText {
      arr.append(.init(icon: "figure.walk", label: "케이던스", value: c, valueColor: .white))
    }
    if let kcal = calorieText {
      arr.append(.init(icon: "flame.fill", label: "칼로리", value: kcal, valueColor: .orange))
    }
    return Array(arr.prefix(4))
  }

  var body: some View {
    ZStack {
      Color.widgetBackground.ignoresSafeArea()

      VStack(spacing: 8) {

        ScrollView(.vertical, showsIndicators: false) {
          VStack(spacing: 10) {
            // Header
            VStack(spacing: 8) {
              Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 36, weight: .medium))
                .foregroundStyle(.brand)
                .accessibilityHidden(true)

              Text("러닝 완료")
                .font(.spoqa(.bold, size: 18))
                .foregroundStyle(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
            }
            .padding(.top, 6)
            .onAppear { WKInterfaceDevice.current().play(.success) }

            // Distance
            Text(distanceKmText + " km")
              .font(.spoqa(.bold, size: 40))
              .foregroundStyle(.brand)
              .lineLimit(1)
              .minimumScaleFactor(0.6)

            DividerLine()

            // Grid
            StatsGrid(items: statItems)
              .padding(.horizontal, 6)
              .padding(.bottom, 10)
            
            Button(action: {
              AppDelegate.shared?.resetToMain()
            }) {
              HStack(spacing: 6) {
                Image(systemName: "chevron.left")
                  .font(.system(size: 12, weight: .semibold))
                Text("뒤로가기")
                  .font(.spoqa(.regular, size: 14))
              }
              .foregroundStyle(.black)
              .frame(maxWidth: .infinity, minHeight: 36)
              .background(RoundedRectangle(cornerRadius: 10).fill(Color.brand))
            }
            .buttonStyle(.plain)
          }
          .padding(.horizontal, 10)
          .padding(.top, 2)
          .padding(.bottom, 2)
        }

        

      }
    }
  }
}

// MARK: - Subviews

private struct DividerLine: View {
  var body: some View {
    Rectangle()
      .fill(Color.border)
      .frame(height: 1)
      .padding(.horizontal, 8)
      .accessibilityHidden(true)
  }
}

private struct StatsGrid: View {
  struct Item: Identifiable, Equatable {
    let id = UUID()
    let icon: String
    let label: String
    let value: String
    let valueColor: Color
  }

  let items: [Item]

  private var paddedItems: [Item?] {
    var arr = items.map { Optional($0) }
    if arr.count == 3 { arr.append(nil) }
    if arr.count == 1 { arr.append(nil) }
    return arr
  }

  private let columns = [
    GridItem(.flexible(), spacing: 8, alignment: .top),
    GridItem(.flexible(), spacing: 8, alignment: .top)
  ]

  var body: some View {
    LazyVGrid(columns: columns, alignment: .center, spacing: 8) {
      ForEach(Array(paddedItems.enumerated()), id: \.offset) { _, maybeItem in
        if let item = maybeItem {
          StatTile(item: item).frame(maxWidth: .infinity)
        } else {
          Color.clear.frame(height: 0)
        }
      }
    }
  }
}

private struct StatTile: View {
  let item: StatsGrid.Item
  var body: some View {
    VStack(alignment: .center, spacing: 4) {
      HStack(spacing: 4) {
        Image(systemName: item.icon)
          .font(.system(size: 12, weight: .semibold))
          .foregroundStyle(.brand)
          .accessibilityHidden(true)

        Text(item.label)
          .font(.spoqa(.regular, size: 12))
          .foregroundStyle(.gray60)
          .lineLimit(1)
          .minimumScaleFactor(0.8)
      }

      HStack {
        Spacer()
        Text(item.value)
          .font(.spoqa(.bold, size: 16))
          .foregroundStyle(item.valueColor)
          .monoDigits()
          .lineLimit(1)
          .minimumScaleFactor(0.6)
        Spacer()
      }
    }
    .padding(.horizontal, 6)
    .padding(.vertical, 6)
    .background(
      RoundedRectangle(cornerRadius: 10)
        .fill(Color.black.opacity(0.25))
        .overlay(
          RoundedRectangle(cornerRadius: 10)
            .stroke(Color.border, lineWidth: 1)
        )
    )
    .accessibilityElement(children: .ignore)
    .accessibilityLabel("\(item.label) \(item.value)")
  }
}
