import colors from "@/src/theme/colors";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BottomModalProps {
    bottomSheetRef?: React.RefObject<BottomSheetModal | null>;
    canClose?: boolean;
    heightVal?: SharedValue<number>;
    children: React.ReactNode;
    handleStyle?: StyleProp<ViewStyle>;
    snapPoints?: number[];
    index?: number;
    bottomInset?: number;
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
}: BottomModalProps) {
    const { bottom } = useSafeAreaInsets();
    return (
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
        >
            <BottomSheetView>{children}</BottomSheetView>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
        borderRadius: 0,
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
