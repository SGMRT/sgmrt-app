// Ghost Runner Design System - CircularText Badge

import { StyleSheet, Text, View } from "react-native";
import { typography } from "../../../tokens";
import type { BadgeColors, BadgePropsCircularText } from "../types";
import { CIRCULAR_TEXT_SIZE } from "../types";

interface CircularTextProps extends Omit<BadgePropsCircularText, "type"> {
    colors: BadgeColors;
}

export function CircularText({ text, colors }: CircularTextProps) {
    return (
        <View
            style={[
                styles.container,
                {
                    width: CIRCULAR_TEXT_SIZE,
                    height: CIRCULAR_TEXT_SIZE,
                    borderRadius: CIRCULAR_TEXT_SIZE / 2,
                    backgroundColor: colors.background,
                    borderWidth: colors.borderWidth,
                    borderColor: colors.border,
                },
            ]}
        >
            <Text
                style={[
                    styles.text,
                    typography.variants.caption,
                    { color: colors.text },
                ]}
            >
                {text}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        textAlign: "center",
    },
});
