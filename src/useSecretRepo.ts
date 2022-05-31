import { GetStringAsync, SecretRepo, SetStringAsync, stringBinaryConverter } from './ceramic';
import { isSelfIdReady, SelfIdNotConnectedState } from './selfId';
import { useSelfId } from './useSelfId';

export function useSecretRepo(key: string): SecretRepo | SelfIdNotConnectedState {
    const { selfId } = useSelfId();
    const isReady = isSelfIdReady(selfId);

    if (isReady) {
        const setAsync: SetStringAsync = async (payload: string) => {
            const did = selfId.client.ceramic.did;
            if (!!did) {
                const jwe = await did.createJWE(stringBinaryConverter.stringToBin(payload), [did.id]);
                await selfId.set(key, jwe);
            }
        };

        const getAsync: GetStringAsync = async () => {
            const jwe = await selfId.get(key);
            const did = selfId.client.ceramic.did;
            return jwe && !!did ? await did.decryptJWE(jwe).then(stringBinaryConverter.binToString) : undefined;
        };

        return { getAsync, setAsync };
    }

    return selfId;
}
