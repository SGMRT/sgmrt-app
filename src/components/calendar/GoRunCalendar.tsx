import { getRunningDays } from "@/src/apis";
import { MonthlyStatusResponse } from "@/src/apis/types/run";
import { endOfDay, startOfDay } from "@/src/utils/formatDate";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Calendar } from "react-native-calendars";
import { Section } from "@/src/components/ui";
import { CustomHeader } from "./CustomHeader";
import { DayComponent } from "./DayComponent";
import {
    formatKey,
    parseYM,
    runningDaysKey,
    shiftYM,
} from "./utils/calendarUtils";

type DateRange = { startDate: Date; endDate: Date };

const fetchRunningDays = async ({
    queryKey,
}: {
    queryKey: ReturnType<typeof runningDaysKey>;
}) => {
    const [, y, m] = queryKey;
    const data = await getRunningDays(y, m);
    return (data ?? []) as MonthlyStatusResponse;
};

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

    const handleDayPress = (day: { dateString: string }) => {
        const [year, month, date] = day.dateString.split("-").map(Number);
        const selected = new Date(year, month - 1, date);
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

    const initialDate = useMemo(
        () => formatKey(period.startDate ?? new Date()),
        [period.startDate]
    );
    const [currentDate, setCurrentDate] = useState<string>(initialDate);
    const { y, m } = useMemo(() => parseYM(currentDate), [currentDate]);
    const queryClient = useQueryClient();

    const { data: currentMonthData } = useQuery({
        queryKey: runningDaysKey(y, m),
        queryFn: fetchRunningDays,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        initialData: () => queryClient.getQueryData(runningDaysKey(y, m)) ?? [],
    });

    useEffect(() => {
        const targets = [shiftYM(y, m, -1), shiftYM(y, m, 1)];
        targets.forEach(({ y: yy, m: mm }) => {
            queryClient.prefetchQuery({
                queryKey: runningDaysKey(yy, mm),
                queryFn: fetchRunningDays,
                staleTime: 5 * 60 * 1000,
            });
        });
    }, [y, m, queryClient]);

    const runSet = useMemo(() => {
        const toKey = (d: { day: number; hasRun: boolean }) => {
            const dd = String(d.day).padStart(2, "0");
            const mm = String(m).padStart(2, "0");
            return `${y}-${mm}-${dd}`;
        };
        return new Set((currentMonthData ?? []).map(toKey as any));
    }, [currentMonthData, y, m]);

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

    const mergedMarkedDates = useMemo(() => {
        const next = { ...markedDates };
        runSet.forEach((k) => {
            if (typeof k !== "string") return;
            next[k] = { ...(next[k] ?? {}), run: true };
        });
        return next;
    }, [markedDates, runSet]);

    return (
        <Section containerStyle={{ marginBottom: 30, marginHorizontal: 16.5 }}>
            <Calendar
                current={initialDate}
                onMonthChange={(d) => {
                    setCurrentDate(d.dateString);
                }}
                style={{ backgroundColor: "#171717" }}
                monthFormat="yyyy년 M월"
                customHeader={CustomHeader}
                enableSwipeMonths
                hideExtraDays
                markingType="period"
                markedDates={mergedMarkedDates}
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
