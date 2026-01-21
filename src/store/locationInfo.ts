import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Coordinate } from "../utils/mapUtils";

interface LocationInfoState {
    coords: Coordinate | null;
    address: string | null;
    temperature: number | null;
    lastUpdated: Date | null; // 주소 업데이트 시간
    weatherLastUpdated: Date | null; // 날씨 업데이트 시간 (별도 관리)
    setLocationInfo: (
        coords: Coordinate,
        address: string,
        temperature: number
    ) => void;
    updateAddress: (coords: Coordinate, address: string) => void;
    updateTemperature: (temperature: number) => void;
}

export const useLocationInfoStore = create<LocationInfoState>()(
    persist(
        (set) => ({
            coords: null,
            address: null,
            temperature: null,
            lastUpdated: null,
            weatherLastUpdated: null,
            setLocationInfo: (coords, address, temperature) =>
                set({
                    coords,
                    address,
                    temperature,
                    lastUpdated: new Date(),
                    weatherLastUpdated: new Date(),
                }),
            updateAddress: (coords, address) =>
                set({
                    coords,
                    address,
                    lastUpdated: new Date(),
                }),
            updateTemperature: (temperature) =>
                set({
                    temperature,
                    weatherLastUpdated: new Date(),
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
