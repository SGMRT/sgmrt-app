//
//  WatchApp.swift
//  app
//
//  Created by 정윤석 on 11/11/25.
//

import SwiftUI

@main
struct WatchApp: App {
  @WKApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
  var body: some Scene {
    WindowGroup { PagerView().environmentObject(appDelegate.ui) }
  }
}
