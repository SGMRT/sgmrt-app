//
//  ResumeIntent.swift
//  ghostrunner
//
//  Created by 정윤석 on 7/29/25.
//

import AppIntents
import WidgetKit

private let kResumeNotification = "com.sgmrt.ghostrunner.resume" as CFString

@available(iOS 16.2, *)
struct ResumeIntent: AppIntent, LiveActivityIntent {
    static var title: LocalizedStringResource = "Resume Timer"
    static var description: IntentDescription = "Resumes the current timer."

    init() {}

    func perform() async throws -> some IntentResult {
        // Darwin Notification 사용 (프로세스 간 통신)
        let center = CFNotificationCenterGetDarwinNotifyCenter()
        CFNotificationCenterPostNotification(
            center,
            CFNotificationName(kResumeNotification),
            nil,
            nil,
            true
        )
        return .result()
    }
}
