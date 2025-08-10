import { ChevronIcon, UserIcon } from "@/assets/svgs/svgs";
import { CourseResponse } from "@/src/apis/types/course";
import colors from "@/src/theme/colors";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { Dimensions, FlatList, TouchableOpacity, View } from "react-native";
import { Divider } from "../ui/Divider";
import EmptyListView from "../ui/EmptyListView";
import { FilterButton } from "../ui/FilterButton";
import RadioButton from "../ui/RadioButton";
import Section from "../ui/Section";
import SlideToAction from "../ui/SlideToAction";
import { Typography } from "../ui/Typography";

interface CourseListViewProps {
    courses: CourseResponse[];
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    selectedCourse: CourseResponse | null;
    onClickCourse: (course: CourseResponse) => void;
}

const CourseListView = ({
    courses,
    bottomSheetRef,
    selectedCourse,
    onClickCourse,
}: CourseListViewProps) => {
    const router = useRouter();
    return (
        <View>
            <Section
                title="나와 가까운 코스"
                titleColor="white"
                style={{
                    marginHorizontal: 16.5,
                    maxHeight: Dimensions.get("window").height - 500,
                }}
                titleRightChildren={<FilterButton onPress={() => {}} />}
            >
                <FlatList
                    data={courses}
                    ListEmptyComponent={
                        <EmptyListView
                            description={`등록된 코스 정보가 존재하지 않습니다.\n러닝을 통해 코스를 등록해주세요.`}
                        />
                    }
                    renderItem={({ item, index }) => (
                        <CourseItem
                            course={item}
                            index={index}
                            maxLength={courses.length}
                            isSelected={selectedCourse?.id === item.id}
                            onClickCourse={onClickCourse}
                        />
                    )}
                    showsVerticalScrollIndicator={false}
                />
            </Section>
            <SlideToAction
                label={
                    selectedCourse ? "이 코스로 러닝 시작" : "밀어서 러닝 시작"
                }
                onSlideSuccess={() => {
                    bottomSheetRef.current?.dismiss();
                    if (selectedCourse) {
                        router.push(`/run/${selectedCourse?.id}/-1`);
                    } else {
                        router.push("/run/solo");
                    }
                }}
                color="green"
                direction="left"
            />
        </View>
    );
};

const CourseItem = ({
    course,
    index,
    maxLength,
    isSelected,
    onClickCourse,
}: {
    course: CourseResponse;
    index: number;
    maxLength: number;
    isSelected: boolean;
    onClickCourse: (course: CourseResponse) => void;
}) => {
    return (
        <View
            style={{
                marginBottom: index + 1 !== maxLength ? 20 : 0,
                flexDirection: "row",
                gap: 20,
            }}
        >
            {/* 코스 이미지 */}
            <View
                style={{
                    backgroundColor: "gray",
                    width: 120,
                    height: 120,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Typography variant="headline" color="white">
                    준비 중
                </Typography>
            </View>
            {/* 코스 정보 */}
            <View
                style={{
                    marginVertical: 4,
                    gap: 5,
                    flex: 1,
                }}
            >
                {/* 코스 이름 */}
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Typography
                        variant="subhead1"
                        color={isSelected ? "primary" : "gray20"}
                    >
                        {course.name}
                    </Typography>
                    <RadioButton
                        isSelected={isSelected}
                        showMyRecord={false}
                        onPress={() => onClickCourse(course)}
                        inactiveColor={colors.gray[40]}
                    />
                </View>
                {/* 코스 거리, 고도 */}
                <View>
                    {/* 코스 거리 */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <Typography variant="body1" color="gray40">
                            거리
                        </Typography>
                        <Divider />
                        <Typography variant="body1" color="gray40">
                            {(course.distance / 1000).toFixed(2)}
                            km
                        </Typography>
                    </View>
                    {/* 코스 고도 */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <Typography variant="body1" color="gray40">
                            고도
                        </Typography>
                        <Divider />
                        <Typography variant="body1" color="gray40">
                            {course.elevationGain}m
                        </Typography>
                    </View>
                </View>
                {/* 유저 수 */}
                <TouchableOpacity
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                    }}
                    onPress={() => {
                        console.log("pressed");
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <UserIcon color={colors.gray[40]} />
                        <Typography variant="body3" color="gray40">
                            {course.runnersCount}
                        </Typography>
                    </View>
                    <ChevronIcon color={colors.gray[40]} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default CourseListView;
