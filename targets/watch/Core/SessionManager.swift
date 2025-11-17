//
//  SessionManager.swift
//  app
//
//  Created by 정윤석 on 11/12/25.
//

import Foundation
import HealthKit
import os

final class SessionManager: NSObject {
  enum Mode { case phoneControlled, watchStandalone }
  
  private let log = Logger(subsystem: "WatchApp", category: "Session")
  private let healthStore = HKHealthStore()
  private let ui: WorkoutUI
  private let wc: WCBridge
  private let metrics = MetricsAggregator()
  private let step = StepCadenceService()
  private var route: RouteRecorder?
  
  private var wSession: HKWorkoutSession?
  private var builder: HKLiveWorkoutBuilder?
  private(set) var mode: Mode = .phoneControlled
  
  private let iso: ISO8601DateFormatter = {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f
  }()
  
  init(ui: WorkoutUI, wc: WCBridge) {
    self.ui = ui
    self.wc = wc
    super.init()
    
    metrics.onHR = { [weak self] bpm in
      guard let self else { return }
      Task { @MainActor in
        self.ui.bpm = Int(bpm.rounded())
      }
      self.wc.post(.bpm(value: bpm, ts: Date()))
    }
    metrics.onDistance = { [weak self] m in
      guard let self else { return }
      Task { @MainActor in
        self.ui.distanceM = m
      }
    }
    metrics.onPace = { [weak self] v in
      guard let self else { return }
      Task { @MainActor in
        self.ui.paceSecPerKm = v
      }
    }
    step.onCadence = { [weak self] spm in
      guard let self else { return }
      Task { @MainActor in
        self.ui.cadenceSpm = spm
      }
    }
    metrics.onCalories = { [weak self] kcal in
      guard let self else { return }
      Task { @MainActor in
        self.ui.calories = kcal
      }
    }
  }
  
  // MARK: Permissions
  func requestAuth(forStandalone: Bool) async throws {
    var toRead = Set<HKObjectType>()
    toRead.insert(HKObjectType.workoutType())
    toRead.insert(HKObjectType.quantityType(forIdentifier: .heartRate)!)
    toRead.insert(HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)!)
    toRead.insert(HKObjectType.quantityType(forIdentifier: .runningSpeed)!)
    toRead.insert(HKObjectType.quantityType(forIdentifier: .stepCount)!)
    toRead.insert(HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!)
    toRead.insert(HKSeriesType.workoutRoute())
    
