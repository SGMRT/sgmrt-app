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
    reset: jest.fn(),
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

// react-native-nitro-modules
jest.mock("react-native-nitro-modules", () => ({
    NitroModules: {
        createHybridObject: jest.fn(),
    },
}));

// HealthKit
jest.mock("@kingstinct/react-native-healthkit", () => ({
    AuthorizationStatus: {
        sharingAuthorized: 2,
        sharingDenied: 1,
        notDetermined: 0,
    },
    authorizationStatusFor: jest.fn().mockReturnValue(0),
    isHealthDataAvailableAsync: jest.fn().mockResolvedValue(false),
    saveWorkoutSample: jest.fn().mockResolvedValue({
        saveWorkoutRoute: jest.fn().mockResolvedValue(undefined),
    }),
    WorkoutActivityType: {
        running: 37,
    },
}));

// expo-file-system
jest.mock("expo-file-system", () => ({
    cacheDirectory: "/mock-cache/",
    writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
    getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1024 }),
}));

// expo-router
jest.mock("expo-router", () => ({
    router: {
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
        dismissAll: jest.fn(),
    },
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
}));

// react-native-toast-message
jest.mock("react-native-toast-message", () => ({
    show: jest.fn(),
    hide: jest.fn(),
    default: { show: jest.fn(), hide: jest.fn() },
}));

// expo-blur
jest.mock("expo-blur", () => ({
    BlurView: "BlurView",
}));

// expo-constants
jest.mock("expo-constants", () => ({
    statusBarHeight: 44,
    default: {
        statusBarHeight: 44,
    },
}));

// uuid mock
jest.mock("uuid", () => ({
    v4: jest.fn(() => "test-uuid-" + Math.random().toString(36).substring(2, 11)),
}));

// react-native-get-random-values (uuid 의존성)
jest.mock("react-native-get-random-values", () => {});

// (선택) 테스트용 env
process.env.EXPO_PUBLIC_API_URL = "https://api.example.com";
process.env.EXPO_PUBLIC_DEV_API_URL = "https://dev-api.example.com";
