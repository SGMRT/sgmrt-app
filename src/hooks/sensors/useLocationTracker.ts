import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";

interface LocationRecord {
    lat: number;
    lng: number;
    alt: number | null;
    timestamp: number;
}

export function useLocationTracker() {
    const [locations, setLocations] = useState<LocationRecord[]>([]);
    const subRef = useRef<Location.LocationSubscription | null>(null);

    useEffect(() => {
        let isMounted = true;
        const startTracking = async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") return;
            subRef.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.BestForNavigation,
                    timeInterval: 1000,
                },
                (result) => {
                    if (!isMounted) return;
                    setLocations((prev) => [
                        ...prev,
                        {
                            lat: result.coords.latitude,
                            lng: result.coords.longitude,
                            alt: result.coords.altitude ?? null,
                            timestamp: result.timestamp,
                        },
                    ]);
                }
            );
        };

        startTracking();

        return () => {
            isMounted = false;
            subRef.current?.remove();
        };
    }, []);

    return { locations };
}
