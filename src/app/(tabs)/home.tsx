import {
    Camera,
    MapView,
    setTelemetryEnabled,
    StyleImport,
} from "@rnmapbox/maps";
import { useEffect } from "react";
import { View } from "react-native";

export default function Home() {
    useEffect(() => {
        setTelemetryEnabled(false);
    });
    return (
        <View style={{ flex: 1 }}>
            <MapView
                style={{ flex: 1 }}
                scaleBarEnabled={false}
                logoEnabled={false}
                styleURL="mapbox://styles/sgmrt/cmbx0w1xy002701sod2z821zr"
            >
                <StyleImport
                    id="basemap"
                    existing
                    config={{
                        theme: "monochrome",
                        lightPreset: "night",
                        showPlaceLabels: false,
                        showRoadLabels: false,
                        showPointOfInterestLabels: true,
                        showTransitLabels: true,
                        show3dObjects: true,
                    }}
                />
                <Camera
                    zoomLevel={16}
                    centerCoordinate={[128.593444283, 35.865496405]}
                    animationDuration={0}
                />
            </MapView>
        </View>
    );
}
