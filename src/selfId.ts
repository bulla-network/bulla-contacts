import { SelfID } from '@self.id/web';
import { SecretRepo } from './ceramic';

export type DisabledState = {
    __type: 'disabled'
    enableSelfId: () => void;
};

export type FailedState = {
    __type: 'failed'
    retry: () => void;
};

export type ConnectedSelfId = SelfID<any, string | number | symbol>;

export type SelfIdNotConnectedState = 'connecting' | 'not-supported' | 'init' | DisabledState | FailedState;
export type SelfIdContext = ConnectedSelfId | SelfIdNotConnectedState;

export function isSelfIdReady(context: SelfIdContext): context is ConnectedSelfId {
    return (context as ConnectedSelfId)?.id !== undefined;
}

export function isSecretRepoReady(context: SecretRepo | SelfIdNotConnectedState): context is SecretRepo {
    return (context as SecretRepo)?.getAsync !== undefined;
}

export function isSelfIdDisabled(context: SelfIdNotConnectedState | any): context is DisabledState {
    return context?.__type === 'disabled';
}

export function isSelfIdFailed(context: SelfIdNotConnectedState | any): context is FailedState {
    return context?.__type === 'failed';
}
