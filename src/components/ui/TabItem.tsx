import { TouchableOpacity } from "react-native";
import { Typography } from "./Typography";

export const TabItem = ({
    title,
    onPress,
    isSelected,
}: {
    title: string;
    onPress: () => void;
    isSelected: boolean;
}) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flex: 1,
                alignItems: "center",
                borderBottomColor: isSelected ? "#3f3f3f" : "transparent",
                borderBottomWidth: 1,
                paddingBottom: 10,
            }}
        >
            <Typography
                variant="subhead2"
                color={isSelected ? "white" : "gray80"}
            >
                {title}
            </Typography>
        </TouchableOpacity>
    );
};
