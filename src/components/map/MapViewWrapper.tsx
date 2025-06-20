import { Puck } from "@/assets/svgs/svgs";
import { Course } from "@/src/types/course";
import {
    Camera,
    Image,
    Images,
    LocationPuck,
    MapView,
    StyleImport,
    UserLocation,
    UserTrackingMode,
    Viewport,
} from "@rnmapbox/maps";
import { useState } from "react";
import { View } from "react-native";
import ControlPannel from "./ControlPannel";
import CourseMarkers from "./CourseMarkers";

interface MapViewWrapperProps {
    children?: React.ReactNode;
    getLocationInfo: (location: {
        longitude: number;
        latitude: number;
    }) => void;
    courses: Course[];
    handlePresentModalPress: () => void;
}

export default function MapViewWrapper({
    children,
    getLocationInfo,
    courses,
    handlePresentModalPress,
}: MapViewWrapperProps) {
    const [isFollowing, setIsFollowing] = useState(true);
    const [followUserMode, setFollowUserMode] = useState(
        UserTrackingMode.Follow
    );
    const [activeCourse, setActiveCourse] = useState<number>(0);

    const onStatusChanged = (status: any) => {
        if (status.to.kind === "idle") {
            setIsFollowing(false);
            setFollowUserMode(UserTrackingMode.Follow);
        }
    };

    const onClickCourse = (course: Course) => {
        setActiveCourse(course.id);
        handlePresentModalPress();
    };

    const onClickCompass = () => {
        if (!isFollowing) {
            onClickLocateMe();
        }
        setFollowUserMode(
            followUserMode === UserTrackingMode.Follow
                ? UserTrackingMode.FollowWithHeading
                : UserTrackingMode.Follow
        );
    };

    const onClickLocateMe = () => {
        setIsFollowing(!isFollowing);
    };

    return (
        <View style={{ flex: 1 }}>
            <MapView
                style={{ flex: 1 }}
                scaleBarEnabled={false}
                logoEnabled={false}
                attributionPosition={{ bottom: 20, left: 20 }}
                attributionEnabled={false}
                styleURL="mapbox://styles/sgmrt/cmbx0w1xy002701sod2z821zr"
            >
                <Images>
                    <Image name="puck">
                        <Puck />
                    </Image>
                </Images>
                <StyleImport
                    id="basemap"
                    config={{
                        theme: "monochrome",
                        lightPreset: "night",
                        showPlaceLabels: false,
                        showRoadLabels: false,
                        showPointOfInterestLabels: true,
                        showTransitLabels: true,
                        show3dObjects: true,
                    }}
                    existing={true}
                />
                <Camera
                    minZoomLevel={14}
                    maxZoomLevel={18}
                    followZoomLevel={16}
                    animationDuration={0}
                    followUserLocation={isFollowing}
                    followUserMode={followUserMode}
                />
                <Viewport onStatusChanged={onStatusChanged} />
                <LocationPuck visible={true} topImage="puck" />
                <UserLocation
                    visible={false}
                    onUpdate={(location) => {
                        getLocationInfo({
                            longitude: location.coords.longitude,
                            latitude: location.coords.latitude,
                        });
                    }}
                />
                {courses.map((course) => (
                    <CourseMarkers
                        key={course.id}
                        course={course}
                        activeCourse={activeCourse}
                        onClickCourse={onClickCourse}
                    />
                ))}
                {children}
            </MapView>
            <ControlPannel
                onClickCompass={onClickCompass}
                onClickLocateMe={onClickLocateMe}
            />
        </View>
    );
}
