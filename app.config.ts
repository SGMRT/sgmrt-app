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
        },
        android: {
            package: "com.sgmrt.ghostrunner",
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#ffffff",
            },
            edgeToEdgeEnabled: true,
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
        ],
        experiments: {
            typedRoutes: true,
        },
    },
};

export default config;
