import { getCourses } from "@/src/apis";
import { CourseResponse } from "@/src/apis/types/course";
import { useAuthStore } from "@/src/store/authState";
import { getDistance } from "@/src/utils/mapUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Camera } from "@rnmapbox/maps";
import { Position } from "@rnmapbox/maps/lib/typescript/src/types/Position";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dimensions } from "react-native";
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomModal from "../ui/BottomModal";
import BottomCourseInfoModal from "./courseInfo/BottomCourseInfoModal";
import BottomMyCourseModal from "./courseInfo/BottomMyCourseModal";
import CourseMarkers from "./CourseMarkers";
import MapViewWrapper from "./MapViewWrapper";

interface HomeMapProps {
    courseType: "all" | "my";
}

const ZOOM_THRESHOLD = 14.5;
const CAMERA_LATITUDE_OFFSET = -0.0003;
const BOTTOM_BAR_HEIGHT = 64;
const BOTTOM_NAV_HEIGHT = 56;
const CONTROL_PANEL_OFFSET = 116;

export default function HomeMap({ courseType }: HomeMapProps) {
    const [activeCourse, setActiveCourse] = useState<CourseResponse | null>(
        null
    );
    const [zoomLevel, setZoomLevel] = useState(16);
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const handlePresentModalPress = () => {
        bottomSheetRef.current?.present();
    };

    const onClickCourse = (course: CourseResponse) => {
        setActiveCourse(course);
        handlePresentModalPress();
        cameraRef.current?.moveTo([
            course.startLng,
            course.startLat - CAMERA_LATITUDE_OFFSET,
        ]);
    };

    const [bounds, setBounds] = useState<Position[]>([]);
    const [center, setCenter] = useState<Position | null>(null);
    const [distance, setDistance] = useState(10);
    const cameraRef = useRef<Camera>(null);
    const { uuid } = useAuthStore();

    const onZoomLevelChanged = (currentZoomLevel: number) => {
        const isHighZoom = zoomLevel > ZOOM_THRESHOLD;
        const isCurrentHighZoom = currentZoomLevel > ZOOM_THRESHOLD;

        // 줌 레벨의 '상태' (고배율/저배율)가 변경되었을 때만 업데이트
        if (isHighZoom !== isCurrentHighZoom) {
            setZoomLevel(currentZoomLevel);
        }
    };

    const heightVal = useSharedValue(0);
    const deviceHeight = Dimensions.get("window").height;
    const { bottom } = useSafeAreaInsets();

    const controlPannelPosition = useAnimatedStyle(() => {
        const baseHeight =
            deviceHeight - BOTTOM_BAR_HEIGHT - BOTTOM_NAV_HEIGHT - bottom;
        if (heightVal.value === 0) {
            return { top: baseHeight - CONTROL_PANEL_OFFSET };
        }
        if (heightVal.value >= baseHeight) {
            return { top: baseHeight - CONTROL_PANEL_OFFSET };
        } else {
            return {
                top: heightVal.value - CONTROL_PANEL_OFFSET,
            };
        }
    });

    const onRegionDidChange = (event: any) => {
        const newCenter = event.geometry.coordinates;
        const visibleBounds = event.properties.visibleBounds;

        if (bounds.length === 0) {
            setBounds(visibleBounds);
        } else {
            const [[lng1, lat1], [lng2, lat2]] = bounds;

            const leftBound = Math.min(lng1, lng2);
            const rightBound = Math.max(lng1, lng2);
            const bottomBound = Math.min(lat1, lat2);
            const topBound = Math.max(lat1, lat2);

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

            setDistance(dist);

            if (!isCenterInsideBounds) {
                setBounds(visibleBounds);
                setCenter(newCenter);
            }
        }
    };

    const { data: courses } = useQuery({
        queryKey: ["courses", courseType, center, distance],
        queryFn: () => {
            console.log("dididid");
            return getCourses({
                lat: center![1]!,
                lng: center![0]!,
                radiusM: distance * 1000,
                ownerUuid: courseType === "my" ? uuid ?? "" : undefined,
            });
        },
        enabled: !!center && !!distance,
    });

    useEffect(() => {
        Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
        }).then((location) => {
            setCenter([location.coords.longitude, location.coords.latitude]);
        });
    }, []);

    useEffect(() => {
        if (courseType === "my") {
            bottomSheetRef.current?.present();
        }
    }, [courseType]);

    const sortedCourses = useMemo(() => {
        if (!courses) return [];
        // activeCourse를 배열의 맨 뒤로 보내서 가장 마지막에 (즉, 가장 위에) 렌더링되도록 정렬
        return [...courses].sort((a, b) => {
            if (a.id === activeCourse?.id) return 1;
            if (b.id === activeCourse?.id) return -1;
            return 0;
        });
    }, [courses, activeCourse]);

    if (!center) return null;

    return (
        <>
            <MapViewWrapper
                onZoomLevelChanged={onZoomLevelChanged}
                controlPannelPosition={controlPannelPosition}
                onRegionDidChange={onRegionDidChange}
                cameraRef={cameraRef}
            >
                {/* active Course가 가장 먼저 표시되도록 정렬 */}
                {sortedCourses.map((course) => (
                    <CourseMarkers
                        key={course.id}
                        course={course}
                        activeCourseId={activeCourse?.id ?? -1}
                        onClickCourse={onClickCourse}
                        zoomLevel={zoomLevel}
                    />
                ))}
            </MapViewWrapper>
            <BottomModal bottomSheetRef={bottomSheetRef} heightVal={heightVal}>
                {courseType === "all" ? (
                    <BottomCourseInfoModal
                        bottomSheetRef={bottomSheetRef}
                        courseId={activeCourse?.id ?? -1}
                    />
                ) : (
                    <BottomMyCourseModal
                        bottomSheetRef={bottomSheetRef}
                        courses={courses ?? []}
                        onClickCourse={onClickCourse}
                    />
                )}
            </BottomModal>
        </>
    );
}
