import { useEffect } from "react";
import { Button, Text, View } from "react-native";
import { sendPushNotification } from "./notifications";
import { usePushNotifications } from "./usePushNotifications";

export default function PushNotificationGate() {
    const { expoPushToken, notification } = usePushNotifications();

    useEffect(() => {
        console.log("expoPushToken", expoPushToken);
        console.log("notification", notification);
    }, [expoPushToken, notification]);

    return (
        <View style={{ display: "none" }}>
            {/* 디버깅용 컴포넌트 */}
            <View style={{ padding: 12 }}>
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
            </View>
        </View>
    );
}
