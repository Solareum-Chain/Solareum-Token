import { keccak256, defaultAbiCoder, toUtf8Bytes, solidityPack } from 'ethers/lib/utils'
import { BigNumberish, Wallet, Contract } from 'ethers'
import { hashMessage, _TypedDataEncoder } from "@ethersproject/hash";
import { network, waffle, ethers } from 'hardhat';

export const sign = async (signer: Wallet, verifyingContract: Contract, key: string, data: any, types: any) => {
  const newData = { ...data }
  delete newData.signatures;

  const chainId = (await waffle.provider.getNetwork()).chainId;
  const domain = {
    name: key,
    chainId,
    version: "1",
    verifyingContract: verifyingContract.address
  }
  const signature = await signer._signTypedData(domain, types, newData)

  // const hash = _TypedDataEncoder.hash(domain, types, newData)
  // const address = ethers.utils.recoverAddress(hash, signature)

  return signature
}