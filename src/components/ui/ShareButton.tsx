import { ShareIcon } from "@/assets/svgs/svgs";
import * as amplitude from "@amplitude/analytics-react-native";
import { Pressable, StyleSheet } from "react-native";
import Share from "react-native-share";

interface ShareProps {
    title: string;
    message: string;
    filename: string;
    getUri: () => Promise<string | null>;
}

export default function ShareButton({
    title,
    message,
    filename,
    getUri,
}: ShareProps) {
    return (
        <Pressable
            onPress={async () => {
                const uri = await getUri();
                Share.open({
                    title: title,
                    message: message,
                    filename: filename,
                    url: uri ?? "",
                })
                    .then((res) => {
                        console.log(res);
                        if (res.success) {
                            amplitude.track("Run Shared");
                        }
                    })
                    .catch((err) => {
                        err && console.log(err);
                    });
            }}
        >
            <ShareIcon style={styles.shareButton} />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    shareButton: {
        marginLeft: 8,
        flex: 1,
    },
});
