//
//  WatchConnectivityBridge.swift
//  app
//
//  Created by 정윤석 on 9/27/25.
//

import Foundation
import WatchConnectivity
import WatchKit


final class WatchConnectivityBridge: NSObject, ObservableObject {
  static let shared = WatchConnectivityBridge()
  private override init() { super.init(); activate() }
  
  
  @Published var lastMessage: String = ""
  
  
  private var session: WCSession? { WCSession.isSupported() ? WCSession.default : nil }
  
  
  func activate() {
    guard let session = session else { return }
    session.delegate = self
    session.activate()
  }
  
  
  // WATCH → PHONE 즉시 전송
  func sendNow(_ dict: [String: Any]) {
    guard let session = session else { return }
    if session.isReachable {
      session.sendMessage(dict, replyHandler: nil) { error in
        print("sendNow error: \(error.localizedDescription)")
      }
    } else {
      // 도달 불가 시 백그라운드 큐로 전송
      session.transferUserInfo(dict)
    }
  }
}


extension WatchConnectivityBridge: WCSessionDelegate {
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    print("WCSession activated: \(activationState.rawValue), error: \(String(describing: error))")
  }
  
  
  // PHONE → WATCH 메시지
  func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
    DispatchQueue.main.async { [weak self] in
      if let t = message["text"] as? String { self?.lastMessage = t }
    }
  }
  
  
  // PHONE → WATCH 백그라운드 전송
  func session(_ session: WCSession, didReceiveUserInfo userInfo: [String : Any] = [:]) {
    DispatchQueue.main.async { [weak self] in
      if let t = userInfo["text"] as? String { self?.lastMessage = t }
    }
  }
}
