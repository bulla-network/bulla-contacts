import { ethers } from 'ethers';
import { isAddress } from 'ethers/lib/utils';

export const addressEquality = (address1: string, address2: string) => address1.toLowerCase() === address2.toLowerCase();
export const isValidAddress = (address: string) => isAddress(address);
export const toChecksumAddress = (address: string) => ethers.utils.getAddress(address.toLowerCase());
