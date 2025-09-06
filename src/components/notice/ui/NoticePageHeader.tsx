import { StyleSheet, View } from "react-native";
import Header from "../../ui/Header";
import { TabItem } from "../../ui/TabItem";

export const NoticePageHeader = ({
    selectedTab,
    onTabPress,
}: {
    selectedTab: "notice" | "event";
    onTabPress: (tab: "notice" | "event") => void;
}) => {
    return (
        <View>
            <Header titleText="공지사항 및 이벤트" hasBackButton={true} />
            <View style={styles.header}>
                <TabItem
                    title="공지사항"
                    onPress={() => onTabPress("notice")}
                    isSelected={selectedTab === "notice"}
                />
                <TabItem
                    title="이벤트"
                    onPress={() => onTabPress("event")}
                    isSelected={selectedTab === "event"}
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
