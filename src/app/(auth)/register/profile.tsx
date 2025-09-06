import { DefaultProfileIcon } from "@/assets/icons/icons";
import { getPresignedUrl, signUp, uploadToS3 } from "@/src/apis";
import BottomAgreementButton from "@/src/components/sign/BottomAgreementButton";
import Header from "@/src/components/ui/Header";
import InfoItem, { InfoFieldTitle } from "@/src/components/ui/InfoItem";
import { StyledButton } from "@/src/components/ui/StyledButton";
import { Typography } from "@/src/components/ui/Typography";
import { useAuthStore } from "@/src/store/authState";
import { useSignupStore } from "@/src/store/signupStore";
import { pickImage } from "@/src/utils/pickImage";
import * as amplitude from "@amplitude/analytics-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "@react-native-firebase/auth";
import * as ImageManipulator from "expo-image-manipulator";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import Toast from "react-native-toast-message";

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
    const { login, setUserInfo } = useAuthStore();
    const router = useRouter();

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
            Toast.show({
                type: "info",
                text1: "로그인에 실패했습니다.",
                position: "bottom",
            });
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
                Toast.show({
                    type: "info",
                    text1: "회원가입 오류. 다시 시도해주세요.",
                    position: "bottom",
                });
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
                amplitude.track("Sign Up", {
                    provider: "email",
                    nickname: nickname,
                    gender: gender,
                    age: age,
                    height: height,
                    weight: weight,
                });
                setUserInfo({
                    username: nickname,
                    gender: gender,
                    age: age,
                    height: height,
                    weight: weight,
                });
                login(res.accessToken, res.refreshToken, res.uuid);
            })
            .catch((err) => {
                console.log(err);
                Toast.show({
                    type: "info",
                    text1: "회원가입 오류. 다시 시도해주세요.",
                    position: "bottom",
                });
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
                            <Image
                                source={
                                    image
                                        ? { uri: image.uri }
                                        : DefaultProfileIcon
                                }
                                style={styles.profileImage}
                            />
                            <StyledButton
                                title="프로필 이미지 등록"
                                onPress={onPickImage}
                                style={{ width: 178 }}
                            />
                        </View>
                        <View style={{ gap: 20 }}>
                            {/* 닉네임 */}
                            <InfoItem
                                title="닉네임"
                                placeholder="특수문자 제외 최대 10자"
                                maxLength={10}
                                value={nickname}
                                onChangeText={setNickname}
                                required
                            />
                            {/* 성별 */}
                            <View>
                                <InfoFieldTitle title="성별" required />
                                <View style={styles.genderButtonContainer}>
                                    <StyledButton
                                        title="여성"
                                        onPress={() => {
                                            setGender("FEMALE");
                                        }}
                                        style={styles.genderButton}
                                        active={gender === "FEMALE"}
                                        activeTextColor="primary"
                                    />
                                    <StyledButton
                                        title="남성"
                                        onPress={() => {
                                            setGender("MALE");
                                        }}
                                        style={styles.genderButton}
                                        active={gender === "MALE"}
                                        activeTextColor="primary"
                                    />
                                </View>
                            </View>
                            {/* 연령 */}
                            <InfoItem
                                title="연령"
                                placeholder="숫자 입력 (예: 20)"
                                keyboardType="numeric"
                                maxLength={3}
                                unit="세"
                                value={age?.toString()}
                                onChangeText={(text) => {
                                    setAge(Number(text));
                                }}
                                required
                            />
                            {/* 신장 */}
                            <InfoItem
                                title="신장"
                                placeholder="소숫점 제외 입력 (예: 172)"
                                keyboardType="numeric"
                                maxLength={3}
                                unit="cm"
                                value={height?.toString()}
                                onChangeText={(text) => {
                                    setHeight(Number(text));
                                }}
                            />
                            {/* 몸무게 */}
                            <View>
                                <InfoItem
                                    title="몸무게"
                                    placeholder="소숫점 제외 입력 (예: 60)"
                                    keyboardType="numeric"
                                    maxLength={3}
                                    unit="kg"
                                    value={weight?.toString()}
                                    onChangeText={(text) => {
                                        setWeight(Number(text));
                                    }}
                                />
                                <Typography
                                    variant="caption1"
                                    color="gray60"
                                    style={{ paddingTop: 10 }}
                                >
                                    신체 스펙 입력시 더 정확한 데이터를 제공해
                                    드릴 수 있습니다
                                </Typography>
                            </View>
                        </View>
                    </ScrollView>
                </View>

                <BottomAgreementButton
                    isActive={isActive}
                    canPress={isActive}
                    onPress={() => {
                        Alert.alert(
                            "회원가입",
                            "회원가입을 진행하시겠습니까?",
                            [
                                {
                                    text: "확인",
                                    onPress: () => {
                                        handleSubmit();
                                    },
                                },
                                {
                                    text: "취소",
                                    style: "cancel",
                                },
                            ]
                        );
                    }}
                    title="가입 완료"
                    topStroke
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContentContainer: {
        paddingHorizontal: 17,
        marginTop: 20,
        paddingBottom: 30,
    },
    profileContainer: {
        marginTop: 28,
        marginBottom: 18,
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
        gap: 4,
        paddingVertical: 3,
    },
    genderButton: {
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
});
