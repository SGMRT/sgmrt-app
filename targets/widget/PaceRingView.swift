//
//  PaceRingView.swift
//  ghostrunner
//
//  Created by 정윤석 on 8/5/25.
//
import SwiftUI

public struct PaceRingView: View {
  public let level: PaceLevel
  public let pace: String
  public var lineWidth: CGFloat = 6
  public var gapDegrees: Double = 12
  public var runningColor: Color = Color(hex: "#E2FF00")
  public var stoppedColor: Color = Color(hex: "#FF3358")
  public var inactvieColor: Color = Color(hex: "#3F3F3F")
  
  private let segments = 5
  
  public init(level: PaceLevel, pace: String) {self.level = level; self.pace = pace}
  
  private var segmentAngles: [(Angle, Angle)] {
    let totalGap = gapDegrees * Double(segments)
    let span = (360.0 - totalGap) / Double(segments)
    return (0..<segments).map { i in
      let start = -90.0 + Double(i) * (span + gapDegrees)
      let end = start + span
      return (Angle(degrees: start), Angle(degrees: end))
    }
  }
  
  public var body: some View {
    ZStack(alignment: .center) {
      ForEach(0..<segments, id: \.self) { i in
        ArcSegment(start: segmentAngles[i].0, end: segmentAngles[i].1, width: lineWidth)
          .foregroundStyle(inactvieColor)
      }
      ForEach(0..<level.rawValue, id: \.self) { i in
        ArcSegment(start: segmentAngles[i].0, end: segmentAngles[i].1, width: lineWidth)
          .foregroundStyle(runningColor)
          .animation(.easeInOut(duration: 0.25), value: level)
      }
      VStack(alignment: .center){
        Text(" ")
          .font(.system(size: 6, weight: .regular))
        Text(pace)
          .font(.system(size: 28, weight: .bold))
          .monospacedDigit()
          .foregroundStyle(Color(hex: "#E8E8E8"))
        Text("페이스")
          .font(.system(size: 12, weight: .regular))
          .foregroundStyle(Color(hex: "#676767"))
      }
    }
    .frame(width: 120, height: 120)
    .drawingGroup()
  }
}

private struct ArcSegment: Shape {
  let start: Angle
  let end: Angle
  let width: CGFloat
  func path(in rect: CGRect) -> Path {
    var p = Path()
    let r = min(rect.width, rect.height) / 2 - width / 2
    p.addArc(center: CGPoint(x: rect.midX, y: rect.midY),
             radius: r, startAngle: start, endAngle: end, clockwise: false)
    return p.strokedPath(.init(lineWidth: width, lineCap: .round))
  }
}
