export function camelToSnakeCase(str: string) {
    return str.replace(/([A-Z])/g, "_$1").toUpperCase();
}

export function getUpdateAttrs(data: any) {
    return Object.keys(data).map((key) => camelToSnakeCase(key));
}
