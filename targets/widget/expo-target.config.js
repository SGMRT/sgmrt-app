/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
    type: "widget",
    icon: "../../assets/images/icon.png",
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
