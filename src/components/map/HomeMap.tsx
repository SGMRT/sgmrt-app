import { getCourses } from "@/src/apis";
import { CourseResponse } from "@/src/apis/types/course";
import { getDistance } from "@/src/utils/mapUtils";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Camera } from "@rnmapbox/maps";
import { Position } from "@rnmapbox/maps/lib/typescript/src/types/Position";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import { SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CourseListView from "../course/CourseListView";
import { ActionButton } from "../ui/ActionButton";
import BottomModal from "../ui/BottomModal";
import StyledBottomSheet from "../ui/StyledBottomSheet";
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
const CAMERA_LATITUDE_OFFSET = 0.0015;
const BOTTOM_BAR_HEIGHT = 104;
const TAB_BAR_HEIGHT = 82;

const CONTROL_PANEL_HEIGHT = 48;
const MARGIN_BOTTOM = 16;
const CONTROL_PANEL_OFFSET = CONTROL_PANEL_HEIGHT + MARGIN_BOTTOM;

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

    const handlePresentModalPress = () => {
        mapBottomSheetRef.current?.present();
    };

    const onClickCourse = (course: CourseResponse) => {
        setActiveCourse(course);
        cameraRef.current?.moveTo([
            course.startLng,
            course.startLat - CAMERA_LATITUDE_OFFSET,
        ]);
    };

    type VisibleBounds = {
        sw: Position;
        ne: Position;
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
                console.log("dist", dist);
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
            console.log("getCourses", center, distance);
            return getCourses({
                lat: center![1]!,
                lng: center![0]!,
                radiusM: distance * 1000,
            });
        },
        placeholderData: keepPreviousData,
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
                    bottom: 93,
                    alignSelf: "center",
                }}
                onPress={() => {
                    router.push("/run/solo");
                }}
            />
            <StyledBottomSheet
                ref={listBottomSheetRef}
                bottomInset={bottom + 36}
                snapPoints={[15, "32%", "48%", "66%"]}
                index={0}
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
}

const HomeBottomModal = ({
    bottomSheetRef,
    heightVal = undefined,
    activeCourse,
}: HomeBottomModalProps) => {
    return (
        <BottomModal bottomSheetRef={bottomSheetRef} heightVal={heightVal}>
            <BottomCourseInfoModal
                bottomSheetRef={bottomSheetRef}
                course={activeCourse ?? null}
            />
        </BottomModal>
    );
};
