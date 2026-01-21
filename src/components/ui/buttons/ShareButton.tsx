import { ShareIcon } from "@/assets/svgs/svgs";
import { devLog } from "@/src/utils/devLog";
import { trackAmplitude } from "@/src/utils/trackAmplitude";
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
                        devLog(res);
                        if (res.success) {
                            // run_shared
                            trackAmplitude("Run Shared", { variant: "image" });
                        }
                    })
                    .catch((err) => {
                        err && devLog(err);
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
