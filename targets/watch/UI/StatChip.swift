//
//  StatChip.swift
//  app
//
//  Created by 정윤석 on 11/12/25.
//

import SwiftUI

struct StatChip: View {
  let icon: String
  let text: String

  var body: some View {
    HStack(spacing: 2) {
      Image(systemName: icon)
        .font(.spoqa(.regular, size: 16))
        .letterSpacing(-0.6)
        .lineHeight(1.5, fontSize: 16)
        .foregroundStyle(.brand)
      Text(text)
        .font(.spoqa(.regular, size: 16))
        .monoDigits()
        .letterSpacing(-0.6)
        .lineHeight(1.5, fontSize: 16)
        .foregroundStyle(.white)
        .lineLimit(1)
        .minimumScaleFactor(0.8)
    }
    .frame(width: 70, alignment: .leading)
  }
}
