//
//  Formatter.swift
//  app
//
//  Created by 정윤석 on 11/12/25.
//

import SwiftUI

func formatHMS(_ t: TimeInterval) -> String {
  let s = Int(t), h = s/3600, m = (s%3600)/60, sec = s%60
  return String(format:"%02d:%02d:%02d",h,m,sec)
}
func formatDistanceKm(_ meters: Double) -> String {
  let km = max(0, meters) / 1000
  return String(format: "%.2f", km)
}
func formatPaceText(_ secPerKm: Double?) -> String {
  guard let v = secPerKm, v.isFinite, v > 0 else { return "--'--\"" }
  let m = Int(v) / 60
  let s = Int(v) % 60
  return String(format: "%d'%02d\"", m, s)
}
let timeOfDayFmt: DateFormatter = {
  let f = DateFormatter()
  f.setLocalizedDateFormatFromTemplate("Hm") // 9:55 같은 형태
  return f
}()
