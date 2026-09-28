import { DefaultProfileIcon } from "@/assets/icons/icons";
import { getPresignedUrl, signUp, uploadToS3 } from "@/src/apis";
import { queryKeys } from "@/src/apis/queryKeys";
import { GetUserInfoResponse } from "@/src/apis/types/user";
import BottomAgreementButton from "@/src/components/sign/BottomAgreementButton";
import { Header, InfoFieldTitle, InfoItem, StyledButton, Typography, showToast } from "@/src/components/ui";
import { Avatar } from "@/src/design-system/atoms/Avatar";
import { Button } from "@/src/design-system/atoms/Button";
import { FieldLabel } from "@/src/design-system/atoms/FieldLabel";
import { Input } from "@/src/design-system/atoms/Input";
import { useAuthStore } from "@/src/store/authState";
import { useSignupStore } from "@/src/store/signupStore";
import { pickImage } from "@/src/utils/pickImage";
import { trackAmplitude } from "@/src/utils/trackAmplitude";
import * as amplitude from "@amplitude/analytics-react-native";
import { useQueryClient } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "@react-native-firebase/auth";
import * as ImageManipulator from "expo-image-manipulator";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Profile() {
    const {
        nickname,
        gender,
        height,
        weight,
        age,
        setNickname,
        setGender,
        setHeight,
        setWeight,
        setAge,
        getSignupData,
    } = useSignupStore();

    const [image, setImage] = useState<ImageManipulator.ImageResult | null>(
        null
    );
    const { login } = useAuthStore();
    const queryClient = useQueryClient();
    const router = useRouter();
    const { bottom } = useSafeAreaInsets();
    const [res, setRes] = useState<any>(null);

    const onPickImage = async () => {
        const image = await pickImage();
        if (image) {
            setImage(image);
        }
    };
    const [isRegistering, setIsRegistering] = useState(false);

    // 특수문자 검사 regex
    const specialCharacterRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    // 숫자만 입력 가능 regex
    const numberOnlyRegex = /^[0-9]*$/;

    // 입력한 값이 규칙을 어겼는지. 비어 있을 때는 아직 나무라지 않는다
    const nicknameError =
        !!nickname && nickname.length > 0 && specialCharacterRegex.test(nickname);
    const ageError =
        !!age && age.toString().length > 0 && !numberOnlyRegex.test(age.toString());

    const isActive =
        nickname !== null &&
        gender !== null &&
        gender !== "" &&
        age !== null &&
        nickname.length > 0 &&
        numberOnlyRegex.test(age.toString()) &&
        !specialCharacterRegex.test(nickname) &&
        (height === null ||
            (numberOnlyRegex.test(height.toString()) && height > 0)) &&
        (weight === null ||
            (numberOnlyRegex.test(weight.toString()) && weight > 0));

    const handleSubmit = async () => {
        if (isRegistering) return;
        setIsRegistering(true);
        Keyboard.dismiss();
        const data = getSignupData();
        data.agreement.agreedAt = new Date().toISOString();
        const idToken = await getAuth().currentUser?.getIdToken();
        if (!idToken) {
            showToast("info", "로그인에 실패했습니다.", bottom);
            router.dismissAll();
            router.replace("/login");
            return;
        }
        if (image) {
            const imageUrl = await getPresignedUrl({
                type: "MEMBER_PROFILE",
                fileName: image.uri.split("/").at(-1) ?? "",
            });
            const uploadResult = await uploadToS3(
                image.uri,
                imageUrl.presignUrl
            );

            if (uploadResult) {
                data.profileImageUrl = imageUrl.presignUrl.split("?X-Amz-")[0];
            } else {
                showToast("info", "회원가입 오류. 다시 시도해주세요.", bottom);
                return;
            }
        }
        signUp({
            ...data,
            idToken: idToken,
        })
            .then(async (res) => {
                setRes(res);
                await AsyncStorage.setItem("welcome", "true");
                // signup_complete
                trackAmplitude("Sign Up", {
                    provider: "email",
                    age: age,
                    gender: gender,
                    height: height,
                    nickname: nickname,
                    weight: weight,
                });
                // React Query 캐시에 사용자 정보 저장
                const userInfoResponse: GetUserInfoResponse = {
                    uuid: res.uuid,
                    nickname: nickname ?? "",
                    profilePictureUrl: data.profileImageUrl ?? "",
                    gender: gender as "MALE" | "FEMALE",
                    weight: weight,
                    height: height,
                    age: age,
                    pushAlarmEnabled: true,
                    vibrationEnabled: true,
                    voiceGuidanceEnabled: true,
                };
                queryClient.setQueryData<GetUserInfoResponse>(
                    queryKeys.user.info(),
                    userInfoResponse
                );
                login(res.accessToken, res.refreshToken, res.uuid);

                // Firebase UID를 User ID로 사용 (login.tsx와 통일)
                const firebaseUid = getAuth().currentUser?.uid;
                if (firebaseUid) {
                    amplitude.setUserId(firebaseUid);
                }
                // User Property 설정
                amplitude.identify(
                    new amplitude.Identify()
                        .set("server_uuid", res.uuid)
                        .set("provider", "email")
                        .set("age", age ?? 0)
                        .set("gender", gender)
                        .set("height", height ?? 0)
                        .set("weight", weight ?? 0)
                        .set("nickname", nickname)
                );
            })
            .then(() => {
                router.replace("/(tabs)/home");
            })
            .catch((err) => {
                if (err.response.status === 409) {
                    if (err.response.data.code === "M-003") {
                        showToast("info", "이미 존재하는 닉네임입니다", bottom);
                    } else {
                        showToast("info", "이미 존재하는 회원입니다", bottom);
                    }
                } else {
                    showToast(
                        "info",
                        "오류가 발생했습니다. 다시 시도해주세요",
                        bottom
                    );
                }
                setIsRegistering(false);
            });
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={{ flex: 1 }}>
                    <Header titleText="기본 정보 입력" />
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={
                            styles.scrollViewContentContainer
                        }
                    >
                        <Typography variant="headline" color="white">
                            더 나은 러닝 경험을 위해{"\n"}
                            회원 정보를 입력해 주세요
                        </Typography>
                        {/* 프로필 이미지 */}
                        <View style={styles.profileContainer}>
                            <Avatar
                                source={image ? { uri: image.uri } : null}
                                diameter={90}
                            />
                            <Button
                                title="프로필 이미지 등록"
                                onPress={onPickImage}
                                size="medium"
                                variant="line"
                            />
                        </View>
                        <View style={{ gap: 20 }}>
                            {/* 닉네임 — 디자인 시스템 Input 시험 적용 */}
                            <Input
                                label="닉네임"
                                required
                                labelPosition="outside"
                                placeholder="특수문자 제외 최대 10자"
                                maxLength={10}
                                value={nickname}
                                onChangeText={setNickname}
                                counter
                                error={nicknameError}
                                message={
                                    nicknameError
                                        ? "특수문자는 사용할 수 없습니다"
                                        : undefined
                                }
                            />
                            {/* 성별 */}
                            <View>
                                <FieldLabel label="성별" required />
                                <View style={styles.genderButtonContainer}>
                                    <Button
                                        title="여성"
                                        onPress={() => setGender("FEMALE")}
                                        size="large"
                                        theme="ui01"
                                        selected={gender === "FEMALE"}
                                        style={styles.genderButton}
                                    />
                                    <Button
                                        title="남성"
                                        onPress={() => setGender("MALE")}
                                        size="large"
                                        theme="ui01"
                                        selected={gender === "MALE"}
                                        style={styles.genderButton}
                                    />
                                </View>
                            </View>
                            {/* 연령 */}
                            <Input
                                label="연령"
                                required
                                labelPosition="outside"
                                placeholder="숫자 입력 (예: 20)"
                                keyboardType="numeric"
                                maxLength={3}
                                unit="세"
                                value={age?.toString()}
                                onChangeText={(text) => {
                                    setAge(text ? Number(text) : null);
                                }}
                                error={ageError}
                                message={
                                    ageError ? "숫자만 입력해 주세요" : undefined
                                }
                            />
                            {/* 신장 — 라벨 바깥 변형 */}
                            <Input
                                label="신장"
                                labelPosition="outside"
                                placeholder="소숫점 제외 입력 (예: 172)"
                                keyboardType="numeric"
                                maxLength={3}
                                unit="cm"
                                value={height?.toString()}
                                onChangeText={(text) => {
                                    setHeight(text ? Number(text) : null);
                                }}
                            />
                            {/* 몸무게 */}
                            <View>
                                <Input
                                    label="몸무게"
                                    labelPosition="outside"
                                    placeholder="소숫점 제외 입력 (예: 60)"
                                    keyboardType="numeric"
                                    maxLength={3}
                                    unit="kg"
                                    value={weight?.toString()}
                                    onChangeText={(text) => {
                                        setWeight(text ? Number(text) : null);
                                    }}
                                />
                                <Typography
                                    variant="caption1"
                                    color="gray60"
                                    style={{ paddingTop: 12 }}
                                >
                                    신체 스펙 입력시 더 정확한 데이터를 제공해
                                    드릴 수 있습니다
                                </Typography>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
            <BottomAgreementButton
                isActive={isActive}
                canPress={isActive}
                onPress={handleSubmit}
                title="가입 완료"
                topStroke
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#141414",
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContentContainer: {
        paddingHorizontal: 16,
        marginTop: 20,
        paddingBottom: 32,
    },
    profileContainer: {
        marginTop: 28,
        marginBottom: 16,
        gap: 16,
        alignItems: "center",
    },
    profileImage: {
        width: 90,
        height: 90,
        borderRadius: 100,
    },

    genderButtonContainer: {
        flexDirection: "row",
        gap: 8,
    },
    // Button 이 크기를 직접 들고 있으므로 여기서는 폭만 나눈다
    genderButton: {
        flex: 1,
    },
});
