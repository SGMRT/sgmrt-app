import { CalendarIcon, ShowIcon } from "@/assets/svgs/svgs";
import { formatDate } from "@/src/utils/formatDate";
import { Pressable, StyleSheet, View } from "react-native";
import { ButtonWithIcon, FilterButton } from "../buttons/FilterButton";
import { Typography } from "../display/Typography";

interface FilterBarProps {
    searchPeriod: {
        startDate: Date;
        endDate: Date;
    };
    setSearchPeriod: (period: { startDate: Date; endDate: Date }) => void;
    onClickFilter: (type: "date" | "filter" | "view") => void;
    selectedFilter: "date" | "course";
    selectedView: "list" | "gallery";
    filters?: {
        date?: boolean;
        filter?: boolean;
        view?: boolean;
    };
    isDeleteMode?: boolean;
    setIsDeleteMode?: (isDeleteMode: boolean) => void;
    selectedCount?: number;
    onDelete?: () => void;
    isLoading?: boolean;
}

export const FilterBar = ({
    searchPeriod,
    setSearchPeriod,
    onClickFilter,
    selectedFilter,
    selectedView,
    filters = {
        date: true,
        filter: true,
        view: true,
    },
    isDeleteMode = false,
    setIsDeleteMode = () => {},
    selectedCount = 0,
    onDelete,
    isLoading = false,
}: FilterBarProps) => {
    const hasSelection = selectedCount > 0;
    const canDelete = hasSelection && !isLoading;
    const { date, filter, view } = filters;
    return (
        <View style={styles.filterBar}>
            {date && (
                <ButtonWithIcon
                    icon={<CalendarIcon />}
                    // 25.06.21 형식으로 되도록
                    title={`${formatDate(searchPeriod.startDate)} ~${formatDate(
                        searchPeriod.endDate,
                    )}`}
                    onPress={() => onClickFilter("date")}
                    variant="body2"
                    color="gray20"
                    style={styles.pv5}
                />
            )}
            {view && (
                <ButtonWithIcon
                    icon={<ShowIcon />}
                    title={selectedView === "list" ? "목록" : "앨범"}
                    onPress={() => onClickFilter("view")}
                    variant="body2"
                    color="gray20"
                    style={styles.pv5}
                />
            )}
            {filter && (
                <FilterButton
                    onPress={() => onClickFilter("filter")}
                    variant="body2"
                    color="gray20"
                    style={styles.pv5}
                    title={selectedFilter === "date" ? "날짜별" : "코스별"}
                />
            )}
            {isDeleteMode && (
                <Pressable
                    onPress={canDelete ? onDelete : undefined}
                    disabled={isLoading}
                    style={{
                        marginLeft: "auto",
                        backgroundColor: "#212121",
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderRadius: 10,
                    }}
                >
                    <Typography
                        variant="body3"
                        color={canDelete ? "primary" : "gray40"}
                    >
                        삭제하기
                    </Typography>
                </Pressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    filterBar: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 16.5,
    },
    pv5: {
        paddingVertical: 5,
    },
});
