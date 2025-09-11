import colors from "@/src/theme/colors";
import BottomSheet, {
    BottomSheetProps,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StyledBottomSheet({
    children,
    backgroundStyle,
    bottomInset,
    handleStyle,
    handleIndicatorStyle,
    snapPoints = [15],
    index = 1,
    animatedPosition,
    ...props
}: BottomSheetProps) {
    const { bottom } = useSafeAreaInsets();
    return (
        <BottomSheet
            backgroundStyle={backgroundStyle ?? styles.container}
            bottomInset={bottomInset ?? bottom + 56}
            handleStyle={handleStyle ?? styles.handle}
            handleIndicatorStyle={
                handleIndicatorStyle ?? styles.handleIndicator
            }
            snapPoints={snapPoints}
            index={index}
            animatedPosition={animatedPosition}
        >
            <BottomSheetView>{children}</BottomSheetView>
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    container: {
        borderTopStartRadius: 20,
        borderTopEndRadius: 20,
        flex: 1,
        backgroundColor: "#111111",
    },
    bottomSheetContent: {
        paddingVertical: 30,
    },
    handle: {
        paddingTop: 10,
        paddingBottom: 0,
    },
    handleIndicator: {
        backgroundColor: colors.gray[40],
        width: 50,
        height: 5,
        borderRadius: 100,
    },
});