    var toShare = Set<HKSampleType>()
    if forStandalone {
      toShare.insert(HKObjectType.workoutType())
      toShare.insert(HKObjectType.quantityType(forIdentifier: .heartRate)!)
      toShare.insert(HKObjectType.quantityType(forIdentifier: .distanceWalkingRunning)!)
      toShare.insert(HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!)
      toShare.insert(HKObjectType.quantityType(forIdentifier: .stepCount)!)
      toShare.insert(HKSeriesType.workoutRoute())
    }
    try await healthStore.requestAuthorization(toShare: toShare, read: toRead)
  }
  
  // MARK: Lifecycle
  func start(activity: String, at t: Date, standalone: Bool) async {
    do {
      try await requestAuth(forStandalone: standalone)
    } catch {
      wc.post(.state(state: "error", reason: "auth:\(error.localizedDescription)", ts: Date()))
      return
    }
      
    mode = standalone ? .watchStandalone : .phoneControlled
    await MainActor.run {
      self.ui.mode = self.mode
    }
      
    let config = HKWorkoutConfiguration()
    config.activityType = (activity == "cycling") ? .cycling : .running
    config.locationType = .outdoor
      
    do {
//      print("start(): creating session")
      let s = try HKWorkoutSession(healthStore: healthStore, configuration: config)
      let b = s.associatedWorkoutBuilder()
      b.dataSource = HKLiveWorkoutDataSource(healthStore: healthStore, workoutConfiguration: config)
      wSession = s
      builder = b
      s.delegate = self
      b.delegate = self
        
//      print("start(): startActivity")
      s.startActivity(with: t)
        
//      print("start(): beginCollection...")
      try await b.beginCollection(at: t)
//      print("start(): beginCollection done")
        
      step.start(healthStore: healthStore, from: t)
//      print("start(): step.start done (standalone=\(standalone))")
        
      if standalone {
        await MainActor.run {
          let r = RouteRecorder(healthStore: self.healthStore)
          r.start()
          self.route = r
        }
//        print("start(): RouteRecorder started")
      }
        
      await MainActor.run { ui.applyState(.started, at: t) }
      wc.post(.state(state: "started", reason: standalone ? "watchStandalone" : "remote", ts: t))
        
      await MainActor.run { ui.applyState(.running, at: t) }
      wc.post(.state(state: "running", reason: "delegate", ts: t))
    } catch {
      log.error("start() error: \(error.localizedDescription)")
      wc.post(.state(state: "error", reason: "start:\(error.localizedDescription)", ts: Date()))
    }
  }
  
  @MainActor func pause(at t: Date) {
    guard let s = wSession else { return }
    s.pause()
    ui.applyState(.paused, at: t)
    wc.post(.state(state: "paused", reason: "user", ts: t))
  }
  
  @MainActor func resume(at t: Date) {
    guard let s = wSession else { return }
    s.resume()
    ui.applyState(.running, at: t)
    wc.post(.state(state: "running", reason: "user", ts: t))
  }
  
  func stop(at t: Date) {
    guard let s = wSession, let b = builder else { return }
    if s.state == .ended { return }
    s.stopActivity(with: t)
    s.end()
    
    Task {
      try? await b.endCollection(at: t)
      step.stop()
      
      // ended 상태로 전환하고 마지막 경과 시간 저장
      let finalElapsed = await MainActor.run { ui.elapsed(at: t) }
      await MainActor.run { ui.updateSyncElapsed(finalElapsed, at: t) }
      
      if mode == .watchStandalone {
        await MainActor.run {
          self.route?.stopCollecting()
        }
        
        do {
          let workout = try await b.finishWorkoutAsync()
          await self.route?.finishAsync(with: workout)
          wc.post(.state(state: "ended", reason: "saved@standalone", ts: t))
        } catch {
          wc.post(.state(state: "error", reason: "finish:\(error.localizedDescription)", ts: Date()))
        }
      } else {
        b.discardWorkout()
        wc.post(.state(state: "ended", reason: "discard@phoneControlled", ts: t))
      }
      
      wSession = nil
      builder = nil
      route = nil
      
      if mode == .watchStandalone {
        // 워치 단독 모드: 완료 화면 표시 (뒤로가기 버튼으로 메인으로 이동)
        await MainActor.run {
          ui.applyState(.ended, at: t)
        }
      } else {
        // 폰 컨트롤 모드: 완료 화면 없이 바로 메인으로
        await MainActor.run {
          ui.applyState(.ready, at: Date())
        }
      }
    }
  }
  
  // 폰 → 워치 메시지 진입점(기존 WCBridge → 여기로 라우팅하도록 연결)
  @MainActor func handlePhonePayload(_ obj: [String: Any]) {
      guard let type = obj["type"] as? String else { return }

      switch type {
      case "sync":
        guard mode == .phoneControlled else { return }

        if let phoneDist = obj["phoneDistanceM"] as? Double {
          Task { @MainActor in
            self.ui.distanceM = phoneDist
          }
        }

        if let phoneElapsed = obj["phoneElapsedSec"] as? Double {
          let syncTimestamp = Date()
          Task { @MainActor in
            self.ui.updateSyncElapsed(phoneElapsed, at: syncTimestamp)
          }
        }

        if let s = obj["state"] as? String {
          Task { @MainActor in
            switch s {
            case "paused": self.ui.applyState(.paused, at: Date())
            case "running": self.ui.applyState(.running, at: Date())
            case "ended": self.ui.applyState(.ended, at: Date()); self.stop(at: Date())
            default: break
            }
          }
        }

      default: break
      }
    }
  }

extension SessionManager: HKWorkoutSessionDelegate, HKLiveWorkoutBuilderDelegate {
  func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
    wc.post(.state(state: "error", reason: error.localizedDescription, ts: Date()))
  }
  
  func workoutSession(_ workoutSession: HKWorkoutSession,
                      didChangeTo to: HKWorkoutSessionState,
                      from: HKWorkoutSessionState,
                      date: Date) {
    switch to {
    case .running:
      Task { @MainActor in ui.applyState(.running, at: date) }
      wc.post(.state(state:"running", reason:"delegate", ts: date))
      
    case .paused:
      Task { @MainActor in ui.applyState(.paused, at: date) }
      wc.post(.state(state:"paused", reason:"delegate", ts: date))
      
    case .ended:
      Task { @MainActor in
        self.ui.applyState(.ended, at: date)
      }
      wc.post(.state(state:"ended", reason:"delegate", ts: date))
      
    default: break
    }
  }
  
  // 실시간 통계
  func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder,
                      didCollectDataOf collectedTypes: Set<HKSampleType>) {
    metrics.consume(collectedTypes: collectedTypes, from: workoutBuilder) { payload in
//      wc.post(.metrics(distanceM: payload.distanceM ?? 0.0,
//                       paceSecPerKm: payload.paceSecPerKm,
//                       cadenceSpm: payload.cadenceSpm,
//                       ts: Date()))
    }
  }
  func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}
}
