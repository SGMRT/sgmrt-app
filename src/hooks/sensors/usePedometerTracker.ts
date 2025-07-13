import { Pedometer } from "expo-sensors";
import { useEffect, useRef, useState } from "react";

interface StepRecord {
    stepCount: number; // 누적 걸음 수
    timestamp: number; // 기록 시각
}

export function usePedometerTracker() {
    const [stepRecords, setStepRecords] = useState<StepRecord[]>([]);
    const subRef = useRef<any>(null);

    useEffect(() => {
        subRef.current = Pedometer.watchStepCount(async (result) => {
            const isAvailable = await Pedometer.isAvailableAsync();
            const { status } = await Pedometer.requestPermissionsAsync();
            if (!isAvailable || status !== "granted") return;

            setStepRecords((prev) => [
                ...prev.slice(-100),
                {
                    stepCount: result.steps, // 누적
                    timestamp: Date.now(), // 수신 시각
                },
            ]);
        });
        return () => subRef.current && subRef.current.remove();
    }, []);

    return { stepRecords };
}
