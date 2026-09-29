// Ghost Runner Design System - SplitAction
//
// 성격이 같은 두 행동을 한 덩어리로 묶고 가운데를 갈라 둔다.
// 버튼 두 개를 나란히 두면 사이 여백만큼 서로 멀어져 둘이 다른 갈래로 읽히는데,
// 프로필 이미지와 회원 정보처럼 "내 것을 고친다"는 한 갈래 안의 두 길일 때는
// 한 면으로 묶고 선으로만 나누는 편이 관계가 그대로 드러난다.
//
// 면은 배경 위에 직접 놓이는 1뎁스(ui01)를 쓴다. 카드와 같은 층이다.
// 가운데 선은 목록의 줄 사이 선과 같은 색을 쓴다.
// 화면에서 무언가를 가르는 선은 한 가지여야 한다.
//
// 여백은 덩어리가 아니라 각 칸이 갖는다.
// 덩어리가 가지면 누른 칸을 밝혀도 여백 안쪽만 밝아져 칸 가운데에 띠가 뜬다.
// 칸이 가지면 누른 자리가 위아래 끝까지 차고, 선은 제 여백으로 물러나
// 여백 안쪽만 채우게 된다.

import { Typography } from "@/src/components/ui";
import { Pressable, StyleSheet, View } from "react-native";
import { darkTheme } from "../../themes/dark";
import { sectionPadding } from "../../tokens/layout";
import { radius } from "../../tokens/radius";

export interface SplitActionItem {
    label: string;
    onPress: () => void;
}

interface SplitActionProps {
    left: SplitActionItem;
    right: SplitActionItem;
}

export function SplitAction({ left, right }: SplitActionProps) {
    return (
        <View style={styles.container}>
            <Half item={left} />
            <View style={styles.divider} />
            <Half item={right} />
        </View>
    );
}

function Half({ item }: { item: SplitActionItem }) {
    return (
        <Pressable
            onPress={item.onPress}
            // 누르는 동안 그 칸만 한 단계 밝아진다.
            // 덩어리 전체를 움직이면 누르지 않은 쪽까지 따라와
            // 어느 길로 들어가는지 알 수 없다.
            style={({ pressed }) => [
                styles.half,
                pressed ? styles.halfPressed : null,
            ]}
        >
            {/* 들어가는 길일 뿐 주된 행동이 아니라 굵기를 한 단계 낮춘다.
                크기는 그대로 두어 읽기는 쉽게 남긴다 */}
            <Typography variant="body2" color="white">
                {item.label}
            </Typography>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        borderRadius: radius.base,
        backgroundColor: darkTheme.ui01,
        // 누른 칸의 밝기가 모서리 밖으로 새지 않게 한다
        overflow: "hidden",
    },
    half: {
        flex: 1,
        padding: sectionPadding,
        alignItems: "center",
        justifyContent: "center",
    },
    halfPressed: {
        backgroundColor: darkTheme.ui01Pressed,
    },
    // 칸이 가진 여백만큼 물러나 여백 안쪽만 채운다
    divider: {
        width: 1,
        marginVertical: sectionPadding,
        backgroundColor: darkTheme.divider,
    },
});
