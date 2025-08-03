/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
    type: "widget",
    icon: "../../assets/images/icon.png",
    entitlements: {
        "com.apple.security.application-groups":
            config.ios.entitlements["com.apple.security.application-groups"],
    },
    images: {
        logo: "../../assets/images/logo_white.png",
        logoTint: "../../assets/images/logo_yellow.png",
    },
});
