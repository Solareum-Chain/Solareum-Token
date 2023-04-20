// npx hardhat run scripts/deployToken.ts

require("dotenv").config({path: `${__dirname}/.env`});
import { Wallet, providers, constants, Contract } from 'ethers'
import { parseEther, parseUnits } from 'ethers/lib/utils';
import { run, ethers, upgrades } from "hardhat";
import { AddressZero } from "@ethersproject/constants";
import { Solareum, IDexFactory, IDexPair, IDexRouter, WETH } from "../typechain";

import SolareumAbi from '../abi/contracts/Solareum.sol/Solareum.json'
import IDexRouterAbi from '../abi/contracts/dex/IDexRouter.sol/IDexRouter.json'
import IDexPairAbi from '../abi/contracts/dex/IDexPair.sol/IDexPair.json'
import IDexFactoryAbi from '../abi/contracts/dex/IDexFactory.sol/IDexFactory.json'
import WETHAbi from '../abi/contracts/test/WETH.sol/WETH.json'

const main = async() => {
  // const signer = ethers.provider.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // hardhat
  // const signer = ethers.provider.getSigner("0xCCD0C72BAA17f4d3217e6133739de63ff6F0b462"); // ganache
  const signer = ethers.provider.getSigner("0x56352451De207599Cf88941C20A43d58BDa854Ac"); // ethereum

  const liquidityToken = parseUnits('3625650', 18)
  // const liquidtyEthers = parseEther('0.2') // ethereum goerli
  const liquidtyEthers = parseEther('48.342') // ethereum mainnet

  // const marketingWallet = "0xc6C89aA4B41D29969a552ad652290BA5C13A93e5"  // ethereum goerli
  const marketingWallet = "0x10852DbdC5d65A6Cda9Ee789f6d7D2CEC419BB97"  // ethereum mainnet

  // requires hardhat to run in fork mode
  // const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D" // ethereum goerli
  const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D" // ethereum mainnet

  const router = new Contract(routerAddress, IDexRouterAbi, signer) as IDexRouter
  console.log("router", routerAddress)
  const factoryAddress = await router.factory()
  console.log("factory", factoryAddress)
  const WETHAddress = await router.WETH()
  const WETH = new Contract(WETHAddress, WETHAbi, signer) as WETH
  console.log("WETH", WETH.address)
  const factory = new Contract(factoryAddress, IDexFactoryAbi, signer) as IDexFactory

  // Solareum token
  // let token = new ethers.Contract("0x5fbc1F3BB78E8614D89DCB82f4d76d37B63af2fC", SolareumAbi, signer) as Solareum; // ethereum goerli
  // let token = new ethers.Contract("0x99B600D0a4abdbc4a6796225a160bCf3D5Ce2a89", SolareumAbi, signer) as Solareum; // ethereum mainnet
  const Solareum = await ethers.getContractFactory("Solareum");
  const token =  await upgrades.deployProxy(Solareum, [router.address, WETH.address, marketingWallet], {initializer: 'initialize', unsafeAllow: ['delegatecall']}) as Solareum;
  // token =  await upgrades.upgradeProxy(token.address, Solareum, { unsafeAllow: ['delegatecall']}) as Solareum;
  await token.deployed();
  console.log("Solareum contract deployed to:", token.address);

  // // create pair with liquidity
  // await (await factory.createPair(token.address, WETH.address)).wait()
  // const pairAddress = await factory.getPair(token.address, WETH.address)
  // console.log("pair", pairAddress)

  const tokenImplAddress = await upgrades.erc1967.getImplementationAddress(token.address)
  console.log("Solareum implementation address:", tokenImplAddress)
  await run("verify:verify", { address: tokenImplAddress, constructorArguments: [] })
  console.log("Solareum implementation verified")


  // await (await token.approve(router.address, constants.MaxUint256)).wait()
  // await (await WETH.approve(router.address, constants.MaxUint256)).wait()
  // await (await WETH.deposit({ value: liquidtyEthers })).wait()
  // await (await router.addLiquidity(token.address, WETH.address, liquidityToken, liquidtyEthers, 0, 0, signer._address, constants.MaxUint256)).wait()
  // await (await token.setAutomatedMarketMakerPair(pairAddress, true, true)).wait()
  // await (await token.setTradingEnabled(true)).wait()
}

main()
//   .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
