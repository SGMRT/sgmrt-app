import { Button } from "../ui/Button";
import { TypographyColor } from "../ui/Typography";

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
        <Button
            containerStyle={{
                height: 58,
                paddingTop: 0,
            }}
            title={text}
            customColor={textColor}
            customBackgroundColor={backgroundColor}
            icon={icon}
            onPress={onPress}
        />
    );
};

export default LoginButton;
