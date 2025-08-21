import { useEffect } from "react";
import { joinedState } from "../store/joinedState";
import { useSensors } from "./useSensors";

export function useRunningSession() {
    useSensors();

    useEffect(() => {
        return joinedState.subscribe((state) => {
            console.log("[JOINED] 위치 수신", state);
        });
    }, []);
}
