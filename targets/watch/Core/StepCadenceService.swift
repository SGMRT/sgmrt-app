//
//  StepCadenceService.swift
//  app
//
//  Created by 정윤석 on 11/12/25.
//

import HealthKit

final class StepCadenceService {
  var onCadence: ((Int)->Void)?
  private var anchor: HKQueryAnchor?
  private var query: HKAnchoredObjectQuery?
  private var ema: Double?
  private let alpha = 0.25
  
  private var healthStore: HKHealthStore?

  func start(healthStore: HKHealthStore, from t: Date) {
    self.healthStore = healthStore
    
    let type = HKQuantityType(.stepCount)
    let pred = HKQuery.predicateForSamples(withStart: t, end: nil, options: .strictStartDate)
    
    let q = HKAnchoredObjectQuery(type: type, predicate: pred, anchor: anchor, limit: HKObjectQueryNoLimit) {
      [weak self] _, samples, _, newAnchor, error in
      self?.consume(samples: samples, newAnchor: newAnchor)
    }
    
    q.updateHandler = { [weak self] _, samples, _, newAnchor, _ in
      self?.consume(samples: samples, newAnchor: newAnchor)
    }
    
    self.query = q
    healthStore.execute(q)
  }

  func stop() {
    if let q = query, let hs = healthStore {
      hs.stop(q)
    }
    query = nil
    anchor = nil
    ema = nil
    healthStore = nil
  }

  private func consume(samples: [HKSample]?, newAnchor: HKQueryAnchor?) {
    guard let arr = samples as? [HKQuantitySample], !arr.isEmpty else { return }
    
    var steps = 0.0
    var earliest = Date.distantFuture
    var latest = Date.distantPast
    
    for s in arr {
      steps += s.quantity.doubleValue(for: .count())
      earliest = min(earliest, s.startDate)
      latest = max(latest, s.endDate)
    }
    
    let dt = max(latest.timeIntervalSince(earliest), 0.5)
    let spmRaw = (steps / dt) * 60.0
    let clamped = min(240.0, max(50.0, spmRaw))
    
    ema = (ema == nil) ? clamped : (ema! + alpha * (clamped - ema!))
    onCadence?(Int((ema ?? clamped).rounded()))
    anchor = newAnchor
  }
}
