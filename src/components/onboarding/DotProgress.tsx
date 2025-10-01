import { DotIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface DotProgressProps {
    progress: number;
    total: number;
    handlePress: (index: number) => void;
}

export const DotProgress = ({
    progress,
    total,
    handlePress,
}: DotProgressProps) => {
    return (
        <View style={styles.container}>
            {Array.from({ length: total }).map((_, index) => (
                <TouchableOpacity
                    key={index}
                    onPress={() => handlePress(index)}
                >
                    <DotIcon
                        width={6}
                        height={6}
                        color={
                            index === progress
                                ? colors.gray[40]
                                : colors.gray[60]
                        }
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    },
});
