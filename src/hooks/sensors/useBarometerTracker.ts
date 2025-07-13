import { Barometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";

interface BaroRecord {
    pressure: number; // 현재 기압(hPa)
    relativeAltitude: number | null; // 앱 시작점 대비 상대 고도(m)
    timestamp: number;
}

export function useBarometerTracker() {
    const [baroRecords, setBaroRecords] = useState<BaroRecord[]>([]);
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

            setBaroRecords((prev) => [
                ...prev.slice(-100),
                {
                    pressure: data.pressure,
                    relativeAltitude: relAlt,
                    timestamp: Date.now(),
                },
            ]);
        });
        return () => subRef.current && subRef.current.remove();
    }, []);

    return { baroRecords };
}
