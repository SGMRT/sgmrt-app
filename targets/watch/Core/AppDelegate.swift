//
//  AppDelegate.swift
//  app
//
//  Created by 정윤석 on 11/11/25.
//

import SwiftUI
import WatchKit

enum ControlMode { case phoneControlled, watchStandalone }

final class AppDelegate: NSObject, WKApplicationDelegate {
  static var shared: AppDelegate?
  
  let ui = WorkoutUI()
  private let wc = WCBridge()
  lazy var session = SessionManager(ui: ui, wc: wc)

  func applicationDidFinishLaunching() {
    Self.shared = self
    wc.activate()
    // 폰→워치 명령 수신
    wc.onCommand = { [weak self] cmd, ts, dict in
      guard let self else { return }
      let t = ts ?? Date()
      switch cmd {
      case .start:
          if self.session.mode == .watchStandalone {
            self.wc.post(.state(state: "running",
                                reason: "ignore:start@standalone",
                                ts: t))
            return
          }

          let act = (dict["activity"] as? String) ?? "running"
          Task {
            await self.session.start(activity: act, at: t, standalone: false)
          }
      case .pause:
        Task { @MainActor in self.session.pause(at: t) }
      case .resume:
        Task { @MainActor in self.session.resume(at: t) }
      case .stop:
        Task { @MainActor in self.session.stop(at: t) }
      }
    }
    // 초기 상태
    Task { @MainActor in ui.applyState(.ready, at: Date()) }
    wc.post(.state(state: "ready", reason: "launch", ts: Date()))
  }

  // 워치에서 직접 시작/제어하는 API (UI에서 호출)
  func startOnWatch(activity: String = "running") { Task { await session.start(activity: activity, at: Date(), standalone: true) } }
  func pauseFromUI()  { session.pause(at: Date()) ; wc.post(.control(action: "pause",  ts: Date())) }
  func resumeFromUI() { session.resume(at: Date()); wc.post(.control(action: "resume", ts: Date())) }
  func stopFromUI()   { session.stop(at: Date())  ; wc.post(.control(action: "stop",   ts: Date())) }
  
  // 메인 화면으로 돌아가기 (ended 상태에서 호출)
  @MainActor
  func resetToMain() {
    ui.applyState(.ready, at: Date())
  }
}
