import colors from "@/src/theme/colors";
import { Switch } from "react-native";

export const StyledSwitch = ({
    isSelected,
    onValueChange,
    disabled = false,
}: {
    isSelected: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
}) => {
    return (
        <Switch
            trackColor={{
                false: colors.gray[40],
                true: colors.primary,
            }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.gray[40]}
            style={{
                transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
            }}
            disabled={disabled}
            value={isSelected}
            onValueChange={onValueChange}
        />
    );
};
