import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { BottomModal, Typography } from "@/src/components/ui";
import { Step } from "./Onboarding";

const steps: Step[] = [
    {
        title: "러닝 중 보폭 리듬이 흔들리지 않도록\n템포를 유지해 주는 기능이에요",
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
                    style={{ textAlign: "center", marginBottom: 10 }}
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
        gap: 15,
        alignItems: "center",
        paddingHorizontal: 16.5,
        marginBottom: 30,
    },
    image: {
        width: "100%",
        aspectRatio: 1.24,
    },
});
