import { HomeIcon } from "@/assets/svgs/svgs";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import Header from "../../ui/Header";
import { TabItem } from "../../ui/TabItem";

export const NoticePageHeader = ({
    selectedTab,
    onTabPress,
}: {
    selectedTab: "GENERAL" | "EVENT";
    onTabPress: (tab: "GENERAL" | "EVENT") => void;
}) => {
    const router = useRouter();

    const onBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(tabs)/home");
        }
    };
    return (
        <View>
            <Header
                titleText="공지사항 및 이벤트"
                // back되면 back하고 안되면 home으로
                onBack={onBack}
                hasBackButton={true}
                rightComponent={
                    <Pressable onPress={() => router.replace("/")}>
                        <HomeIcon />
                    </Pressable>
                }
            />
            <View style={styles.header}>
                <TabItem
                    title="공지사항"
                    onPress={() => onTabPress("GENERAL")}
                    isSelected={selectedTab === "GENERAL"}
                />
                <TabItem
                    title="이벤트"
                    onPress={() => onTabPress("EVENT")}
                    isSelected={selectedTab === "EVENT"}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        marginTop: 10,
        flexDirection: "row",
    },
});
