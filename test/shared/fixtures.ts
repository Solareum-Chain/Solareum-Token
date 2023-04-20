import { Wallet, providers, constants, Contract } from 'ethers'
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { waffle, ethers, upgrades } from 'hardhat'
import { expandTo18Decimals } from './utilities'

import { Solareum, IDexFactory, IDexPair, IDexRouter, WETH } from '../../typechain'

import SolareumAbi from '../../artifacts/contracts/Solareum.sol/Solareum.json'
import IDexFactoryAbi from '../../artifacts/contracts/dex/IDexFactory.sol/IDexFactory.json'
import IDexPairAbi from '../../artifacts/contracts/dex/IDexPair.sol/IDexPair.json'
import IDexRouterAbi from '../../artifacts/contracts/dex/IDexRouter.sol/IDexRouter.json'
import WETHAbi from '../../artifacts/contracts/test/WETH.sol/WETH.json'
import { formatEther, parseEther, parseUnits } from 'ethers/lib/utils'

const { AddressZero } = constants;

export async function createFixture([owner, marketingWallet]: Wallet[], provider: providers.Web3Provider) {
  upgrades.silenceWarnings()

  // deploy WETH contract and convert some ETH
  const WETHFactory = await ethers.getContractFactory("WETH");
  const WETH = await WETHFactory.deploy() as WETH;
  await WETH.deposit({ value: parseEther('100') })

  // requires hardhat to run in fork mode
  console.log(formatEther(await owner.getBalance()))
  const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
  const router = new Contract(routerAddress, IDexRouterAbi.abi, owner) as IDexRouter
  const factoryAddress = await router.factory()
  console.log(factoryAddress)
  const factory = new Contract(factoryAddress, IDexFactoryAbi.abi, owner) as IDexFactory

  // Solareum token
  const Solareum = await ethers.getContractFactory("Solareum");
  const token =  await upgrades.deployProxy(Solareum, [router.address, WETH.address, marketingWallet.address], {initializer: 'initialize', unsafeAllow: ['delegatecall']}) as Solareum;

  // create pair with liquidity
  await factory.createPair(token.address, WETH.address)
  const pairAddress = await factory.getPair(token.address, WETH.address)
  console.log(pairAddress)
  const pair = new Contract(pairAddress, IDexPairAbi.abi, owner) as IDexPair

  return {
    token,
    router,
    factory,
    pair,
    WETH,
  }
}
