// Ghost Runner Design System - Normal Badge

import { StyleSheet, Text, View } from "react-native";
import type { BadgeColors, BadgePropsNormal } from "../types";
import { NORMAL_CONFIG } from "../types";

interface NormalProps extends Omit<BadgePropsNormal, "type"> {
    colors: BadgeColors;
}

export function Normal({ size, text, icon: Icon, iconBalanced, colors }: NormalProps) {
    const config = NORMAL_CONFIG[size];

    const textStyle = [
        styles.text,
        {
            fontFamily: config.fontFamily,
            fontSize: config.fontSize,
            lineHeight: config.lineHeight,
            fontWeight: config.fontWeight,
            letterSpacing: config.letterSpacing,
            color: colors.text,
        },
    ];

    return (
        <View
            style={[
                styles.container,
                {
                    height: config.height,
                    paddingHorizontal: config.paddingHorizontal,
                    borderRadius: config.borderRadius,
                    backgroundColor: colors.background,
                    gap: config.gap,
                    borderWidth: colors.borderWidth,
                    borderColor: colors.border,
                },
            ]}
        >
            {Icon ? (
                <>
                    <Icon
                        width={config.iconSize}
                        height={config.iconSize}
                        color={colors.text}
                    />
                    <Text style={textStyle}>{text}</Text>
                    {iconBalanced && (
                        <View
                            style={{
                                width: config.iconSize,
                                height: config.iconSize,
                            }}
                        />
                    )}
                </>
            ) : (
                <Text style={textStyle}>{text}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        textAlign: "center",
    },
});
