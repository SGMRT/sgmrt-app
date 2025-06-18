import TabBar from "@/src/components/ui/TabBar";
import { Text, View } from "react-native";

export default function Stats() {
    return (
        <View style={{ flex: 1 }}>
            <Text>Stats</Text>
            <TabBar position="bottom" />
        </View>
    );
}
