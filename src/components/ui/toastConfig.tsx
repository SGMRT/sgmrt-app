import { ToastCheckIcon, ToastInfoIcon } from "@/assets/svgs/svgs";
import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";
import { ToastShowParams } from "react-native-toast-message";
import { Typography } from "./Typography";

export const SuccessToast = (props: ToastShowParams) => (
    <BlurView intensity={14} style={styles.container}>
        <ToastCheckIcon />
        <Typography variant="subhead2" color="white">
            {props.text1}
        </Typography>
    </BlurView>
);

export const InfoToast = (props: ToastShowParams) => (
    <BlurView intensity={14} style={styles.container}>
        <ToastInfoIcon />
        <Typography variant="subhead2" color="white">
            {props.text1}
        </Typography>
    </BlurView>
);

export const toastConfig = {
    success: SuccessToast,
    info: InfoToast,
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: "rgba(92, 92, 92, 0.8)",
        gap: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 30,
        overflow: "hidden",
        zIndex: 100,
    },
});
