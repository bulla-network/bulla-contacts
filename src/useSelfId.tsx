import { ConnectNetwork, EthereumAuthProvider, SelfID } from '@self.id/web';
import React, { useEffect, useState } from 'react';
import * as envs from '../env.json';
import { DisabledState, isSelfIdDisabled, SelfIdContext } from './selfId';
import { setLocalStorage, getLocalStorage } from './localStorage';

declare global {
    interface Window {
        ethereum: any;
    }
}

const SelfIdContext = React.createContext<SelfIdContext>('init');
type SelfIdProviderProps = { children: React.ReactNode; userAddress: string; chainId: number; notSupported: boolean; env: 'mainnet' | 'testnet' };

export const SelfIdProvider = ({ children, userAddress, chainId, notSupported, env }: SelfIdProviderProps) => {
    const [selfId, setSelfId] = useState<SelfIdContext>(notSupported ? 'not-supported' : 'init');
    const storageKey = `${userAddress}:${chainId}:selfIdEnabled`;
    const ceramicEnv = envs[env];

    const disabledState = {
        enableSelfId: () => {
            setLocalStorage(storageKey, true);
            setSelfId('init');
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
        } catch (e) {
            setSelfId('failed');
            console.error(e);
        }
    }

    useEffect(() => {
        if (selfId == 'init') {
            if (!getLocalStorage<boolean>(storageKey)) {
                setSelfId(disabledState);
            } else authenticate();
        }
    }, [userAddress, selfId == 'init']);

    return <SelfIdContext.Provider value={selfId}>{children}</SelfIdContext.Provider>;
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
        isFailed: selfId == 'failed',
        enabledState,
    };
};
