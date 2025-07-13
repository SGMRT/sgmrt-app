import * as Location from "expo-location";
import { useEffect, useRef } from "react";

interface LocationRecord {
    lat: number;
    lng: number;
    alt: number | null;
    timestamp: number;
}

export function useLocationTracker() {
    const locationsRef = useRef<LocationRecord[]>([]);
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
                    locationsRef.current = [
                        ...locationsRef.current,
                        {
                            lat: result.coords.latitude,
                            lng: result.coords.longitude,
                            alt: result.coords.altitude ?? null,
                            timestamp: result.timestamp,
                        },
                    ];

                    if (locationsRef.current.length > 150) {
                        locationsRef.current = locationsRef.current.slice(-100);
                    }
                }
            );
        };

        startTracking();

        return () => {
            isMounted = false;
            subRef.current?.remove();
        };
    }, []);

    return { locations: locationsRef.current };
}
