import { CourseFilter } from "@/src/components/course/CourseFilter";
import { CoursesWithFilter } from "@/src/components/course/CoursesWithFilter";
import Header from "@/src/components/ui/Header";
import SlideToAction from "@/src/components/ui/SlideToAction";
import TabBar from "@/src/components/ui/TabBar";
import { TabItem } from "@/src/components/ui/TabItem";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { SafeAreaView, View } from "react-native";

export default function Stats() {
    const [selectedTab, setSelectedTab] = useState<"solo" | "ghost">("solo");
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const [selectedFilter, setSelectedFilter] = useState<
        "day" | "week" | "month" | "year"
    >("month");
    const data = [
        {
            id: 1,
            name: "소고기마라탕",
        },
    ];
    const router = useRouter();
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#111111" }}>
            <Header
                titleText="내 기록"
                onDelete={
                    selectedItemId ? () => setSelectedItemId(null) : undefined
                }
            />
            <View style={{ flexDirection: "row", marginTop: 10 }}>
                <TabItem
                    title="내 기록"
                    onPress={() => setSelectedTab("solo")}
                    isSelected={selectedTab === "solo"}
                />
                <TabItem
                    title="고스트 러닝"
                    onPress={() => setSelectedTab("ghost")}
                    isSelected={selectedTab === "ghost"}
                />
            </View>
            <View style={{ flex: 1, marginTop: 20 }}>
                <CoursesWithFilter
                    data={data}
                    selectedCourseId={selectedItemId}
                    setSelectedCourseId={setSelectedItemId}
                    onClickFilter={() => bottomSheetRef.current?.present()}
                />
            </View>
            <TabBar />
            <SlideToAction
                label={
                    selectedTab === "solo"
                        ? "이 코스로 러닝 시작"
                        : "고스트와 러닝 시작"
                }
                onSlideSuccess={() => {
                    if (selectedTab === "solo") {
                        router.push("/run/solo");
                    } else {
                        router.push("/run/solo");
                    }
                }}
                color="green"
                direction="left"
            />
            <CourseFilter
                bottomSheetRef={bottomSheetRef}
                setSelectedFilter={setSelectedFilter}
                selectedFilter={selectedFilter}
            />
        </SafeAreaView>
    );
}
