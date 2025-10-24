import PreviewScreen from "@/src/features/replay/PreviewScreen";
import { useLocalSearchParams } from "expo-router";

export default function Preview() {
    const { courseId } = useLocalSearchParams();
    return <PreviewScreen courseId={Number(courseId)} />;
}
