import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LocationInfoState {
    coords: [number | null, number | null];
    address: string | null;
    temperature: number | null;
    lastUpdated: Date | null;
    setLocationInfo: (
        coords: [number, number],
        address: string,
        temperature: number
    ) => void;
}

export const useLocationInfoStore = create<LocationInfoState>()(
    persist(
        (set) => ({
            coords: [null, null],
            address: null,
            temperature: null,
            lastUpdated: null,
            setLocationInfo: (coords, address, temperature) =>
                set({ coords, address, temperature, lastUpdated: new Date() }),
        }),
        {
            name: "location-info",
        }
    )
);
