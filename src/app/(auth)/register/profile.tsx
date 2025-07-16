import { DefaultProfileIcon } from "@/assets/icons/icons";
import { signUp } from "@/src/apis";
import BottomAgreementButton from "@/src/components/sign/BottomAgreementButton";
import Header from "@/src/components/ui/Header";
import { Typography, TypographyColor } from "@/src/components/ui/Typography";
import { useAuthStore } from "@/src/store/authState";
import { useSignupStore } from "@/src/store/signupStore";
import colors from "@/src/theme/colors";
import { getAuth } from "@react-native-firebase/auth";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Image,
    KeyboardType,
    SafeAreaView,
    ScrollView,
    StyleProp,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
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
    const { login } = useAuthStore();
    const router = useRouter();

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
                router.push("/intro");
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
                        <Button
                            title="프로필 이미지 등록"
                            onPress={pickImage}
                            style={{ width: 178 }}
                        />
                    </View>
                    <View style={{ gap: 20 }}>
                        {/* 닉네임 */}
                        <View>
                            <InfoFieldTitle title="닉네임" required />
                            <InfoField
                                placeholder="특수문자 제외 최대 10자"
                                maxLength={10}
                                value={nickname}
                                onChangeText={setNickname}
                            />
                        </View>
                        {/* 성별 */}
                        <View>
                            <InfoFieldTitle title="성별" required />
                            <View style={styles.genderButtonContainer}>
                                <Button
                                    title="여성"
                                    onPress={() => {
                                        setGender("FEMALE");
                                    }}
                                    style={styles.genderButton}
                                    active={gender === "FEMALE"}
                                    activeTextColor="primary"
                                />
                                <Button
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
                        <View>
                            <InfoFieldTitle title="신장" />
                            <InfoField
                                placeholder="소숫점 제외 입력 (예: 172)"
                                keyboardType="numeric"
                                maxLength={3}
                                unit="cm"
                                value={height?.toString()}
                                onChangeText={(text) => {
                                    setHeight(Number(text));
                                }}
                            />
                        </View>
                        {/* 몸무게 */}
                        <View>
                            <InfoFieldTitle title="몸무게" />
                            <InfoField
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
                onPress={handleSubmit}
                title="가입완료"
            />
        </SafeAreaView>
    );
}

interface InfoFieldTitleProps {
    title: string;
    required?: boolean;
}

const InfoFieldTitle = ({ title, required }: InfoFieldTitleProps) => {
    return (
        <View
            style={{
                flexDirection: "row",
            }}
        >
            <Typography variant="subhead2" color="white">
                {title}
            </Typography>
            {required && (
                <Typography variant="subhead2" color="red">
                    *
                </Typography>
            )}
        </View>
    );
};

interface InfoFieldProps {
    placeholder?: string;
    unit?: string;
    keyboardType?: KeyboardType;
    maxLength?: number;
    value?: string | null;
    onChangeText?: (text: string) => void;
}

const InfoField = ({
    placeholder,
    value,
    keyboardType,
    maxLength,
    unit,
    onChangeText,
}: InfoFieldProps) => {
    return (
        <View style={styles.infoField}>
            <TextInput
                style={styles.infoFieldInput}
                placeholderTextColor={colors.gray[60]}
                placeholder={placeholder}
                keyboardType={keyboardType}
                maxLength={maxLength ?? undefined}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                value={value ?? undefined}
                onChangeText={onChangeText}
            />
            {unit && (
                <Typography variant="body1" color="gray60">
                    {unit}
                </Typography>
            )}
        </View>
    );
};

interface ButtonProps {
    title: string;
    style?: StyleProp<ViewStyle>;
    active?: boolean;
    activeTextColor?: TypographyColor;
    inactiveTextColor?: TypographyColor;
    onPress: () => void;
}

const Button = ({
    title,
    style,
    active,
    activeTextColor = "gray40",
    inactiveTextColor = "gray40",
    onPress,
}: ButtonProps) => {
    return (
        <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
            <Typography
                variant="caption1"
                color={active ? activeTextColor : inactiveTextColor}
            >
                {title}
            </Typography>
        </TouchableOpacity>
    );
};

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
    button: {
        paddingVertical: 8,
        borderColor: colors.gray[80],
        borderWidth: 1,
        backgroundColor: "#171717",
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    infoFieldInput: {
        color: colors.gray[20],
        fontSize: 16,
        fontFamily: "SpoqaHanSansNeo-Regular",
    },
    infoField: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 6,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#212121",
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
