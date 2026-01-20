import { ToastCheckIcon, ToastInfoIcon } from "@/assets/svgs/svgs";
import { BlurView } from "expo-blur";
import Constants from "expo-constants";
import { StyleSheet } from "react-native";
import Toast, { ToastShowParams } from "react-native-toast-message";
import { Typography } from "../display/Typography";

export const showCompactToast = (
    text: string,
    topOffset: number = Constants.statusBarHeight + 50 + 82,
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
    type: "success" | "info",
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
        <ToastCheckIcon />
        <Typography variant="subhead2" color="white">
            {props.text1}
        </Typography>
    </BlurView>
);

export const InfoToast = (props: ToastShowParams) => (
    <BlurView intensity={14} style={[styles.baseContainer, styles.container]}>
        <ToastInfoIcon />
        <Typography variant="subhead2" color="white">
            {props.text1}
        </Typography>
    </BlurView>
);

export const toastConfig = {
    success: SuccessToast,
    info: InfoToast,
    compact: CompactToast,
};

const styles = StyleSheet.create({
    baseContainer: {
        backgroundColor: "rgba(92, 92, 92, 0.8)",
        alignItems: "center",
        justifyContent: "center",
        height: 52,
        paddingHorizontal: 20,
        borderRadius: 30,
        overflow: "hidden",
        zIndex: 100,
    },
    container: {
        gap: 8,
        flexDirection: "row",
    },
});
