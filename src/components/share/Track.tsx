import { Telemetry } from "@/src/apis/types/run";
import { useMemo } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import Svg, { Polyline } from "react-native-svg";

type Props = {
    data: Telemetry[];
    width: number;
    height: number;
    padding?: number; // px
    strokeWidth?: number; // px
    stroke?: string; // color
    style?: StyleProp<ViewStyle>;
};

/**
 * lat/lng → 화면 좌표로 정규화
 * - 바운딩박스 기준 스케일
 * - padding 적용, 중앙 정렬
 * - 위쪽이 북쪽처럼 보이도록 lat는 y축 반전
 */
function normalizePoints(
    data: Telemetry[],
    width: number,
    height: number,
    padding: number
) {
    const lats = data.map((d) => d.lat);
    const lngs = data.map((d) => d.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const geoW = Math.max(1e-9, maxLng - minLng);
    const geoH = Math.max(1e-9, maxLat - minLat);

    const drawW = Math.max(0, width - padding * 2);
    const drawH = Math.max(0, height - padding * 2);

    // 동일 비율로 맞춰서 letterboxing (중앙 정렬)
    const scale = Math.min(drawW / geoW, drawH / geoH);

    // 실제 그려질 영역 크기
    const scaledW = geoW * scale;
    const scaledH = geoH * scale;

    // 중앙 정렬 오프셋
    const offsetX = (width - scaledW) / 2;
    const offsetY = (height - scaledH) / 2;

    // 경로점 변환
    const points = data.map((d) => {
        const x = (d.lng - minLng) * scale + offsetX;
        // y는 lat를 반전시켜 위가 북쪽처럼 보이게
        const y = (maxLat - d.lat) * scale + offsetY;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    return points.join(" ");
}

function Track({
    data,
    width,
    height,
    padding = 12,
    strokeWidth = 4,
    stroke = "#E2FF00",
    style,
}: Props) {
    const points = useMemo(() => {
        if (!data?.length) return "";
        return normalizePoints(data, width, height, padding);
    }, [data, width, height, padding]);

    if (!data?.length) return null;

    return (
        <View
            pointerEvents="none" // 터치 통과
            style={[{ width, height, backgroundColor: "transparent" }, style]}
        >
            <Svg width={width} height={height}>
                <Polyline
                    points={points}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </Svg>
        </View>
    );
}

export default Track;
