import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { BottomModal, Typography } from "@/src/components/ui";
import { Step } from "./Onboarding";
import { screenGutter } from "@/src/design-system/tokens/layout";
import { spacing } from "@/src/design-system/tokens/spacing";

const steps: Step[] = [
    {
        title: "러닝 중 발걸음 리듬이 흐트러지지 않도록\n템포를 잡아 주는 기능이에요",
        image: require("@/assets/images/onboarding/cadence_assist_1.png"),
    },
];

interface CadenceAssistGuideProps {
    show: boolean;
    handleClose: () => void;
}

export const CadenceAssistGuide = ({
    show,
    handleClose,
}: CadenceAssistGuideProps) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    useEffect(() => {
        if (show) {
            bottomSheetRef.current?.present();
        } else {
            bottomSheetRef.current?.dismiss();
        }
    }, [show]);
    return (
        <BottomModal
            bottomSheetRef={bottomSheetRef}
            onDismiss={handleClose}
            backdropOpacity={0.2}
        >
            <View style={styles.container}>
                <Typography
                    variant="headline"
                    color="white"
                    style={{ textAlign: "center", marginBottom: spacing[8] }}
                >
                    {steps[0].title}
                </Typography>
                <Image
                    source={steps[0].image}
                    style={styles.image}
                    contentFit="cover"
                />
            </View>
        </BottomModal>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: spacing[16],
        alignItems: "center",
        paddingHorizontal: screenGutter,
        marginBottom: spacing[28],
    },
    image: {
        width: "100%",
        aspectRatio: 1.24,
    },
});
