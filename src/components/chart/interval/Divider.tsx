import { memo } from "react";
import { View } from "react-native";
import { radius } from "@/src/design-system/tokens/radius";
import { darkTheme } from "@/src/design-system/themes/dark";

/**
 * 점 + 세로 라인 컴포넌트
 */
export const Divider = memo(function Divider() {
    return (
        <View style={{ alignItems: "center" }}>
            <View
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: radius.full,
                    borderWidth: 1,
                    borderColor: darkTheme.primary,
                }}
            />
            <View style={{ width: 1, flex: 1, backgroundColor: darkTheme.ui02 }} />
        </View>
    );
});
