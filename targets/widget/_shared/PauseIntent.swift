//
//  PauseIntent.swift
//  ghostrunner
//
//  Created by 정윤석 on 7/29/25.
//

import AppIntents
import WidgetKit

private let kPauseNotification = "com.sgmrt.ghostrunner.pause" as CFString

@available(iOS 16.2, *)
struct PauseIntent: AppIntent, LiveActivityIntent {
    static var title: LocalizedStringResource = "Pause Timer"
    static var description: IntentDescription = "Pauses the current timer."

    init() {}

    func perform() async throws -> some IntentResult {
        // Darwin Notification 사용 (프로세스 간 통신)
        let center = CFNotificationCenterGetDarwinNotifyCenter()
        CFNotificationCenterPostNotification(
            center,
            CFNotificationName(kPauseNotification),
            nil,
            nil,
            true
        )
        return .result()
    }
}
