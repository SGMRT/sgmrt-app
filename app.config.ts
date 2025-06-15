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
        ios: {
            supportsTablet: true,
        },
        android: {
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
                    RNMapboxMapsDownloadtOKEN:
                        "sk.eyJ1Ijoic2dtcnQiLCJhIjoiY21ieDQ3amw5MTMwdjJpczEycG1hcTdndiJ9.wVjCu8HAcZagGw5LNXZUtw",
                    RNMapboxMapsVersion: "11.0.0",
                },
            ],
        ],
        experiments: {
            typedRoutes: true,
        },
    },
};

export default config;
