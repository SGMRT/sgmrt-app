import { StyleProp, View, ViewStyle } from "react-native";
import { Typography } from "./Typography";

export const TextWithSub = ({
    title,
    sub,
    containerStyle,
}: {
    title: string;
    sub: string;
    containerStyle?: StyleProp<ViewStyle>;
}) => {
    return (
        <View style={[containerStyle, { gap: 4, alignItems: "center" }]}>
            <Typography
                variant="sectionhead"
                color="white"
                style={{ textAlign: "center" }}
            >
                {title}
            </Typography>
            <Typography variant="body3" color="gray40">
                {sub}
            </Typography>
        </View>
    );
};
