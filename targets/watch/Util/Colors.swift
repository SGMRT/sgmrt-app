//
//  Colors.swift
//  app
//
//  Created by 정윤석 on 11/12/25.
//

import SwiftUI

extension Color {
  init(r: Int, g: Int, b: Int, a: Double = 1) {
    self.init(.sRGB,
              red:   Double(r) / 255.0,
              green: Double(g) / 255.0,
              blue:  Double(b) / 255.0,
              opacity: a)
  }

  init(rgb: Int, a: Double = 1) {
    self.init(
      .sRGB,
      red:   Double((rgb >> 16) & 0xFF) / 255.0,
      green: Double((rgb >>  8) & 0xFF) / 255.0,
      blue:  Double(rgb         & 0xFF) / 255.0,
      opacity: a
    )
  }
}

extension Color {
  static let gray40 = Color(rgb: 0xB5B5B5)
  static let gray60 = Color(rgb: 0x676767)
  static let border = Color(rgb: 0x2E2E2E)
}

extension ShapeStyle where Self == Color {
  static var gray40: Color { .gray40 }
  static var gray60: Color { .gray60 }
  static var border: Color { .border }
}
