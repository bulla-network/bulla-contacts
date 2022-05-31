export type SetStringAsync = (secret: string) => Promise<void>;
export type GetStringAsync = () => Promise<string | undefined>;

export type SecretRepo = {
    getAsync: GetStringAsync;
    setAsync: SetStringAsync;
};

export const stringBinaryConverter = {
    stringToBin: (str: string): Uint8Array => {
        const byteArray = [...Array(str.length).keys()].map(x => str.charCodeAt(x));
        return new Uint8Array(byteArray);
    },
    binToString: (binArr: Uint8Array) => {
        return String.fromCharCode.apply(String, Array.from(binArr));
    },
};
