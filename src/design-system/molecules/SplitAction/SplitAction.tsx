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

import { Typography } from "@/src/components/ui";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { darkTheme } from "../../themes/dark";
import { radius } from "../../tokens/radius";
import { spacing } from "../../tokens/spacing";
import { sectionPadding } from "../../tokens/layout";

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
        <TouchableOpacity
            onPress={item.onPress}
            // 누른 쪽 면을 밝히면 여백 안쪽 24 만 밝아져 칸 가운데에 띠가 뜬다.
            // 덩어리는 그대로 두고 글자만 흐려지게 해서 어디를 눌렀는지 알린다.
            activeOpacity={0.5}
            style={styles.half}
            // 칸이 글자 높이(24)뿐이라 그대로는 누르기에 좁다.
            // 덩어리가 가진 여백(20) 만큼만 넓혀 바깥으로 넘치지 않게 한다.
            hitSlop={{ top: spacing[20], bottom: spacing[20] }}
        >
            {/* 들어가는 길일 뿐 주된 행동이 아니라 굵기를 한 단계 낮춘다.
                크기는 그대로 두어 읽기는 쉽게 남긴다 */}
            <Typography variant="body2" color="white">
                {item.label}
            </Typography>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    // 여백은 섹션과 같이 덩어리가 갖고 칸은 제 여백을 갖지 않는다.
    // 칸이 여백을 가지면 가운데 선이 위아래 끝까지 닿아 덩어리가 잘려 보인다.
    container: {
        flexDirection: "row",
        padding: sectionPadding,
        // 칸과 선 사이도 섹션의 줄 사이와 같은 20 이다.
        // 붙여 두면 선이 칸의 테두리처럼 읽혀 두 칸이 따로 놀아 보인다.
        gap: sectionPadding,
        borderRadius: radius.base,
        backgroundColor: darkTheme.ui01,
    },
    half: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    // 여백 안쪽을 위아래로 꽉 채운다
    divider: {
        width: 1,
        backgroundColor: darkTheme.divider,
    },
});
