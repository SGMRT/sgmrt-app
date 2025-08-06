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
            guard recentPace > 0, recentPace < 9999 else { return "-’--”" }
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
