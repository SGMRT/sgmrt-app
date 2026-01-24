import { registerDevice } from "@/src/apis";
import { useAuthStore } from "@/src/store/authState";
import { devLog, errorLog } from "@/src/utils/devLog";
import * as Application from "expo-application";
import * as Device from "expo-device";
import { useEffect } from "react";
import { Platform, View } from "react-native";
import { usePushNotifications } from "./usePushNotifications";

async function getDeviceUuid(): Promise<string> {
    if (Platform.OS === "ios") {
        const iosId = await Application.getIosIdForVendorAsync();
        if (iosId) return iosId;
    } else if (Platform.OS === "android") {
        const androidId = Application.getAndroidId();
        if (androidId) return androidId;
    }
    return `${Device.modelName ?? "unknown"}-${Date.now()}`;
}

export default function PushNotificationGate() {
    const { expoPushToken, notification } = usePushNotifications();
    const { isLoggedIn } = useAuthStore();

    useEffect(() => {
        if (isLoggedIn && expoPushToken && expoPushToken !== "") {
            const appVersion =
                Application.nativeApplicationVersion ?? "unknown";

            getDeviceUuid()
                .then((deviceUuid) =>
                    registerDevice({
                        deviceUuid,
                        appVersion,
                        pushToken: expoPushToken,
                        osName: Platform.OS,
                        osVersion: Platform.Version.toString(),
                        modelName: Device.modelName ?? undefined,
                    }),
                )
                .then(() => {
                    devLog("registerDevice");
                })
                .catch((error) => {
                    errorLog(error);
                });
        }
    }, [expoPushToken, notification, isLoggedIn]);

    return (
        <View style={{ backgroundColor: "white", display: "none" }}>
            {/* 디버깅용 컴포넌트 */}
            {/* <View style={{ padding: 12 }}>
                <Text>Expo Push Token: {expoPushToken}</Text>
                <Text>Title: {notification?.request.content.title ?? ""}</Text>
                <Text>Body: {notification?.request.content.body ?? ""}</Text>
                <Text>
                    Data:{" "}
                    {JSON.stringify(notification?.request.content.data ?? {})}
                </Text>
                <Button
                    title="Test Push"
                    onPress={() => sendPushNotification(expoPushToken)}
                />
            </View> */}
        </View>
    );
}
