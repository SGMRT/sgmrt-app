import { getCourses } from "@/src/apis";
import { CourseResponse } from "@/src/apis/types/course";
import { getDistance } from "@/src/utils/mapUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { MapView } from "@rnmapbox/maps";
import { Position } from "@rnmapbox/maps/lib/typescript/src/types/Position";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Dimensions } from "react-native";
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomCourseInfoModal from "./courseInfo/BottomCourseInfoModal";
import CourseMarkers from "./CourseMarkers";
import MapViewWrapper from "./MapViewWrapper";

export default function HomeMap() {
    const [activeCourse, setActiveCourse] = useState<number>(0);
    const [zoomLevel, setZoomLevel] = useState(16);
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const handlePresentModalPress = () => {
        bottomSheetRef.current?.present();
    };
    const onClickCourse = (course: CourseResponse) => {
        setActiveCourse(course.id);
        handlePresentModalPress();
    };
    const [bounds, setBounds] = useState<Position[]>([]);
    const [center, setCenter] = useState<Position>([0, 0]);
    const [distance, setDistance] = useState(1);
    const mapRef = useRef<MapView>(null);

    const onZoomLevelChanged = (currentZoomLevel: number) => {
        if (zoomLevel > 14.5 && currentZoomLevel <= 14.5) {
            setZoomLevel(currentZoomLevel);
        } else if (zoomLevel <= 14.5 && currentZoomLevel > 14.5) {
            setZoomLevel(currentZoomLevel);
        }
    };

    useEffect(() => {
        if (mapRef.current) {
            setTimeout(() => {
                mapRef.current?.getCenter().then((center) => {
                    setCenter(center);
                });
            }, 1000);
        }
    }, []);

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
        }
    };

    const { data: courses } = useQuery({
        queryKey: ["courses", center[0], center[1], distance],
        queryFn: () =>
            getCourses({
                lat: center[1],
                lng: center[0],
                radiusKm: distance,
            }),
        enabled: center[0] !== 0 || center[1] !== 0,
    });

    return (
        <>
            <MapViewWrapper
                onZoomLevelChanged={onZoomLevelChanged}
                controlPannelPosition={controlPannelPosition}
                onRegionDidChange={onRegionDidChange}
                ref={mapRef}
            >
                {courses?.map((course) => (
                    <CourseMarkers
                        key={course.id}
                        course={course}
                        activeCourse={activeCourse}
                        onClickCourse={onClickCourse}
                        zoomLevel={zoomLevel}
                    />
                ))}
            </MapViewWrapper>
            <BottomCourseInfoModal
                bottomSheetRef={bottomSheetRef}
                heightVal={heightVal}
                course={courses?.find((course) => course.id === activeCourse)}
            />
        </>
    );
}
