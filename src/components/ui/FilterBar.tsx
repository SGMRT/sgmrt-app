import { CalendarIcon } from "@/assets/svgs/svgs";
import { formatDate } from "@/src/utils/formatDate";
import { StyleSheet, View } from "react-native";
import { ButtonWithIcon, FilterButton } from "./FilterButton";

interface FilterBarProps {
    searchPeriod: {
        startDate: Date;
        endDate: Date;
    };
    setSearchPeriod: (period: { startDate: Date; endDate: Date }) => void;
    onClickFilter: (type: "date" | "filter" | "view") => void;
}

export const FilterBar = ({
    searchPeriod,
    setSearchPeriod,
    onClickFilter,
}: FilterBarProps) => {
    return (
        <View style={styles.filterBar}>
            <ButtonWithIcon
                icon={<CalendarIcon />}
                // 25.06.21 형식으로 되도록
                title={`${formatDate(searchPeriod.startDate)} ~${formatDate(
                    searchPeriod.endDate
                )}`}
                onPress={() => onClickFilter("date")}
                variant="body2"
                color="gray20"
                style={styles.pv5}
            />
            <FilterButton
                onPress={() => onClickFilter("filter")}
                variant="body2"
                color="gray20"
                style={styles.pv5}
            />
            <ButtonWithIcon
                title="보기 방식"
                onPress={() => onClickFilter("view")}
                variant="body2"
                color="gray20"
                style={styles.pv5}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    filterBar: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
    },
    pv5: {
        paddingVertical: 5,
    },
});
