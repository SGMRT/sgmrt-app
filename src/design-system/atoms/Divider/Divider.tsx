// Ghost Runner Design System - Divider
//
// 무언가를 가르는 선은 앱 전체에서 한 가지여야 한다.
// 예전에는 이 파일과 components/ui/layout/Divider 둘이 따로 있었고,
// 색과 기능이 서로 갈라져 있었다. 이 파일 하나로 합쳤다.

import { StyleSheet, View } from "react-native";
import { darkTheme } from "../../themes/dark";
import { radius } from "../../tokens/radius";

export type DividerDirection = "vertical" | "horizontal";

interface DividerProps {
    /**
     * 세로선은 나란히 놓인 값 사이를 가르고,
     * 가로선은 폭을 채워 위아래를 가른다.
     */
    direction?: DividerDirection;
    /**
     * 선의 색.
     *
     * 넘기지 않으면 2뎁스를 쓴다. 배경(17) 위에서 17, 카드(23) 위에서 11 떠오른다.
     * 공용 기본값은 어느 면에 놓일지 모르므로 두 면 모두에서 떠야 한다.
     *
     * 1뎁스(23)는 카드 위에서 면과 같아져 사라지고,
     * 3뎁스(56)는 카드 위에서 33 이나 떠올라 선이 내용보다 먼저 눈에 들어온다.
     */
    color?: string;
}

export const Divider = ({
    direction = "vertical",
    color = darkTheme.uiUp,
}: DividerProps) => (
    <View
        style={[
            direction === "vertical" ? styles.vertical : styles.horizontal,
            { backgroundColor: color },
        ]}
    />
);

const styles = StyleSheet.create({
    vertical: {
        height: 10,
        width: 1,
        borderRadius: radius.xs,
    },
    // 투명도를 걸지 않는다. 색으로 세기를 정해 두고 다시 흐리면
    // 어느 쪽이 실제 값인지 알 수 없고, 올린 색이 도로 묻힌다.
    horizontal: {
        height: 1,
        width: "100%",
        borderRadius: radius.xs,
    },
});
