import { ScrollTopIcon } from "@/assets/svgs/svgs";
import { useGlobalStyles } from "@/src/theme/useGlobalStyles";
import { StyleSheet, TouchableOpacity } from "react-native";

interface ScrollButtonProps {
    onPress: () => void;
    position?: "bottom-left" | "bottom-right";
    bottomInset?: number;
}

/**
 * Floating circular button that triggers `onPress` and positions itself at the bottom-left or bottom-right
 * using theme-provided offsets.
 *
 * The component reads `bottomLeft` / `bottomRight` positioning from `useGlobalStyles()` and adds `bottomInset`
 * (if provided) to that value. Defaults to `"bottom-right"` when `position` is omitted.
 *
 * @param onPress - Callback invoked when the button is pressed.
 * @param position - Which corner to anchor the button to; either `"bottom-left"` or `"bottom-right"`. Defaults to `"bottom-right"`.
 * @param bottomInset - Optional additional pixels to add to the computed bottom offset.
 * @returns A touchable React element containing the scroll-to-top icon.
 */
export default function ScrollButton({
    onPress,
    position = "bottom-right",
    bottomInset,
}: ScrollButtonProps) {
    const globalStyles = useGlobalStyles();
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.container,
                position === "bottom-left" && [
                    globalStyles.bottomLeft,
                    {
                        bottom:
                            globalStyles.bottomLeft.bottom + (bottomInset ?? 0),
                    },
                ],
                position === "bottom-right" && [
                    globalStyles.bottomRight,
                    {
                        bottom:
                            globalStyles.bottomRight.bottom +
                            (bottomInset ?? 0),
                    },
                ],
            ]}
        >
            <ScrollTopIcon />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 48,
        height: 48,
        backgroundColor: "#111111",
        borderWidth: 1,
        borderColor: "#3F3F3F",
        position: "absolute",
        zIndex: 10,
        right: 16.5,
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
    },
});
