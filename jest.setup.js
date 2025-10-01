/* eslint-env jest, node */
import "react-native-gesture-handler/jestSetup";

global.__DEV__ = true;

// AsyncStorage mock
jest.mock("@react-native-async-storage/async-storage", () =>
    require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Amplitude mock (AsyncStorage 네이티브 접근 차단)
jest.mock("@amplitude/analytics-react-native", () => ({
    init: jest.fn(),
    track: jest.fn(),
    identify: jest.fn(),
    setDeviceId: jest.fn(),
    setUserId: jest.fn(),
}));

// Sentry mock
jest.mock("@sentry/react-native", () => ({
    init: jest.fn(),
    withScope: (fn) => fn({ setTags: jest.fn(), setContext: jest.fn() }),
    captureException: jest.fn(),
}));

// SecureStore
jest.mock("expo-secure-store", () => ({
    getItemAsync: jest.fn().mockResolvedValue(null),
    setItemAsync: jest.fn().mockResolvedValue(undefined),
    deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mapbox
jest.mock("@rnmapbox/maps", () => ({
    setAccessToken: jest.fn(),
    setTelemetryEnabled: jest.fn(),
    default: { setAccessToken: jest.fn() },
}));

// Audio API
jest.mock("react-native-audio-api", () => {
    class FakeOsc {
        start() {}
        stop() {}
        connect() {}
        disconnect() {}
    }
    return {
        AudioContext: class {
            createOscillator() {
                return new FakeOsc();
            }
            resume() {}
            suspend() {}
            close() {}
        },
    };
});

// expo-image
jest.mock("expo-image", () => ({ Image: "Image" }));

// reanimated
jest.mock("react-native-reanimated", () =>
    require("react-native-reanimated/mock")
);

// safe-area
jest.mock("react-native-safe-area-context", () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// (선택) 테스트용 env
process.env.EXPO_PUBLIC_API_URL = "https://api.example.com";
process.env.EXPO_PUBLIC_DEV_API_URL = "https://dev-api.example.com";
