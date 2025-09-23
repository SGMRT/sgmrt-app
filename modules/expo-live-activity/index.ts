import { Platform } from "react-native";
import androidModule from "./index.android";
import iosModule from "./index.ios";

// 플랫폼별로 적절한 모듈을 가져옴
const expoLiveActivity = Platform.select({
    ios: iosModule,
    android: androidModule,
    default: androidModule, // fallback
});

export default expoLiveActivity;
export * from "./types";
