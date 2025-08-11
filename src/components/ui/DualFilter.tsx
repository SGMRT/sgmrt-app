import { StyleProp, TouchableOpacity, View, ViewStyle } from "react-native";
import Section from "./Section";
import { Typography } from "./Typography";

interface DualFilterProps {
    firstLabel: string;
    secondLabel: string;
    onPressFirst: () => void;
    onPressSecond: () => void;
    selected: "first" | "second";
    style?: StyleProp<ViewStyle>;
}

export const DualFilter = ({
    firstLabel,
    secondLabel,
    onPressFirst,
    onPressSecond,
    selected,
    style,
}: DualFilterProps) => {
    return (
        <View style={[style, { gap: 10, marginHorizontal: 16.5 }]}>
            <TouchableOpacity onPress={onPressFirst}>
                <Section style={{ alignItems: "center" }}>
                    <Typography
                        variant="headline"
                        color={selected === "first" ? "primary" : "gray20"}
                    >
                        {firstLabel}
                    </Typography>
                </Section>
            </TouchableOpacity>

            <Section style={{ alignItems: "center" }}>
                <TouchableOpacity onPress={onPressSecond}>
                    <Typography
                        variant="headline"
                        color={selected === "second" ? "primary" : "gray20"}
                    >
                        {secondLabel}
                    </Typography>
                </TouchableOpacity>
            </Section>
        </View>
    );
};
