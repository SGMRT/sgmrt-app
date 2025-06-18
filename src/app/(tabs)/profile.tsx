import TabBar from "@/src/components/ui/TabBar";
import { Text, View } from "react-native";

export default function Profile() {
    return (
        <View style={{ flex: 1 }}>
            <Text>Profile</Text>
            <TabBar position="bottom" />
        </View>
    );
}
