import { setTelemetryEnabled } from "@rnmapbox/maps";
import { StyleSheet, useWindowDimensions, View } from "react-native";

import HomeMap from "@/src/components/map/HomeMap";
import WeatherInfo from "@/src/components/map/WeatherInfo";
import { HomeNotices } from "@/src/components/notice/HomeNotices";
import { WelcomeOnboarding } from "@/src/components/onboarding/WelcomOnboarding";
import TabBar from "@/src/components/ui/TabBar";
import TopBlurView from "@/src/components/ui/TopBlurView";
import { useSplashUntilLocationReady } from "@/src/features/permission/useSplashUntilLocationReady";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { Confetti, ConfettiMethods } from "react-native-fast-confetti";

export default function Home() {
    const [showListView, setShowListView] = useState(false);

    const confettiRef = useRef<ConfettiMethods | null>(null);
    const { height: windowHeight, width: windowWidth } = useWindowDimensions();

    const mapBottomSheetRef = useRef<BottomSheetModal>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useSplashUntilLocationReady();

    useEffect(() => {
        setTelemetryEnabled(false);
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

    const handleCloseOnboarding = useCallback(() => {
        setShowOnboarding(false);
        AsyncStorage.setItem("welcome", "false");
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
                <WelcomeOnboarding
                    show={showOnboarding}
                    handleClose={handleCloseOnboarding}
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
