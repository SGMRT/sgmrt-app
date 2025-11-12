//
//  WorkoutUI.swift
//  app
//
//  Created by 정윤석 on 11/11/25.
//

import Foundation
import SwiftUI

@MainActor
final class WorkoutUI: ObservableObject {
  @Published var state: String = "idle"
  @Published var bpm: Int = 0
  @Published var distanceM: Double = 0
  @Published var paceSecPerKm: Double? = nil
  @Published var cadenceSpm: Int? = nil
  @Published var calories: Int = 0
  @Published var mode: SessionManager.Mode = .phoneControlled

  @Published var startedAt: Date? = nil
  @Published var pauseAccum: TimeInterval = 0
  @Published var pauseStartedAt: Date? = nil
  @Published var endedAt: Date? = nil

  // 폰 동기화용: 마지막 동기화 시점의 경과 시간과 타임스탬프
  private var lastSyncElapsedSec: Double? = nil
  private var lastSyncTimestamp: Date? = nil

  enum State {
    case ready
    case started
    case running
    case paused
    case ended
  }

  func applyState(_ new: State, at t: Date) {
    switch new {
    case .ready:
      state = "ready"
      startedAt = nil
      endedAt = nil
      pauseAccum = 0
      pauseStartedAt = nil
      lastSyncElapsedSec = nil
      lastSyncTimestamp = nil
      bpm = 0; distanceM = 0; paceSecPerKm = nil; cadenceSpm = nil; calories = 0

    case .started:
      startedAt = t
      pauseAccum = 0
      pauseStartedAt = nil
      endedAt = nil
      state = "running"

    case .running:
      if startedAt == nil { startedAt = t }
      if let ps = pauseStartedAt {
        pauseAccum += t.timeIntervalSince(ps)
        pauseStartedAt = nil
      }
      state = "running"

    case .paused:
      if pauseStartedAt == nil { pauseStartedAt = t }
      state = "paused"

    case .ended:
      if let ps = pauseStartedAt {
        pauseAccum += t.timeIntervalSince(ps)
        pauseStartedAt = nil
      }
      endedAt = t
      state = "ended"
    }
  }

  func elapsed(at date: Date = Date()) -> TimeInterval {
    // ended 상태면 시간이 멈춰야 함
    if state == "ended" {
      // ended 상태일 때는 마지막으로 저장된 경과 시간 반환
      if let lastElapsed = lastSyncElapsedSec {
        return lastElapsed
      }
      // 워치 자체 시간 계산인 경우
      guard let start = startedAt, let end = endedAt else { return 0 }
      var paused = pauseAccum
      if let ps = pauseStartedAt {
        paused += end.timeIntervalSince(ps)
      }
      return max(0, end.timeIntervalSince(start) - paused)
    }
    
    // 폰 동기화가 활성화된 경우 (phoneControlled 모드)
    if let lastElapsed = lastSyncElapsedSec, let lastTs = lastSyncTimestamp {
      // pause 상태면 마지막 동기화 시점의 경과 시간 그대로 반환
      if state == "paused" {
        return lastElapsed
      }
      // running 상태면 마지막 동기화 경과 시간 + 경과한 시간
      let elapsedSinceSync = date.timeIntervalSince(lastTs)
      return max(0, lastElapsed + elapsedSinceSync)
    }
    
    // 워치 자체 시간 계산 (watchStandalone 모드)
    guard let start = startedAt else { return 0 }
    let now: Date = {
      switch state {
      case "paused":  return pauseStartedAt ?? date
      default:        return date
      }
    }()

    var paused = pauseAccum
    if let ps = pauseStartedAt, state != "running" {
      paused += now.timeIntervalSince(ps)
    }
    return max(0, now.timeIntervalSince(start) - paused)
  }
  
  // 폰 동기화 데이터 업데이트
  func updateSyncElapsed(_ elapsedSec: Double, at timestamp: Date) {
    lastSyncElapsedSec = elapsedSec
    lastSyncTimestamp = timestamp
  }
}
