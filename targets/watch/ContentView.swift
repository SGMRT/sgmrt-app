//
//  ContentView.swift
//  app
//
//  Created by 정윤석 on 9/27/25.
//

import SwiftUI


struct ContentView: View {
  @StateObject private var vm = ContentViewModel()
  @ObservedObject private var bridge = WatchConnectivityBridge.shared
  
  
  var body: some View {
    VStack(spacing: 8) {
      Button("Send hello to iPhone") { vm.sendHelloToPhone() }
      if !bridge.lastMessage.isEmpty {
        Text("PHONE → WATCH: \(bridge.lastMessage)")
          .font(.footnote)
          .multilineTextAlignment(.center)
      }
      List(vm.log, id: \.self) { Text($0) }
    }
    .padding()
  }
}
