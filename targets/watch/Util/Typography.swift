//
//  Typography.swift
//  app
//
//  Created by 정윤석 on 11/12/25.
//

import SwiftUI

extension View {
  /// 글자 간격 (letter-spacing)
  func letterSpacing(_ value: CGFloat) -> some View {
    self.tracking(value)
  }

  /// multiple = 1.2 → 기본 라인 높이의 120%
  func lineHeight(_ multiple: CGFloat, fontSize: CGFloat) -> some View {
    // multiple * fontSize - fontSize = 추가 여백 px
    let extra = max(0, (multiple - 1.0) * fontSize)
    return self.lineSpacing(extra)
  }

  /// 숫자 모노스페이스 (페이스/심박/거리용)
  func monoDigits() -> some View {
    self.monospacedDigit()
  }
  
  /// 한 줄 고정 + 자동 축소 + 말줄임 + 숫자 타이포 최적화
  func singleLine(scale: CGFloat = 0.8) -> some View {
    self
      .lineLimit(1)
      .minimumScaleFactor(scale)  // 80%까지 축소
      .truncationMode(.tail)
      .allowsTightening(true)     // 커닝을 살짝 줄여서 더 잘 맞춤
  }
}
