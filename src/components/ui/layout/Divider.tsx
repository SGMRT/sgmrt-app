import { StyleSheet, View } from "react-native";
import { radius } from "@/src/design-system/tokens/radius";
import { darkTheme } from "@/src/design-system/themes/dark";

export const Divider = ({
    direction = "vertical",
    // 3뎁스 색을 쓴다. 배경(20) 위에서 36, 카드(26) 위에서 30 떠오른다.
    // 1뎁스(26)는 카드 위에서 면과 같아져 사라지고,
    // 2뎁스(34)는 카드 위에서 8뿐이라 면 사다리 한 단계에 묻혔다.
    //
    // 예전에는 #3f3f3f 를 박아 두어 테마 밖 값이었고,
    // 화면마다 바꾸려면 호출부에서 색을 넘겨야 했다.
    color = darkTheme.ui02,
}: {
    direction?: "vertical" | "horizontal";
    color?: string;
}) => (
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
