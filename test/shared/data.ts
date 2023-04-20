import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { Wallet } from "@ethersproject/wallet";
import { getAddress } from 'ethers/lib/utils'
import { expandTo18Decimals } from "./utilities";

export const tokenSingleId = (mintData: MintData) => {
  return tokenId(mintData, mintData.tokenId)
}

export const tokenId = (mintData: MintData | MintMultipleData, tokenId: BigNumberish) => {
  let value = BigNumber.from(mintData.minter).shl(96);
  value = value.or(BigNumber.from(mintData.collectionId).shl(64))
  value = value.or(tokenId)
  return value.toString()
}

export const tokenIdValues = async (tokenId: string) => {
  const tokenIdBN = BigNumber.from(tokenId)
  return {
    minter: getAddress(BigInt.asUintN(160, BigInt(tokenIdBN.shr(96).toString())).toString(16)),
    collectionId: Number(BigInt.asUintN(32, BigInt(tokenIdBN.shr(64).toString()))),
    tokenIdx: Number(BigInt.asUintN(64, BigInt(tokenIdBN.toString())))
  }
}

export interface MintDataUser {
  account: string;
  value: BigNumberish;
}

export interface MintData {
  minter: string;
  collectionId: BigNumberish;
  tokenId: BigNumberish;
  supply: BigNumberish;
  collectionUri: string;
  baseUri: string;
  tokenUri: string;
  creators: MintDataUser[];
  royalties: MintDataUser[];
  signatures: string[];
}

export interface MintMultipleData {
  minter: string;
  collectionId: BigNumberish;
  tokenStartId: number;
  tokenEndId: number;
  tokenSupplies: BigNumberish[];
  collectionUri: string;
  baseUri: string;
  creators: MintDataUser[];
  royalties: MintDataUser[];
  signatures: string[];
}

export const mintData = (
  minter: Wallet,
  creator2: Wallet,
  royalty3: Wallet
) => {
  const Types = {
    MintData: [
      { name: "minter", type: "uint160" },
      { name: "collectionId", type: "uint32" },
      { name: "tokenStartId", type: "uint64" },
      { name: "tokenEndId", type: "uint64" },
      { name: "tokenSupplies", type: "uint256[]" },
      { name: "collectionUri", type: "string" },
      { name: "baseUri", type: "string" },
      { name: "creators", type: "Part[]" },
      { name: "royalties", type: "Part[]" },
    ],
    Part: [
      { name: "account", type: "address" },
      { name: "value", type: "uint256" },
    ],
  };

  const defaultCreator: MintDataUser = {
    account: minter.address,
    value: 10000,
  };
  const defaultCreators: MintDataUser[] = [
    { account: minter.address, value: 9000 },
    { account: creator2.address, value: 1000 },
  ];
  const defaultRoyalty: MintDataUser = { account: minter.address, value: 900 };
  const defaultRoyalties: MintDataUser[] = [
    { account: minter.address, value: 700 },
    { account: creator2.address, value: 100 },
    { account: royalty3.address, value: 200 },
  ];

  const baseMintData: MintMultipleData = {
    minter: minter.address,
    collectionId: 1,
    collectionUri: "",
    baseUri: "",
    creators: [defaultCreator],
    royalties: [] as typeof defaultRoyalty[],
    tokenStartId: 1,
    tokenEndId: 1,
    tokenSupplies: [],
    signatures: [] as string[],
  };
  const mintDataFung: MintMultipleData = {
    ...baseMintData,
    tokenSupplies: [expandTo18Decimals(1000)],
  };
  const mintDataSemiFung: MintMultipleData = {
    ...baseMintData,
    collectionId: 2,
    collectionUri: "ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/collection.json",
    baseUri: "Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu",
    royalties: defaultRoyalties,
    tokenStartId: 1,
    tokenEndId: 2,
    tokenSupplies: [100, 200]
  };
  const mintDataNonFung: MintMultipleData = {
    ...baseMintData,
    collectionId: 3,
    collectionUri: "ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu/collection.json",
    baseUri: "Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu",
    creators: [defaultCreator],
    royalties: defaultRoyalties,
    tokenStartId: 100,
    tokenEndId: 400,
    tokenSupplies: []
  };

  return {
    Types,
    defaultCreator,
    defaultCreators,
    defaultRoyalty,
    defaultRoyalties,
    baseMintData,
    mintDataFung,
    mintDataSemiFung,
    mintDataNonFung,
  };
};
