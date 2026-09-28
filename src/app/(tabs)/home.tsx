import { setTelemetryEnabled } from "@rnmapbox/maps";
import { StyleSheet, useWindowDimensions, View } from "react-native";

import HomeMap from "@/src/components/map/HomeMap";
import WeatherInfo from "@/src/components/map/WeatherInfo";
import { HomeNotices } from "@/src/components/notice/HomeNotices";
import { WelcomeOnboarding } from "@/src/components/onboarding/WelcomOnboarding";
import { ShuffleButton, TabBar, TopBlurView } from "@/src/components/ui";
import { darkTheme } from "@/src/design-system/themes/dark";
import { core } from "@/src/design-system/tokens/colors";
import { useSplashUntilLocationReady } from "@/src/features/permission/useSplashUntilLocationReady";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { Confetti, ConfettiMethods } from "react-native-fast-confetti";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Home() {
    const [showListView, setShowListView] = useState(false);

    const confettiRef = useRef<ConfettiMethods | null>(null);
    const { height: windowHeight, width: windowWidth } = useWindowDimensions();

    const mapBottomSheetRef = useRef<BottomSheetModal>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);

    const [refreshKey, setRefreshKey] = useState(0);
    const [refreshable, setRefreshable] = useState(false);

    const onShuffle = () => {
        setRefreshKey(refreshKey + 1);
        setRefreshable(false);
    };

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

    const { top } = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <TopBlurView>
                <WeatherInfo />
            </TopBlurView>
            <View style={[styles.bottomContainer, { paddingTop: top + 50 }]}>
                <HomeNotices />
                {refreshable && <ShuffleButton onPress={onShuffle} />}
            </View>

            <HomeMap
                courseType={"all"}
                showListView={showListView}
                setShowListView={setShowListView}
                mapBottomSheetRef={mapBottomSheetRef}
                refreshKey={refreshKey}
                onRefreshableChange={setRefreshable}
            />
            <TabBar topRound={false} />

            <Confetti
                ref={confettiRef}
                fallDuration={4000}
                count={100}
                // 색종이는 장식 그래픽이라 면·글자 토큰을 쓰지 않는다.
                // 강조색만 토큰에서 가져와 Primary 가 바뀌면 함께 따라간다.
                colors={["#D9D9D9", darkTheme.primary, core.white]}
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
    bottomContainer: {
        position: "absolute",
        left: 0,
        right: 0,
        zIndex: 100,
    },
});
