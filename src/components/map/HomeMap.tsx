import { getCourses } from "@/src/apis";
import { CourseResponse } from "@/src/apis/types/course";
import { useAppPermissions } from "@/src/features/permission/useAppPermissions";
import { useAuthStore } from "@/src/store/authState";
import colors from "@/src/theme/colors";
import { devLog } from "@/src/utils/devLog";
import {
    calculateCenter,
    calculateZoomLevelFromSize,
    Coordinate,
    getDistance,
} from "@/src/utils/mapUtils";
import * as amplitude from "@amplitude/analytics-react-native";
import { BottomSheetHandle, BottomSheetModal } from "@gorhom/bottom-sheet";
import { Camera } from "@rnmapbox/maps";
import { Position } from "@rnmapbox/maps/lib/typescript/src/types/Position";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import {
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CourseListView from "../course/CourseListView";
import { ActionButton } from "../ui/ActionButton";
import BottomModal from "../ui/BottomModal";
import StyledBottomSheet from "../ui/StyledBottomSheet";
import { Typography } from "../ui/Typography";
import BottomCourseInfoModal from "./courseInfo/BottomCourseInfoModal";
import CourseMarkers from "./CourseMarkers";
import MapViewWrapper from "./MapViewWrapper";

interface HomeMapProps {
    courseType: "all" | "my";
    showListView: boolean;
    setShowListView: (showListView: boolean) => void;
    mapBottomSheetRef: React.RefObject<BottomSheetModal | null>;
}

const ZOOM_THRESHOLD = 14.5;
const CAMERA_LATITUDE_OFFSET = 0.006;
const BOTTOM_BAR_HEIGHT = 155;
const TAB_BAR_HEIGHT = 130;

const CONTROL_PANEL_HEIGHT = 48;
const MARGIN_BOTTOM = 16;
const CONTROL_PANEL_OFFSET = CONTROL_PANEL_HEIGHT + MARGIN_BOTTOM;

type VisibleBounds = {
    sw: Position;
    ne: Position;
};

export default function HomeMap({
    courseType,
    showListView,
    setShowListView,
    mapBottomSheetRef,
}: HomeMapProps) {
    const router = useRouter();
    const [activeCourse, setActiveCourse] = useState<CourseResponse | null>(
        null
    );
    const [zoomLevel, setZoomLevel] = useState(16);
    const { requestOptional, requestOrAlert } = useAppPermissions();
    const { uuid } = useAuthStore();

    const firstRenderRef = useRef(true);

    const handlePresentModalPress = () => {
        mapBottomSheetRef.current?.present();
    };

    const onClickCourse = (course: CourseResponse) => {
        setActiveCourse(course);

        amplitude.track("course_detail_view", {
            course_id: course.id,
            is_own_course: course.ownerUuid === uuid,
        });

        const coordinates: Coordinate[] = [];

        course.telemetries.forEach((telemetry) => {
            coordinates.push({ lat: telemetry.lat, lng: telemetry.lng });
        });

        const center = calculateCenter(coordinates);
        const zoomLevel = calculateZoomLevelFromSize(
            center.size,
            center.latitude - CAMERA_LATITUDE_OFFSET
        );

        cameraRef.current?.setCamera({
            centerCoordinate: [
                center.longitude,
                center.latitude - CAMERA_LATITUDE_OFFSET,
            ],
            zoomLevel: zoomLevel,
        });
    };

    const [bounds, setBounds] = useState<VisibleBounds | null>(null);
    const [center, setCenter] = useState<Position | null>(null);
    const [distance, setDistance] = useState(10);
    const cameraRef = useRef<Camera>(null);

    const onZoomLevelChanged = useCallback(
        (currentZoomLevel: number) => {
            const isHighZoom = zoomLevel > ZOOM_THRESHOLD;
            const isCurrentHighZoom = currentZoomLevel > ZOOM_THRESHOLD;

            // 줌 레벨의 '상태' (고배율/저배율)가 변경되었을 때만 업데이트
            if (isHighZoom !== isCurrentHighZoom) {
                setZoomLevel(currentZoomLevel);
            }
        },
        [zoomLevel]
    );

    const deviceHeight = Dimensions.get("window").height;
    const { bottom } = useSafeAreaInsets();

    const controlPannelPosition = useAnimatedStyle(() => {
        const baseHeight = deviceHeight - BOTTOM_BAR_HEIGHT - bottom;
        return { top: baseHeight - CONTROL_PANEL_OFFSET };
    });

    const onRegionDidChange = (event: any) => {
        const newCenter = event.properties.center;
        const visibleBounds = event.properties.bounds;

        const { sw, ne } = bounds ?? visibleBounds;

        if (bounds !== null) {
            const leftBound = sw[0];
            const rightBound = ne[0];
            const bottomBound = sw[1];
            const topBound = ne[1];

            const [centerLng, centerLat] = newCenter;

            const isCenterInsideBounds =
                centerLng >= leftBound &&
                centerLng <= rightBound &&
                centerLat >= bottomBound &&
                centerLat <= topBound;

            const dist = Math.max(
                Math.round(
                    getDistance(
                        { lat: centerLat, lng: leftBound },
                        { lat: centerLat, lng: rightBound }
                    ) / 1000
                ),
                1
            );

            if (!isCenterInsideBounds) {
                setDistance(dist);
                setCenter(newCenter);
                setBounds(visibleBounds);
            }
        } else {
            setBounds(visibleBounds);
            setCenter(newCenter);
        }
    };

    const { data: courses } = useQuery({
        queryKey: ["courses", courseType, center, distance],
        queryFn: () => {
            amplitude.track("main_screen_view", {
                course_search_radius:
                    distance * 1000 > 10000 ? 10000 : distance * 1000,
            });
            return getCourses({
                lat: center![1]!,
                lng: center![0]!,
                radiusM: distance * 1000 > 10000 ? 10000 : distance * 1000,
            });
        },
        placeholderData: keepPreviousData,
        enabled: !!center && !!distance,
    });

    // 선택된 코스가 포함되어있는 것을 보장하기 위해 병합
    const mergedCourses = useMemo(() => {
        if (!courses) return activeCourse ? [activeCourse] : [];
        const hasActive =
            activeCourse && courses.some((c) => c.id === activeCourse.id);
        if (hasActive) return courses;
        return activeCourse ? [activeCourse, ...courses] : courses;
    }, [courses, activeCourse]);

    // activeCourse가 변경되었을 때, 실제 코스 데이터에서 찾아서 업데이트
    useEffect(() => {
        if (!activeCourse || !courses) return;
        const canonicalCourse = courses.find((c) => c.id === activeCourse.id);
        if (canonicalCourse && canonicalCourse !== activeCourse) {
            setActiveCourse(canonicalCourse);
        }
    }, [activeCourse, courses]);

    useEffect(() => {
        if (firstRenderRef.current && courses) {
            firstRenderRef.current = false;
            setActiveCourse(courses[0]);
        }
    }, [courses]);

    useEffect(() => {
        Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
        }).then((location) => {
            setCenter([location.coords.longitude, location.coords.latitude]);
        });
    }, []);

    useEffect(() => {
        setShowListView(false);
        mapBottomSheetRef.current?.dismiss();
    }, [courseType, setShowListView, mapBottomSheetRef]);

    const listBottomSheetRef = useRef<BottomSheetModal>(null);

    const onClickCourseInfo = (course: CourseResponse) => {
        listBottomSheetRef.current?.collapse();
        onClickCourse(course);
        setShowListView(false);
        handlePresentModalPress();
    };

    return (
        <>
            <MapViewWrapper
                onZoomLevelChanged={onZoomLevelChanged}
                controlPannelPosition={controlPannelPosition}
                onRegionDidChange={onRegionDidChange}
                cameraRef={cameraRef}
                logoPosition={{ bottom: TAB_BAR_HEIGHT + 8, left: 10 }}
                attributionPosition={{ bottom: TAB_BAR_HEIGHT + 6, right: 0 }}
                onTap={() => {
                    devLog("onTap");
                    setActiveCourse(null);
                    mapBottomSheetRef.current?.dismiss();
                }}
            >
                {mergedCourses?.map((course) => (
                    <CourseMarkers
                        key={course.id}
                        course={course}
                        activeCourseId={activeCourse?.id ?? -1}
                        onClickCourse={onClickCourseInfo}
                        zoomLevel={zoomLevel}
                    />
                ))}
            </MapViewWrapper>
            <ActionButton
                type="text"
                text="러닝 시작"
                style={{
                    position: "absolute",
                    bottom: 149,
                    alignSelf: "center",
                }}
                onPress={async () => {
                    const ok = await requestOrAlert(
                        "SENSORS",
                        "러닝 중 측정을 위해 권한이 필요해요"
                    );

                    if (!ok) {
                        return;
                    } else {
                        router.push("/run/solo");
                    }

                    requestOptional("HEALTHKIT");
                    requestOptional("WATCH");
                }}
            />
            <StyledBottomSheet
                ref={listBottomSheetRef}
                bottomInset={bottom + 36}
                snapPoints={[64, 290, "66%"]}
                index={0}
                handleComponent={ListBottomSheetHandle}
            >
                <View style={{ height: 20 }} />
                <CourseListView
                    courses={mergedCourses ?? []}
                    selectedCourse={activeCourse}
                    onShowCourseInfo={onClickCourseInfo}
                    maxHeight={Dimensions.get("window").height - 500}
                />
                <View style={{ height: 10 }} />
            </StyledBottomSheet>
            <HomeBottomModal
                bottomSheetRef={mapBottomSheetRef}
                modalType={showListView ? "list" : courseType}
                activeCourse={activeCourse}
                courses={mergedCourses ?? []}
                onClickCourse={onClickCourse}
                onClickCourseInfo={onClickCourseInfo}
                backdropOpacity={0.1}
            />
        </>
    );
}

