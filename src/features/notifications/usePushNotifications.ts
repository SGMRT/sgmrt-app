import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { registerForPushNotificationsAsync } from "./notifications";

export function usePushNotifications() {
    const [expoPushToken, setExpoPushToken] = useState<string>("");
    const [notification, setNotification] = useState<
        Notifications.Notification | undefined
    >(undefined);

    useEffect(() => {
        let isMounted = true;

        registerForPushNotificationsAsync()
            .then((token) => {
                if (isMounted) setExpoPushToken(token ?? "");
            })
            .catch((error) => {
                if (isMounted) setExpoPushToken(String(error));
            });

        const receivedSub = Notifications.addNotificationReceivedListener(
            (rn) => {
                setNotification(rn);
            }
        );

        const responseSub =
            Notifications.addNotificationResponseReceivedListener(
                (response) => {
                    console.log("response", response);
                    // TODO: 라우팅 처리 등 필요
                }
            );

        return () => {
            isMounted = false;
            receivedSub.remove();
            responseSub.remove();
        };
    }, []);

    return { expoPushToken, notification };
}
