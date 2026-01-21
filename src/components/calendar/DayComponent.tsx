import colors from "@/src/theme/colors";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Typography } from "@/src/components/ui";

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
                    isRun && { backgroundColor: colors.gray[40] },
                ]}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    DayContainer: {
        paddingTop: 5,
        paddingBottom: 8,
        width: 40,
        alignItems: "center",
        justifyContent: "center",
        marginVertical: -5,
        marginHorizontal: 0,
    },
    DaySelected: { backgroundColor: "#404512", width: "101%" },
    DayStarting: {
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
    },
    DayEnding: { borderTopRightRadius: 10, borderBottomRightRadius: 10 },
    DaySoloPeriod: { borderRadius: 10, width: 40 },
    Dot: {
        width: 2,
        height: 2,
        borderRadius: 100,
    },
});
