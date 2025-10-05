import {
    AuthorizationRequestStatus,
    useHealthkitAuthorization,
} from "@kingstinct/react-native-healthkit";
import * as Location from "expo-location";
import { Barometer, Pedometer } from "expo-sensors";
import {
    getTrackingPermissionsAsync,
    PermissionStatus,
    requestTrackingPermissionsAsync,
} from "expo-tracking-transparency";
import { useCallback } from "react";
import { Alert, Linking, Platform } from "react-native";

import { requestWatchAuthorization } from "@/modules/expo-watch-module";
import { Labels } from "./alerts";
import type {
    PermissionCheck,
    PermissionGroup,
    PermissionRequestResult,
} from "./types";

// LOCATION (FG)
async function checkLocation(): Promise<PermissionCheck> {
    const fg = await Location.getForegroundPermissionsAsync();
    const missing: string[] = [];
    if (fg.status !== "granted") missing.push(Labels.locationFg);
    return { ok: missing.length === 0, missing, details: { fg } };
}

async function requestLocation(): Promise<PermissionRequestResult> {
    let requested = false;
    const missing: string[] = [];
    let fg = await Location.getForegroundPermissionsAsync();
    if (fg.status !== "granted") {
        requested = true;
        fg = await Location.requestForegroundPermissionsAsync();
    }
    if (fg.status !== "granted") missing.push(Labels.locationFg);
    return { ok: missing.length === 0, missing, requested, details: { fg } };
}

// SENSORS
async function checkSensors(): Promise<PermissionCheck> {
    const p = await Pedometer.getPermissionsAsync();
    const b = await Barometer.getPermissionsAsync();
    const missing: string[] = [];
    if (p.status !== "granted") missing.push(Labels.activity);
    if (b.status !== "granted") missing.push(Labels.barometer);
    return { ok: missing.length === 0, missing, details: { p, b } };
}

async function requestSensors(): Promise<PermissionRequestResult> {
    let requested = false;
    const missing: string[] = [];

    let p = await Pedometer.getPermissionsAsync();
    if (p.status !== "granted") {
        requested = true;
        p = await Pedometer.requestPermissionsAsync();
    }

    let b = await Barometer.getPermissionsAsync();
    if (b.status !== "granted") {
        requested = true;
        b = await Barometer.requestPermissionsAsync();
    }

    if (p.status !== "granted") missing.push(Labels.activity);
    if (b.status !== "granted") missing.push(Labels.barometer);

    return { ok: missing.length === 0, missing, requested, details: { p, b } };
}

// HEALTHKIT
type HKAuthState = {
    status: AuthorizationRequestStatus;
    request: () => Promise<AuthorizationRequestStatus>;
};

function useHealthKitBridge(): HKAuthState {
    const [status, request] = useHealthkitAuthorization(
        ["HKQuantityTypeIdentifierHeartRate"],
        [
            "HKQuantityTypeIdentifierDistanceWalkingRunning",
            "HKQuantityTypeIdentifierActiveEnergyBurned",
            "HKWorkoutTypeIdentifier",
            "HKWorkoutRouteTypeIdentifier",
        ]
    );
    return {
        status: status ?? AuthorizationRequestStatus.unknown,
        request: async () => {
            const next = await request();
            return next ?? AuthorizationRequestStatus.unknown;
        },
    };
}

function checkHealthKit(status: AuthorizationRequestStatus): PermissionCheck {
    const authorized = status === AuthorizationRequestStatus.unnecessary;
    return {
        ok: authorized,
        missing: authorized ? [] : [Labels.healthkit],
        details: { status },
    };
}

async function requestHealthKit(
    hk: HKAuthState
): Promise<PermissionRequestResult> {
    let requested = false;
    let status = hk.status;
    if (status == AuthorizationRequestStatus.shouldRequest) {
        requested = true;
        status = await hk.request();
    }
    const { ok, missing } = checkHealthKit(status);
    return { ok, missing, requested, details: { status } };
}

