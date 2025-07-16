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
        ios: {
            bundleIdentifier: "com.sgmrt.ghostrunner",
            infoPlist: {
                ITSAppUsesNonExemptEncryption: false,
            },
            config: {
                usesNonExemptEncryption: false,
            },
            googleServicesFile:
                process.env.GOOGLE_SERVICES_INFO ||
                "./GoogleService-Info.plist",
            usesAppleSignIn: true,
        },
        android: {
            package: "com.sgmrt.ghostrunner",
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#ffffff",
            },
            edgeToEdgeEnabled: true,
            googleServicesFile:
                process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
        },
        web: {
            bundler: "metro",
            output: "static",
            favicon: "./assets/images/favicon.png",
        },
        plugins: [
            "expo-router",
            [
                "expo-splash-screen",
                {
                    image: "./assets/images/splash-icon.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#ffffff",
                },
            ],
            [
                "expo-location",
                {
                    locationAlwaysAndWhenInUsePermission:
                        "Allow $(PRODUCT_NAME) to use your location.",
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
        ],
        experiments: {
            typedRoutes: true,
        },
    },
};

export default config;
