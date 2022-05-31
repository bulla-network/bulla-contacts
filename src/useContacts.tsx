import React, { useEffect, useMemo, useState } from 'react';
import * as Yup from 'yup';
import { RequiredStringSchema } from 'yup/lib/string';
import { SecretRepo } from './ceramic';
import {
    Contact,
    contactNameSchema,
    ContactsContext,
    ContactValidator,
    emailAddressSchema,
    isContactNameValid,
    isContactsReady,
    isEmailValid,
    validate,
} from './contacts';
import { addressEquality, isValidAddress } from './ethereum';
import { isSecretRepoReady } from './selfId';
import { useSecretRepo } from './useSecretRepo';

const ContactsContext = React.createContext<ContactsContext>('init');
type ContactsProviderProps = { children: React.ReactNode; userAddress: string };

export const ContactsProvider = ({ children, userAddress }: ContactsProviderProps) => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const secretRepoState = useSecretRepo('bulla-contacts');
    const [fetching, setFetching] = useState(true);
    const isReady = isSecretRepoReady(secretRepoState);

    async function loadContactsAsync(contactsRepo: SecretRepo) {
        try {
            await contactsRepo
                .getAsync()
                .then(str => (str == undefined ? [] : (JSON.parse(str) as Contact[])))
                .then(setContacts);
        } finally {
            setFetching(false);
        }
    }

    useEffect(() => {
        if (isReady) {
            loadContactsAsync(secretRepoState);
        }
    }, [isReady]);

    const context: ContactsContext = useMemo(() => {
        if (fetching && isReady) {
            return 'fetching';
        }
        if (isReady) {
            const setNewContacts = async (newContacts: Contact[]) => {
                const newContactsString = JSON.stringify(newContacts);
                await secretRepoState
                    .setAsync(newContactsString)
                    .then(_ => {
                        setContacts(newContacts);
                    })
                    .catch(console.log);
            };

            const addContactAsync = async (contact: Contact) => setNewContacts([...contacts, contact]);
            const addOrUpdateContactsAsync = async (newContacts: Contact[]) => {
                const oldAndNewContacts = [...newContacts, ...contacts];
                const uniqueWalletAddresses = [...new Set(oldAndNewContacts.map(x => x.walletAddress))];
                const contactsToSave = uniqueWalletAddresses
                    .map(walletAddress => oldAndNewContacts.find(x => x.walletAddress == walletAddress))
                    .filter((x): x is Contact => x !== undefined);

                return setNewContacts(contactsToSave);
            };
            const editContactAsync = async (oldContact: Contact, newContact: Contact) =>
                setNewContacts([...contacts.filter(x => x.walletAddress !== oldContact.walletAddress), newContact]);
            const deleteContactsAsync = async (toDelete: Contact[]) => setNewContacts(contacts.filter(x => !toDelete.includes(x)));
            const contactsIncludingYou = [...contacts, { name: 'You', walletAddress: userAddress }];
            const getContact = (walletAddressParam: string) =>
                contactsIncludingYou.find(({ walletAddress }) => addressEquality(walletAddress, walletAddressParam)) ?? 'not-found';

            return {
                contacts: contacts
                    .filter(c => c.walletAddress !== userAddress)
                    .sort((a, b) => {
                        const aName = a.name.toLowerCase();
                        const bName = b.name.toLowerCase();

                        if (aName < bName) {
                            return -1;
                        }
                        if (aName > bName) {
                            return 1;
                        }
                        return 0;
                    }),
                addContactAsync,
                addOrUpdateContactsAsync,
                editContactAsync,
                deleteContactsAsync,
                getContact,
            };
        } else {
            return secretRepoState;
        }
    }, [contacts, fetching, secretRepoState]);

    return <ContactsContext.Provider value={context}>{children}</ContactsContext.Provider>;
};

export const useContacts = () => {
    const context = React.useContext(ContactsContext);
    if (!context) throw new Error('Error: you must call useContacts with the ContactsProvider');
    return context;
};

function walletAddressSchemaFactory(userAddress: string, contactsNotToDuplicate: Contact[]) {
    return Yup.string()
        .required('Wallet address required')
        .test('is-valid-address', 'Invalid wallet address', value => isValidAddress(value || ''))
        .test('is-address-own', 'Cannot add own wallet address', value => !addressEquality(value || '', userAddress))
        .test('already-exists', 'Cannot add duplicate wallet address', value =>
            contactsNotToDuplicate.every(x => !addressEquality(x.walletAddress, value || '')),
        );
}

const contactValidator = (walletAddressSchema: RequiredStringSchema<string | undefined>) =>
    Yup.object().shape({
        name: contactNameSchema,
        walletAddress: walletAddressSchema,
        emailAddress: emailAddressSchema,
    });

export function useContactValidator(userAddress: string): ContactValidator {
    const contactsContext = useContacts();

    const contacts = isContactsReady(contactsContext) ? contactsContext.contacts : [];
    const walletAddressSchema = walletAddressSchemaFactory(userAddress, contacts);
    const schema = contactValidator(walletAddressSchema);
    const editSchema = (editContact: Contact) =>
        contactValidator(
            walletAddressSchemaFactory(
                userAddress,
                contacts.filter(x => x.walletAddress !== editContact.walletAddress),
            ),
        );

    const canAddWalletAddressToContacts = (address: string, specificContactsNotToDuplicate?: Contact[]) => {
        const contactsNotToDuplicate = specificContactsNotToDuplicate ?? contacts;
        return validate(() => walletAddressSchemaFactory(userAddress, contactsNotToDuplicate).validateSync(address));
    };

    return { schema, editSchema, isContactNameValid, canAddWalletAddressToContacts, isEmailValid };
}
