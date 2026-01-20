import { Typography } from "@/src/components/ui";
import colors from "@/src/theme/colors";
import { BottomSheetHandle } from "@gorhom/bottom-sheet";
import { StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";

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
        backgroundColor: colors.gray[40],
        width: 50,
        height: 5,
        borderRadius: 100,
    },
});
