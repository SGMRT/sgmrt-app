import { darkTheme } from "@/src/design-system/themes/dark";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { radius } from "@/src/design-system/tokens/radius";

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
    // 고름 표시에 강조색을 쓰지 않는다. 강조색은 주 행동 몫이다
    activeColor = darkTheme.ui07,
    inactiveColor = darkTheme.ui04,
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
                            color: darkTheme.uiBackground,
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
        borderRadius: radius.full,
        borderWidth: 1.5,
        justifyContent: "center",
        alignItems: "center",
    },
});
