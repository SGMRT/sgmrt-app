import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

export function useLocalNotificationPermission({
    withActiveRetry = true,
}: { withActiveRetry?: boolean } = {}) {
    const [granted, setGranted] = useState(false);
    const appState = useRef<AppStateStatus>(AppState.currentState);

    const refresh = useCallback(async () => {
        const { status } = await Notifications.getPermissionsAsync();
        setGranted(status === "granted");
    }, []);

    useEffect(() => {
        // 앱 시작/마운트 시 1회 조회
        refresh();
    }, [refresh]);

    // 설정앱에서 복귀: active로 바뀌는 순간 재조회
    useEffect(() => {
        const sub = AppState.addEventListener("change", async (next) => {
            const prev = appState.current;
            appState.current = next;
            if (prev.match(/inactive|background/) && next === "active") {
                await refresh();

                if (withActiveRetry) {
                    setTimeout(refresh, 350);
                    setTimeout(refresh, 1000);
                }
            }
        });
        return () => sub.remove();
    }, [refresh, withActiveRetry]);

    return { granted, refresh };
}
