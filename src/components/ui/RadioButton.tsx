import colors from "@/src/theme/colors";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface RadioButtonProps {
    isSelected: boolean;
    showMyRecord?: boolean;
    onPress: () => void;
}

export default function RadioButton({
    isSelected,
    showMyRecord = false,
    onPress,
}: RadioButtonProps) {
    return (
        <Pressable onPress={() => onPress()}>
            <View
                style={[
                    styles.container,
                    {
                        backgroundColor: showMyRecord
                            ? isSelected
                                ? colors.primary
                                : colors.gray[60]
                            : "transparent",
                        borderColor: isSelected
                            ? colors.primary
                            : colors.gray[60],
                        borderWidth: 1.5,
                    },
                ]}
            >
                {showMyRecord && (
                    <Text
                        style={{
                            color: colors.black,
                            fontFamily: "SpoqaHanSansNeo-Bold",
                            fontSize: 12,
                        }}
                    >
                        나
                    </Text>
                )}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 20,
        height: 20,
        borderRadius: 100,
        borderWidth: 1.5,
        justifyContent: "center",
        alignItems: "center",
    },
});
