import { ConnectNetwork, EthereumAuthProvider, SelfID } from '@self.id/web';
import React, { useEffect, useState } from 'react';
import * as envs from '../env.json';
import { getLocalStorage, setLocalStorage } from './localStorage';
import { DisabledState, isSelfIdDisabled, isSelfIdFailed, SelfIdContext } from './selfId';

declare global {
    interface Window {
        ethereum: any;
    }
}

const SelfIdContext = React.createContext<SelfIdContext>('init');
type SelfIdProviderProps = { children: React.ReactNode; userAddress: string; notSupported: boolean; env: 'mainnet' | 'testnet' };

export const SelfIdProvider = ({ children, userAddress, notSupported, env }: SelfIdProviderProps) => {
    const [selfId, setSelfId] = useState<SelfIdContext | 'init-bypass-enabled-check'>(notSupported ? 'not-supported' : 'init');
    const storageKey = `${userAddress}:selfIdEnabled`;
    const ceramicEnv = envs[env];

    const disabledState: DisabledState = {
        __type: 'disabled',
        enableSelfId: () => {
            setSelfId('init-bypass-enabled-check');
        },
    };

    async function authenticate() {
        try {
            setSelfId('connecting');
            const selfId = await SelfID.authenticate({
                authProvider: new EthereumAuthProvider(window.ethereum, userAddress),
                ceramic: ceramicEnv.url,
                model: ceramicEnv.model,
                connectNetwork: ceramicEnv.id as ConnectNetwork,
            });

            setSelfId(selfId);
            setLocalStorage(storageKey, true);
        } catch (e) {
            setSelfId({__type: 'failed', retry: () => setSelfId('init')});
            console.error(e);
        }
    }

    useEffect(() => {
        if (selfId == 'init' || selfId == 'init-bypass-enabled-check') {
            if (selfId == 'init' && !getLocalStorage<boolean>(storageKey)) {
                setSelfId(disabledState);
            } else authenticate();
        }
    }, [userAddress, selfId]);

    return <SelfIdContext.Provider value={selfId == 'init-bypass-enabled-check' ? 'connecting' : selfId}>{children}</SelfIdContext.Provider>;
};

export const useSelfId: () => {
    selfId: SelfIdContext;
    isConnecting: boolean;
    isFailed: boolean;
    enabledState: 'enabled' | DisabledState;
} = () => {
    const selfId = React.useContext(SelfIdContext);
    const isConnecting = selfId == 'connecting';
    const enabledState = !isSelfIdDisabled(selfId) ? 'enabled' : selfId;

    return {
        selfId,
        isConnecting,
        isFailed: isSelfIdFailed(selfId),
        enabledState,
    };
};
