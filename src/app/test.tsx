import { useQuery } from "@tanstack/react-query";
import { SplashScreen } from "expo-router";
import { getCourse, getPacemakerByCourseId, getPacemakerDetail } from "../apis";
import { Typography } from "../components/ui/Typography";

const courseId = 728;
export default function Test() {
    SplashScreen.hideAsync();

    const { data: course } = useQuery({
        queryKey: ["course", courseId],
        queryFn: () => getCourse(courseId),
    });

    const { data: pacemakerSummary } = useQuery({
        queryKey: ["pacemaker", courseId],
        queryFn: () => getPacemakerByCourseId(courseId),
    });

    const { data: pacemakerDetail } = useQuery({
        queryKey: [
            "pacemakerDetail",
            pacemakerSummary?.pacemakerSummaryResponse.id!,
        ],
        queryFn: () =>
            getPacemakerDetail(pacemakerSummary?.pacemakerSummaryResponse.id!),
        enabled: !!pacemakerSummary?.pacemakerSummaryResponse.id,
    });

    if (!pacemakerDetail) return null;

    console.log(pacemakerDetail);

    return (
        <Typography variant="body1" color="white">
            test
        </Typography>
    );
}
