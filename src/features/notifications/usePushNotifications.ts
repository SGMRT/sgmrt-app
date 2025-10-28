import { trackAmplitude } from "@/src/utils/trackAmplitude";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { RelativePathString, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Linking } from "react-native";
import { registerForPushNotificationsAsync } from "./notifications";

type UrlItem = { version: string | null; url: string | null };
type Payload = { urls: UrlItem[] };

const isInternalRoute = (url: string) => url.startsWith("/");

const getAppVersion = () =>
    Application.nativeApplicationVersion ??
    Constants?.expoConfig?.version ??
    null;

/** 알림 → 리다이렉트 로직 */
function redirectFromNotification(notification: Notifications.Notification) {
    const data = (notification.request.content.data ?? {}) as Payload;
    const urls = Array.isArray(data.urls) ? data.urls : [];

    if (urls.length === 0) return;

    const currentVersion = getAppVersion();

    // 버전이 일치하는 URL 먼저 탐색
    let target: UrlItem | undefined;
    if (currentVersion) {
        target = urls.find((u) => u.version === currentVersion);
    }
    // 없으면 version === null(모든 버전 공통) 우선 사용
    if (!target) {
        target = urls.find((u) => u.version === null || u.version === "");
    }

    if (!target || !target.url || target.url === "") return;

    if (isInternalRoute(target.url)) {
        trackAmplitude("notification_redirect", {
            url: target.url,
            version: target.version,
        });
        router.push(target.url as RelativePathString);
    } else {
        Linking.openURL(target.url).catch(() => {
            // 실패 시 무시 또는 로깅
        });
    }
}

export function usePushNotifications() {
    const [expoPushToken, setExpoPushToken] = useState<string>("");
    const [notification, setNotification] = useState<
        Notifications.Notification | undefined
    >(undefined);

    const handledIdsRef = useRef<Set<string>>(new Set());

    const handleOnce = (n?: Notifications.Notification) => {
        if (!n) return;
        const id = n.request.identifier;
        if (handledIdsRef.current.has(id)) return;
        handledIdsRef.current.add(id);
        redirectFromNotification(n);
    };

    useEffect(() => {
        let isMounted = true;

        registerForPushNotificationsAsync()
            .then((token) => {
                if (isMounted) setExpoPushToken(token ?? "");
            })
            .catch((error) => {
                if (isMounted) setExpoPushToken("");
            });

        // 2) 콜드 스타트 시 마지막 알림 응답 처리
        (async () => {
            try {
                const last =
                    await Notifications.getLastNotificationResponseAsync();
                handleOnce(last?.notification);
            } catch {}
        })();

        const receivedSub = Notifications.addNotificationReceivedListener(
            (rn) => {
                if (!isMounted) return;
                setNotification(rn);
            }
        );

        const responseSub =
            Notifications.addNotificationResponseReceivedListener(
                (response) => {
                    handleOnce(response.notification);
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
