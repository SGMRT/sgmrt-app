//
//  Font.swift
//  app
//
//  Created by 정윤석 on 11/12/25.
//

import SwiftUI

extension Font {
  enum FontWeight {
    case bold
    case regular
    
    var value: String {
      switch self {
      case .bold:
        return "Bold"
      case .regular:
        return "Regular"
      }
    }
  }
  
  static func spoqa(_ weight: FontWeight, size fontSize: CGFloat) -> Font {
    let familyName = "SpoqaHanSansNeo"
    let weightString = weight.value
    
    return Font.custom("\(familyName)-\(weightString)", size: fontSize)
  }
}
