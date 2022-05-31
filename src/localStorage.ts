const tryParseJson = (value: any) => {
    try {
        return JSON.parse(value);
    } catch (e) {
        return undefined;
    }
};

export const setLocalStorage = (key: string, value: any) => localStorage.setItem(key, JSON.stringify(value));

export const getLocalStorage = <T>(key: string): T | undefined => {
    const value = localStorage.getItem(key);
    return value ? tryParseJson(value) : value;
};
