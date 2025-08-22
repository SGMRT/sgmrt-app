import { RunMode } from "../types";
import { CourseVariant } from "../types/status";

export function mapRunType(
    mode: RunMode,
    variant?: CourseVariant
): "SOLO" | "GHOST" | "COURSE" {
    if (mode === "COURSE") return variant === "GHOST" ? "GHOST" : "COURSE";
    return "SOLO";
}
