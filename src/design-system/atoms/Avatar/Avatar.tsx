// Ghost Runner Design System - Avatar
//
// 피그마 "Atom > 아바타" 정의를 옮긴 컴포넌트다.
//
// 사진이 없을 때(empty)는 어두운 원 위에 회색 실루엣을 얹는다.
// 기존에는 이 상태가 PNG 한 장으로 박혀 있어 색을 바꿀 수 없었다.
// 여기서는 원과 실루엣을 직접 그리므로 토큰이 바뀌면 같이 따라온다.

import { Image, ImageSourcePropType, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { darkTheme } from "../../themes/dark";

export type AvatarSize = "small" | "medium" | "large";

const SIZE: Record<AvatarSize, number> = {
    small: 40,
    medium: 56,
    large: 80,
};

interface AvatarProps {
    /** 사진. 없으면 빈 상태로 그린다 */
    source?: ImageSourcePropType | null;
    size?: AvatarSize;
    /** 규격 밖 크기가 필요할 때 직접 지정 */
    diameter?: number;
}

export function Avatar({ source, size = "medium", diameter }: AvatarProps) {
    const d = diameter ?? SIZE[size];

    return (
        <View
            style={[
                styles.frame,
                {
                    width: d,
                    height: d,
                    borderRadius: d / 2,
                    backgroundColor: darkTheme.ui02,
                },
            ]}
        >
            {source ? (
                <Image source={source} style={{ width: d, height: d }} />
            ) : (
                <EmptySilhouette diameter={d} />
            )}
        </View>
    );
}

/**
 * 빈 상태 실루엣.
 *
 * 피그마 80 짜리 아바타를 실측해 100 기준으로 환산했다.
 *   전체 지름 80 · 머리 지름 32 · 몸 너비 55 · 머리와 몸이 4 만큼 겹친다
 * 몸은 아래가 원 밖으로 나가고 frame 의 overflow 로 잘린다.
 */
function EmptySilhouette({ diameter }: { diameter: number }) {
    return (
        <Svg width={diameter} height={diameter} viewBox="0 0 100 100">
            <Circle cx="50" cy="44" r="20" fill={darkTheme.ui05} />
            <Circle cx="50" cy="95" r="35" fill={darkTheme.ui05} />
        </Svg>
    );
}

const styles = StyleSheet.create({
    frame: {
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
});
