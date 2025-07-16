import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { SharedValue } from "react-native-reanimated";
import BottomModal from "../../ui/BottomModal";
import ExpendHeader from "../../ui/ExpendHeader";
import SlideToAction from "../../ui/SlideToAction";
import CoursesInfoList from "./CoursesInfoList";

interface BottomMyCourseModalProps {
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    canClose?: boolean;
    heightVal: SharedValue<number>;
}

export default function BottomMyCourseModal({
    bottomSheetRef,
    canClose = true,
    heightVal,
}: BottomMyCourseModalProps) {
    const router = useRouter();

    useEffect(() => {
        bottomSheetRef.current?.present();
        console.log("bottomSheetRef: ", bottomSheetRef.current);
    }, [bottomSheetRef]);

    return (
        <BottomModal
            bottomSheetRef={bottomSheetRef}
            canClose={canClose}
            heightVal={heightVal}
        >
            <ExpendHeader
                title={"최신 공개 코스"}
                titleColor="gray40"
                marginHorizontal={true}
                onPress={() => {
                    console.log("press");
                    bottomSheetRef.current?.dismiss();
                    router.push("/course");
                }}
            />
            <CoursesInfoList />
            <SlideToAction
                label={"이 코스로 러닝 시작"}
                onSlideSuccess={() => {
                    console.log("slide success");
                    bottomSheetRef.current?.dismiss();
                }}
                color="green"
                direction="left"
            />
        </BottomModal>
    );
}

const styles = StyleSheet.create({});
