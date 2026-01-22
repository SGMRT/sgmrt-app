//
//  CompleteIntent.swift
//  ghostrunner
//
//  Created by 정윤석 on 7/29/25.
//

import AppIntents
import WidgetKit

private let kCompleteNotification = "com.sgmrt.ghostrunner.complete" as CFString

@available(iOS 16.2, *)
struct CompleteIntent: AppIntent, LiveActivityIntent {
    static var title: LocalizedStringResource = "Complete Exercise"
    static var description: IntentDescription = "Opens the app to complete the exercise"
    static var openAppWhenRun: Bool = true

    init() {}

    func perform() async throws -> some IntentResult {
        // Darwin Notification 사용 (프로세스 간 통신)
        let center = CFNotificationCenterGetDarwinNotifyCenter()
        CFNotificationCenterPostNotification(
            center,
            CFNotificationName(kCompleteNotification),
            nil,
            nil,
            true
        )
        return .result()
    }
}
