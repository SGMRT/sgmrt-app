import { setTelemetryEnabled } from "@rnmapbox/maps";
import { StyleSheet, View } from "react-native";

import CourseFilter from "@/src/components/map/CourseFilter";
import HomeMap from "@/src/components/map/HomeMap";
import WeatherInfo from "@/src/components/map/WeatherInfo";
import SlideToAction from "@/src/components/ui/SlideToAction";
import TabBar from "@/src/components/ui/TabBar";
import TopBlurView from "@/src/components/ui/TopBlurView";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        setTelemetryEnabled(false);
    }, []);

    return (
        <View style={styles.container}>
            <TopBlurView>
                <WeatherInfo />
                <CourseFilter />
            </TopBlurView>
            <HomeMap courses={[]} />
            <TabBar />
            <SlideToAction
                label="밀어서 러닝시작"
                onSlideSuccess={() => {
                    router.push("/run/solo");
                }}
                color="green"
                direction="left"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
    },
});
