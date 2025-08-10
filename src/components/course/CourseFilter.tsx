import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Pressable, View } from "react-native";
import BottomModal from "../ui/BottomModal";
import { Typography } from "../ui/Typography";

export const CourseFilter = ({
    bottomSheetRef,
    setSelectedFilter,
    selectedFilter,
}: {
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    setSelectedFilter: (filter: "day" | "week" | "month" | "year") => void;
    selectedFilter: "day" | "week" | "month" | "year";
}) => {
    return (
        <BottomModal bottomSheetRef={bottomSheetRef}>
            <View>
                <View
                    style={{
                        alignItems: "center",
                        borderBottomWidth: 1,
                        borderBottomColor: "#3f3f3f",
                        paddingBottom: 20,
                    }}
                >
                    <Typography variant="body3" color="white">
                        보기 방식
                    </Typography>
                </View>
                <FilterItem
                    title="1일"
                    onPress={() => {
                        setSelectedFilter("day");
                        bottomSheetRef.current?.close();
                    }}
                    isSelected={selectedFilter === "day"}
                />
                <FilterItem
                    title="1주"
                    onPress={() => {
                        setSelectedFilter("week");
                        bottomSheetRef.current?.close();
                    }}
                    isSelected={selectedFilter === "week"}
                />
                <FilterItem
                    title="1개월"
                    onPress={() => {
                        setSelectedFilter("month");
                        bottomSheetRef.current?.close();
                    }}
                    isSelected={selectedFilter === "month"}
                />
                <FilterItem
                    title="1년"
                    onPress={() => {
                        setSelectedFilter("year");
                        bottomSheetRef.current?.close();
                    }}
                    isSelected={selectedFilter === "year"}
                />
            </View>
        </BottomModal>
    );
};

const FilterItem = ({
    title,
    onPress,
    isSelected,
}: {
    title: string;
    onPress: () => void;
    isSelected: boolean;
}) => {
    return (
        <Pressable onPress={onPress}>
            <View
                style={{
                    alignItems: "center",
                    borderBottomWidth: 1,
                    borderBottomColor: "#212121",
                    paddingVertical: 20,
                    backgroundColor: isSelected ? "#171717" : "transparent",
                }}
            >
                <Typography
                    variant="headline"
                    color={isSelected ? "primary" : "gray20"}
                >
                    {title}
                </Typography>
            </View>
        </Pressable>
    );
};
