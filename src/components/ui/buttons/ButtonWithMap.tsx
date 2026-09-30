import {
    Flag2Icon,
    HomeIcon,
    MapIcon,
    QuitIcon,
    SaveIcon,
    ShareIcon,
} from "@/assets/svgs/svgs";
import {
    Pressable,
    StyleProp,
    StyleSheet,
    View,
    ViewStyle,
} from "react-native";
import { Typography } from "../display/Typography";
import { Button, ButtonTheme } from "@/src/design-system/atoms/Button";
import { radius } from "@/src/design-system/tokens/radius";
import { screenGutter } from "@/src/design-system/tokens/layout";
import { spacing } from "@/src/design-system/tokens/spacing";
import { darkTheme } from "@/src/design-system/themes/dark";
import { core } from "@/src/design-system/tokens/colors";

/**
 * 러닝 화면 아래에 붙는, 주 행동과 곁딸린 행동을 나란히 둔 버튼.
 *
 * 왼쪽 정사각형은 주 행동이 아니라 빠져나가는 길이라 면을 한 단계만 올리고,
 * 오른쪽이 폭을 채워 주 행동임을 나타낸다.
 * 두 면의 높이는 디자인 시스템 large(56)에 맞춘다.
 */
const ICON_SIDE = 56;

interface ButtonWithIconProps {
    onPressIcon: () => void;
    iconType: "map" | "home" | "share" | "save" | "quit" | "flag";
    title: string;
    onPress?: () => void;
    theme?: ButtonTheme;
    disabled?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
    topStroke?: boolean;
}

export default function ButtonWithIcon({
    onPressIcon,
    containerStyle,
    topStroke,
    iconType,
    title,
    onPress,
    theme = "primary",
    disabled,
}: ButtonWithIconProps) {
    return (
        <View
            style={[
                styles.container,
                containerStyle,
                topStroke && styles.topStroke,
            ]}
        >
            <Pressable style={styles.button} onPress={onPressIcon}>
                {iconType === "map" ? (
                    <>
                        <MapIcon color={darkTheme.ui07} />
                        <Typography variant="mini" color="gray40">
                            지도
                        </Typography>
                    </>
                ) : iconType === "share" ? (
                    <>
                        <ShareIcon color={darkTheme.ui07} />
                        <Typography variant="mini" color="gray40">
                            공유하기
                        </Typography>
                    </>
                ) : iconType === "save" ? (
                    <>
                        <SaveIcon color={core.white} />
                        <Typography variant="mini" color="white">
                            기록 저장
                        </Typography>
                    </>
                ) : iconType === "quit" ? (
                    <>
                        <QuitIcon color={core.white} />
                        <Typography variant="mini" color="white">
                            종료하기
                        </Typography>
                    </>
                ) : iconType === "flag" ? (
                    <>
                        <Flag2Icon />
                        <Typography variant="mini2" color="white">
                            코스 미리보기
                        </Typography>
                    </>
                ) : (
                    <>
                        <HomeIcon color={darkTheme.ui07} />
                        <Typography variant="mini" color="gray40">
                            메인
                        </Typography>
                    </>
                )}
            </Pressable>
            <Button
                title={title}
                onPress={onPress}
                size="large"
                theme={theme}
                disabled={disabled}
                style={styles.mainAction}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: darkTheme.uiUp,
        borderRadius: radius.base,
        alignItems: "center",
        justifyContent: "center",
        width: ICON_SIDE,
        height: ICON_SIDE,
    },
    mainAction: {
        flex: 1,
    },
    container: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing[6],
        marginHorizontal: screenGutter,
        paddingTop: spacing[12],
    },
    topStroke: {
        borderTopWidth: 1,
        borderTopColor: darkTheme.ui01,
    },
});
