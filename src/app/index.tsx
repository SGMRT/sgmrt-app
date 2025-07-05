import { Redirect } from "expo-router";
import { useState } from "react";

export default function Index() {
    const [isLogin, setIsLogin] = useState(false);

    if (isLogin) {
        return <Redirect href="/intro" />;
    }

    return <Redirect href="/(auth)/login" />;
}
