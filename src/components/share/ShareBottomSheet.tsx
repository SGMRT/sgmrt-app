import {
    ShareDefault,
    ShareLogo,
    ShareRecord,
    ShareSimple,
    ShareVideo,
} from "@/assets/icons/icons";
import { ShareVariantWithVideo } from "@/src/app/(tabs)/stats/result/[runningId]/[courseId]/[ghostRunningId]";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
    Dimensions,
    ImageSourcePropType,
    ScrollView,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomModal, Button, Section, Typography } from "@/src/components/ui";

const types = [
    { title: "기본", asset: ShareDefault, variant: "default" },
    { title: "영상", asset: ShareVideo, variant: "video" },
    { title: "기록투명", asset: ShareRecord, variant: "record" },
    { title: "로고투명", asset: ShareLogo, variant: "logo" },
    { title: "심플투명", asset: ShareSimple, variant: "simple" },
];

interface ShareBottomSheetProps {
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    selected: ShareVariantWithVideo;
    onSelect: (variant: ShareVariantWithVideo) => void;
    onShare: () => Promise<void>;
}

export const ShareBottomSheet = ({
    bottomSheetRef,
    selected,
    onSelect,
    onShare,
}: ShareBottomSheetProps) => {
    const { bottom } = useSafeAreaInsets();
    const maxHeight = Dimensions.get("window").height - 250;

    const handlePress = (index: number) => {
        onSelect(types[index].variant as ShareVariantWithVideo);
    };

    return (
        <BottomModal
            bottomInset={bottom}
            backdrop
            backdropOpacity={0.1}
            canClose
            bottomSheetRef={bottomSheetRef}
        >
            <Section
                title="공유 방식"
                titleColor="white"
                titleVariant="subhead1"
                containerStyle={{
                    backgroundColor: "transparent",
                    gap: 10,
                }}
                centerTitle
            >
                <ScrollView
                    style={{ flex: 1, height: maxHeight - 230 }}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                >
                    <View
                        style={{
                            flex: 1,
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 10,
                        }}
                    >
                        {types.map((item, index) => (
                            <ShareCard
                                key={item.title}
                                title={item.title}
                                asset={item.asset}
                                onPress={() => handlePress(index)}
                                selected={selected === item.variant}
                            />
                        ))}
                    </View>
                </ScrollView>
                <BlurView
                    intensity={0}
                    style={{
                        height: 205,
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                    }}
                    pointerEvents="none"
                >
                    <LinearGradient
                        colors={[
                            "rgba(17, 17, 17, 0)",
                            "rgba(17, 17, 17, 0)",
                            "rgba(17, 17, 17, 1)",
                        ]}
                        style={{ flex: 1 }}
                    />
                </BlurView>
            </Section>
            <Button type="active" title="공유하기" onPress={onShare} />
        </BottomModal>
    );
};

const ShareCard = ({
    title,
    asset,
    onPress,
    selected,
}: {
    title: string;
    asset: ImageSourcePropType;
    onPress: () => void;
    selected: boolean;
}) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={{
                backgroundColor: "#171717",
                flexBasis: "48.5%",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
                overflow: "hidden",
            }}
        >
            <Image
                source={asset}
                contentFit="contain"
                style={{
                    width: "100%",
                    height: 260,
                }}
            />
            <Typography
                variant="subhead2"
                color={selected ? "primary" : "gray40"}
                style={{ marginTop: 10, marginBottom: 16 }}
            >
                {title}
            </Typography>
        </TouchableOpacity>
    );
};
