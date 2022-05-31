import { SelfIdNotConnectedState } from './selfId';
import * as Yup from 'yup';

export type Contact = {
    name: string;
    walletAddress: string;
    emailAddress?: string;
};

export type ContactValidator = {
    schema: any;
    editSchema: (editContact: Contact) => any;
    isContactNameValid: (name: string) => true | string[];
    canAddWalletAddressToContacts: (address: string, specificContactsNotToDuplicate?: Contact[]) => true | string[];
    isEmailValid: (name: string) => true | string[];
};

export type GetContact = (walletAddress: string) => Contact | 'not-found';

export type ContactsRepo = {
    contacts: Contact[];
    addContactAsync: (contact: Contact) => Promise<void>;
    addOrUpdateContactsAsync: (contact: Contact[]) => Promise<void>;
    editContactAsync: (oldContact: Contact, newContact: Contact) => Promise<void>;
    deleteContactsAsync: (toDelete: Contact[]) => Promise<void>;
    getContact: GetContact;
};

export type ContactsContext = ContactsRepo | SelfIdNotConnectedState | 'fetching';

export function isContactsReady(context: ContactsContext): context is ContactsRepo {
    return (context as ContactsRepo)?.addContactAsync !== undefined;
}

export function requireContactsReady(): never {
    throw new Error('Contacts not ready. Should never happen');
}

export function validate(func: () => any): true | string[] {
    try {
        func();
        return true;
    } catch (error: any | { errors: string[] }) {
        const maybeValidationErrors: string[] | undefined = error?.errors;
        return maybeValidationErrors === undefined ? ['Unknown error'] : maybeValidationErrors;
    }
}

export const emailAddressSchema = Yup.string().email('Invalid email address').optional();
export const contactNameSchema = Yup.string().required('Contact name required');

export const isEmailValid = (email: string) => validate(() => emailAddressSchema.validateSync(email));
export const isContactNameValid = (name: string) => validate(() => contactNameSchema.validateSync(name));
