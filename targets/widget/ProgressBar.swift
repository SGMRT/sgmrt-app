//
//  ProgressBar.swift
//  ghostrunner
//
//  Created by 정윤석 on 8/5/25.
//

import SwiftUI

public struct ProgressBarView : View {
    public var progress: Double          // 0.0 ~ 1.0
    public var isRunning: Bool = true
    public var height: CGFloat = 10
    public var trackColor: Color = Color(hex: "#3F3F3F") // 배경(짙은 회색)
    public var runningColor: Color = Color(hex: "#E2FF00") // 네온 옐로우
    public var stoppedColor: Color = Color(hex: "#FF3358") // 레드
    public var animate: Bool = true

    private var clamped: Double { max(0, min(1, progress)) }
    private var activeColor: Color { isRunning ? runningColor : stoppedColor }

    public init(progress: Double,
                isRunning: Bool = true,
                height: CGFloat = 10) {
        self.progress = progress
        self.isRunning = isRunning
        self.height = height
    }

    public var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            ZStack(alignment: .leading) {
                // Track
                Capsule()
                    .fill(trackColor)

                // Fill
                Capsule()
                    .fill(activeColor)
                    .frame(width: w * clamped) // 0~1 비율
                    .padding(.horizontal, 4)   // 좌우 여백
                    .padding(.vertical, 3)     // 상하 여백
                    .animation(animate ? .easeInOut(duration: 0.25) : .none,
                               value: clamped)
            }
        }
        .frame(height: height)
        .accessibilityLabel(Text("진행률"))
        .accessibilityValue(Text("\(Int(clamped*100))퍼센트"))
    }
}

