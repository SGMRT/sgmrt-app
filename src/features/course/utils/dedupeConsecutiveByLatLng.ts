import { Checkpoint } from "@/src/apis/types/course";

export function dedupeConsecutiveByLatLng(arr: Checkpoint[]): Checkpoint[] {
    return arr.filter((p, i) => {
        if (i === 0) return true;
        const prev = arr[i - 1];
        return !(p.lat === prev.lat && p.lng === prev.lng);
    });
}
