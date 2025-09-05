import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useGlobalStyles() {
    const insets = useSafeAreaInsets();

    return StyleSheet.create({
        bottom: {
            position: "absolute",
            bottom: insets.bottom + 50 + 16,
        },
        bottomLeft: {
            position: "absolute",
            bottom: insets.bottom + 50 + 16,
            left: 16.5,
        },
        bottomRight: {
            position: "absolute",
            bottom: insets.bottom + 50 + 16,
            right: 16.5,
        },
    });
}
