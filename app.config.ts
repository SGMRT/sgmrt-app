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
            backgroundColor: "#111111",
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
                    image: "./assets/icons/logo.png",
                    resizeMode: "contain",
                    backgroundColor: "#111111",
                    imageWidth: 275,
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
            [
                "react-native-google-mobile-ads",
                {
                    androidAppId: "ca-app-pub-3940256099942544~1458002511",
                    iosAppId: "ca-app-pub-3940256099942544~1458002511",
                    skAdNetworkItems: [
                        "cstr6suwn9.skadnetwork",
                        "4fzdc2evr5.skadnetwork",
                        "2fnua5tdw4.skadnetwork",
                        "ydx93a7ass.skadnetwork",
                        "p78axxw29g.skadnetwork",
                        "v72qych5uu.skadnetwork",
                        "ludvb6z3bs.skadnetwork",
                        "cp8zw746q7.skadnetwork",
                        "3sh42y64q3.skadnetwork",
                        "c6k4g5qg8m.skadnetwork",
                        "s39g8k73mm.skadnetwork",
                        "3qy4746246.skadnetwork",
                        "f38h382jlk.skadnetwork",
                        "hs6bdukanm.skadnetwork",
                        "mlmmfzh3r3.skadnetwork",
                        "v4nxqhlyqp.skadnetwork",
                        "wzmmz9fp6w.skadnetwork",
                        "su67r6k2v3.skadnetwork",
                        "yclnxrl5pm.skadnetwork",
                        "t38b2kh725.skadnetwork",
                        "7ug5zh24hu.skadnetwork",
                        "gta9lk7p23.skadnetwork",
                        "vutu7akeur.skadnetwork",
                        "y5ghdn5j9k.skadnetwork",
                        "v9wttpbfk9.skadnetwork",
                        "n38lu8286q.skadnetwork",
                        "47vhws6wlr.skadnetwork",
                        "kbd757ywx3.skadnetwork",
                        "9t245vhmpl.skadnetwork",
                        "a2p9lx4jpn.skadnetwork",
                        "22mmun2rn5.skadnetwork",
                        "44jx6755aq.skadnetwork",
                        "k674qkevps.skadnetwork",
                        "4468km3ulz.skadnetwork",
                        "2u9pt9hc89.skadnetwork",
                        "8s468mfl3y.skadnetwork",
                        "klf5c3l5u5.skadnetwork",
                        "ppxm28t8ap.skadnetwork",
                        "kbmxgpxpgc.skadnetwork",
                        "uw77j35x4d.skadnetwork",
                        "578prtvx9j.skadnetwork",
                        "4dzt52r2t5.skadnetwork",
                        "tl55sbb4fm.skadnetwork",
                        "c3frkrj4fj.skadnetwork",
                        "e5fvkxwrpn.skadnetwork",
                        "8c4e2ghe7u.skadnetwork",
                        "3rd42ekr43.skadnetwork",
                        "97r2b46745.skadnetwork",
                        "3qcr597p9d.skadnetwork",
                    ],

                    // iOS: ATT 권한 문구
                    userTrackingUsageDescription:
                        "맞춤형 광고 제공을 위해 기기 식별자를 사용할 수 있습니다.",
                },
            ],
            [
                "react-native-google-mobile-ads",
                {
                    androidAppId: "ca-app-pub-3940256099942544~1458002511",
                    iosAppId: "ca-app-pub-2823475521649542~5190026466",
                    skAdNetworkItems: [
                        "cstr6suwn9.skadnetwork",
                        "4fzdc2evr5.skadnetwork",
                        "2fnua5tdw4.skadnetwork",
                        "ydx93a7ass.skadnetwork",
                        "p78axxw29g.skadnetwork",
                        "v72qych5uu.skadnetwork",
                        "ludvb6z3bs.skadnetwork",
                        "cp8zw746q7.skadnetwork",
                        "3sh42y64q3.skadnetwork",
                        "c6k4g5qg8m.skadnetwork",
                        "s39g8k73mm.skadnetwork",
                        "3qy4746246.skadnetwork",
                        "f38h382jlk.skadnetwork",
                        "hs6bdukanm.skadnetwork",
                        "mlmmfzh3r3.skadnetwork",
                        "v4nxqhlyqp.skadnetwork",
                        "wzmmz9fp6w.skadnetwork",
                        "su67r6k2v3.skadnetwork",
                        "yclnxrl5pm.skadnetwork",
                        "t38b2kh725.skadnetwork",
                        "7ug5zh24hu.skadnetwork",
                        "gta9lk7p23.skadnetwork",
                        "vutu7akeur.skadnetwork",
                        "y5ghdn5j9k.skadnetwork",
                        "v9wttpbfk9.skadnetwork",
                        "n38lu8286q.skadnetwork",
                        "47vhws6wlr.skadnetwork",
                        "kbd757ywx3.skadnetwork",
                        "9t245vhmpl.skadnetwork",
                        "a2p9lx4jpn.skadnetwork",
                        "22mmun2rn5.skadnetwork",
                        "44jx6755aq.skadnetwork",
                        "k674qkevps.skadnetwork",
                        "4468km3ulz.skadnetwork",
                        "2u9pt9hc89.skadnetwork",
                        "8s468mfl3y.skadnetwork",
                        "klf5c3l5u5.skadnetwork",
                        "ppxm28t8ap.skadnetwork",
                        "kbmxgpxpgc.skadnetwork",
                        "uw77j35x4d.skadnetwork",
                        "578prtvx9j.skadnetwork",
                        "4dzt52r2t5.skadnetwork",
                        "tl55sbb4fm.skadnetwork",
                        "c3frkrj4fj.skadnetwork",
                        "e5fvkxwrpn.skadnetwork",
                        "8c4e2ghe7u.skadnetwork",
                        "3rd42ekr43.skadnetwork",
                        "97r2b46745.skadnetwork",
                        "3qcr597p9d.skadnetwork",
                    ],

                    // iOS: ATT 권한 문구
                    userTrackingUsageDescription:
                        "맞춤형 광고 제공을 위해 기기 식별자를 사용할 수 있습니다.",
                },
            ],
            "expo-notifications",
            "expo-tracking-transparency",
        ],
        experiments: {
            typedRoutes: true,
        },
    },
};

export default config;
