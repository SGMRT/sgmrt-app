import { setTelemetryEnabled } from "@rnmapbox/maps";
import { StyleSheet, useWindowDimensions, View } from "react-native";

import HomeMap from "@/src/components/map/HomeMap";
import WeatherInfo from "@/src/components/map/WeatherInfo";
import { HomeNotices } from "@/src/components/notice/HomeNotices";
import { Onboarding } from "@/src/components/onboarding/Onboarding";
import TabBar from "@/src/components/ui/TabBar";
import TopBlurView from "@/src/components/ui/TopBlurView";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SplashScreen } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Confetti, ConfettiMethods } from "react-native-fast-confetti";

export default function Home() {
    const [showListView, setShowListView] = useState(false);

    const confettiRef = useRef<ConfettiMethods | null>(null);
    const { height: windowHeight, width: windowWidth } = useWindowDimensions();

    const mapBottomSheetRef = useRef<BottomSheetModal>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        setTelemetryEnabled(false);
        SplashScreen.hideAsync();
    }, []);

    useEffect(() => {
        const loadWelcome = async () => {
            const welcome = await AsyncStorage.getItem("welcome");

            if (welcome === "true") {
                setShowOnboarding(true);
            }
        };
        loadWelcome();
    }, []);

    return (
        <View style={styles.container}>
            <TopBlurView>
                <WeatherInfo />
                <HomeNotices />
            </TopBlurView>
            <HomeMap
                courseType={"all"}
                showListView={showListView}
                setShowListView={setShowListView}
                mapBottomSheetRef={mapBottomSheetRef}
            />
            <TabBar topRound={false} />
            {/* <SlideToAction
                label="밀어서 러닝 시작"
                onSlideSuccess={() => {
                    router.push("/run/solo");
                }}
                color="green"
                direction="left"
            /> */}

            <Confetti
                ref={confettiRef}
                fallDuration={4000}
                count={100}
                colors={["#d9d9d9", "#e2ff00", "#ffffff"]}
                flakeSize={{ width: 12, height: 8 }}
                fadeOutOnEnd={true}
                cannonsPositions={[
                    { x: windowWidth / 2, y: windowHeight - 200 },
                    { x: windowWidth / 2, y: windowHeight - 200 },
                ]}
                blastDuration={800}
                autoplay={false}
            />
            {showOnboarding && (
                <Onboarding
                    showOnboarding={showOnboarding}
                    setShowOnboarding={setShowOnboarding}
                    confettiRef={confettiRef}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
    },
});
