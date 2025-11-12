//
//  MetricsAggregator.swift
//  app
//
//  Created by 정윤석 on 11/12/25.
//

import HealthKit

final class MetricsAggregator {
  struct Payload { let distanceM: Double?; let paceSecPerKm: Double?; let cadenceSpm: Int?; let calories: Int? }
  var onHR: ((Double)->Void)?
  var onDistance: ((Double)->Void)?
  var onPace: ((Double)->Void)?
  var onCalories: ((Int)->Void)?

  func consume(collectedTypes: Set<HKSampleType>,
               from builder: HKLiveWorkoutBuilder,
               emit: (Payload)->Void) {
    var dist: Double?
    var pace: Double?
    var cal: Int?

    for t in collectedTypes {
      guard let qt = t as? HKQuantityType, let st = builder.statistics(for: qt) else { continue }
      if qt == HKQuantityType(.heartRate), let q = st.mostRecentQuantity() {
        let bpm = q.doubleValue(for: .count().unitDivided(by: .minute()))
        onHR?(bpm)
      }
      if qt == HKQuantityType(.distanceWalkingRunning) {
        dist = st.sumQuantity()?.doubleValue(for: .meter())
        if let d = dist { onDistance?(d) }
      }
      if qt == HKQuantityType(.runningSpeed), let q = st.mostRecentQuantity() {
        let mps = q.doubleValue(for: .meter().unitDivided(by: .second()))
        if mps > 0 { pace = 1000.0 / mps; onPace?(pace!) }
      }
      if qt == HKQuantityType(.activeEnergyBurned) {
        let kcal = st.sumQuantity()?.doubleValue(for: .kilocalorie()) ?? 0
        cal = Int(kcal.rounded())
        if let c = cal { onCalories?(c) }
      }
    }
    emit(Payload(distanceM: dist, paceSecPerKm: pace, cadenceSpm: nil, calories: cal))
  }
}
