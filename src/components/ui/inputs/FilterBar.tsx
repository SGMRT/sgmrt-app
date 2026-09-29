import { CalendarIcon, ShowIcon } from "@/assets/svgs/svgs";
import { Button } from "@/src/design-system/atoms/Button";
import { spacing } from "@/src/design-system/tokens/spacing";
import { formatDate } from "@/src/utils/formatDate";
import { StyleSheet, View } from "react-native";
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
                />
            )}
            {view && (
                <ButtonWithIcon
                    icon={<ShowIcon />}
                    title={selectedView === "list" ? "목록" : "앨범"}
                    onPress={() => onClickFilter("view")}
                    variant="body2"
                    color="gray20"
                />
            )}
            {filter && (
                <FilterButton
                    onPress={() => onClickFilter("filter")}
                    variant="body2"
                    color="gray20"
                    title={selectedFilter === "date" ? "날짜별" : "코스별"}
                />
            )}
            {isDeleteMode && (
                /* 고른 코스를 지우는 행동이라 되돌릴 수 없다.
                   secondary 로 두어 다른 필터와 성격이 다름을 드러낸다. */
                <Button
                    title="삭제하기"
                    onPress={onDelete ?? (() => {})}
                    disabled={!canDelete}
                    size="small"
                    theme="secondary"
                    variant="line"
                    style={styles.deleteButton}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    filterBar: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: spacing[6],
        paddingHorizontal: spacing[16],
    },
    deleteButton: {
        marginLeft: "auto",
    },
});
