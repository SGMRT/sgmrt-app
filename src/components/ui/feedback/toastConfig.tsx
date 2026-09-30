import { ToastCheckIcon, ToastInfoIcon } from "@/assets/svgs/svgs";
import { BlurView } from "expo-blur";
import Constants from "expo-constants";
import { StyleSheet } from "react-native";
import Toast, { ToastShowParams } from "react-native-toast-message";
import { Typography } from "../display/Typography";
import { radius } from "@/src/design-system/tokens/radius";
import { darkTheme } from "@/src/design-system/themes/dark";
import { spacing } from "@/src/design-system/tokens/spacing";
import { HEADER_HEIGHT } from "../layout/Header";

export const showCompactToast = (
    text: string,
    topOffset: number = Constants.statusBarHeight + HEADER_HEIGHT + 82,
    duration: number = 3000
) => {
    Toast.show({
        type: "compact",
        text1: text,
        position: "top",
        topOffset: topOffset,
        visibilityTime: duration,
    });
};

// safeAreaInsets

export const showToast = (
    type: "success" | "error",
    text: string,
    bottom: number,
    offset: number = bottom + 82,
    duration: number = 3000
) => {
    Toast.show({
        type: type,
        text1: text,
        position: "bottom",
        bottomOffset: offset,
        visibilityTime: duration,
    });
};

export const CompactToast = (props: ToastShowParams) => (
    <BlurView intensity={14} style={styles.baseContainer}>
        <Typography variant="subhead2" color="white">
            {props.text1}
        </Typography>
    </BlurView>
);

export const SuccessToast = (props: ToastShowParams) => (
    <BlurView intensity={14} style={[styles.baseContainer, styles.container]}>
        <ToastCheckIcon color={darkTheme.primary} />
        <Typography variant="subhead2" color="white">
            {props.text1}
        </Typography>
    </BlurView>
);

// 실패를 알리는 토스트. 예전 이름이 info 였는데 아이콘은 빨간색이라
// 이름만 보고는 중립적인 알림으로 읽혔다. 뜻에 맞춰 error 로 바꿨다.
export const ErrorToast = (props: ToastShowParams) => (
    <BlurView intensity={14} style={[styles.baseContainer, styles.container]}>
        <ToastInfoIcon color={darkTheme.secondary} />
        <Typography variant="subhead2" color="white">
            {props.text1}
        </Typography>
    </BlurView>
);

export const toastConfig = {
    success: SuccessToast,
    error: ErrorToast,
    compact: CompactToast,
};

const styles = StyleSheet.create({
    // 높이를 적지 않고 패딩으로 잡는다. 높이로 적으면 눈에 보이는 여백이
    // "높이 빼기 글자" 의 나머지가 되어 스케일 밖 값으로 떨어진다.
    baseContainer: {
        backgroundColor: darkTheme.overlaySurface,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: spacing[12],
        paddingHorizontal: spacing[20],
        borderRadius: radius.full,
        overflow: "hidden",
        zIndex: 100,
    },
    container: {
        gap: spacing[8],
        flexDirection: "row",
    },
});
