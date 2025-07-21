import { Divider } from "@/src/components/ui/Divider";
import Header from "@/src/components/ui/Header";
import { StyledButton } from "@/src/components/ui/StyledButton";
import TabBar from "@/src/components/ui/TabBar";
import { Typography } from "@/src/components/ui/Typography";
import { useState } from "react";
import {
    Image,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";

export default function ProfileScreen() {
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
    return (
        <ScrollView
            contentContainerStyle={{
                flex: 1,
                marginHorizontal: 17,
                marginTop: 20,
            }}
        >
            {/* Profile */}
            <View style={{ gap: 15, marginTop: 10 }}>
                <Profile />
                <View style={{ flexDirection: "row", gap: 4, flex: 1 }}>
                    <StyledButton
                        title="프로필 이미지 변경"
                        onPress={() => {}}
                        style={{ width: "50%" }}
                    />
                    <StyledButton
                        title="회원 정보 변경"
                        onPress={() => {}}
                        style={{ width: "50%" }}
                    />
                </View>
            </View>
        </ScrollView>
    );
};

const Profile = () => {
    return (
        <View
            style={{
                flexDirection: "row",
                gap: 15,
                alignItems: "center",
            }}
        >
            <Image
                source={{
                    uri: "https://picsum.photos/200/300",
                }}
                style={{ width: 60, height: 60, borderRadius: 100 }}
            />
            <View>
                <Typography variant="headline" color="gray20">
                    윤다희
                </Typography>
                <View
                    style={{
                        flexDirection: "row",
                        gap: 10,
                        alignItems: "center",
                    }}
                >
                    <Typography variant="body1" color="gray40">
                        166cm
                    </Typography>
                    <Divider />
                    <Typography variant="body1" color="gray40">
                        55kg
                    </Typography>
                    <Divider />
                    <Typography variant="body1" color="gray40">
                        여성
                    </Typography>
                </View>
            </View>
        </View>
    );
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
