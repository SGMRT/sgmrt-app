import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * React hook that returns global absolute-positioned styles adjusted for device safe-area insets.
 *
 * The styles position elements above the bottom safe area with a fixed base offset (50 + 16 = 66).
 * - `bottom`: centered horizontally, positioned above the safe-area bottom.
 * - `bottomLeft`: positioned above the safe-area bottom and offset from the left edge (16.5).
 * - `bottomRight`: positioned above the safe-area bottom and offset from the right edge (16.5).
 *
 * @returns A StyleSheet object containing `bottom`, `bottomLeft`, and `bottomRight` styles that react to safe-area inset changes.
 */
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
