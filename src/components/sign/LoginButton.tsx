import { Button } from "../ui/Button";
import { TypographyColor } from "../ui/Typography";

interface LoginButtonProps {
    text: string;
    textColor?: TypographyColor;
    backgroundColor: string;
    icon: React.ReactNode;
    disabled?: boolean;
    onPress: () => void;
}

const LoginButton = ({
    text,
    textColor = "black",
    backgroundColor,
    icon,
    disabled,
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
            disabled={disabled}
        />
    );
};

export default LoginButton;
