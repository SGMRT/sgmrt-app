import { ChevronIcon } from "@/assets/svgs/svgs";
import { CheckRow } from "@/src/design-system/molecules/CheckRow";
import { darkTheme } from "@/src/design-system/themes/dark";

interface AgreeItemProps {
    title: string;
    isAgreed: boolean;
    onPressAgree: () => void;
    onPressDetail: () => void;
}

/** 개별 약관 한 줄. 체크 마크 + 제목 + 상세 보기 화살표 */
const AgreeItem = ({
    title,
    isAgreed,
    onPressAgree,
    onPressDetail,
}: AgreeItemProps) => {
    return (
        <CheckRow
            control="check"
            label={title}
            checked={isAgreed}
            onToggle={onPressAgree}
            trailing={<ChevronIcon color={darkTheme.ui05} />}
            onPressTrailing={onPressDetail}
        />
    );
};

export default AgreeItem;
