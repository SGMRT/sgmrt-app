import { DefaultLogo } from "@/assets/icons/icons";
import { CourseResponse } from "@/src/apis/types/course";
import colors from "@/src/theme/colors";
import { getDistance } from "@/src/utils/mapUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, FlatList, Image, View } from "react-native";
import ButtonWithIcon from "../ui/ButtonWithMap";
import { Divider } from "../ui/Divider";
import { DualFilter } from "../ui/DualFilter";
import EmptyListView from "../ui/EmptyListView";
import { FilterButton } from "../ui/FilterButton";
import RadioButton from "../ui/RadioButton";
import Section from "../ui/Section";
import { Typography } from "../ui/Typography";
import { UserCount } from "../ui/UserCount";

interface CourseListViewProps {
    courses: CourseResponse[];
    courseType: "all" | "my";
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    selectedCourse: CourseResponse | null;
    onClickCourse: (course: CourseResponse) => void;
    onClickCourseInfo: (course: CourseResponse) => void;
}

const CourseListView = ({
    courses,
    courseType,
    bottomSheetRef,
    selectedCourse,
    onClickCourse,
    onClickCourseInfo,
}: CourseListViewProps) => {
    const [editMode, setEditMode] = useState(false);
    const [filter, setFilter] = useState<"near" | "trend">("near");
    const [sortedCourses, setSortedCourses] = useState<CourseResponse[]>([]);

    const router = useRouter();

    useEffect(() => {
        const sortCourses = async () => {
            if (filter === "near") {
                try {
                    const { status } =
                        await Location.requestForegroundPermissionsAsync();
                    if (status !== "granted") {
                        console.error(
                            "Permission to access location was denied"
                        );
                        // 권한이 없으면 인기순으로 대체하거나 사용자에게 알림
                        setSortedCourses(
                            [...courses].sort(
                                (a, b) => b.runnersCount - a.runnersCount
                            )
                        );
                        return;
                    }

                    const userLocation =
                        await Location.getCurrentPositionAsync();
                    const newSorted = [...courses].sort((a, b) => {
                        const distanceA = getDistance(
                            {
                                lat: userLocation.coords.latitude,
                                lng: userLocation.coords.longitude,
                            },
                            { lat: a.startLat, lng: a.startLng }
                        );
                        const distanceB = getDistance(
                            {
                                lat: userLocation.coords.latitude,
                                lng: userLocation.coords.longitude,
                            },
                            { lat: b.startLat, lng: b.startLng }
                        );
                        return distanceA - distanceB;
                    });
                    setSortedCourses(newSorted);
                } catch (error) {
                    console.error(
                        "Failed to get location or sort courses:",
                        error
                    );
                    // 에러 발생 시 기본 정렬 또는 다른 처리
                    setSortedCourses(courses);
                }
            } else {
                // filter === "trend"
                const newSorted = [...courses].sort(
                    (a, b) => b.runnersCount - a.runnersCount
                );
                setSortedCourses(newSorted);
            }
        };

        sortCourses();
    }, [filter, courses]);

    const onPressFilter = () => {
        setEditMode(true);
    };

    const onPressNear = () => {
        setFilter("near");
        setEditMode(false);
    };

    const onPressTrend = () => {
        setFilter("trend");
        setEditMode(false);
    };

    if (editMode) {
        return (
            <DualFilter
                description="정렬 방식"
                firstLabel="가까운 순"
                secondLabel="인기 순"
                onPressFirst={onPressNear}
                onPressSecond={onPressTrend}
                selected={filter === "near" ? "first" : "second"}
            />
        );
    }

    return (
        <View>
            <View style={{ marginHorizontal: 16.5 }}>
                <Section
                    title={courseType === "all" ? "고스트 코스" : "내 코스"}
                    titleColor="white"
                    style={{
                        maxHeight: Dimensions.get("window").height - 500,
                    }}
                    containerStyle={{
                        borderBottomStartRadius: 0,
                        borderBottomEndRadius: 0,
                    }}
                    titleRightChildren={
                        <FilterButton
                            onPress={onPressFilter}
                            title={filter === "near" ? "가까운 순" : "인기 순"}
                        />
                    }
                >
                    <FlatList
                        data={sortedCourses}
                        ListEmptyComponent={
                            <EmptyListView
                                description={`등록된 코스 정보가 존재하지 않습니다.\n러닝을 통해 코스를 등록해주세요.`}
                            />
                        }
                        renderItem={({ item, index }) => (
                            <CourseGalleryItem
                                courseName={item.name}
                                distance={item.distance / 1000}
                                elevation={item.elevationGain}
                                userCount={item.runnersCount}
                                index={index}
                                maxLength={courses.length}
                                imageUrl={item.thumbnailUrl}
                                isSelected={selectedCourse?.id === item.id}
                                onClickCourse={() => onClickCourse(item)}
                                onClickCourseInfo={() => {
                                    onClickCourseInfo(item);
                                }}
                            />
                        )}
                        showsVerticalScrollIndicator={false}
                    />
                </Section>
            </View>
            <ButtonWithIcon
                iconType="map"
                title={
                    selectedCourse ? "이 코스로 러닝 시작" : "밀어서 러닝 시작"
                }
                onPress={() => {
                    bottomSheetRef.current?.dismiss();
                    if (selectedCourse) {
                        router.push(`/run/${selectedCourse?.id}/-1`);
                    } else {
                        router.push("/run/solo");
                    }
                }}
                topStroke
                onPressIcon={() => {
                    bottomSheetRef.current?.dismiss();
                }}
                type="active"
            />
        </View>
    );
};

export const CourseGalleryItem = ({
    courseName,
    distance,
    elevation,
    userCount,
    index,
    maxLength,
    imageUrl,
    isSelected,
    onClickCourse,
    onClickCourseInfo,
}: {
    courseName: string;
    distance: number;
    elevation: number;
    userCount: number;
    index: number;
    maxLength: number;
    isSelected: boolean;
    imageUrl: string;
    onClickCourse: () => void;
    onClickCourseInfo: () => void;
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
                <Image
                    source={imageUrl ? { uri: imageUrl } : DefaultLogo}
                    style={{
                        width: 120,
                        height: 120,
                        borderRadius: 10,
                    }}
                />
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
                        {courseName}
                    </Typography>
                    <RadioButton
                        isSelected={isSelected}
                        showMyRecord={false}
                        onPress={onClickCourse}
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
                            {distance.toFixed(2)}
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
                            {elevation}m
                        </Typography>
                    </View>
                </View>
                {/* 유저 수 */}
                <UserCount userCount={userCount} onPress={onClickCourseInfo} />
            </View>
        </View>
    );
};

export default CourseListView;
