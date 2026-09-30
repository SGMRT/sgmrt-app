import { HomeIcon } from "@/assets/svgs/svgs";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Header } from "@/src/components/ui";
import { Tabs, TabOption } from "@/src/design-system/molecules/Tabs";
import { darkTheme } from "@/src/design-system/themes/dark";

const NOTICE_TABS: TabOption<"GENERAL" | "EVENT">[] = [
    { key: "GENERAL", title: "공지사항" },
    { key: "EVENT", title: "이벤트" },
];

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
                        <HomeIcon color={darkTheme.ui07} />
                    </Pressable>
                }
            />
            <Tabs
                options={NOTICE_TABS}
                selected={selectedTab}
                onSelect={onTabPress}
            />
        </View>
    );
};
