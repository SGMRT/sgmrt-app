import colors from "@/src/theme/colors";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface RadioButtonProps {
    isSelected: boolean;
    showMyRecord?: boolean;
    onPress: () => void;
    activeColor?: string;
    inactiveColor?: string;
}

export default function RadioButton({
    isSelected,
    showMyRecord = false,
    onPress,
    activeColor = colors.primary,
    inactiveColor = colors.gray[60],
}: RadioButtonProps) {
    return (
        <Pressable onPress={() => onPress()}>
            <View
                style={[
                    styles.container,
                    {
                        backgroundColor: showMyRecord
                            ? isSelected
                                ? activeColor
                                : inactiveColor
                            : "transparent",
                        borderColor: isSelected ? activeColor : inactiveColor,
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
