import { getCourses } from "@/src/apis";
import { CourseResponse } from "@/src/apis/types/course";
import { useAppPermissions } from "@/src/features/permission/useAppPermissions";
import { useAuthStore } from "@/src/store/authState";
import colors from "@/src/theme/colors";
import {
    calculateCenter,
    calculateZoomLevelFromSize,
    Coordinate,
    getDistance,
} from "@/src/utils/mapUtils";
import { trackAmplitude } from "@/src/utils/trackAmplitude";
import { BottomSheetHandle, BottomSheetModal } from "@gorhom/bottom-sheet";
import { Camera } from "@rnmapbox/maps";
import { Position } from "@rnmapbox/maps/lib/typescript/src/types/Position";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
import BottomCourseInfoModal from "./courseInfo/BottomCourseInfoModal/BottomCourseInfoModal";
import CourseMarkers from "./CourseMarkers";
import MapViewWrapper from "./MapViewWrapper";

interface HomeMapProps {
    courseType: "all" | "my";
    showListView: boolean;
    setShowListView: (showListView: boolean) => void;
    mapBottomSheetRef: React.RefObject<BottomSheetModal | null>;
}

const ZOOM_THRESHOLD = 14.5;
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
    const updateMapRef = useRef(true);

    const handlePresentModalPress = () => {
        mapBottomSheetRef.current?.present();
    };

    const onClickCourse = (course: CourseResponse) => {
        updateMapRef.current = false;
        setActiveCourse(course);

        trackAmplitude("course_detail_view", {
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
            center.latitude
        );

        cameraRef.current?.setCamera({
            centerCoordinate: [center.longitude, center.latitude],
            zoomLevel: zoomLevel,
            padding: {
                paddingTop: 0,
                paddingBottom: 200,
                paddingLeft: 0,
                paddingRight: 0,
            },
        });
    };

    const [center, setCenter] = useState<Position | null>(null);
    const [distance, setDistance] = useState(5000);

    const lastRef = useRef({
        center: null as Position | null,
        distance: 5000,
    });

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
        if (!updateMapRef.current) return;

        const newCenter: Position = event.properties.center;
        const visibleBounds: VisibleBounds = event.properties.bounds;

        const [centerLng, centerLat] = newCenter;
        const { sw, ne } = visibleBounds;

        const horiz = getDistance(
            { lat: centerLat, lng: sw[0] },
            { lat: centerLat, lng: ne[0] }
        );

        const vert = getDistance(
            { lat: sw[1], lng: centerLng },
            { lat: ne[1], lng: centerLng }
        );

        const minSide = Math.min(horiz, vert);
        const radius = Math.min(Math.round(minSide / 2), 10000);

        if (!lastRef.current.center) {
            setDistance(radius);
            setCenter(newCenter);
            lastRef.current.center = newCenter;
            lastRef.current.distance = radius;
        } else if (
            getDistance(
                {
                    lat: lastRef.current.center[1]!,
                    lng: lastRef.current.center[0]!,
                },
                { lat: newCenter[1]!, lng: newCenter[0]! }
            ) > 1000
        ) {
            setDistance(radius);
            setCenter(newCenter);
            lastRef.current.center = newCenter;
            lastRef.current.distance = radius;
        }
    };

    const { data: courses } = useQuery({
        queryKey: ["courses", courseType, center, distance],
        queryFn: () => {
            trackAmplitude("main_screen_view", {
                course_search_radius: distance,
            });
            return getCourses({
                lat: center![1]!,
                lng: center![0]!,
                radiusM: distance,
            });
        },
        placeholderData: keepPreviousData,
        enabled: !!center && !!distance,
    });

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
                    setActiveCourse(null);
                    mapBottomSheetRef.current?.dismiss();
                    updateMapRef.current = true;
                }}
            >
                {courses?.map((course) => (
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
                    const hk = await requestOptional("HEALTHKIT");

                    const ok = await requestOrAlert(
                        "SENSORS",
                        "러닝 중 측정을 위해 권한이 필요해요"
                    );

                    if (!ok) {
                        return;
                    } else {
                        router.push("/run/solo");
                    }
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
                    courses={courses ?? []}
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
                courses={courses ?? []}
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
