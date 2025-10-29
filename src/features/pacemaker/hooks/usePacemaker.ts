import { Telemetry } from "@/src/apis/types/run";

interface PacemakerProps {
    pacemakerId: number | string;
    courseTelemetry: Telemetry[];
    myPoint: Telemetry;
    timestamp: number;
}

export function usePacemaker() {}
