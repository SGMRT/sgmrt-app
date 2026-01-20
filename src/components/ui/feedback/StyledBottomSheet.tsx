import colors from "@/src/theme/colors";
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetProps,
    BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback } from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface StyledBottomSheetProps extends BottomSheetProps {
    ref?: React.RefObject<BottomSheetModal | null>;
    backdropOpacity?: number;
    backdrop?: boolean;
}

export default function StyledBottomSheet({
    children,
    backgroundStyle,
    bottomInset,
    handleStyle,
    handleIndicatorStyle,
    snapPoints = [15],
    index = 1,
    animatedPosition,
    topInset,
    ref,
    backdropOpacity = 0.4,
    backdrop = false,
    enableDynamicSizing,
    ...props
}: StyledBottomSheetProps) {
    const { bottom } = useSafeAreaInsets();
    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                pressBehavior="close"
                opacity={backdropOpacity}
                style={{ marginBottom: bottom }}
            />
        ),
        [bottom, backdropOpacity]
    );
    return (
        <BottomSheet
            backdropComponent={backdrop ? renderBackdrop : undefined}
            ref={ref}
            backgroundStyle={backgroundStyle ?? styles.container}
            bottomInset={bottomInset ?? bottom + 56}
            handleStyle={handleStyle ?? styles.handle}
            handleIndicatorStyle={
                handleIndicatorStyle ?? styles.handleIndicator
            }
            handleComponent={props.handleComponent}
            snapPoints={snapPoints}
            index={index}
            animatedPosition={animatedPosition}
            enableDynamicSizing={enableDynamicSizing}
        >
            <BottomSheetView>{children}</BottomSheetView>
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderTopColor: "#212121",
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
