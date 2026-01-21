module.exports = {
    preset: "jest-expo",
    testMatch: ["**/__tests__/**/*.(spec|test).[tj]s?(x)"],
    setupFiles: ["<rootDir>/jest.setup.js"],
    transformIgnorePatterns: [
        "node_modules/(?!(" +
            // RN/Expo 계열은 변환 허용
            "react-native" +
            "|@react-native" +
            "|expo(?:-[^/]+)?" +
            "|@expo(?:-[^/]+)?" +
            "|@react-navigation" +
            "|@amplitude/analytics-react-native" +
            "|react-native-audio-api" +
            "|react-native-toast-message" +
            "|react-native-nitro-modules" +
            "|@kingstinct/react-native-healthkit" +
            ")/)",
    ],
    moduleNameMapper: {
        "^@/src/(.*)$": "<rootDir>/src/$1",
        "^@/assets/(.*)$": "<rootDir>/assets/$1",
        "^@/(.*)$": "<rootDir>/$1",
    },
    testPathIgnorePatterns: [
        "/node_modules/",
        "<rootDir>/src/app/test.tsx", // 네이티브 데모 페이지는 유닛 테스트 제외(원하면 유지)
    ],
    // 커버리지 수집 범위: 핵심 비즈니스 로직 (순수 함수, 스토어)
    collectCoverageFrom: [
        "src/features/**/utils/**/*.{ts,tsx}",
        "src/features/**/store/**/*.{ts,tsx}",
        "src/features/**/context/**/*.{ts,tsx}",
        "src/utils/**/*.{ts,tsx}",
        "src/store/**/*.{ts,tsx}",
        "src/apis/core/**/*.{ts,tsx}",
        "src/apis/utils.{ts,tsx}",
        // 제외: 네이티브 API 의존, 타입 정의, 인덱스 파일
        "!src/**/*.d.ts",
        "!src/**/types.{ts,tsx}",
        "!src/**/index.{ts,tsx}",
        "!src/utils/devLog.{ts,tsx}",
        "!src/utils/sentryTools.{ts,tsx}",
        "!src/utils/runUtils/saveRunning.{ts,tsx}",
        "!src/utils/pickImage.{ts,tsx}",
        "!src/utils/trackAmplitude.{ts,tsx}",
        "!src/store/localPrefs.{ts,tsx}",
        "!src/store/locationInfo.{ts,tsx}",
        "!src/store/signupStore.{ts,tsx}",
        "!src/features/**/context/actions.{ts,tsx}",
        "!src/features/**/context/context.{ts,tsx}",
        "!src/features/pacemaker/utils/pacemakerTelemetry.{ts,tsx}",
    ],
};
