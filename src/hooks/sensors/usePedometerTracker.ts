import { Pedometer } from "expo-sensors";
import { useEffect, useRef } from "react";

interface StepRecord {
    stepCount: number; // 누적 걸음 수
    timestamp: number; // 기록 시각
}

export function usePedometerTracker() {
    const stepRecordsRef = useRef<StepRecord[]>([]);
    const subRef = useRef<any>(null);

    useEffect(() => {
        subRef.current = Pedometer.watchStepCount(async (result) => {
            const isAvailable = await Pedometer.isAvailableAsync();
            const { status } = await Pedometer.requestPermissionsAsync();
            if (!isAvailable || status !== "granted") return;

            stepRecordsRef.current = [
                ...stepRecordsRef.current,
                {
                    stepCount: result.steps, // 누적
                    timestamp: Date.now(), // 수신 시각
                },
            ];

            if (stepRecordsRef.current.length > 150) {
                stepRecordsRef.current = stepRecordsRef.current.slice(-100);
            }
        });
        return () => subRef.current && subRef.current.remove();
    }, []);

    return { stepRecords: stepRecordsRef.current };
}
