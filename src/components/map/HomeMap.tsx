import { getCourses } from "@/src/apis";
import { CourseResponse } from "@/src/apis/types/course";
import { useAuthStore } from "@/src/store/authState";
import { getDistance } from "@/src/utils/mapUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Camera } from "@rnmapbox/maps";
import { Position } from "@rnmapbox/maps/lib/typescript/src/types/Position";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { Dimensions } from "react-native";
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomCourseInfoModal from "./courseInfo/BottomCourseInfoModal";
import BottomMyCourseModal from "./courseInfo/BottomMyCourseModal";
import CourseMarkers from "./CourseMarkers";
import MapViewWrapper from "./MapViewWrapper";

interface HomeMapProps {
    courseType: "all" | "my";
}

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
        console.log("course: ", course);
        setActiveCourse(course);
        handlePresentModalPress();
        cameraRef.current?.moveTo([course.startLng, course.startLat - 0.0008]);
    };

    const [bounds, setBounds] = useState<Position[]>([]);
    const [center, setCenter] = useState<Position>([0, 0]);
    const [distance, setDistance] = useState(10);
    const cameraRef = useRef<Camera>(null);
    const { uuid } = useAuthStore();

    const onZoomLevelChanged = (currentZoomLevel: number) => {
        if (zoomLevel > 14.5 && currentZoomLevel <= 14.5) {
            setZoomLevel(currentZoomLevel);
        } else if (zoomLevel <= 14.5 && currentZoomLevel > 14.5) {
            setZoomLevel(currentZoomLevel);
        }
    };

    const heightVal = useSharedValue(0);
    const deviceHeight = Dimensions.get("window").height;
    const { bottom } = useSafeAreaInsets();

    const controlPannelPosition = useAnimatedStyle(() => {
        const baseHeight = deviceHeight - 64 - 56 - bottom;
        if (heightVal.value === 0) {
            return { top: baseHeight - 116 }; // 최초 위치 고정
        }
        if (heightVal.value >= baseHeight) {
            return { top: baseHeight - 116 };
        } else {
            return {
                top: heightVal.value - 116,
            };
        }
    });

    const onRegionDidChange = (event: any) => {
        const center = event.geometry.coordinates; // [lng, lat]
        const visibleBounds = event.properties.visibleBounds;

        if (bounds.length === 0) {
            setBounds(visibleBounds);
        } else {
            const [[lng1, lat1], [lng2, lat2]] = bounds;

            const leftBound = Math.min(lng1, lng2);
            const rightBound = Math.max(lng1, lng2);
            const bottomBound = Math.min(lat1, lat2);
            const topBound = Math.max(lat1, lat2);

            const [centerLng, centerLat] = center;

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
            }

            refetch();
        }
    };

    const { data: courses, refetch } = useQuery({
        queryKey: ["courses", courseType, center, distance],
        queryFn: () => {
            return getCourses({
                lat: center[1],
                lng: center[0],
                radiusM: distance * 1000,
                ownerId: courseType === "my" ? uuid ?? "" : undefined,
            });
        },
        enabled: !!center[0] && !!center[1] && !!distance,
    });

    useEffect(() => {
        Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
        }).then((location) => {
            setCenter([location.coords.longitude, location.coords.latitude]);
            refetch();
        });
    }, [refetch]);

    return (
        <>
            <MapViewWrapper
                onZoomLevelChanged={onZoomLevelChanged}
                controlPannelPosition={controlPannelPosition}
                onRegionDidChange={onRegionDidChange}
                cameraRef={cameraRef}
            >
                {/* active Course가 가장 먼저 표시되도록 정렬 */}
                {courses
                    ?.filter((course) => course.id !== activeCourse?.id)
                    .map((course) => (
                        <CourseMarkers
                            key={course.id}
                            course={course}
                            activeCourseId={activeCourse?.id ?? -1}
                            onClickCourse={onClickCourse}
                            zoomLevel={zoomLevel}
                        />
                    ))}
                {activeCourse && (
                    <CourseMarkers
                        key={activeCourse.id}
                        course={activeCourse}
                        activeCourseId={activeCourse.id}
                        onClickCourse={onClickCourse}
                        zoomLevel={zoomLevel}
                    />
                )}
            </MapViewWrapper>
            {courseType === "all" ? (
                <BottomCourseInfoModal
                    bottomSheetRef={bottomSheetRef}
                    heightVal={heightVal}
                    courseId={activeCourse?.id ?? -1}
                />
            ) : (
                courses &&
                courses.length > 0 && (
                    <BottomMyCourseModal
                        bottomSheetRef={bottomSheetRef}
                        heightVal={heightVal}
                        courses={courses ?? []}
                        onClickCourse={onClickCourse}
                    />
                )
            )}
        </>
    );
}
