import { localWorkoutSyncStore } from "@/src/store/workoutSyncStore";
import { queryWorkoutSamples } from "@kingstinct/react-native-healthkit";
import { useEffect, useState } from "react";

export function useUnSyncedWatchWorkoutCount() {
    const importedWorkoutIds = localWorkoutSyncStore(
        (s) => s.importedWorkoutIds
    );
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setIsLoading(true);

                const proxies = await queryWorkoutSamples({
                    limit: 50,
                    ascending: false,
                });

                const filtered: typeof proxies = [];

                for (const p of proxies) {
                    const distance = await p.getStatistic(
                        "HKQuantityTypeIdentifierDistanceWalkingRunning"
                    );
                    const workoutRoutes = await p.getWorkoutRoutes();
                    const dist = distance?.sumQuantity?.quantity ?? 0;

                    const isFromGhostRunnerWatch =
                        p.sourceRevision?.source?.bundleIdentifier ===
                            "com.sgmrt.ghostrunner" &&
                        p.device?.model === "Watch";

                    const isLongEnough = dist >= 0.5;
                    const isNotImported = !importedWorkoutIds.includes(p.uuid);
                    const hasRoutes = workoutRoutes.length > 0;

                    if (
                        isFromGhostRunnerWatch &&
                        isLongEnough &&
                        isNotImported &&
                        hasRoutes
                    ) {
                        filtered.push(p);
                    }
                }

                if (!cancelled) {
                    setCount(filtered.length);
                }
            } catch (e) {
                if (!cancelled) {
                    setCount(0);
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [importedWorkoutIds]);

    return { count, isLoading };
}
