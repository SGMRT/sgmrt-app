import { TouchableOpacity, View } from "react-native";
import { Typography, TypographyColor } from "../ui/Typography";

interface LoginButtonProps {
    text: string;
    textColor?: TypographyColor;
    backgroundColor: string;
    icon: React.ReactNode;
    onPress: () => void;
}

const LoginButton = ({
    text,
    textColor = "black",
    backgroundColor,
    icon,
    onPress,
}: LoginButtonProps) => {
    return (
        <TouchableOpacity onPress={onPress}>
            <View
                style={{
                    height: 56,
                    backgroundColor,
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 10,
                }}
            >
                {icon}
                <Typography variant="subhead2" color={textColor}>
                    {text}
                </Typography>
            </View>
        </TouchableOpacity>
    );
};

export default LoginButton;
