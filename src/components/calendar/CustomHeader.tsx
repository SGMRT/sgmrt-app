import { BackIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { Pressable, StyleSheet, View } from "react-native";
import { Divider, Typography } from "@/src/components/ui";

export const CustomHeader = (item: any) => {
    const monthObj = new Date(item.month);
    const year = monthObj.getFullYear();
    const month = monthObj.getMonth() + 1;
    return (
        <View>
            <View style={styles.headerContainer}>
                <View style={styles.header}>
                    <Pressable onPress={() => item.addMonth(-1)}>
                        <BackIcon
                            style={{ transform: [{ rotate: "0deg" }] }}
                            color={colors.gray[40]}
                            width={20}
                            height={20}
                        />
                    </Pressable>
                    <Typography
                        variant="headline"
                        color="white"
                        style={styles.headerTitle}
                    >
                        {year}년 {month}월
                    </Typography>
                    <Pressable onPress={() => item.addMonth(1)}>
                        <BackIcon
                            style={{ transform: [{ rotate: "180deg" }] }}
                            color={colors.gray[40]}
                            width={20}
                            height={20}
                        />
                    </Pressable>
                </View>
                <Divider direction="horizontal" />
            </View>
            <View style={styles.dayHeaderContainer}>
                {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                    <Typography variant="body2" color="gray40" key={day}>
                        {day}
                    </Typography>
                ))}
            </View>
        </View>
    );
};

export const styles = StyleSheet.create({
    headerContainer: {
        gap: 10,
        marginBottom: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerTitle: {
        paddingVertical: 8,
        backgroundColor: "#171717",
        textAlign: "center",
    },
    dayHeaderContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        marginBottom: 8,
    },
});
