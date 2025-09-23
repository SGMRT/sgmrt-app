export function devLog(...args: any[]) {
    if (__DEV__) {
        console.log(...args);
    }
}

export function errorLog(...args: any[]) {
    if (__DEV__) {
        console.error(...args);
    }
}
