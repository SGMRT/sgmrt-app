//
//  ContentViewModel.swift
//  app
//
//  Created by 정윤석 on 9/27/25.
//

import Foundation


final class ContentViewModel: ObservableObject {
  @Published var log: [String] = []
  
  
  func sendHelloToPhone() {
    WatchConnectivityBridge.shared.sendNow(["text": "hello world"])
    log.append("WATCH → PHONE: hello world")
  }
}
