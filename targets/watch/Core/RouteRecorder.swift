//
//  RouteRecorder.swift
//  app
//
//  Created by 정윤석 on 11/11/25.
//

import Foundation
import CoreLocation
import HealthKit

final class RouteRecorder: NSObject, CLLocationManagerDelegate {
  private let healthStore: HKHealthStore
  private var builder: HKWorkoutRouteBuilder?
  private let lm = CLLocationManager()
  private var buf: [CLLocation] = []
  private var isActive = false
  
  private var lastAltitude: Double?
  private(set) var totalAscent: Double = 0
  private(set) var totalDescent: Double = 0

  init(healthStore: HKHealthStore) {
    self.healthStore = healthStore
    super.init()
    lm.delegate = self
  }

  func start() {
    guard !isActive else { return }
    isActive = true
    
    dlog(Log.route, "RouteRecorder start() CALLED")
    
    builder = HKWorkoutRouteBuilder(healthStore: healthStore, device: .local())
    
    lm.activityType = .fitness
    lm.desiredAccuracy = kCLLocationAccuracyBest
    lm.distanceFilter = 5
    
    let status = lm.authorizationStatus
    dlog(Log.route, "Location auth status at start: \(status.rawValue)")
    
    if status == .notDetermined {
      lm.requestWhenInUseAuthorization()
    } else if status == .authorizedWhenInUse || status == .authorizedAlways {
      lm.startUpdatingLocation()
      dlog(Log.route, "startUpdatingLocation() called (already authorized)")
    } else {
      dlog(Log.route, "Location not authorized (status=\(status.rawValue))")
    }
  }

  func stopCollecting() {
    guard isActive else { return }
    isActive = false
    dlog(Log.route, "RouteRecorder.stopCollecting()")
    lm.stopUpdatingLocation()
  }

  /// 워크아웃이 생성된 후(= finishWorkout 완료 콜백에서 받은 HKWorkout) Route를 최종 마감
  func finishAsync(with workout: HKWorkout) async {
    dlog(Log.route, "finishAsync called with workout: \(workout.uuid)")

    guard let builder = builder else {
      dlog(Log.route, "finishAsync: builder is nil, skipping")
      return
    }

    do {
      // 남은 버퍼 있으면 HealthKit으로 밀어넣기
      if !buf.isEmpty {
        let batch = buf
        buf.removeAll()
        dlog(Log.route, "finishAsync: flushing remaining buf=\(batch.count)")
        try await builder.insertRouteDataAsync(batch)
      }

      let meta: [String: Any] = [
        HKMetadataKeyElevationAscended: HKQuantity(unit: .meter(),
                                                   doubleValue: totalAscent),
        HKMetadataKeyElevationDescended: HKQuantity(unit: .meter(),
                                                    doubleValue: totalDescent)
      ]

      dlog(Log.route, "finishAsync: calling finishRouteAsync")
      let route = try await builder.finishRouteAsync(with: workout, metadata: meta)
      dlog(Log.route, "finishAsync: finishRouteAsync completed, route=\(route.uuid)")

      self.builder = nil
    } catch {
      dlog(Log.route, "finishAsync ERROR: \(error.localizedDescription)")
    }
  }
  
  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    let status = manager.authorizationStatus
    dlog(Log.route, "locationManagerDidChangeAuthorization: \(status.rawValue)")
    
    guard isActive else { return }
    
    switch status {
    case .authorizedWhenInUse, .authorizedAlways:
      dlog(Log.route, "Authorization granted, startUpdatingLocation()")
      lm.startUpdatingLocation()
    case .denied, .restricted:
      dlog(Log.route, "Authorization denied/restricted")
    case .notDetermined:
      dlog(Log.route, "Authorization notDetermined")
    @unknown default:
      dlog(Log.route, "Authorization unknown default")
    }
  }

  // MARK: - CLLocationManagerDelegate
  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    print("locationManager CALLED, count:", locations.count)
    guard isActive else { return }
    buf.append(contentsOf: locations)
    
    if let last = locations.last {
      dlog(Log.route, String(format: "loc: lat=%.6f lng=%.6f acc=%.1fm ts=%.0f",
                             last.coordinate.latitude,
                             last.coordinate.longitude,
                             last.horizontalAccuracy,
                             last.altitude,
                             last.timestamp.timeIntervalSince1970))
    }
    
    for loc in locations {
      let alt = loc.altitude
      if let last = lastAltitude {
        let delta = alt - last
        if delta >= 0.5 { totalAscent += delta }     // 0.5m 이상 상승만 카운트
        else if delta <= -0.5 { totalDescent -= delta }
      }
      lastAltitude = alt
    }
  
    if buf.count >= 20 {
      let batch = buf
      buf.removeAll()
      dlog(Log.route, "insertRouteData(batch=\(batch.count))")
      builder?.insertRouteData(batch) { ok, err in
        if let err = err { dlog(Log.route, "insertRouteData error=\(err.localizedDescription)") }
        else { dlog(Log.route, "insertRouteData success=\(ok)") }
      }
    }
  }
}
