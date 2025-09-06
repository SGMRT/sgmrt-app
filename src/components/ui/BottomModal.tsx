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
