const config = {
    expo: {
        name: "ghostrunner",
        slug: "ghostrunner",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        scheme: "ghostrunner",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        extra: {
            eas: {
                projectId: "2cb16511-b095-499b-b82f-be1d7afaeea4",
            },
        },
        owner: "sgmrt",
        splash: {
            backgroundColor: "#090A0A",
        },
        ios: {
            bundleIdentifier: "com.sgmrt.ghostrunner",
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false,
                NSSupportsLiveActivities: true,
                NSAppTransportSecurity: {
                    NSAllowsArbitraryLoads: true,
                },
            },
            config: {
                usesNonExemptEncryption: false,
            },
            googleServicesFile:
                process.env.GOOGLE_SERVICES_INFO ||
                "./GoogleService-Info.plist",
            usesAppleSignIn: true,
            appleTeamId: "5J98U9WUGW",
            entitlements: {
                "com.apple.security.application-groups": [
                    "group.com.sgmrt.ghostrunner",
                ],
            },
        },
        android: {
            package: "com.sgmrt.ghostrunner",
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#e2ff00",
            },
            edgeToEdgeEnabled: true,
            googleServicesFile:
                process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
        },
        updates: {
            url: "https://u.expo.dev/2cb16511-b095-499b-b82f-be1d7afaeea4",
            requestHeaders: {
                "expo-channel-name": "production",
            },
        },
        runtimeVersion: {
            policy: "appVersion",
        },
        plugins: [
            "expo-router",
            [
                "expo-splash-screen",
                {
                    image: "./assets/images/splash-icon.png",
                    resizeMode: "contain",
                    backgroundColor: "#090A0A",
                },
            ],
            [
                "expo-location",
                {
                    locationAlwaysAndWhenInUsePermission:
                        "러닝 경로를 추적하고 지도에 표시하기 위해 위치 권한이 필요합니다.",
                    isIosBackgroundLocationEnabled: true,
                    isAndroidBackgroundLocationEnabled: true,
                },
            ],
            [
                "@rnmapbox/maps",
                {
                    RNMapboxMapsDownloadToken:
                        process.env.MAPBOX_DOWNLOAD_TOKEN,
                    RNMapboxMapsVersion: "11.12.2",
                },
            ],
            [
                "expo-sensors",
                {
                    motionPermission:
                        "정확한 고도 측정과 활동 추적을 위해 모션 권한이 필요합니다.",
                },
            ],
            [
                "expo-secure-store",
                {
                    configureAndroidBackup: true,
                    faceIdPermission:
                        "사용자의 민감한 정보를 안전하게 저장하고 활용하기 위해 보안 권한이 필요합니다.",
                },
            ],
            "@react-native-firebase/app",
            "@react-native-firebase/auth",
            "@react-native-firebase/crashlytics",
            [
                "expo-build-properties",
                {
                    ios: {
                        useFrameworks: "static",
                    },
                    android: {
                        extraMavenRepos: [
                            "https://devrepo.kakao.com/nexus/content/groups/public/",
                        ],
                    },
                },
            ],
            "expo-apple-authentication",
            [
                "@react-native-kakao/core",
                {
                    nativeAppKey: "64152404b18a24bc4102db5c38d50def",
                    android: {
                        authCodeHandlerActivity: true,
                    },
                    ios: {
                        handleKakaoOpenUrl: true,
                    },
                },
            ],
            [
                "expo-image-picker",
                {
                    photosPermission:
                        "프로필 사진을 설정하거나 공유하기 위해 사진첩 접근 권한이 필요합니다.",
                },
            ],
            "@bacons/apple-targets",
            [
                "@sentry/react-native/expo",
                {
                    url: "https://sentry.io/",
                    project: "react-native",
                    organization: "sogogimaratang",
                },
            ],
            "expo-audio",
            [
                "react-native-share",
                {
                    ios: ["fb", "instagram", "twitter", "tiktoksharesdk"],
                    android: [
                        "com.facebook.katana",
                        "com.instagram.android",
                        "com.twitter.android",
                        "com.zhiliaoapp.musically",
                    ],
                    enableBase64ShareAndroid: true,
                },
            ],
        ],
        experiments: {
            typedRoutes: true,
        },
    },
};

export default config;
