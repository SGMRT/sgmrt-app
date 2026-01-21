<p align="center">
  <img src="assets/icons/logo.png" alt="Ghost Runner Logo" width="280"/>
</p>

<p align="center">
  <img src="assets/icons/icon.png" alt="Ghost Runner Icon" width="80"/>
</p>

<p align="center">
  <strong>혼자가 아닌, 고스트와 함께</strong><br/>
  과거의 나와 경쟁하는 몰입형 러닝 앱
</p>

<p align="center">
  <a href="https://apps.apple.com/kr/app/ghostrunner/id6747737877">
    <img src="https://img.shields.io/badge/App_Store-0D96F6?style=for-the-badge&logo=app-store&logoColor=white" alt="App Store"/>
  </a>
  <a href="https://ghostrun.io">
    <img src="https://img.shields.io/badge/Website-000000?style=for-the-badge&logo=safari&logoColor=white" alt="Website"/>
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native"/>
  <img src="https://img.shields.io/badge/Expo_SDK_53-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo"/>
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
</p>

---

## 왜 고스트러너인가?

| 문제 | 고스트러너의 해결책 |
|------|---------------------|
| 혼자 달리면 동기부여가 안 돼요 | 과거의 나(고스트)와 실시간 경쟁 |
| 매번 같은 코스가 지루해요 | 다른 러너들의 코스를 선택해 함께 달리기 |
| 내가 얼마나 성장했는지 모르겠어요 | 세그먼트별 비교와 상세 통계 제공 |

## 주요 기능

### 고스트 러닝
과거의 내 기록을 소환해 실시간으로 경쟁합니다. 지도에서 고스트의 위치를 확인하며 추월의 쾌감을 느껴보세요.

### 코스 러닝
다른 러너들이 달린 실제 코스를 선택해 함께 달릴 수 있습니다. 새로운 코스 발견의 재미와 함께 경쟁의 긴장감을 더합니다.

### 실시간 피드백
- **음성 코칭** - 페이스, 거리, 시간을 음성으로 안내
- **메트로놈** - VDOT 기반 목표 케이던스 유지
- **Live Activity** - 잠금 화면에서 실시간 현황 확인

### 상세 러닝 통계
페이스, 케이던스, 심박수, 고도, 칼로리를 구간별로 분석합니다.

### Apple Watch 연동
심박수를 실시간으로 모니터링하고 러닝 데이터와 함께 기록합니다.

## 스크린샷

> 준비 중

## 시작하기

### 사전 요구사항

- Node.js 18+
- iOS: Xcode 15+, CocoaPods
- Android: Android Studio, JDK 17

### 설치

```bash
# 의존성 설치
npm install

# iOS 네이티브 빌드
npx expo run:ios

# Android 네이티브 빌드
npx expo run:android
```

### 개발 서버 실행

```bash
npm start
```

## 프로젝트 구조

```
src/
├── app/          # Expo Router 페이지
├── components/   # 재사용 UI 컴포넌트
├── features/     # 기능별 모듈
│   ├── run/      # 러닝 핵심 로직 (센서, 상태관리, 통계)
│   ├── course/   # 코스 관리 및 오프코스 감지
│   └── audio/    # 음성 피드백 및 메트로놈
├── apis/         # API 클라이언트
├── store/        # Zustand 전역 상태
└── utils/        # 유틸리티 함수
```

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | React Native, Expo SDK 53 |
| Language | TypeScript |
| Navigation | Expo Router (파일 기반 라우팅) |
| State | Zustand, TanStack Query |
| Map | Mapbox GL |
| Sensors | expo-location, expo-sensors |
| Watch | HealthKit, WatchConnectivity |
| Analytics | Amplitude, Sentry |
| CI/CD | EAS Build, EAS Update |

## 링크

- [공식 웹사이트](https://ghostrun.io)
- [App Store](https://apps.apple.com/kr/app/ghostrunner/id6747737877)