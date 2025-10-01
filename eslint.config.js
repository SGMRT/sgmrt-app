// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
import globals from "globals";

module.exports = defineConfig([
    expoConfig,
    {
        ignores: ["dist/*"],
        files: [
            "**/__tests__/**/*.{js,ts,tsx}",
            "**/*.{spec,test}.{js,ts,tsx}",
            "jest.setup.js",
        ],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
    },
]);
