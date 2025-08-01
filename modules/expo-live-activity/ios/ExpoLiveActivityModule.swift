import ExpoModulesCore
import ActivityKit

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
      
      Function("startActivity") { (startedAt: Date, sessionId: String, runType: String, recentPace: String, distance: String, calories: String, progress: Double?) -> Bool in
          if #available(iOS 16.2, *) {
              let attributes = GoRunAttributes(runType: runType, sessionId: sessionId)
              let contentState = GoRunAttributes.ContentState(startedAt: startedAt, recentPace: recentPace, distance: distance, calories: calories, progress: progress)
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
      
      Function("updateActivity") { (startedAt: Date, recentPace: String, distance: String, calories: String, pausedAt: Date?, progress: Double?) -> Void in
          if #available(iOS 16.2, *) {
              let contentState = GoRunAttributes.ContentState(startedAt: startedAt, pausedAt: pausedAt ?? nil, recentPace: recentPace, distance: distance, calories: calories, progress: progress)
              
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
