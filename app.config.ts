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
                        "Allow $(PRODUCT_NAME) to use your location.",
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
                        "Allow $(PRODUCT_NAME) to access your device motion",
                },
            ],
            [
                "expo-secure-store",
                {
                    configureAndroidBackup: true,
                    faceIdPermission:
                        "Allow $(PRODUCT_NAME) to access your Face ID",
                },
            ],
            "@react-native-firebase/app",
            "@react-native-firebase/auth",
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
                    nativeAppKey: process.env.EXPO_PUBLIC_KAKAO_APP_KEY,
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
                        "The app accesses your photos to let you share them with your friends.",
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
        ],
        experiments: {
            typedRoutes: true,
        },
    },
};

export default config;
