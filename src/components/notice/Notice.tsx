import { CloseIcon, SpeakerIcon } from "@/assets/svgs/svgs";
import { BlurView } from "expo-blur";
import { Pressable, StyleSheet, View } from "react-native";
import { Typography } from "../ui/Typography";

export const Notice = () => {
    return (
        <BlurView intensity={1} style={styles.container}>
            <View style={styles.content}>
                <SpeakerIcon />
                <Typography
                    variant="caption1"
                    color="gray40"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    내용 내용 내용 내용 내용 내용 내용 내용 내용 내용 내용 내용
                    내용 내용 내용 내용 내용
                </Typography>
            </View>
            <Pressable onPress={() => {}}>
                <CloseIcon />
            </Pressable>
        </BlurView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: "rgba(17, 17, 17, 0.8)",
        paddingVertical: 10,
        paddingLeft: 15,
        paddingRight: 50,
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 200,
        flexDirection: "row",
        width: "100%",
        boxShadow: "0px 2px 6px 0px rgba(0, 0, 0, 0.15)",
    },
    content: {
        flexDirection: "row",
        gap: 6,
        paddingRight: 30,
    },
});
