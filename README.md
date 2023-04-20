# Solareum token contract

This project is using [Hardhat](https://hardhat.org/getting-started/) for development, compiling, testing and deploying. The development tool used for development is [Visual Studio Code](https://code.visualstudio.com/) which has [great plugins](https://hardhat.org/guides/vscode-tests.html) for solidity development and mocha testing.

## Contracts

* Ethereum
  * Solareum token (ERC20) : [0x99B600D0a4abdbc4a6796225a160bCf3D5Ce2a89](https://etherscan.com/address/0x99B600D0a4abdbc4a6796225a160bCf3D5Ce2a89)

* Ethereum Goerli
  * Solareum token (ERC20) : [0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D](https://goerli.etherscan.com/address/0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D)

## APR/APY calculation
APR = (1 + (rewardYield/rewardDenominator)) ^ (365 * 2) // rebase each 12 hours = twice a day
APR = (1 + 0.004576915) ^ 730 = 28.037 = 2803.7% APY

## Compiling

Introduction to compiling these contracts

### Install needed packages

```npm
npm install or yarn install
```

### Compile code

```npm
npx hardhat compile
```

### Test code

```node
npx hardhat test
```

### Run a local development node

You can use this for local development with for example metamask. [Hardhat node guide](https://hardhat.org/hardhat-network/)

```node
npx hardhat node
```

### Scripts

Use the scripts in the "scripts" folder. Each script has the command to start it on top.

Make sure you have set the right settings in your ['.env' file](https://www.npmjs.com/package/dotenv). You have to create this file with the following contents yourself:

```node
PRIVATE_KEY=<private_key>

GOERLI_INFURA=
MAIN_INFURA=

DEFENDER_TEAM_API_KEY="<defender_key>"
DEFENDER_TEAM_API_SECRET_KEY="<defender_secret>"
```
