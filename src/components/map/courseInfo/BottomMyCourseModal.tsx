import { CourseResponse } from "@/src/apis/types/course";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
    courses: CourseResponse[];
    onClickCourse: (course: CourseResponse) => void;
}

export default function BottomMyCourseModal({
    bottomSheetRef,
    canClose = true,
    heightVal,
    courses,
    onClickCourse,
}: BottomMyCourseModalProps) {
    const [selectedCourse, setSelectedCourse] = useState<CourseResponse | null>(
        null
    );
    const router = useRouter();

    useEffect(() => {
        bottomSheetRef.current?.present();
    }, [bottomSheetRef]);

    useEffect(() => {
        if (courses && courses.length > 0) {
            setSelectedCourse(courses[0]);
        }
    }, [courses]);

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
                    bottomSheetRef.current?.dismiss();
                    router.push("/course");
                }}
            />
            <CoursesInfoList
                courses={courses}
                selectedCourse={selectedCourse}
                setSelectedCourse={setSelectedCourse}
                onClickCourse={onClickCourse}
            />
            <SlideToAction
                label={"이 코스로 러닝 시작"}
                onSlideSuccess={() => {
                    bottomSheetRef.current?.dismiss();
                    router.push(`/run/${selectedCourse?.id}/-1`);
                }}
                color="green"
                direction="left"
            />
        </BottomModal>
    );
}

const styles = StyleSheet.create({});
