import { BackIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { useMemo } from "react";
import { Pressable, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { Divider } from "./Divider";
import Section from "./Section";
import { Typography } from "./Typography";

export const GoRunCalendar = ({
    period,
    setPeriod,
}: {
    period: { startDate: Date; endDate: Date };
    setPeriod: (period: { startDate: Date; endDate: Date }) => void;
}) => {
    const handleDayPress = (day: any) => {
        // 달력 라이브러리에서 받은 날짜 문자열로 Date 객체 생성
        const selectedDateObj = new Date(day.dateString);

        // 시작일과 종료일이 모두 선택된 상태에서 다시 클릭하면 기간을 리셋하고 새로 시작
        if (
            period.startDate &&
            period.endDate &&
            period.startDate < period.endDate
        ) {
            setPeriod({
                startDate: selectedDateObj,
                endDate: selectedDateObj,
            });
            return;
        }

        // 시작일만 선택된 상태에서 클릭
        if (period.startDate) {
            // 시작일보다 이전 날짜를 선택하면, 새 날짜가 시작일이 됨
            if (selectedDateObj < period.startDate) {
                setPeriod({
                    startDate: selectedDateObj,
                    endDate: period.startDate,
                });
            } else {
                // 시작일보다 이후 날짜를 선택하면, 새 날짜가 종료일이 됨
                setPeriod({ ...period, endDate: selectedDateObj });
            }
        } else {
            // 아무것도 선택되지 않은 상태에서는 시작일과 종료일을 동일하게 설정
            setPeriod({
                startDate: selectedDateObj,
                endDate: selectedDateObj,
            });
        }
    };

    const markedDates = useMemo(() => {
        const marked: { [key: string]: any } = {};

        if (!period.startDate) {
            return marked;
        }

        // 날짜를 순회하며 기간 마킹
        let currentDate = new Date(period.startDate);
        const endDate = period.endDate ? new Date(period.endDate) : currentDate;

        while (currentDate <= endDate) {
            const dateString = currentDate.toISOString().split("T")[0];
            marked[dateString] = {
                selected: true,
                color: "#404512",
                textColor: colors.white,
            };
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // 시작일과 종료일 특별 마킹
        marked[period.startDate.toISOString().split("T")[0]] = {
            ...marked[period.startDate.toISOString().split("T")[0]],
            startingDay: true,
        };

        if (period.endDate) {
            marked[period.endDate.toISOString().split("T")[0]] = {
                ...marked[period.endDate.toISOString().split("T")[0]],
                endingDay: true,
            };
        } else {
            // 시작일만 선택된 경우, 시작일이 곧 종료일
            marked[period.startDate.toISOString().split("T")[0]].endingDay =
                true;
        }

        return marked;
    }, [period.startDate, period.endDate]);

    return (
        <Section containerStyle={{ marginBottom: 30, marginHorizontal: 16.5 }}>
            <Calendar
                style={{
                    backgroundColor: "#171717",
                }}
                monthFormat="yyyy년 M월"
                customHeader={CustomHeader}
                enableSwipeMonths={true}
                hideExtraDays={true}
                markingType="period"
                markedDates={markedDates}
                theme={{
                    backgroundColor: "#171717",
                    calendarBackground: "#171717",
                    textDayFontFamily: "Pretendard-Medium",
                    textDayFontSize: 18,
                    selectedDayTextColor: colors.white,
                    dayTextColor: colors.gray[40],
                    todayTextColor: colors.gray[40],
                }}
                onDayPress={handleDayPress}
            />
        </Section>
    );
};

const CustomHeader = (item: any) => {
    const monthObj = new Date(item.month);
    const year = monthObj.getFullYear();
    const month = monthObj.getMonth() + 1;
    return (
        <View>
            <View
                style={{
                    gap: 10,
                    marginBottom: 20,
                }}
            >
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Pressable
                        onPress={() => {
                            item.addMonth(-1);
                        }}
                    >
                        <BackIcon
                            height={16.2}
                            width={8.1}
                            style={{
                                transform: [
                                    {
                                        rotate: "0deg",
                                    },
                                ],
                            }}
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
                    <Pressable
                        onPress={() => {
                            item.addMonth(1);
                        }}
                    >
                        <BackIcon
                            height={16.2}
                            width={8.1}
                            style={{
                                transform: [
                                    {
                                        rotate: "180deg",
                                    },
                                ],
                            }}
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
