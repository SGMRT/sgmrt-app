//
//  WCBridge.swift
//  app
//
//  Created by 정윤석 on 11/12/25.
//

import Foundation
import WatchConnectivity
import os

final class WCBridge: NSObject, WCSessionDelegate {
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: (any Error)?) {}
  
  private let log = Logger(subsystem: "WatchApp", category: "WC")
  private let iso: ISO8601DateFormatter = {
    let f = ISO8601DateFormatter()
    f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return f
  }()

  var onCommand: ((PhoneInCommand, Date?, [String:Any]) -> Void)?   // 폰→워치 명령 콜백

  func activate() {
    guard WCSession.isSupported() else { return }
    let s = WCSession.default
    s.delegate = self
    s.activate()
  }

  // 워치→폰 브로드캐스트
  func post(_ event: WatchOutEvent) {
    guard let data = try? JSONSerialization.data(withJSONObject: encode(event)) else { return }
    let s = WCSession.default
    if s.isReachable {
      s.sendMessageData(data, replyHandler: nil) { self.log.error("\($0.localizedDescription)") }
    } else {
      s.transferUserInfo(encode(event))
    }
  }

  private func encode(_ e: WatchOutEvent) -> [String:Any] {
    func ts(_ d: Date) -> String { iso.string(from: d) }
    switch e {
    case let .state(state, reason, time):
      return ["type":"state","state":state,"reason":reason ?? NSNull(),"ts":ts(time)]
    case let .control(action, time):
      return ["type":"control","action":action,"ts":ts(time)]
    case let .bpm(value, time):
      return ["type":"bpm","bpm":value,"ts":ts(time)]
    case let .metrics(dist, pace, spm, time):
      return ["type":"metrics",
              "distanceM": dist as Any,
              "paceSecPerKm": pace as Any,
              "cadenceSpm": spm as Any,
              "ts": ts(time)]
    }
  }

  @MainActor func session(_ session: WCSession, didReceiveMessageData messageData: Data) {
    guard let obj = try? JSONSerialization.jsonObject(with: messageData) as? [String: Any] else { return }

    if let type = obj["type"] as? String, type == "sync" {
      AppDelegate.shared?.session.handlePhonePayload(obj)
      return
    }

    handle(obj)
  }
  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String : Any] = [:]) { handle(userInfo) }
  func session(_ session: WCSession,
               didReceiveApplicationContext applicationContext: [String : Any]) {
    handle(applicationContext) }

  private func handle(_ dict: [String:Any]) {
    guard let cmdStr = dict["cmd"] as? String, let cmd = PhoneInCommand(rawValue: cmdStr) else { return }
    let ts = (dict["eventTs"] as? String).flatMap(iso.date(from:))
    onCommand?(cmd, ts, dict)
  }
}
