//
//  WorkoutUI.swift
//  app
//
//  Created by 정윤석 on 9/29/25.
//

import Combine
import Foundation

/// 워치 화면용 상태 모델
final class WorkoutUI: ObservableObject {
  @Published var state: String = "idle"
  @Published var bpm: Int = 0

  // 시간 계산용
  @Published var startedAt: Date? = nil          // 세션 시작 시각
  @Published var pauseAccum: TimeInterval = 0    // 누적 일시정지 시간
  @Published var pauseStartedAt: Date? = nil     // 현재 일시정지 시작 시각
  @Published var endedAt: Date?                  // 종료 시각

  /// 지정 시점 기준 경과시간(초). paused이면 멈춘 값 유지.
  func elapsed(at date: Date = Date()) -> TimeInterval {
    guard let t0 = startedAt else { return 0 }
    let now: Date
    switch state {
    case "ended":
        now = endedAt ?? date
    case "paused":
        now = pauseStartedAt ?? date
    default:
        now = date
    }
    
    var paused = pauseAccum
    
    if let ps = pauseStartedAt, state != "running" && state != "ended" {
      paused += now.timeIntervalSince(ps)
    }
    
    return max(0, now.timeIntervalSince(t0) - paused)
  }
}
