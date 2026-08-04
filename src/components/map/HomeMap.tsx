import { getCourses } from "@/src/apis";
import { CourseResponse } from "@/src/apis/types/course";
import { usePinnedCourses } from "@/src/features/pacemaker/hooks/usePinnedCourses";
import { useLocationInfoStore } from "@/src/store/locationInfo";
import { useAppPermissions } from "@/src/features/permission/useAppPermissions";
import { useAuthStore } from "@/src/store/authState";
import { devLog } from "@/src/utils/devLog";
import {
    calculateCenter,
    calculateZoomLevelFromSize,
    Coordinate,
    getDistance,
} from "@/src/utils/mapUtils";
import { trackAmplitude } from "@/src/utils/trackAmplitude";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Camera } from "@rnmapbox/maps";
import { Position } from "@rnmapbox/maps/lib/typescript/src/types/Position";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CourseListView from "../course/CourseListView";
import { ActionButton, StyledBottomSheet } from "@/src/components/ui";
import CourseMarkers from "./CourseMarkers";
import { REGION_DEFAULT_RADIUS_M, shouldAttachRegionId } from "./regionPolicy";
import MapViewWrapper from "./MapViewWrapper";
import { HomeBottomModal } from "./HomeBottomModal";
import { ListBottomSheetHandle } from "./ListBottomSheetHandle";

interface HomeMapProps {
    courseType: "all" | "my";
    showListView: boolean;
    setShowListView: (showListView: boolean) => void;
    mapBottomSheetRef: React.RefObject<BottomSheetModal | null>;
    refreshKey: number;
    onRefreshableChange?: (v: boolean) => void;
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
    refreshKey,
    onRefreshableChange,
}: HomeMapProps) {
    const { bottom } = useSafeAreaInsets();
    const deviceHeight = Dimensions.get("window").height;
    const router = useRouter();

    const [activeCourse, setActiveCourse] = useState<CourseResponse | null>(
        null
    );
    const [center, setCenter] = useState<Position | null>(null);
    const [distance, setDistance] = useState(5000);

    const lastRef = useRef({
        center: null as Position | null,
        distance: 5000,
    });
    const cameraRef = useRef<Camera>(null);
    const firstRenderRef = useRef(true);
    // 최초 진입 시의 사용자 GPS — regionId 첨부 판정(지도 중심 ≈ 사용자 위치) 기준점
    const userGpsRef = useRef<Coordinate | null>(null);

    const [zoomLevel, setZoomLevel] = useState(16);
    const { requestOptional, requestOrAlert } = useAppPermissions();
    const { uuid } = useAuthStore();

    const handlePresentModalPress = () => {
        mapBottomSheetRef.current?.present();
    };

    const onClickCourse = (course: CourseResponse) => {
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

    const controlPannelPosition = useAnimatedStyle(() => {
        const baseHeight = deviceHeight - BOTTOM_BAR_HEIGHT - bottom;
        return { top: baseHeight - CONTROL_PANEL_OFFSET };
    });

    const markRefreshable = useCallback(
        (v: boolean) => {
            onRefreshableChange?.(v);
        },
        [onRefreshableChange]
    );

    const onRegionDidChange = (event: any) => {
        if (!center) return;

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

        setDistance(radius);
        setCenter(newCenter);

        if (!lastRef.current.center) {
            lastRef.current.center = newCenter;
            lastRef.current.distance = radius;
            markRefreshable(true);
        } else if (
            getDistance(
                {
                    lat: lastRef.current.center[1]!,
                    lng: lastRef.current.center[0]!,
                },
                { lat: newCenter[1]!, lng: newCenter[0]! }
            ) > 500 ||
            Math.abs(lastRef.current.distance - radius) > 500
        ) {
            lastRef.current.center = newCenter;
            lastRef.current.distance = radius;
            markRefreshable(true);
        }
    };

    useEffect(() => {
        trackAmplitude("main_screen_view", {
            version: "v2",
        });
    }, []);

    const { data: courses } = useQuery({
        queryKey: ["courses", refreshKey],
        queryFn: async () => {
            markRefreshable(false);
            // 홈 기본 조회(지도 중심 ≈ 사용자 GPS)만 regionId를 첨부해 서버 지역 캐시를 탄다.
            // 이때 반경도 서버 캐시 고정값(2km)으로 보낸다 — 3km 초과 반경은 서버가 캐시를 우회한다.
            const { regionId } = useLocationInfoStore.getState();
            const attachRegionId = shouldAttachRegionId({
                regionId,
                mapCenter: { lat: center![1]!, lng: center![0]! },
                userGps: userGpsRef.current,
            });
            const courses = await getCourses({
                lat: center![1]!,
                lng: center![0]!,
                radiusM: attachRegionId ? REGION_DEFAULT_RADIUS_M : distance,
                ...(attachRegionId ? { regionId: regionId! } : {}),
            });
            trackAmplitude("gotten_courses_info", {
                lat: center![1]!,
                lng: center![0]!,
                distance: distance,
                courses_count: courses.length,
            });
            return courses;
        },
        placeholderData: keepPreviousData,
        enabled: !!center && !!distance,
    });

    const { mergedCourses, isLoading: isPinnedCoursesLoading } =
        usePinnedCourses({ baseCourses: courses ?? [] });

    // activeCourse가 변경되었을 때, 실제 코스 데이터에서 찾아서 업데이트
    useEffect(() => {
        if (!activeCourse || !mergedCourses) return;
        const canonicalCourse = mergedCourses.find(
            (c) => c.id === activeCourse.id
        );
        if (canonicalCourse && canonicalCourse !== activeCourse) {
            setActiveCourse(canonicalCourse);
        }
    }, [activeCourse, mergedCourses]);

    useEffect(() => {
        if (firstRenderRef.current && mergedCourses) {
            firstRenderRef.current = false;
            setActiveCourse(mergedCourses[0]);
        }
    }, [mergedCourses]);

    const initializeCenter = useCallback(() => {
        if (center) return;
        try {
            Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.BestForNavigation,
            }).then((location) => {
                userGpsRef.current = {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                };
                setCenter([
                    location.coords.longitude,
                    location.coords.latitude,
                ]);
            });
        } catch (error) {
            onRefreshableChange?.(true);
            devLog("위치 정보 조회 실패", error);
        }
    }, [center, onRefreshableChange]);

    useEffect(() => {
        initializeCenter();
    }, [initializeCenter]);

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

    if (isPinnedCoursesLoading) {
        return <></>;
    }

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
