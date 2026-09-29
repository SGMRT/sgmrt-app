import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { screenGutter } from "@/src/design-system/tokens/layout";

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
            left: screenGutter,
        },
        bottomRight: {
            position: "absolute",
            bottom: insets.bottom + 50 + 16,
            right: screenGutter,
        },
    });
}
