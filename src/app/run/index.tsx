import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import SlideToAction from "@/src/components/map/SlideToAction";
import WeatherInfo from "@/src/components/map/WeatherInfo";
import StatsIndicator from "@/src/components/ui/\bStatsIndicator";
import TopBlurView from "@/src/components/ui/TopBlurView";
import colors from "@/src/theme/colors";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useEffect, useRef } from "react";
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
    useEffect(() => {
        bottomSheetRef.current?.present();
    }, []);

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
                <Text style={styles.timeText}>01:20</Text>
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
            <SlideToAction
                label="밀어서 러닝 종료"
                onSlideSuccess={() => {}}
                color="red"
                direction="right"
            />
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
