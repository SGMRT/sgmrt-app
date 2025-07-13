import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

export default function Ghost() {
    const { courseId, ghostRunningId } = useLocalSearchParams();

    console.log(courseId, ghostRunningId);

    return <View></View>;
}
