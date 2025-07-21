import Header from "@/src/components/ui/Header";
import TabBar from "@/src/components/ui/TabBar";
import { Typography } from "@/src/components/ui/Typography";
import { useState } from "react";
import { SafeAreaView, TouchableOpacity, View } from "react-native";

export default function Profile() {
    const [selectedTab, setSelectedTab] = useState<"info" | "course">("info");
    return (
        <View style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1, backgroundColor: "#171717" }}>
                {/* Header */}
                <View>
                    <Header titleText="마이페이지" hasBackButton={false} />
                    <View style={{ flexDirection: "row", marginTop: 10 }}>
                        <HeaderTabItem
                            title="내 정보"
                            onPress={() => setSelectedTab("info")}
                            isSelected={selectedTab === "info"}
                        />
                        <HeaderTabItem
                            title="내 코스"
                            onPress={() => setSelectedTab("course")}
                            isSelected={selectedTab === "course"}
                        />
                    </View>
                </View>
                {/* Content */}
                {selectedTab === "info" && <Info />}
                {selectedTab === "course" && <Course />}
            </SafeAreaView>
            <TabBar position="bottom" />
        </View>
    );
}

const Info = () => {
    return <View></View>;
};

const Course = () => {
    return <View></View>;
};

const HeaderTabItem = ({
    title,
    onPress,
    isSelected,
}: {
    title: string;
    onPress: () => void;
    isSelected: boolean;
}) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                flex: 1,
                alignItems: "center",
                borderBottomColor: isSelected ? "#3f3f3f" : "transparent",
                borderBottomWidth: 1,
                paddingBottom: 10,
            }}
        >
            <Typography
                variant="subhead2"
                color={isSelected ? "white" : "gray80"}
            >
                {title}
            </Typography>
        </TouchableOpacity>
    );
};
