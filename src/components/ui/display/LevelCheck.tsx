import { darkTheme } from "@/src/design-system/themes/dark";
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
                                          // 고름은 밝기로 나타낸다.
                                          // 강조색을 쓰면 아래 주 행동 버튼과 다툰다.
                                          // 고르지 않은 쪽도 gray20 이라 거의 같이
                                          // 밝았던 것을 한참 낮춘다.
                                          color: isActive
                                              ? darkTheme.ui10
                                              : darkTheme.ui05,
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
