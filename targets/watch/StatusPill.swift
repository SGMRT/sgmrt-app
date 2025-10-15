//
//  StatusPill.swift
//  app
//
//  Created by 정윤석 on 10/15/25.
//
import SwiftUI

// 상태 배지
struct StatusPill: View {
  let state: String
  var body: some View {
    let (label, color) = style(for: state)
    Text(label)
      .font(.caption2.bold())
      .padding(.horizontal, 10).padding(.vertical, 4)
      .background(Capsule().fill(color.opacity(0.18)))
      .overlay(Capsule().stroke(color.opacity(0.55), lineWidth: 1))
      .foregroundStyle(color)
  }

  private func style(for s: String) -> (String, Color) {
    switch s {
    case "running":     return ("러닝 중", .brand as Color)
    case "paused":      return ("일시정지", .yellow)
    case "ended":       return ("종료됨", .gray)
    case "error":       return ("오류", .red)
    case "ready":       return ("준비", .brand as Color)
    case "started":     return ("시작 중", .brand as Color)
    case "reachable":   return ("연결됨", .green)
    case "unreachable": return ("연결 끊김", .orange)
    default:            return ("대기", .secondary)
    }
  }
}