interface HomeBottomModalProps {
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    heightVal?: SharedValue<number>;
    modalType: "all" | "my" | "list";
    activeCourse: CourseResponse | null;
    courses: CourseResponse[];
    onClickCourse: (course: CourseResponse) => void;
    onClickCourseInfo: (course: CourseResponse) => void;
    onClose?: () => void;
    backdrop?: boolean;
    backdropOpacity?: number;
}

const HomeBottomModal = ({
    bottomSheetRef,
    heightVal = undefined,
    activeCourse,
    onClose = () => {},
    backdrop = true,
    backdropOpacity = 0.4,
}: HomeBottomModalProps) => {
    return (
        <BottomModal
            bottomSheetRef={bottomSheetRef}
            heightVal={heightVal}
            onDismiss={onClose}
            backdrop={backdrop}
            backdropOpacity={backdropOpacity}
        >
            <BottomCourseInfoModal
                bottomSheetRef={bottomSheetRef}
                course={activeCourse ?? null}
            />
        </BottomModal>
    );
};

const ListBottomSheetHandle = () => {
    const animatedIndex = useSharedValue(0);
    const animatedPosition = useSharedValue(0);
    return (
        <View style={{ alignItems: "center" }}>
            <BottomSheetHandle
                indicatorStyle={styles.handleIndicator}
                animatedIndex={animatedIndex}
                animatedPosition={animatedPosition}
            />
            <Typography variant="subhead1" color="gray40">
                목록
            </Typography>
        </View>
    );
};

const styles = StyleSheet.create({
    handleIndicator: {
        backgroundColor: colors.gray[40],
        width: 50,
        height: 5,
        borderRadius: 100,
    },
});
