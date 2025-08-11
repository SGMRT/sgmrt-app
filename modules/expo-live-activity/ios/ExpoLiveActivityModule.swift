import ExpoModulesCore
import ActivityKit
import SwiftUI

public enum RunType: String, Codable, Hashable, Sendable {
    case solo = "SOLO"
    case ghost = "GHOST"
    case course = "COURSE"
}

public enum MessageType: String, Codable, Hashable, Sendable {
    case info = "INFO"
    case warning = "WARNING"
    case error = "ERROR"
    case success = "SUCCESS"
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)

        let r, g, b, a: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (r, g, b, a) = (
                (int >> 8) * 17,
                (int >> 4 & 0xF) * 17,
                (int & 0xF) * 17,
                255
            )
        case 6: // RGB (24-bit)
            (r, g, b, a) = (
                int >> 16,
                int >> 8 & 0xFF,
                int & 0xFF,
                255
            )
        case 8: // ARGB (32-bit)
            (r, g, b, a) = (
                int >> 16 & 0xFF,
                int >> 8 & 0xFF,
                int & 0xFF,
                int >> 24
            )
        default:
            (r, g, b, a) = (255, 0, 0, 255) // fallback: red
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// 0단계는 정지/측정불가 상태
public enum PaceLevel: Int, Codable, Hashable, Sendable {
    case level0 = 0, level1, level2, level3, level4, level5
}

public struct GoRunAttributes: ActivityAttributes, Sendable {
    public typealias ContentState = State

    // 불변 메타데이터
    public var runType: RunType
    public var sessionId: String?

    public init(runType: RunType, sessionId: String? = nil) {
        self.runType = runType
        self.sessionId = sessionId
    }

    // 가변 상태
    public struct State: Codable, Hashable, Sendable {
        public var startedAt: Date
        public var pausedAt: Date?

        /// 초/킬로 pace (예: 6'15" = 375.0)
        public var recentPace: Double

        /// 달린 거리(미터 권장). 표시는 포맷팅에서 처리.
        public var distanceMeters: Double

        /// 0.0~1.0 진행률
        public var progress: Double?

        public var message: String?
        public var messageType: MessageType?

        public init(
            startedAt: Date,
            pausedAt: Date? = nil,
            recentPace: Double,
            distanceMeters: Double,
            progress: Double? = nil,
            message: String? = nil,
            messageType: MessageType? = nil
        ) {
            self.startedAt = startedAt
            self.pausedAt = pausedAt
            self.recentPace = recentPace
            self.distanceMeters = distanceMeters
            if let p = progress {
                self.progress = max(0, min(1, p))
            } else {
                self.progress = nil
            }
            self.message = message
            self.messageType = messageType
        }

        // MARK: - Helpers

        public func getElapsedTimeInSeconds() -> TimeInterval {
            if let pausedAt { return pausedAt.timeIntervalSince(startedAt) }
            return Date().timeIntervalSince(startedAt)
        }

        public func isRunning() -> Bool { pausedAt == nil }

        public func formattedElapsedTime() -> String {
            let total = Int(getElapsedTimeInSeconds())
            let h = total / 3600
            let m = (total % 3600) / 60
            let s = total % 60
            return h > 0 ? String(format: "%d:%02d:%02d", h, m, s)
                         : String(format: "%d:%02d", m, s)
        }

        /// 먼 미래 날짜(타임라인 만료용) – 필요 시 사용
        public func getFutureDate() -> Date {
            Date().addingTimeInterval(365 * 24 * 60 * 60)
        }

        public func formattedPace() -> String {
            guard recentPace > 0, recentPace < 1800 else { return "-’--”" }
            let minutes = Int(recentPace) / 60
            let seconds = Int(recentPace) % 60
            return String(format: "%d’%02d”", minutes, seconds)
        }

        /// 분/㎞ 기준 5단계 + 정지(0단계)
        public func paceLevel() -> PaceLevel {
            guard isRunning(), recentPace > 0 else { return .level0 }
            switch recentPace {
            case 480...:        return .level1      // ≥ 8:00
            case 420..<480:     return .level2      // ≥ 7:00
            case 360..<420:     return .level3      // ≥ 6:00
            case 300..<360:     return .level4      // ≥ 5:00
            case ..<300:        return .level5      // < 5:00
            default:            return .level0
            }
        }

        public func formattedDistanceKm() -> String {
            String(format: "%.2f", distanceMeters / 1000.0)
        }
      
        public func messageColor() -> Color {
          guard let type = messageType else { return Color(hex: "#B5B5B5") }
          switch type {
          case .warning:
            return Color(hex: "#FF3358")
          default:
            return Color(hex: "#B5B5B5")
        }
      }
    }
}


public class ExpoLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
      Name("ExpoLiveActivity")

      Events("onLiveActivityCancel")

      Function("areActivitiesEnabled") { () -> Bool in
          if #available(iOS 16.2, *) {
              return !Activity<GoRunAttributes>.activities.isEmpty
          } else {
              return false
          }
      }
      
      Function("isActivityInProgress") { () -> Bool in
          if #available(iOS 16.2, *) {
              return !Activity<GoRunAttributes>.activities.isEmpty
          } else {
              return false
          }
      }
      
      Function("startActivity") { (runType: String, sessionId: String, startedAt: Date, recentPace: Double, distanceMeters: Double, progress: Double?, message: String?, messageType: String?) -> Bool in
          if #available(iOS 16.2, *) {
            guard let runType = RunType(rawValue: runType) else { print("runType is invalid"); return false }
            guard let messageType = MessageType(rawValue: messageType ?? "INFO") else { print("messageType is invalid"); return false }
              let attributes = GoRunAttributes(runType: runType, sessionId: sessionId)
              let contentState = GoRunAttributes.ContentState(startedAt: startedAt, recentPace: recentPace, distanceMeters: distanceMeters, progress: progress, message: message, messageType: messageType)
              let acitivityContent = ActivityContent(state: contentState, staleDate: nil)
              do {
                  let activity = try Activity.request(attributes: attributes, content: acitivityContent)
                  NotificationCenter.default.addObserver(self, selector: #selector(self.onLiveActivityCancel), name: Notification.Name("onLiveActivityCancel"), object: nil)
                  return true
              } catch (let error) {
                  return false
              }
          } else {
              return false
          }
      }
      
      Function("updateActivity") { (startedAt: Date, recentPace: Double, distanceMeters: Double, pausedAt: Date?, progress: Double?, message: String?, messageType: String?) -> Void in
          if #available(iOS 16.2, *) {
            guard let messageType = MessageType(rawValue: messageType ?? "INFO") else { print("messageType is invalid"); return }
              let contentState = GoRunAttributes.ContentState(startedAt: startedAt, pausedAt: pausedAt, recentPace: recentPace, distanceMeters: distanceMeters, progress: progress, message: message, messageType: messageType)
              
              Task {
                  for activity in Activity<GoRunAttributes>.activities {
                      await activity.update(using: contentState)
                  }
              }
          }
      }
      
      Function("endActivity") { () -> Void in
          if #available(iOS 16.2, *) {
              Task {
                  for activity in Activity<GoRunAttributes>.activities {
                      await activity.end(nil, dismissalPolicy: .immediate)
                  }
              }
              
              NotificationCenter.default.removeObserver(self, name: Notification.Name("onLiveActivityCancel"), object: nil)
          }
      }
  }
    
    @objc
    func onLiveActivityCancel() {
        sendEvent("onLiveActivityCancel", [:])
    }
}
