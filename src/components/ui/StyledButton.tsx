import colors from "@/src/theme/colors";
import {
    StyleProp,
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
} from "react-native";
import { Typography, TypographyColor } from "./Typography";

interface ButtonProps {
    title: string;
    style?: StyleProp<ViewStyle>;
    active?: boolean;
    activeTextColor?: TypographyColor;
    inactiveTextColor?: TypographyColor;
    onPress: () => void;
}

export const StyledButton = ({
    title,
    style,
    active,
    activeTextColor = "gray40",
    inactiveTextColor = "gray40",
    onPress,
}: ButtonProps) => {
    return (
        <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
            <Typography
                variant="caption1"
                color={active ? activeTextColor : inactiveTextColor}
            >
                {title}
            </Typography>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 8,
        borderColor: colors.gray[80],
        borderWidth: 1,
        backgroundColor: "#171717",
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
    },
});
