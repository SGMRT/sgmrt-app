import { GetUserInfoResponse } from "@/src/apis/types/user";
import { Typography } from "@/src/components/ui";
import { Avatar } from "@/src/design-system/atoms/Avatar";
import { spacing } from "@/src/design-system/tokens/spacing";
import { StyleSheet, View } from "react-native";
import { sectionPadding } from "@/src/design-system/tokens/layout";
import { Divider } from "@/src/design-system/atoms/Divider";

interface ProfileCardProps {
    userInfo: GetUserInfoResponse | null;
    loading?: boolean;
}

export const ProfileCard = ({ userInfo, loading }: ProfileCardProps) => {
    const userProfileImageUrl =
        userInfo?.profilePictureUrl?.split("?X-Amz-")[0];

    return (
        <View style={styles.profileContent}>
            {/* 회원 정보 등록 화면과 같은 Avatar 를 쓴다.
                예전에는 사진이 없을 때 PNG 한 장을 얹어 색을 바꿀 수 없었다. */}
            <Avatar
                source={
                    userProfileImageUrl ? { uri: userProfileImageUrl } : null
                }
                diameter={60}
            />
            <View>
                <Typography variant="headline" color="gray20">
                    {loading ? "" : userInfo?.nickname ?? "고스트러너"}
                </Typography>
                <View style={styles.profileInfo}>
                    <Typography variant="body2" color="gray40">
                        {loading
                            ? ""
                            : userInfo?.height
                            ? `${userInfo.height}cm`
                            : "키 비공개"}
                    </Typography>

                    <Divider />
                    <Typography variant="body2" color="gray40">
                        {loading
                            ? ""
                            : userInfo?.weight
                            ? `${userInfo.weight}kg`
                            : "몸무게 비공개"}
                    </Typography>

                    <Divider />
                    <Typography variant="body2" color="gray40">
                        {loading
                            ? ""
                            : userInfo?.gender === "MALE"
                            ? "남성"
                            : userInfo?.gender === "FEMALE"
                            ? "여성"
                            : "성별 비공개"}
                    </Typography>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // 면도 모서리도 없는 영역이다. 아래 여백만 제가 갖는다.
    // 감싸는 쪽이 gap 으로 주면 이 값이 화면마다 달라진다.
    profileContent: {
        flexDirection: "row",
        gap: spacing[16],
        alignItems: "center",
        paddingBottom: sectionPadding,
    },
    profileInfo: {
        flexDirection: "row",
        gap: spacing[12],
        alignItems: "center",
    },
});
