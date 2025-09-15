const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const {
    wrapWithAudioAPIMetroConfig,
} = require("react-native-audio-api/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */

const config = getSentryExpoConfig(__dirname);

const { transformer, resolver } = config;

config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
};
config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
    sourceExts: [...resolver.sourceExts, "svg"],
};

module.exports = wrapWithAudioAPIMetroConfig(config);
