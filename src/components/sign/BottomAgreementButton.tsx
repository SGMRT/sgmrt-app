import colors from "@/src/theme/colors";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Typography } from "../ui/Typography";

interface BottomAgreementButtonProps {
    isActive: boolean;
    canPress?: boolean;
    title?: string;
    onPress: () => void;
}

export default function BottomAgreementButton({
    isActive,
    canPress = true,
    title = "동의하기",
    onPress,
}: BottomAgreementButtonProps) {
    return (
        <TouchableOpacity
            onPress={() => {
                if (canPress) {
                    onPress();
                }
            }}
        >
            <View
                style={[
                    styles.button,
                    {
                        backgroundColor: isActive ? colors.primary : "#333333",
                    },
                ]}
            >
                <Typography
                    variant="subhead2"
                    color={isActive ? "black" : "white"}
                >
                    {title}
                </Typography>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        width: "100%",
        height: 56,
        justifyContent: "center",
        alignItems: "center",
    },
});
