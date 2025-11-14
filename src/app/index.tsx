import { Redirect, SplashScreen } from "expo-router";
import { useAuthStore } from "../store/authState";

SplashScreen.preventAutoHideAsync();

export default function Index() {
    const { isLoggedIn } = useAuthStore();

    return <Redirect href={isLoggedIn ? "/(tabs)/home" : "/(auth)/login"} />;
}
