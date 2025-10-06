import * as amplitude from "@amplitude/analytics-react-native";

export const trackAmplitude = (event: string, properties?: any) => {
    if (!__DEV__) {
        amplitude.track(event, properties ?? undefined);
    }
};
