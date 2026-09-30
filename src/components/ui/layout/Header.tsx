import { BackIcon, TrashIcon } from "@/assets/svgs/svgs";
import { useRouter } from "expo-router";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Typography } from "../display/Typography";
import { screenGutter } from "@/src/design-system/tokens/layout";
import { darkTheme } from "@/src/design-system/themes/dark";
import { spacing } from "@/src/design-system/tokens/spacing";

/**
 * 화면 맨 위 제목 줄의 높이.
 *
 * 예전에는 50 이 이 파일과 토스트 위치 계산에 따로 적혀 있었고,
 * 4px 규칙 밖 값이기도 했다. 48 로 내려 스케일 위로 올리고 이름을 준다.
 * 이 줄을 비켜 가야 하는 곳은 값을 적지 말고 이것을 가져다 쓴다.
 */
export const HEADER_HEIGHT = spacing[48];

/**
 * 아이콘이 손가락에 닿는 자리를 넓히는 값.
 *
 * 아이콘은 24 라 그대로 두면 누를 자리가 24 밖에 안 된다.
 * 사방 10 을 더해 44 를 만든다. hitSlop 은 그려지는 자리를 건드리지 않아
 * 아이콘은 가장자리 여백에 그대로 붙어 있는다.
 */
export const ICON_HIT_SLOP = 10;

interface HeaderProps {
    titleText: string;
    titleComponent?: React.ReactNode;
    hasBackButton?: boolean;
    onDelete?: () => void;
    onBack?: () => void;
    /**
     * 지우기 아이콘의 색.
     *
     * 예전 기본값은 `"gray40"` 이었는데 이것은 Typography 의 색 이름이지
     * 색값이 아니다. SVG 에 그대로 넘어가 색으로 읽히지 않았다.
     */
    deleteColor?: string;
    rightComponent?: React.ReactNode;
}

export default memo(function Header({
    titleText,
    titleComponent,
    hasBackButton = true,
    onDelete,
    onBack,
    deleteColor = darkTheme.ui07,
    rightComponent,
}: HeaderProps) {
    const router = useRouter();
    return (
        <View style={styles.header}>
            <View style={styles.sideContainer}>
                {hasBackButton && (
                    <Pressable
                        onPress={() => (onBack ? onBack() : router.back())}
                        style={styles.iconButton}
                        hitSlop={ICON_HIT_SLOP}
                    >
                        <BackIcon color={darkTheme.ui07} />
                    </Pressable>
                )}
            </View>
            {titleComponent ? (
                titleComponent
            ) : (
                <Typography variant="subhead2" color="gray20">
                    {titleText}
                </Typography>
            )}
            <View style={[styles.sideContainer, styles.rightContainer]}>
                {onDelete && (
                    <Pressable
                        onPress={onDelete}
                        style={styles.iconButton}
                        hitSlop={ICON_HIT_SLOP}
                    >
                        <TrashIcon color={deleteColor} />
                    </Pressable>
                )}
                {rightComponent}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: screenGutter,
        height: HEADER_HEIGHT,
        justifyContent: "space-between",
    },
    sideContainer: {
        width: 40,
        alignItems: "flex-start",
    },
    rightContainer: {
        alignItems: "flex-end",
    },
    iconButton: {
        width: 24,
        height: 24,
        justifyContent: "center",
        alignItems: "center",
    },
});
