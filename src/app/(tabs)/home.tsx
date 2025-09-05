import { setTelemetryEnabled } from "@rnmapbox/maps";
import { StyleSheet, useWindowDimensions, View } from "react-native";

import HomeMap from "@/src/components/map/HomeMap";
import HomeTopBar from "@/src/components/map/HomeTopFilter";
import WeatherInfo from "@/src/components/map/WeatherInfo";
import BottomModal from "@/src/components/ui/BottomModal";
import TabBar from "@/src/components/ui/TabBar";
import { SuccessToast } from "@/src/components/ui/toastConfig";
import TopBlurView from "@/src/components/ui/TopBlurView";
import { Typography } from "@/src/components/ui/Typography";
import { useAuthStore } from "@/src/store/authState";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { Confetti, ConfettiMethods } from "react-native-fast-confetti";

/**
 * Home screen component composing header, map, onboarding modal, confetti, and tab bar.
 *
 * Renders the top weather/header area, a map with optional list view, a bottom tab bar, and two bottom-sheet-driven UX elements:
 * - An onboarding BottomModal that shows a welcome message and a success toast on first launch (controlled via AsyncStorage "welcome" key).
 * - A map-related BottomSheet presented from the top bar menu.
 *
 * Side effects:
 * - Disables Mapbox telemetry on mount.
 * - On first run (when "welcome" is "true" or not set), restarts the confetti animation, presents the onboarding modal for ~3 seconds, then persists "welcome" = "false".
 *
 * Internal state:
 * - `type` ("all" | "my"): filter applied to the map content.
 * - `showListView`: toggles the map's list view.
 *
 * The component exposes no props and returns the rendered JSX for the home screen.
 *
 * @returns The Home screen React element.
 */
export default function Home() {
    const [type, setType] = useState<"all" | "my">("all");
    const [showListView, setShowListView] = useState(false);

    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const confettiRef = useRef<ConfettiMethods | null>(null);
    const { height: windowHeight, width: windowWidth } = useWindowDimensions();
    const { username } = useAuthStore().userInfo ?? {};

    const mapBottomSheetRef = useRef<BottomSheetModal>(null);

    useEffect(() => {
        setTelemetryEnabled(false);
    }, []);

    useEffect(() => {
        const loadWelcome = async () => {
            const welcome = await AsyncStorage.getItem("welcome");

            if (welcome === "true" || welcome === null) {
                confettiRef.current?.restart();
                bottomSheetRef.current?.present();
                setTimeout(() => {
                    bottomSheetRef.current?.close();
                }, 3000);
                await AsyncStorage.setItem("welcome", "false");
            }
        };
        loadWelcome();
    }, []);

    return (
        <View style={styles.container}>
            <TopBlurView>
                <WeatherInfo />
                <HomeTopBar
                    type={type}
                    setType={setType}
                    onClickMenu={() => {
                        setShowListView(true);
                        mapBottomSheetRef.current?.present();
                    }}
                />
            </TopBlurView>
            <HomeMap
                courseType={type}
                showListView={showListView}
                setShowListView={setShowListView}
                mapBottomSheetRef={mapBottomSheetRef}
            />
            <TabBar />
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

            <BottomModal bottomSheetRef={bottomSheetRef} canClose={true}>
                <View
                    style={{
                        alignItems: "center",
                        gap: 4,
                    }}
                >
                    <Typography
                        variant="headline"
                        color="white"
                        style={{ textAlign: "center" }}
                    >
                        반가워요 {username}님!{"\n"}
                        고스트러너 가입을 환영해요
                    </Typography>
                    <Typography variant="body3" color="gray40">
                        내 정보는 마이페이지의 회원 정보에서 변경 가능합니다
                    </Typography>
                </View>
                <View style={{ alignItems: "center", paddingVertical: 20 }}>
                    <SuccessToast text1="가입이 완료 되었습니다" />
                </View>
            </BottomModal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
    },
});
