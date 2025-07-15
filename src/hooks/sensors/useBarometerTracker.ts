import { Barometer } from "expo-sensors";
import { useEffect, useRef } from "react";

interface BaroRecord {
    pressure: number; // 현재 기압(hPa)
    relativeAltitude: number | null; // 앱 시작점 대비 상대 고도(m)
    timestamp: number;
}

export function useBarometerTracker() {
    const baroRecordsRef = useRef<BaroRecord[]>([]);
    const basePressure = useRef<number | null>(null);
    const subRef = useRef<any>(null);

    useEffect(() => {
        subRef.current = Barometer.addListener(async (data) => {
            const isAvailable = await Barometer.isAvailableAsync();
            const { status } = await Barometer.requestPermissionsAsync();
            if (!isAvailable || status !== "granted") return;

            if (basePressure.current === null) {
                basePressure.current = data.pressure;
            }
            // Δh = 8.43 * (P₀ - P)
            const relAlt =
                data.relativeAltitude ??
                (basePressure.current! - data.pressure) * 8.43;

            baroRecordsRef.current = [
                ...baroRecordsRef.current,
                {
                    pressure: data.pressure,
                    relativeAltitude: relAlt,
                    timestamp: Date.now(),
                },
            ];

            if (baroRecordsRef.current.length > 100) {
                baroRecordsRef.current = baroRecordsRef.current.slice(-50);
            }
        });
        return () => subRef.current && subRef.current.remove();
    }, []);

    return { baroRecords: baroRecordsRef.current };
}
