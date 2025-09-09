import { Platform } from "react-native";

// 플랫폼별로 적절한 모듈을 가져옴
const expoLiveActivity = Platform.select({
    ios: () => require("./index.ios").default,
    android: () => require("./index.android").default,
    default: () => require("./index.android").default, // fallback
})();

export default expoLiveActivity;
export * from "./types";
