import { BackIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { endOfDay, startOfDay } from "@/src/utils/formatDate";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { Divider } from "./Divider";
import Section from "./Section";
import { Typography } from "./Typography";

type DateRange = { startDate: Date; endDate: Date };

export const GoRunCalendar = ({
    period,
    setPeriod,
}: {
    period: DateRange;
    setPeriod: (period: DateRange) => void;
}) => {
    // 내부 편집 상태(종료일 null 허용)
    const [changedPeriod, setChangedPeriod] = useState<{
        startDate: Date | null;
        endDate: Date | null;
    }>({
        startDate: period.startDate ? startOfDay(period.startDate) : null,
        endDate: period.endDate ? endOfDay(period.endDate) : null,
    });

    // 외부 period가 바뀌면 내부 상태도 동기화
    useEffect(() => {
        const pStart = period.startDate
            ? startOfDay(period.startDate).getTime()
            : null;
        const pEnd = period.endDate ? endOfDay(period.endDate).getTime() : null;
        const cStart = changedPeriod.startDate
            ? startOfDay(changedPeriod.startDate).getTime()
            : null;
        const cEnd = changedPeriod.endDate
            ? endOfDay(changedPeriod.endDate).getTime()
            : null;

        // 진짜로 달라졌을 때만 setChangedPeriod
        if (pStart !== cStart || pEnd !== cEnd) {
            setChangedPeriod({
                startDate: pStart ? new Date(pStart) : null,
                endDate: pEnd ? new Date(pEnd) : null,
            });
        }
    }, [period.startDate, period.endDate]);

    // 범위가 완성되면 부모에 반영
    useEffect(() => {
        if (!changedPeriod.startDate || !changedPeriod.endDate) return;

        const nextStart = startOfDay(changedPeriod.startDate).getTime();
        const nextEnd = endOfDay(changedPeriod.endDate).getTime();
        const curStart = period.startDate
            ? startOfDay(period.startDate).getTime()
            : null;
        const curEnd = period.endDate
            ? endOfDay(period.endDate).getTime()
            : null;

        // 값이 바뀐 경우에만 부모로 전파
        if (nextStart !== curStart || nextEnd !== curEnd) {
            setPeriod({
                startDate: new Date(nextStart),
                endDate: new Date(nextEnd),
            });
        }
    }, [
        changedPeriod.startDate,
        changedPeriod.endDate,
        period.startDate,
        period.endDate,
        setPeriod,
    ]);

    const formatKey = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };

    const handleDayPress = (day: { dateString: string }) => {
        const selected = new Date(day.dateString);
        const s = startOfDay(selected);
        const e = endOfDay(selected);

        const hasStart = !!changedPeriod.startDate;
        const hasEnd = !!changedPeriod.endDate;

        // 1) 완성된 범위 상태: 클릭 = 초기화 후 새 시작일
        if (hasStart && hasEnd) {
            setChangedPeriod({ startDate: s, endDate: null });
            return;
        }

        // 2) 시작만 있는 상태: 두 번째 클릭으로 종료 확정
        if (hasStart && !hasEnd) {
            const start = startOfDay(changedPeriod.startDate!);

            // 같은 날을 다시 눌렀다면 단일일자 그대로 유지(원하면 초기화로 바꿔도 됨)
            if (s.getTime() === start.getTime()) {
                setChangedPeriod({
                    startDate: start,
                    endDate: endOfDay(start),
                }); // 단일일자를 아예 완성으로 처리
                return;
            }

            // 역전 정렬
            if (s < start) {
                setChangedPeriod({ startDate: s, endDate: endOfDay(start) });
            } else {
                setChangedPeriod({ startDate: start, endDate: e });
            }
            return;
        }

        // 3) 아무 것도 없는 상태: 시작 지정
        setChangedPeriod({ startDate: s, endDate: null });
    };

    const markedDates = useMemo(() => {
        const marked: Record<string, any> = {};
        if (!changedPeriod.startDate) return marked;

        const start = startOfDay(changedPeriod.startDate);
        const end = changedPeriod.endDate
            ? endOfDay(changedPeriod.endDate)
            : null;

        // 단일일자(종료 미선택 or 같은 날) → 시작/끝 모두 true
        if (!end || formatKey(start) === formatKey(end)) {
            const k = formatKey(start);
            marked[k] = {
                selected: true,
                startingDay: true,
                endingDay: true,
            };
            return marked;
        }

        // 구간 마킹
        let cur = new Date(start);
        while (cur <= end) {
            const k = formatKey(cur);
            marked[k] = {
                selected: true,
            };
            cur.setDate(cur.getDate() + 1);
        }

        // 시작/끝 모서리 지정
        marked[formatKey(start)] = {
            ...marked[formatKey(start)],
            startingDay: true,
        };
        marked[formatKey(end)] = { ...marked[formatKey(end)], endingDay: true };

        return marked;
    }, [changedPeriod.startDate, changedPeriod.endDate]);

    return (
        <Section containerStyle={{ marginBottom: 30, marginHorizontal: 16.5 }}>
            <Calendar
                style={{ backgroundColor: "#171717" }}
                monthFormat="yyyy년 M월"
                customHeader={CustomHeader}
                enableSwipeMonths
                hideExtraDays
                markingType="period"
                markedDates={markedDates}
                theme={{
                    backgroundColor: "#171717",
                    calendarBackground: "#171717",
                }}
                onDayPress={handleDayPress}
                dayComponent={DayComponent}
            />
        </Section>
    );
};

const DayComponent = (day: any) => {
    //boolean
    const isStartingDay = !!day.marking?.startingDay;
    const isEndingDay = !!day.marking?.endingDay;
    const isInPeriod = !!day.marking?.selected;

    const isSoloPeriod = isStartingDay && isEndingDay;
    const isSelected = isStartingDay || isEndingDay || isInPeriod;

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
            <View style={styles.Dot} />
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
        backgroundColor: colors.gray[40],
        borderRadius: 100,
    },
});

const CustomHeader = (item: any) => {
    const monthObj = new Date(item.month);
    const year = monthObj.getFullYear();
    const month = monthObj.getMonth() + 1;
    return (
        <View>
            <View style={{ gap: 10, marginBottom: 20 }}>
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
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
                        style={{
                            paddingVertical: 8,
                            backgroundColor: "#171717",
                            textAlign: "center",
                        }}
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
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingHorizontal: 16,
                    marginBottom: 8,
                }}
            >
                {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                    <Typography variant="body2" color="gray40" key={day}>
                        {day}
                    </Typography>
                ))}
            </View>
        </View>
    );
};
