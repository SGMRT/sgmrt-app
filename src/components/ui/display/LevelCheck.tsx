import colors from "@/src/theme/colors";
import React from "react";
import { StyleProp, TouchableHighlight, View, ViewStyle } from "react-native";
import { Typography } from "./Typography";

interface LevelCheckProps {
    maxLevel: number;
    level: number;
    setLevel: (level: number) => void;
    label: {
        left: string | React.ReactNode;
        right: string | React.ReactNode;
        gap: number;
    };
    icon: {
        icon: React.ReactElement;
        gap: number;
    };
    style?: StyleProp<ViewStyle>;
}

export const LevelCheck = ({
    icon,
    maxLevel,
    level,
    setLevel,
    label,
    style,
}: LevelCheckProps) => {
    return (
        <View style={[style, { flexDirection: "row", gap: label.gap }]}>
            <Typography variant="body2" color="gray40">
                {label.left}
            </Typography>

            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: icon.gap,
                }}
            >
                {Array.from({ length: maxLevel }).map((_, index) => {
                    const isActive = index < level;

                    return (
                        <TouchableHighlight
                            key={index}
                            onPress={() => setLevel(index + 1)}
                        >
                            {React.isValidElement(icon.icon)
                                ? React.cloneElement(icon.icon, {
                                      style: {
                                          color: isActive
                                              ? colors.primary
                                              : colors.gray[20],
                                      },
                                  } as React.SVGProps<SVGSVGElement>)
                                : null}
                        </TouchableHighlight>
                    );
                })}
            </View>

            <Typography variant="body2" color="gray40">
                {label.right}
            </Typography>
        </View>
    );
};
