export function devLog(...args: any[]) {
    if (__DEV__) {
        console.log(...args);
    }
}
