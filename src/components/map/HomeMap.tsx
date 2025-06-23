import { Course } from "@/src/types/course";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef, useState } from "react";
import { Dimensions } from "react-native";
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CourseMarkers from "./CourseMarkers";
import MapViewWrapper from "./MapViewWrapper";
import BottomCourseInfoModal from "./courseInfo/BottomCourseInfoModal";

interface HomeMapProps {
    courses: Course[];
}

export default function HomeMap({ courses }: HomeMapProps) {
    const [activeCourse, setActiveCourse] = useState<number>(0);
    const [zoomLevel, setZoomLevel] = useState(16);
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const handlePresentModalPress = () => {
        bottomSheetRef.current?.present();
        console.log(bottomSheetRef.current);
    };
    const onClickCourse = (course: Course) => {
        setActiveCourse(course.id);
        handlePresentModalPress();
    };

    const onZoomLevelChanged = (currentZoomLevel: number) => {
        if (zoomLevel > 14.5 && currentZoomLevel <= 14.5) {
            setZoomLevel(currentZoomLevel);
            console.log("zoomLevel", zoomLevel);
        } else if (zoomLevel <= 14.5 && currentZoomLevel > 14.5) {
            setZoomLevel(currentZoomLevel);
            console.log("zoomLevel", zoomLevel);
        }
    };

    const heightVal = useSharedValue(0);
    const deviceHeight = Dimensions.get("window").height;
    const { bottom } = useSafeAreaInsets();

    const controlPannelPosition = useAnimatedStyle(() => {
        const baseHeight = deviceHeight - 64 - 56 - bottom;
        if (heightVal.value >= baseHeight) {
            return { top: baseHeight - 116 };
        } else {
            return {
                top: heightVal.value - 116,
            };
        }
    });

    return (
        <>
            <MapViewWrapper
                onZoomLevelChanged={onZoomLevelChanged}
                controlPannelPosition={controlPannelPosition}
            >
                {courses.map((course) => (
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
            />
        </>
    );
}
