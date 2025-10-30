import * as Updates from "expo-updates";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

type Options = {
    checkOnForeground?: boolean;
    reloadNonCritical?: boolean; // false=백그라운드만
    cooldownMs?: number;
    onCriticalStart?: () => void;
    onCriticalDone?: () => void;
    onNonCriticalDownloaded?: () => void;
    onError?: (e: unknown) => void;
};

export function useUpdateOrchestrator({
    checkOnForeground = true,
    reloadNonCritical = false,
    cooldownMs = 7000,
    onCriticalStart,
    onCriticalDone,
    onNonCriticalDownloaded,
    onError,
}: Options = {}) {
    const {
        currentlyRunning,
        availableUpdate,
        isUpdatePending,
        isDownloading,
        isChecking,
    } = Updates.useUpdates();

    const [checking, setChecking] = useState(false);
    const appState = useRef(AppState.currentState);
    const lastCheckAt = useRef(0);

    // critical 판정: next.extra.criticalIndex > current.extra.criticalIndex
    const isCritical = useMemo(() => {
        const next =
            (availableUpdate?.manifest as any)?.extra?.expoClient?.extra
                ?.criticalIndex ?? 0;
        const curr =
            (currentlyRunning?.manifest as any)?.extra?.expoClient?.extra
                ?.criticalIndex ?? 0;
        return Number(next) > Number(curr);
    }, [availableUpdate?.manifest, currentlyRunning?.manifest]);

    const checkOnce = async () => {
        try {
            setChecking(true);

            // 1) 업데이트 할 것이 있는지 체크
            const res = await Updates.checkForUpdateAsync();

            // 2) 업데이트 할 것이 없으면 종료
            if (!res.isAvailable) return;

            const nextManifest: any = res.manifest ?? {};
            const currManifest: any = (currentlyRunning?.manifest as any) ?? {};
            const nextCritical = Number(
                nextManifest?.extra?.expoClient?.extra?.criticalIndex ?? 0
            );
            const currCritical = Number(
                currManifest?.extra?.expoClient?.extra?.criticalIndex ?? 0
            );
            const critical = nextCritical > currCritical;

            // 3) 다운로드
            if (critical) {
                onCriticalStart?.();
                await Updates.fetchUpdateAsync();

                // 딜레이 삽입
                await new Promise((resolve) => setTimeout(resolve, 10000));

                onCriticalDone?.();

                // 4) 즉시 재시작 (강제업뎃)
                await Updates.reloadAsync();
            } else {
                await Updates.fetchUpdateAsync(); // 조용히 다운로드
                onNonCriticalDownloaded?.();

                if (reloadNonCritical) await Updates.reloadAsync();
            }
        } catch (e) {
            onError?.(e);
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        if (!checkOnForeground) return;
        const sub = AppState.addEventListener("change", (s) => {
            const prev = appState.current;
            appState.current = s;
            if (
                (prev === "background" || prev === "inactive") &&
                s === "active"
            ) {
                const now = Date.now();
                if (now - lastCheckAt.current > cooldownMs) {
                    lastCheckAt.current = now;
                    checkOnce();
                }
            }
        });
        return () => sub.remove();
    }, [checkOnForeground, cooldownMs]);

    useEffect(() => {
        if (isUpdatePending && reloadNonCritical) {
            Updates.reloadAsync();
        }
    }, [isUpdatePending, reloadNonCritical]);

    return {
        checkOnce,
        isCritical,
        isChecking: checking || isChecking,
        isDownloading,
    };
}
