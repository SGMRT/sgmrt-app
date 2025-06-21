import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import WeatherInfo from "@/src/components/map/WeatherInfo";
import SlideToAction from "@/src/components/ui/SlideToAction";
import SlideToDualAction from "@/src/components/ui/SlideToDualAction";
import StatsIndicator from "@/src/components/ui/StatsIndicator";
import TopBlurView from "@/src/components/ui/TopBlurView";
import colors from "@/src/theme/colors";
import { getRunTime } from "@/src/utils/runUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const stats = [
    { label: "거리", value: "1.45", unit: "km" },
    { label: "평균 페이스", value: "8’15”", unit: "" },
    { label: "케이던스", value: "24", unit: "spm" },
    { label: "고도", value: "18", unit: "m" },
    { label: "칼로리", value: "100", unit: "kcal" },
    { label: "BPM", value: "--", unit: "" },
];

export default function Run() {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const { bottom } = useSafeAreaInsets();
    const [isRunning, setIsRunning] = useState(true);
    const [runTime, setRunTime] = useState(0);
    useEffect(() => {
        bottomSheetRef.current?.present();
    }, []);

    useEffect(() => {
        if (isRunning) {
            const interval = setInterval(() => {
                setRunTime((prev) => prev + 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isRunning]);

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: "#111111",
                paddingBottom: bottom,
            }}
        >
            <TopBlurView>
                <WeatherInfo />
                <Text style={styles.timeText}>
                    {getRunTime(runTime, "MM:SS")}
                </Text>
            </TopBlurView>
            <MapViewWrapper hasLocateMe={false}></MapViewWrapper>
            <View
                style={{
                    backgroundColor: "#111111",
                    alignItems: "center",
                }}
            >
                <View
                    style={{
                        width: 50,
                        height: 5,
                        backgroundColor: colors.gray[40],
                        borderRadius: 100,
                        marginTop: 10,
                    }}
                />
                <View style={{ paddingVertical: 30 }}>
                    <StatsIndicator stats={stats} color="gray20" />
                </View>
            </View>
            {isRunning && (
                <SlideToAction
                    label="밀어서 러닝 종료"
                    onSlideSuccess={() => {
                        setIsRunning(false);
                    }}
                    color="red"
                    direction="right"
                />
            )}
            {!isRunning && (
                <SlideToDualAction
                    onSlideLeft={() => {
                        console.log("기록 저장");
                    }}
                    onSlideRight={() => {
                        console.log("이어서 뛰기");
                        setIsRunning(true);
                    }}
                    leftLabel="기록 저장"
                    rightLabel="이어서 뛰기"
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    timeText: {
        fontFamily: "SpoqaHanSansNeo-Bold",
        fontSize: 60,
        color: "white",
        lineHeight: 81.3,
        textAlign: "center",
    },
});
