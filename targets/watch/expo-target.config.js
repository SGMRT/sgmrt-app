/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
    type: "watch",
    name: "GhostRunner Watch",
    icon: "../../assets/images/icon.png",
    colors: { $accent: "#e2ff00", $widgetBackground: "#111111" },
    deploymentTarget: "9.4",
    entitlements: {
        "com.apple.security.application-groups":
            config.ios.entitlements["com.apple.security.application-groups"],
    },
});
