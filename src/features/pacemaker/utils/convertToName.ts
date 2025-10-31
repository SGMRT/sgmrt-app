import { GhostyType } from "@/src/apis/types/ghosty";

const GhostyCharacterNameMap: Record<keyof typeof GhostyType, string> = {
    RECOVERY_JOGGING: "브리즈",
    STAMINA: "버디",
    SPEED: "스파키",
    MARATHON: "마일로",
    FREE: "루피",
};

export function convertToName(
    runningType: GhostyType | keyof typeof GhostyType | undefined
) {
    if (!runningType) return "고스티";

    // 1) 코드로 들어온 경우 바로 매칭
    if (runningType in GhostyCharacterNameMap) {
        return GhostyCharacterNameMap[
            runningType as keyof typeof GhostyCharacterNameMap
        ];
    }

    // 2) enum value(한글 라벨)로 들어온 경우 → 코드로 역매핑
    const code = (Object.entries(GhostyType).find(
        ([, val]) => val === runningType
    )?.[0] ?? "") as keyof typeof GhostyType;

    return GhostyCharacterNameMap[code] ?? "고스티";
}
