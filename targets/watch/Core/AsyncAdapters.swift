//
//  AsyncAdapters.swift
//  app
//
//  Created by 정윤석 on 11/12/25.
//

import HealthKit
import CoreLocation

extension HKLiveWorkoutBuilder {
  func finishWorkoutAsync() async throws -> HKWorkout {
    if #available(watchOS 10.0, *) {
      // watchOS 10부터는 async API가 기본 제공됨
      return try await withCheckedThrowingContinuation { cont in
        self.finishWorkout { workout, error in
          if let error = error { cont.resume(throwing: error); return }
          guard let workout = workout else {
            cont.resume(throwing: NSError(domain: "HK", code: -1, userInfo: [NSLocalizedDescriptionKey: "workout nil"]))
            return
          }
          cont.resume(returning: workout)
        }
      }
    } else {
      return try await withCheckedThrowingContinuation { cont in
        self.finishWorkout { workout, error in
          if let error = error { cont.resume(throwing: error); return }
          guard let workout = workout else {
            cont.resume(throwing: NSError(domain: "HK", code: -1, userInfo: [NSLocalizedDescriptionKey: "workout nil"]))
            return
          }
          cont.resume(returning: workout)
        }
      }
    }
  }
}

extension HKWorkoutRouteBuilder {
  func insertRouteDataAsync(_ locations: [CLLocation]) async throws {
    try await withCheckedThrowingContinuation { (cont: CheckedContinuation<Void, Error>) in
      self.insertRouteData(locations) { success, error in
        if let error = error {
          cont.resume(throwing: error)
        } else if success {
          cont.resume(returning: ())
        } else {
          cont.resume(throwing: NSError(
            domain: "HK",
            code: -2,
            userInfo: [NSLocalizedDescriptionKey: "insertRouteData failed"]
          ))
        }
      }
    }
  }

  func finishRouteAsync(with workout: HKWorkout, metadata: [String: Any]? = nil) async throws -> HKWorkoutRoute {
    try await withCheckedThrowingContinuation { cont in
      self.finishRoute(with: workout, metadata: metadata) { route, error in
        if let error = error { cont.resume(throwing: error) }
        else if let route = route { cont.resume(returning: route) }
        else {
          cont.resume(throwing: NSError(domain: "HK", code: -3, userInfo: [NSLocalizedDescriptionKey: "finishRoute returned nil"]))
        }
      }
    }
  }
}
