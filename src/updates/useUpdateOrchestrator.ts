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
            (availableUpdate?.manifest as any)?.extra?.criticalIndex ?? 0;
        const curr =
            (currentlyRunning?.manifest as any)?.extra?.criticalIndex ?? 0;
        return Number(next) > Number(curr);
    }, [availableUpdate?.manifest, currentlyRunning?.manifest]);

    const checkOnce = async () => {
        try {
            setChecking(true);
            const res = await Updates.checkForUpdateAsync();
            if (!res.isAvailable) return;

            if (isCritical) {
                onCriticalStart?.(); // 전면 오버레이 띄우기
                await Updates.fetchUpdateAsync();
                onCriticalDone?.(); // 오버레이 닫기
                await Updates.reloadAsync(); // 바로 재시작
            } else {
                await Updates.fetchUpdateAsync(); // 조용히 다운로드만
                onNonCriticalDownloaded?.();
                if (reloadNonCritical) {
                    await Updates.reloadAsync();
                }
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
