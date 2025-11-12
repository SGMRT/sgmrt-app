//
//  EventSchema.swift
//  app
//
//  Created by 정윤석 on 11/12/25.
//

import Foundation

enum WatchOutEvent {
  case state(state: String, reason: String?, ts: Date)
  case control(action: String, ts: Date)
  case bpm(value: Double, ts: Date)
  case metrics(distanceM: Double, paceSecPerKm: Double?, cadenceSpm: Int? , ts: Date)
}

enum PhoneInCommand: String {
  case start, pause, resume, stop
}
