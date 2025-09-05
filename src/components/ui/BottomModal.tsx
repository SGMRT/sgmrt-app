import colors from "@/src/theme/colors";
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback } from "react";
import { Dimensions, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BottomModalProps {
    bottomSheetRef?: React.RefObject<BottomSheetModal | null>;
    canClose?: boolean;
    heightVal?: SharedValue<number>;
    children: React.ReactNode;
    handleStyle?: StyleProp<ViewStyle>;
    snapPoints?: string[];
    index?: number;
    bottomInset?: number;
    onDismiss?: () => void;
    backdrop?: boolean;
}

/**
 * A configurable bottom sheet modal built on @gorhom/bottom-sheet.
 *
 * Renders a BottomSheetModal with sensible defaults (rounded top corners, interactive keyboard behavior,
 * optional backdrop, and safe-area aware insets). The modal supports swipe-to-close, custom snap points,
 * an animated position value, and an optional external ref.
 *
 * @param bottomSheetRef - Optional ref to control the BottomSheetModal instance.
 * @param canClose - When false, disables pan-down-to-close (defaults to true).
 * @param heightVal - Optional Reanimated SharedValue tied to the modal's animated position.
 * @param handleStyle - Additional style applied to the sheet handle area.
 * @param snapPoints - Snap points for the sheet (e.g., ['25%', '50%']).
 * @param index - Initial snap index within `snapPoints`.
 * @param bottomInset - Explicit bottom inset to override the safe-area bottom inset.
 * @param onDismiss - Callback invoked when the modal is dismissed.
 * @param backdrop - If true (default), renders a semi-opaque backdrop that closes the sheet on press.
 *
 * @returns The BottomSheetModal React element.
 */
export default function BottomModal({
    bottomSheetRef,
    canClose = true,
    heightVal,
    children,
    handleStyle,
    snapPoints,
    index,
    bottomInset,
    onDismiss,
    backdrop = true,
}: BottomModalProps) {
    const { bottom } = useSafeAreaInsets();
    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                pressBehavior="close"
                opacity={0.4}
                style={{ marginBottom: bottom }}
            />
        ),
        [bottom]
    );
    return (
        <>
            <BottomSheetModal
                ref={bottomSheetRef}
                bottomInset={bottomInset ?? bottom}
                enablePanDownToClose={canClose}
                backgroundStyle={styles.container}
                handleStyle={[styles.handle, handleStyle]}
                handleIndicatorStyle={styles.handleIndicator}
                animatedPosition={heightVal ?? undefined}
                snapPoints={snapPoints}
                index={index}
                onDismiss={onDismiss}
                maxDynamicContentSize={Dimensions.get("window").height - 250}
                keyboardBehavior="interactive"
                backdropComponent={backdrop ? renderBackdrop : undefined}
            >
                <BottomSheetView
                    style={{
                        minHeight: 280 - (bottomInset ?? bottom) - 35,
                        justifyContent: "center",
                    }}
                >
                    {children}
                </BottomSheetView>
            </BottomSheetModal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
        borderTopStartRadius: 20,
        borderTopEndRadius: 20,
    },
    handle: {
        paddingTop: 10,
        paddingBottom: 20,
    },
    handleIndicator: {
        backgroundColor: colors.gray[40],
        width: 50,
        height: 5,
        borderRadius: 100,
    },
});
