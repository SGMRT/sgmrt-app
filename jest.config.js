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
            ")/)",
    ],
    moduleNameMapper: {
        "^@/src/(.*)$": "<rootDir>/src/$1",
        "^@/(.*)$": "<rootDir>/src/$1",
    },
    testPathIgnorePatterns: [
        "/node_modules/",
        "<rootDir>/src/app/test.tsx", // 네이티브 데모 페이지는 유닛 테스트 제외(원하면 유지)
    ],
};
