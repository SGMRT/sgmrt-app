import colors from "@/src/theme/colors";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import {
    AdsConsent,
    AdsConsentStatus,
    NativeAd,
    NativeAdChoicesPlacement,
    NativeAdView,
    NativeAsset,
    NativeAssetType,
    NativeMediaAspectRatio,
    TestIds,
} from "react-native-google-mobile-ads";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Typography } from "../ui/Typography";

type Props = { style?: ViewStyle };
const AD_UNIT_ID = __DEV__
    ? TestIds.NATIVE
    : Platform.OS === "ios"
    ? process.env.EXPO_PUBLIC_AD_IOS_NATIVE_BANNER_KEY || ""
    : process.env.EXPO_PUBLIC_AD_ANDROID_NATIVE_BANNER_KEY || "";

export default function CompactNativeAdRow({ style }: Props) {
    const [ad, setAd] = useState<NativeAd | null>(null);
    const { bottom } = useSafeAreaInsets();

    useEffect(() => {
        let active = true;
        let creactedAd: NativeAd | null = null;

        if (!AD_UNIT_ID) return;

        AdsConsent.getConsentInfo().then((info) => {
            const npa = info.status !== AdsConsentStatus.OBTAINED;

            NativeAd.createForAdRequest(AD_UNIT_ID, {
                aspectRatio: NativeMediaAspectRatio.LANDSCAPE,
                adChoicesPlacement: NativeAdChoicesPlacement.TOP_RIGHT,
                startVideoMuted: true,
                requestNonPersonalizedAdsOnly: npa,
            })
                .then((a) => {
                    if (!active) {
                        a.destroy?.();
                        return;
                    }
                    creactedAd = a;
                    setAd(a);
                })
                .catch((e) => {
                    if (!active) return;
                    console.error(e);
                });
        });

        return () => {
            active = false;
            creactedAd?.destroy?.();
        };
    }, []);

    if (!ad) return <View style={{ height: 32 + bottom, marginTop: -10 }} />;

    return (
        <NativeAdView
            nativeAd={ad}
            style={[styles.container, style, { marginBottom: bottom }]}
        >
            {/* AD 배지 (자산 아님) */}
            <View style={styles.badge}>
                <Typography variant="advertiser" color="white">
                    AD
                </Typography>
            </View>

            {/* 이미지 */}
            {ad.icon?.url && (
                <NativeAsset assetType={NativeAssetType.ICON}>
                    <Image source={{ uri: ad.icon?.url }} style={styles.icon} />
                </NativeAsset>
            )}

            {/* 텍스트 라인 */}
            <View style={styles.textLine}>
                {ad.advertiser ? (
                    <NativeAsset assetType={NativeAssetType.ADVERTISER}>
                        <Typography
                            variant="advertiser"
                            color="white"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {ad.advertiser}
                            {": "}
                        </Typography>
                    </NativeAsset>
                ) : null}
                <NativeAsset assetType={NativeAssetType.HEADLINE}>
                    <Typography
                        variant="caption1"
                        color="gray20"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {ad.headline}
                    </Typography>
                </NativeAsset>
            </View>

            {/* CTA */}
            <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                <Typography
                    variant="caption1"
                    color="black"
                    numberOfLines={1}
                    style={styles.cta}
                >
                    {ad.callToAction}
                </Typography>
            </NativeAsset>
        </NativeAdView>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: -10,
        marginLeft: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    badge: {
        width: 28,
        height: 18,
        borderRadius: 9,
        backgroundColor: "#28323B",
        alignItems: "center",
        justifyContent: "center",
    },
    textLine: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 32,
        overflow: "hidden",
        flex: 1,
        flexShrink: 1,
    },
    cta: {
        flexShrink: 0,
        marginLeft: "auto",
        backgroundColor: colors.gray[60],
        paddingHorizontal: 4,
        borderRadius: 8,
        marginRight: 18,
    },
    icon: {
        width: 20,
        height: 20,
        borderRadius: 4,
    },
});
