//
//  GoRunAttributes.swift
//  ghostrunner
//
//  Created by 정윤석 on 7/29/25.
//

import ActivityKit
import SwiftUI

struct GoRunAttributes: ActivityAttributes {
  public typealias GoRunStatus = ContentState
  var runType: String
  var sessionId: String?
  
  public struct ContentState: Codable, Hashable {
    var startedAt: Date
    var pausedAt: Date?
    
    var recentPace: String
    var distance: String
    var calories: String
    var progress: Double?
    
    func getElapsedTimeInSeconds() -> TimeInterval {
      if let pausedAt = pausedAt {
          return pausedAt.timeIntervalSince(startedAt)
      } else {
          return Date().timeIntervalSince(startedAt)
      }
    }
    
    func isRunning() -> Bool {
      return pausedAt == nil
    }
    
    func getFormattedElapsedTime() -> String {
      let elapsed = getElapsedTimeInSeconds()
      let totalSeconds = Int(elapsed)
      let hours = totalSeconds / 3600
      let minutes = (totalSeconds % 3600) / 60
      let seconds = totalSeconds % 60

      if hours > 0 {
          return String(format: "%d:%02d:%02d", hours, minutes, seconds)
      } else {
          return String(format: "%d:%02d", minutes, seconds)
      }
    }
    
    func getFutureDate() -> Date {
        return Date().addingTimeInterval(365 * 24 * 60 * 60)
    }
  }
}
