import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    FlatList,
    Modal,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import { ConfettiMethods } from "react-native-fast-confetti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../ui/Button";
import { Typography } from "../ui/Typography";
import { DotProgress } from "./DotProgress";

export type Step = {
    title: string;
    image: any;
    subTitle?: string;
};

interface OnboardingProps {
    steps: Step[];
    show: boolean;
    handleClose?: () => void;
    confettiRef?: React.RefObject<ConfettiMethods | null>;
    nextTitle?: string;
    endTitle?: string;
    canSlide?: boolean;
    showButton?: boolean;
}

const PAGE_H_PADDING = 16.5 * 2;

export const Onboarding = ({
    steps,
    show,
    handleClose,
    confettiRef,
    nextTitle = "다음",
    endTitle = "시작하기",
    canSlide = false,
    showButton = true,
}: OnboardingProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const listRef = useRef<FlatList<Step>>(null);
    const { width: windowWidth } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const didWelcome = useRef(false);

    const PAGE_WIDTH = useMemo(() => Math.max(0, windowWidth), [windowWidth]);

    const lastIndex = useMemo(() => steps.length - 1, [steps.length]);

    const handlePress = () => {
        if (currentIndex === lastIndex) {
            handleClose?.();
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

    useEffect(() => {
        if (currentIndex === lastIndex && !didWelcome.current) {
            confettiRef?.current?.restart();
            didWelcome.current = true;
        }
    }, [currentIndex]);

    return (
        <Modal
            visible={show}
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
                        scrollEnabled={canSlide}
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

                    {steps.length > 0 && (
                        <DotProgress
                            progress={currentIndex}
                            total={steps.length}
                            handlePress={(index) => onDotPress(index)}
                        />
                    )}

                    {showButton && (
                        <Button
                            title={
                                currentIndex === lastIndex
                                    ? endTitle
                                    : nextTitle
                            }
                            onPress={handlePress}
                            containerStyle={styles.buttonContainer}
                            style={styles.button}
                        />
                    )}
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
