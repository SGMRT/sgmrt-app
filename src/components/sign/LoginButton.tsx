import { Button, ButtonTheme } from "@/src/design-system/atoms/Button";

interface LoginButtonProps {
    text: string;
    /**
     * 어느 제휴사의 버튼인지.
     *
     * 예전에는 부르는 쪽이 면 색과 글자색을 직접 넘겼는데,
     * 로그인 화면에서 쓰는 색은 제휴사가 정해 둔 값이라 고를 여지가 없다.
     * 이름으로 받아 색은 디자인 시스템이 정한다.
     */
    provider: "kakao" | "apple";
    icon: React.ReactNode;
    disabled?: boolean;
    onPress: () => void;
}

const THEME: Record<LoginButtonProps["provider"], ButtonTheme> = {
    kakao: "kakao",
    apple: "ui02",
};

const LoginButton = ({
    text,
    provider,
    icon,
    disabled,
    onPress,
}: LoginButtonProps) => {
    return (
        <Button
            title={text}
            theme={THEME[provider]}
            size="large"
            leading={icon}
            onPress={onPress}
            disabled={disabled}
            block
        />
    );
};

export default LoginButton;
