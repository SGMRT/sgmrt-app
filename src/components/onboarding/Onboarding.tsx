import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useMemo, useRef, useState } from "react";
import {
    FlatList,
    Modal,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../ui/Button";
import { Typography } from "../ui/Typography";
import { DotProgress } from "./DotProgress";

interface OnboardingProps {
    showOnboarding: boolean;
    setShowOnboarding: (showOnboarding: boolean) => void;
}

type Step = {
    title: string;
    image: any;
    subTitle?: string;
};

const steps: Step[] = [
    {
        title: `내 주변 코스를 탐색하고\n러닝 후 나만의 코스도 등록해 보세요`,
        image: require("@/assets/images/onboarding/onboarding_1.png"),
    },
    {
        title: `어떤 코스가 제일 인기 있을까?\n목록을 열어 확인해 보세요`,
        image: require("@/assets/images/onboarding/onboarding_2.png"),
    },
    {
        title: "코스별 내 최고 기록이 고스트로 남아요\n고스트와 달려 나를 넘어보세요",
        image: require("@/assets/images/onboarding/onboarding_3.png"),
    },
    {
        title: "고스트와 나는 색으로 구분돼요\n작은 숫자는 내 과거 기록과의 차이에요",
        image: require("@/assets/images/onboarding/onboarding_4.png"),
    },
    {
        title: "모든 준비가 끝났어요\n어제의 나를 뛰어넘을 준비가 되셨나요?",
        subTitle: "내 정보는 마이페이지의 회원 정보에서 변경 가능해요",
        image: require("@/assets/images/onboarding/onboarding_5.png"),
    },
];

const PAGE_H_PADDING = 16.5 * 2;

export const Onboarding = ({
    showOnboarding,
    setShowOnboarding,
}: OnboardingProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const listRef = useRef<FlatList<Step>>(null);
    const { width: windowWidth } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const PAGE_WIDTH = useMemo(() => Math.max(0, windowWidth), [windowWidth]);

    const handlePress = () => {
        if (currentIndex === steps.length - 1) {
            AsyncStorage.setItem("onboarding", "false");
            setShowOnboarding(false);
        } else {
            const next = currentIndex + 1;
            listRef.current?.scrollToIndex({ index: next, animated: true });
            setCurrentIndex(next);
        }
    };

    const onDotPress = (index: number) => {
        listRef.current?.scrollToIndex({ index, animated: true });
        setCurrentIndex(index);
    };

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 60,
    }).current;
    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index != null) {
                setCurrentIndex(viewableItems[0].index!); // ← 스크롤 중에도 즉시 dot 갱신
            }
        }
    ).current;

    return (
        <Modal
            visible={showOnboarding}
            transparent
            animationType="slide"
            style={styles.modal}
        >
            <View style={styles.container}>
                <View
                    style={[
                        styles.contentContainer,
                        { paddingBottom: Math.max(12, insets.bottom) },
                    ]}
                >
                    <FlatList
                        ref={listRef}
                        data={steps}
                        keyExtractor={(item) => item.title}
                        horizontal
                        decelerationRate="fast"
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        disableIntervalMomentum
                        getItemLayout={(_, index) => ({
                            length: PAGE_WIDTH,
                            offset: PAGE_WIDTH * index,
                            index,
                        })}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                        style={{ width: PAGE_WIDTH }}
                        renderItem={({ item }) => (
                            <View
                                style={[
                                    styles.content,
                                    {
                                        width: PAGE_WIDTH,
                                        paddingHorizontal: PAGE_H_PADDING / 2,
                                    },
                                ]}
                            >
                                <View style={styles.titleContainer}>
                                    <Typography
                                        variant="headline"
                                        color="white"
                                        style={styles.title}
                                    >
                                        {item.title}
                                    </Typography>
                                    <Typography variant="body3" color="gray40">
                                        {item.subTitle}
                                    </Typography>
                                </View>

                                <Image
                                    source={item.image}
                                    style={styles.image}
                                    contentFit="cover"
                                />
                            </View>
                        )}
                    />

                    <DotProgress
                        progress={currentIndex}
                        total={steps.length}
                        handlePress={(index) => onDotPress(index)}
                    />

                    <Button
                        title={currentIndex === 4 ? "시작하기" : "다음"}
                        onPress={handlePress}
                        containerStyle={styles.buttonContainer}
                        style={styles.button}
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modal: {
        flex: 1,
        backgroundColor: "rgba(23, 23, 23, 0.5)",
    },
    container: {
        flex: 1,
        justifyContent: "flex-end",
    },
    contentContainer: {
        alignItems: "center",
        paddingHorizontal: 16.5,
        paddingTop: 34,
        backgroundColor: "#111111",
        borderTopStartRadius: 20,
        borderTopEndRadius: 20,
    },
    content: {
        gap: 15,
        alignItems: "center",
        marginBottom: 15,
    },
    titleContainer: {
        marginBottom: 10,
        alignItems: "center",
        gap: 4,
    },
    title: {
        textAlign: "center",
    },
    image: {
        width: "100%",
        aspectRatio: 1.24,
    },
    buttonContainer: {
        width: "100%",
        marginTop: 30,
    },
    button: {
        marginHorizontal: 0,
    },
});
