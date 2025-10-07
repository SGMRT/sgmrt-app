/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
    type: "widget",
    icon: "../../assets/images/icon.png",
    colors: { $accent: "#e2ff00", $widgetBackground: "#111111" },
    name: "고스트러너",
    entitlements: {
        "com.apple.security.application-groups":
            config.ios.entitlements["com.apple.security.application-groups"],
    },
    images: {
        logo: {
            "1x": "../../assets/images/widget/logo_1x.png",
            "2x": "../../assets/images/widget/logo_2x.png",
            "3x": "../../assets/images/widget/logo_3x.png",
        },
    },
});
