import { CourseResponse } from "@/src/apis/types/course";
import { BottomModal } from "@/src/components/ui";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { SharedValue } from "react-native-reanimated";
import BottomCourseInfoModal from "./courseInfo/BottomCourseInfoModal/BottomCourseInfoModal";

interface HomeBottomModalProps {
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    heightVal?: SharedValue<number>;
    modalType: "all" | "my" | "list";
    activeCourse: CourseResponse | null;
    courses: CourseResponse[];
    onClickCourse: (course: CourseResponse) => void;
    onClickCourseInfo: (course: CourseResponse) => void;
    onClose?: () => void;
    backdrop?: boolean;
    backdropOpacity?: number;
}

export const HomeBottomModal = ({
    bottomSheetRef,
    heightVal = undefined,
    activeCourse,
    onClose = () => {},
    backdrop = true,
    backdropOpacity = 0.4,
}: HomeBottomModalProps) => {
    return (
        <BottomModal
            bottomSheetRef={bottomSheetRef}
            heightVal={heightVal}
            onDismiss={onClose}
            backdrop={backdrop}
            backdropOpacity={backdropOpacity}
        >
            <BottomCourseInfoModal
                bottomSheetRef={bottomSheetRef}
                course={activeCourse ?? null}
            />
        </BottomModal>
    );
};
