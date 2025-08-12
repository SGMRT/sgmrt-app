import { Telemetry } from "@/src/apis/types/run";
import {
    calculateZoomLevelFromSize,
    convertTelemetriesToCourse,
} from "@/src/utils/mapUtils";
import { StyleSheet, View } from "react-native";
import CourseLayer from "../map/CourseLayer";
import MapViewWrapper from "../map/MapViewWrapper";

interface ResultCorseMapProps {
    center: {
        latitude: number;
        longitude: number;
        size: number;
    };
    telemetries: Telemetry[];
}

export default function ResultCorseMap({
    center,
    telemetries,
}: ResultCorseMapProps) {
    return (
        <View style={styles.mapContainer}>
            <MapViewWrapper
                controlEnabled={false}
                showPuck={false}
                center={center}
                zoom={calculateZoomLevelFromSize(center.size, center.latitude)}
            >
                <CourseLayer
                    course={convertTelemetriesToCourse(telemetries ?? [])}
                    isActive={true}
                    onClickCourse={() => {}}
                />
            </MapViewWrapper>
        </View>
    );
}

const styles = StyleSheet.create({
    mapContainer: {
        height: 260,
        borderRadius: 20,
        overflow: "hidden",
    },
});
