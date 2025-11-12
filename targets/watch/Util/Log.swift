//
//  Log.swift
//  app
//
//  Created by 정윤석 on 11/11/25.
//

import os

enum Log {
  static let core   = Logger(subsystem: "WatchApp", category: "Core")
  static let hk     = Logger(subsystem: "WatchApp", category: "HealthKit")
  static let wc     = Logger(subsystem: "WatchApp", category: "WC")
  static let route  = Logger(subsystem: "WatchApp", category: "Route")
  static let step = Logger(subsystem: "WatchApp", category: "Step")
}

// 필요 시 토글
let ENABLE_VERBOSE_LOG = true
func dlog(_ logger: Logger, _ msg: String) {
  guard ENABLE_VERBOSE_LOG else { return }
  logger.debug("\(msg, privacy: .public)")
}
