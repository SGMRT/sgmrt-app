import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Typography } from "@/src/components/ui";
import { ghostLime } from "@/src/design-system/tokens/colors";
import { radius } from "@/src/design-system/tokens/radius";
import { darkTheme } from "@/src/design-system/themes/dark";
import { spacing } from "@/src/design-system/tokens/spacing";

export const DayComponent = (day: any) => {
    //boolean
    const isStartingDay = !!day.marking?.startingDay;
    const isEndingDay = !!day.marking?.endingDay;
    const isInPeriod = !!day.marking?.selected;

    const isSoloPeriod = isStartingDay && isEndingDay;
    const isSelected = isStartingDay || isEndingDay || isInPeriod;

    const isRun = !!day.marking?.run;

    return (
        <TouchableOpacity
            onPress={() => day.onPress(day.date)}
            onLongPress={() => day.onLongPress(day.date)}
            style={[
                styles.DayContainer,
                isSelected && styles.DaySelected,
                isStartingDay && styles.DayStarting,
                isEndingDay && styles.DayEnding,
                isSoloPeriod && styles.DaySoloPeriod,
            ]}
        >
            <Typography
                variant="subhead1"
                color={isSelected ? "white" : "gray40"}
            >
                {day.date.day}
            </Typography>
            <View
                style={[
                    styles.Dot,
                    isRun && { backgroundColor: darkTheme.ui07 },
                ]}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    DayContainer: {
        paddingTop: spacing[4],
        paddingBottom: 8,
        width: 40,
        alignItems: "center",
        justifyContent: "center",
        marginVertical: -5,
        marginHorizontal: 0,
    },
    // 고른 기간을 덮는 띠.
    //
    // Primary 를 어둡게 깐 자리다. 예전에는 사다리 밖 값(#404512)이었다.
    // 강조색 사다리의 100 은 그보다 한 끗 밝아 고른 기간이 또렷해지고,
    // 흰 날짜 글자와의 대비도 넉넉하다.
    DaySelected: { backgroundColor: ghostLime[100], width: "101%" },
    DayStarting: {
        borderTopLeftRadius: radius.md,
        borderBottomLeftRadius: radius.md,
    },
    DayEnding: { borderTopRightRadius: radius.md, borderBottomRightRadius: radius.md },
    DaySoloPeriod: { borderRadius: radius.md, width: 40 },
    Dot: {
        width: 2,
        height: 2,
        borderRadius: radius.full,
    },
});
