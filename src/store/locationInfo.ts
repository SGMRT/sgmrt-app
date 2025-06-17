import AsyncStorage from "@react-native-async-storage/async-storage";
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
                set({
                    coords,
                    address,
                    temperature,
                    lastUpdated: new Date(),
                }),
        }),
        {
            name: "location-info",
            storage: {
                getItem: async (name) => {
                    const raw = await AsyncStorage.getItem(name);
                    return raw ? JSON.parse(raw) : null;
                },
                setItem: async (name, value) => {
                    await AsyncStorage.setItem(name, JSON.stringify(value));
                },
                removeItem: async (name) => {
                    await AsyncStorage.removeItem(name);
                },
            },
        }
    )
);
