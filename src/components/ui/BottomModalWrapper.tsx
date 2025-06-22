import colors from "@/src/theme/colors";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface BottomModalWrapperProps {
    children: React.ReactNode;
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    canClose?: boolean;
}

export default function BottomModalWrapper({
    children,
    bottomSheetRef,
    canClose = true,
}: BottomModalWrapperProps) {
    const insets = useSafeAreaInsets();
    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            bottomInset={insets.bottom}
            enablePanDownToClose={canClose}
            backgroundStyle={styles.container}
            handleStyle={styles.handle}
            handleIndicatorStyle={styles.handleIndicator}
        >
            <BottomSheetView>{children}</BottomSheetView>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
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
