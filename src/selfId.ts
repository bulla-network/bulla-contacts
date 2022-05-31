import { SelfID } from '@self.id/web';
import { SecretRepo } from './ceramic';

export type DisabledState = {
    enableSelfId: () => void;
};

export type ConnectedSelfId = SelfID<any, string | number | symbol>;

export type SelfIdNotConnectedState = 'connecting' | 'failed' | 'not-supported' | 'init' | DisabledState;
export type SelfIdContext = ConnectedSelfId | SelfIdNotConnectedState;

export function isSelfIdReady(context: SelfIdContext): context is ConnectedSelfId {
    return (context as ConnectedSelfId)?.id !== undefined;
}

export function isSecretRepoReady(context: SecretRepo | SelfIdNotConnectedState): context is SecretRepo {
    return (context as SecretRepo)?.getAsync !== undefined;
}

export function isSelfIdDisabled(context: SelfIdNotConnectedState | any): context is DisabledState {
    return (context as DisabledState)?.enableSelfId !== undefined;
}
