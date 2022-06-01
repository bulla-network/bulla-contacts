# Bulla Contacts

  

Save Web3 contacts and reuse across multiple dApps. Stored and encrypted with Ceramic, SelfId and 3ID Connect.  

## Get started 

`npm install @bulla/contacts`
`yarn add @bulla/contacts`

## Provider components

  

This is a React library. There are two main components:

  

`<SelfIdProvider />` and `<ContactsProvider />`.

  

SelfIdProvider maintains the connection information to SelfId and Ceramic. It provides the current state of the connection and a function to enable it if disabled.

ContactsProvider uses the SelfId connection to get, set and manipulate the contacts. The rest of the app can operate without knowledge of how contacts are persisted.

Example:

```
const App = () => {
	const {userAddress, chainId} = useWeb3(); // not included, SelfIdProvider needs wallet and network.
	return (
		<SelfIdProvider userAddress={userAddress} chainId={chainId} notSupported={false} env="mainnet">
			<ContactsProvider  userAddress={userAddress}>
				<YourAppHere />
			</ContactsProvider>
		</SelfIdProvider>
	);
}
```
## Hooks

`useContacts`

Your main entry point to interact with Contacts. 
	
```
const contactsContext = useContacts();
```
where ContactsContext can be of type `ContactsRepo | SelfIdNotConnectedState | 'fetching';`

This allows for improve type safety and easier UX.

Helper functions are available to help with this inconvenience.

```
function  isContactsReady(context: ContactsContext): context  is  ContactsRepo;
function  requireContactsReady(): never;
```

