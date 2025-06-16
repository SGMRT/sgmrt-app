import Mapbox from "@rnmapbox/maps";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "");

export default function RootLayout() {
    const [loaded] = useFonts({
        "SpoqaHanSansNeo-Regular": require("@/assets/fonts/SpoqaHanSansNeo-Regular.ttf"),
        "SpoqaHanSansNeo-Medium": require("@/assets/fonts/SpoqaHanSansNeo-Medium.ttf"),
        "SpoqaHanSansNeo-Bold": require("@/assets/fonts/SpoqaHanSansNeo-Bold.ttf"),
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
            </Stack>
        </GestureHandlerRootView>
    );
}
