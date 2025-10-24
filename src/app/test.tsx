import { SplashScreen } from "expo-router";
import PreviewScreen from "../features/replay/PreviewScreen";

export default function Test() {
    SplashScreen.hideAsync();
    return <PreviewScreen courseId={1} />;
}
