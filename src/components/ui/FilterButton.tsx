import { FilterIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { StyleSheet, TouchableOpacity } from "react-native";
import { Typography } from "./Typography";

export const FilterButton = ({ onPress }: { onPress: () => void }) => {
    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            <>
                <FilterIcon />
                <Typography variant="caption1" color="gray40">
                    필터
                </Typography>
            </>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        backgroundColor: "#171717",
        borderColor: colors.gray[80],
        gap: 4,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
});
