import { Typography } from "@/src/components/ui";
import { BottomSheetHandle } from "@gorhom/bottom-sheet";
import { StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { radius } from "@/src/design-system/tokens/radius";
import { darkTheme } from "@/src/design-system/themes/dark";

export const ListBottomSheetHandle = () => {
    const animatedIndex = useSharedValue(0);
    const animatedPosition = useSharedValue(0);
    return (
        <View style={{ alignItems: "center" }}>
            <BottomSheetHandle
                indicatorStyle={styles.handleIndicator}
                animatedIndex={animatedIndex}
                animatedPosition={animatedPosition}
            />
            <Typography variant="subhead1" color="gray40">
                목록
            </Typography>
        </View>
    );
};

const styles = StyleSheet.create({
    handleIndicator: {
        backgroundColor: darkTheme.ui07,
        width: 50,
        height: 5,
        borderRadius: radius.full,
    },
});
