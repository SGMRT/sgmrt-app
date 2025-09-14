import colors from "@/src/theme/colors";
import { Switch } from "react-native";

export const StyledSwitch = ({
    isSelected,
    onValueChange,
}: {
    isSelected: boolean;
    onValueChange: (value: boolean) => void;
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
            value={isSelected}
            onValueChange={onValueChange}
        />
    );
};
