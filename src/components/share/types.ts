import { Telemetry } from "@/src/apis/types/run";
import { Stat } from "@/src/components/ui/StatRow";

export type ShareVariant = "default" | "logo" | "simple" | "record";

export type CommonShareProps = {
    telemetries: Telemetry[];
    width?: number;
    height?: number;
    title?: string;
    distance?: string | number;
    stats?: Stat[];
    onMapReady?: () => void;
};
