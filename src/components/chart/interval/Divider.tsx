import colors from "@/src/theme/colors";
import { memo } from "react";
import { View } from "react-native";

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
                    borderRadius: 100,
                    borderWidth: 1,
                    borderColor: colors.primary,
                }}
            />
            <View style={{ width: 1, flex: 1, backgroundColor: "#3f3f3f" }} />
        </View>
    );
});
