import { Notice } from "@/src/apis";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { forwardRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Typography } from "@/src/components/ui";
import { NoticePreviewItem } from "./ui/NoticePreviewItem";
import { spacing } from "@/src/design-system/tokens/spacing";
import { darkTheme } from "@/src/design-system/themes/dark";

type Props = {
    data: Notice[];
    onEndReached?: () => void;
    isFetchingNextPage?: boolean;
};

export const NoticePreviewList = forwardRef<FlashListRef<Notice>, Props>(
    ({ data, onEndReached, isFetchingNextPage }, ref) => {
        const router = useRouter();
        return (
            <FlashList
                ref={ref}
                data={data}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.contentContainer}
                // 카드끼리 쌓일 때의 간격은 화면마다 같다
                ItemSeparatorComponent={() => (
                    <View style={{ height: spacing[12] }} />
                )}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.6}
                renderItem={({ item }) => (
                    <NoticePreviewItem
                        title={item.title}
                        content={item.content}
                        date={new Date(item.startAt)}
                        onPress={() => {
                            router.push(`/profile/notice/${item.id}`);
                        }}
                    />
                )}
                ListEmptyComponent={
                    <View style={{ alignItems: "center", paddingVertical: 20 }}>
                        <Typography variant="body1" color="gray40">
                            아직 공지사항이 없어요
                        </Typography>
                    </View>
                }
                ListFooterComponent={
                    isFetchingNextPage ? (
                        <View style={{ paddingVertical: 16 }}>
                            <ActivityIndicator
                                size="large"
                                color={darkTheme.primary}
                            />
                        </View>
                    ) : null
                }
            />
        );
    }
);

NoticePreviewList.displayName = "NoticePreviewList";

const styles = StyleSheet.create({
    contentContainer: {
        paddingVertical: spacing[20],
        paddingHorizontal: spacing[16],
    },
});
