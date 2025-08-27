import { useEffect, useState } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import {
    NativeAd,
    NativeAdChoicesPlacement,
    NativeAdView,
    NativeAsset,
    NativeAssetType,
    NativeMediaAspectRatio,
    TestIds,
} from "react-native-google-mobile-ads";

type Props = { style?: ViewStyle };
const AD_UNIT_ID = __DEV__ ? TestIds.NATIVE : "ca-app-pub-xxxxxxxx/xxxxxxxx"; // ← 운영용 교체

export default function CompactNativeAdRow({ style }: Props) {
    const [ad, setAd] = useState<NativeAd | null>(null);

    useEffect(() => {
        let active = true;
        NativeAd.createForAdRequest(AD_UNIT_ID, {
            aspectRatio: NativeMediaAspectRatio.LANDSCAPE,
            adChoicesPlacement: NativeAdChoicesPlacement.TOP_RIGHT,
            startVideoMuted: true,
        })
            .then((a) => active && setAd(a))
            .catch(console.error);
        return () => {
            active = false;
            ad?.destroy?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!ad) return null;

    return (
        <NativeAdView nativeAd={ad} style={[styles.container, style]}>
            {/* AD 배지 (자산 아님) */}
            <View style={styles.badge}>
                <Text style={styles.badgeText}>AD</Text>
            </View>

            {/* 텍스트 라인 */}
            <View style={styles.textLine}>
                {ad.advertiser ? (
                    <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                        <Text numberOfLines={1} style={styles.advertiser}>
                            {ad.advertiser}
                        </Text>
                    </NativeAsset>
                ) : null}
                {ad.advertiser ? <Text style={styles.sep}>: </Text> : null}
                <NativeAsset assetType={NativeAssetType.HEADLINE}>
                    <Text numberOfLines={1} style={styles.headline}>
                        {ad.headline}
                    </Text>
                </NativeAsset>
            </View>
        </NativeAdView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingLeft: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    badge: {
        width: 28,
        height: 18,
        borderRadius: 9,
        backgroundColor: "#28323B",
        alignItems: "center",
        justifyContent: "center",
    },
    badgeText: { color: "#C7D1DA" },
    textLine: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 32,
    },
    advertiser: {
        color: "#FFFFFF",
        justifyContent: "center",
        alignItems: "center",
    },
    sep: { color: "#9AA0A6" },
    headline: { color: "#C9CED6" },
});
