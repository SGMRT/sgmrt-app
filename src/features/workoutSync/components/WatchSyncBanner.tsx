// components/home/WatchSyncBanner.tsx
import Section from "@/src/components/ui/Section";
import { Typography } from "@/src/components/ui/Typography";
import { useRouter } from "expo-router";

type Props = {
    count: number;
};

export default function WatchSyncBanner({ count }: Props) {
    const router = useRouter();

    if (count <= 0) return null;

    return (
        <Section
            title={`동기화할 수 있는 워치 기록 ${count}건`}
            titleColor="white"
            titleVariant="body2"
            shortcutTitle="바로가기"
            onPress={() => router.push("/stats/sync")}
        >
            <Typography variant="caption1" color="gray40">
                워치에서 기록한 러닝을 고스트러너 기록으로 저장해보세요.
            </Typography>
        </Section>
    );
}
