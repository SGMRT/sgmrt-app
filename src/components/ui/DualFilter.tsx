import { StyleProp, TouchableOpacity, View, ViewStyle } from "react-native";
import { Divider } from "./Divider";
import Section from "./Section";
import { Typography } from "./Typography";

interface DualFilterProps {
    description?: string;
    firstLabel: string;
    secondLabel: string;
    onPressFirst: () => void;
    onPressSecond: () => void;
    selected: "first" | "second";
    style?: StyleProp<ViewStyle>;
}

export const DualFilter = ({
    description,
    firstLabel,
    secondLabel,
    onPressFirst,
    onPressSecond,
    selected,
    style,
}: DualFilterProps) => {
    return (
        <View
            style={[
                style,
                { gap: 10, marginHorizontal: 16.5, marginBottom: 20 },
            ]}
        >
            {description && (
                <View
                    style={{ gap: 10, alignItems: "center", marginBottom: 20 }}
                >
                    <Typography variant="subhead1" color="white">
                        {description}
                    </Typography>
                    <Divider direction="horizontal" />
                </View>
            )}
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

            <TouchableOpacity onPress={onPressSecond}>
                <Section style={{ alignItems: "center" }}>
                    <Typography
                        variant="headline"
                        color={selected === "second" ? "primary" : "gray20"}
                    >
                        {secondLabel}
                    </Typography>
                </Section>
            </TouchableOpacity>
        </View>
    );
};
