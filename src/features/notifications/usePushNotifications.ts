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

type Semver = [number, number, number];

const parseSemver = (version: string | null | undefined): Semver | null => {
    if (!version) return null;
    const trimmed = version.trim();
    const base = trimmed.endsWith("^") ? trimmed.slice(0, -1) : trimmed;
    const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(base);
    if (!m) return null;
    return [Number(m[1]), Number(m[2]), Number(m[3])] as Semver;
};

const compareSemver = (a: Semver, b: Semver): number => {
    for (let i = 0; i < 3; i++) {
        if (a[i] !== b[i]) return a[i] - b[i];
    }
    return 0;
};

const isRangeSpec = (version: string | null | undefined) =>
    !!version && version.trim().endsWith("^");
const isExactSpec = (version: string | null | undefined) =>
    !!version && !isRangeSpec(version);

const pickTargetByVersion = (
    urls: UrlItem[],
    currentVersion: string | null | undefined
) => {
    if (!urls?.length) return undefined;

    if (currentVersion) {
        const exact = urls.find(
            (u) =>
                isExactSpec(u.version) &&
                u.version?.trim() === currentVersion &&
                u.url
        );
        if (exact) return exact;
    }

    if (currentVersion) {
        const current = parseSemver(currentVersion);
        if (current) {
            const satisfiedRanges: { item: UrlItem; base: Semver }[] = [];

            for (const u of urls) {
                if (!u?.url || !isRangeSpec(u.version)) continue;
                const base = parseSemver(u.version);
                if (!base) continue;
                if (compareSemver(current, base) >= 0) {
                    satisfiedRanges.push({ item: u, base });
                }
            }

            if (satisfiedRanges.length) {
                satisfiedRanges.sort((a, b) => compareSemver(b.base, a.base));
                return satisfiedRanges[0].item;
            }
        }
    }

    const common = urls.find(
        (u) =>
            u.version === null ||
            u.version === "" ||
            (u.version === undefined && u.url)
    );

    if (common) return common;

    return undefined;
};

/** 알림 → 리다이렉트 로직 */
function redirectFromNotification(notification: Notifications.Notification) {
    const data = (notification.request.content.data ?? {}) as Payload;
    const urls = Array.isArray(data.urls) ? data.urls : [];
    if (urls.length === 0) return;

    const currentVersion = getAppVersion();
    const target = pickTargetByVersion(urls, currentVersion);

    if (!target || !target.url) return;

    if (isInternalRoute(target.url)) {
        trackAmplitude("notification_redirect", {
            url: target.url,
            version: target.version,
            app_version: currentVersion ?? "unknown",
            match_type: isExactSpec(target.version)
                ? "exact"
                : isRangeSpec(target.version)
                ? "range"
                : "common",
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
        trackAmplitude("notification_received", {
            id,
            title: n.request.content.title,
            body: n.request.content.body,
            data: n.request.content.data,
        });
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
