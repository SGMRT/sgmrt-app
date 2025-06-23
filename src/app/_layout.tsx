import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import Mapbox from "@rnmapbox/maps";
import { BlurView } from "expo-blur";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast, { ToastProps } from "react-native-toast-message";

SplashScreen.preventAutoHideAsync();

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "");

const toastConfig = {
    success: (props: ToastProps) => (
        <BlurView
            intensity={14}
            style={{
                backgroundColor: "rgba(92, 92, 92, 0.8)",
                gap: 10,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 18,
                paddingHorizontal: 20,
                borderRadius: 30,
                overflow: "hidden",
            }}
        >
            <Text style={{ color: "white" }}>Success</Text>
        </BlurView>
    ),
    info: (props: ToastProps) => (
        <View>
            <Text>Info</Text>
        </View>
    ),
};

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

    if (!loaded) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModalProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="course" />
                    <Stack.Screen
                        name="run"
                        options={{ gestureEnabled: false }}
                    />
                </Stack>
                <Toast config={toastConfig} />
            </BottomSheetModalProvider>
        </GestureHandlerRootView>
    );
}