// ADS/ATT (iOS)
async function checkATT(): Promise<PermissionCheck> {
    if (Platform.OS !== "ios") return { ok: true, missing: [] };
    const att = await getTrackingPermissionsAsync();
    const ok =
        att.status === PermissionStatus.GRANTED ||
        att.status === PermissionStatus.DENIED;
    return {
        ok,
        missing: ok ? [] : [Labels.att ?? "추적 허용(ATT)"],
        details: { att },
    };
}

async function requestATT(): Promise<PermissionRequestResult> {
    if (Platform.OS !== "ios")
        return { ok: true, missing: [], requested: false };
    const before = await getTrackingPermissionsAsync();
    if (
        before.status === PermissionStatus.GRANTED ||
        before.status === PermissionStatus.DENIED
    ) {
        return { ok: true, missing: [], requested: false, details: { before } };
    }
    const after = await requestTrackingPermissionsAsync();
    const ok =
        after.status === PermissionStatus.GRANTED ||
        after.status === PermissionStatus.DENIED;
    return {
        ok,
        missing: ok ? [] : [Labels.att ?? "추적 허용(ATT)"],
        requested: true,
        details: { after },
    };
}

// WATCH
async function checkWatch(): Promise<PermissionCheck> {
    return { ok: false, missing: [Labels.watch], details: {} };
}
async function requestWatch(): Promise<PermissionRequestResult> {
    try {
        const ok = await requestWatchAuthorization();
        return { ok, missing: ok ? [] : [Labels.watch], requested: true };
    } catch {
        return { ok: false, missing: [Labels.watch], requested: true };
    }
}

// PUBLIC HOOK
export function useAppPermissions() {
    const hk = useHealthKitBridge();

    const check = useCallback(
        async (group: PermissionGroup): Promise<PermissionCheck> => {
            switch (group) {
                case "LOCATION":
                    return await checkLocation();
                case "SENSORS":
                    return await checkSensors();
                case "HEALTHKIT":
                    return checkHealthKit(hk.status);
                case "ADS":
                    return await checkATT();
                case "WATCH":
                    return await checkWatch();
                default:
                    return { ok: true, missing: [] };
            }
        },
        [hk.status]
    );

    const request = useCallback(
        async (group: PermissionGroup): Promise<PermissionRequestResult> => {
            switch (group) {
                case "LOCATION":
                    return await requestLocation();
                case "SENSORS":
                    return await requestSensors();
                case "HEALTHKIT":
                    return await requestHealthKit(hk);
                case "ADS":
                    return await requestATT();
                case "WATCH":
                    return await requestWatch();
                default:
                    return { ok: true, missing: [], requested: false };
            }
        },
        [hk]
    );

    /** 필수 권한: 실패 시 Alert (예: SENSORS, LOCATION 등) */
    const requestOrAlert = useCallback(
        async (
            group: Extract<PermissionGroup, "SENSORS" | "LOCATION">,
            alertTitle = "권한이 부족해요"
        ): Promise<boolean> => {
            const res = await request(group);
            if (!res.ok && res.missing.length > 0) {
                Alert.alert(alertTitle, "설정에서 권한을 허용해주세요.", [
                    {
                        text: "설정",
                        style: "default",
                        onPress: () => Linking.openSettings(),
                    },
                ]);
            }
            return res.ok;
        },
        [request]
    );

    /** 선택 권한: Alert 없이 시도 (예: HEALTHKIT, ADS) */
    const requestOptional = useCallback(
        async (
            group: Extract<
                PermissionGroup,
                "HEALTHKIT" | "ADS" | "WATCH" | "LOCATION" | "SENSORS"
            >
        ): Promise<boolean> => {
            const res = await request(group);
            return res.ok;
        },
        [request]
    );

    return {
        check,
        request,
        requestOrAlert,
        requestOptional,
    };
}
