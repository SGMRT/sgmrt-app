import { DefaultProfileIcon } from "@/assets/icons/icons";
import { signUp } from "@/src/apis";
import BottomAgreementButton from "@/src/components/sign/BottomAgreementButton";
import BottomModal from "@/src/components/ui/BottomModal";
import Header from "@/src/components/ui/Header";
import InfoItem, { InfoFieldTitle } from "@/src/components/ui/InfoItem";
import SlideToAction from "@/src/components/ui/SlideToAction";
import { StyledButton } from "@/src/components/ui/StyledButton";
import { Typography } from "@/src/components/ui/Typography";
import { useAuthStore } from "@/src/store/authState";
import { useSignupStore } from "@/src/store/signupStore";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { getAuth } from "@react-native-firebase/auth";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import { Confetti, ConfettiMethods } from "react-native-fast-confetti";
import Toast from "react-native-toast-message";

export default function Profile() {
    const {
        nickname,
        profileImageUrl,
        gender,
        height,
        weight,
        setNickname,
        setProfileImageUrl,
        setGender,
        setHeight,
        setWeight,
        getSignupData,
    } = useSignupStore();

    const [image, setImage] = useState<string | null>(null);
    const { login, setUserInfo } = useAuthStore();
    const router = useRouter();
    const { height: windowHeight, width: windowWidth } = useWindowDimensions();

    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const confettiRef = useRef<ConfettiMethods | null>(null);
    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
            selectionLimit: 1,
        });

        console.log(result);

        if (!result.canceled) {
            const manipulated = await ImageManipulator.manipulateAsync(
                result.assets[0].uri,
                [],
                { format: ImageManipulator.SaveFormat.PNG }
            );
            setImage(manipulated.uri);
        }
    };

    // 특수문자 검사 regex
    const specialCharacterRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

    const isActive =
        nickname !== null &&
        gender !== null &&
        gender !== "" &&
        nickname.length > 0 &&
        !specialCharacterRegex.test(nickname);

    const handleSubmit = async () => {
        const data = getSignupData();
        data.agreement.agreedAt = new Date().toISOString();
        const idToken = await getAuth().currentUser?.getIdToken();
        if (!idToken) {
            Toast.show({
                type: "info",
                text1: "로그인에 실패했습니다.",
            });
            router.dismissAll();
            router.replace("/login");
            return;
        }
        signUp({
            ...data,
            idToken: idToken,
        })
            .then((res) => {
                console.log(res);
                login(res.accessToken, res.refreshToken, res.uuid);
                setUserInfo({
                    username: nickname,
                    height: height,
                    weight: weight,
                    gender: gender,
                });

                bottomSheetRef.current?.present();
                confettiRef.current?.restart();
            })
            .catch((err) => {
                console.log(err);
                Toast.show({
                    type: "info",
                    text1: "가입에 실패했습니다.",
                });
                router.dismissAll();
                router.replace("/login");
            });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1 }}>
                <Header titleText="기본 정보 입력" />
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollViewContentContainer}
                >
                    <Typography variant="headline" color="white">
                        더 나은 러닝 경험을 위해{"\n"}
                        회원 정보를 입력해 주세요
                    </Typography>
                    {/* 프로필 이미지 */}
                    <View style={styles.profileContainer}>
                        <Image
                            source={image ? { uri: image } : DefaultProfileIcon}
                            style={styles.profileImage}
                        />
                        <StyledButton
                            title="프로필 이미지 등록"
                            onPress={pickImage}
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
                                신체 스펙 입력시 더 정확한 데이터를 제공해 드릴
                                수 있습니다
                            </Typography>
                        </View>
                    </View>
                </ScrollView>
            </View>
            <BottomAgreementButton
                isActive={isActive}
                canPress={isActive}
                onPress={() => {
                    handleSubmit();
                }}
                title="가입완료"
            />

            <Confetti
                ref={confettiRef}
                fallDuration={4000}
                count={100}
                colors={["#d9d9d9", "#e2ff00", "#ffffff"]}
                flakeSize={{ width: 12, height: 8 }}
                fadeOutOnEnd={true}
                cannonsPositions={[
                    { x: windowWidth / 2, y: windowHeight - 200 },
                    { x: windowWidth / 2, y: windowHeight - 200 },
                ]}
                blastDuration={800}
                autoplay={false}
            />

            <BottomModal bottomSheetRef={bottomSheetRef}>
                <View
                    style={{
                        alignItems: "center",
                        gap: 4,
                        paddingVertical: 20,
                    }}
                >
                    <Typography
                        variant="headline"
                        color="white"
                        style={{ textAlign: "center" }}
                    >
                        반가워요 {nickname}님!{"\n"}
                        고스트러너 가입을 환영해요
                    </Typography>
                    <Typography variant="body2" color="gray40">
                        내 정보는 마이페이지의 회원 정보에서 변경 가능합니다
                    </Typography>
                </View>
                <SlideToAction
                    label="밀어서 메인으로"
                    onSlideSuccess={() => {
                        router.dismissAll();
                        router.replace("/intro");
                    }}
                    color="green"
                    direction="left"
                />
            </BottomModal>
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
    },
});
