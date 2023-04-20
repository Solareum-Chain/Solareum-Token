import { HardhatUserConfig } from "hardhat/types";

// import "@nomiclabs/hardhat-ganache";
import "@nomiclabs/hardhat-waffle";
import "hardhat-typechain";
import 'hardhat-abi-exporter';
import "hardhat-tracer";
import "hardhat-dependency-compiler";
import 'hardhat-contract-sizer';
import '@openzeppelin/hardhat-upgrades';
// import '@openzeppelin/hardhat-defender';
import "@nomiclabs/hardhat-etherscan";

require("dotenv").config({path: `${__dirname}/.env`});

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  // defender: {
  //   apiKey: process.env.DEFENDER_TEAM_API_KEY,
  //   apiSecret: process.env.DEFENDER_TEAM_API_SECRET_KEY,
  // },
  networks: {
    hardhat: {
      forking: {
        enabled: true,
        url: `${process.env.MAIN_ALCHEMY_URL}`,
        blockNumber: 16963128
      }
    },
    goerli: {
      url: `${process.env.GOERLI_INFURA}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
    kovan: {
      url: `${process.env.KOVAN_INFURA}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
    rinkeby: {
      url: `${process.env.RINKEBY_INFURA}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
    mainnet: {
      url: `${process.env.MAIN_INFURA}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
    bsctestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
    bscmainnet: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
    polygon: {
      url: "https://matic-mainnet.chainstacklabs.com",
      chainId: 137,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
    polygonmumbai: {
      url: "https://matic-mumbai.chainstacklabs.com",
      chainId: 80001,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
    ganache: {
      url: "HTTP://127.0.0.1:7545",
      chainId: 1337,
      accounts: [`0x767f7322259ccc3a24165da6767b2a76f7cd94b2e4b0f76beb65b8b07ec11990`]
    }
  },
  etherscan: {
    apiKey: {
      mainnet: `${process.env.ETHERSCAN_API_TOKEN}`,
      goerli: `${process.env.ETHERSCAN_API_TOKEN}`,
      bsc: `${process.env.BSC_API_TOKEN}`,
      bscTestnet: `${process.env.BSC_API_TOKEN}`,
      polygon: `${process.env.POLYGON_API_TOKEN}`,
      polygonMumbai: `${process.env.POLYGON_API_TOKEN}`,
    }
  },
  solidity: {
    compilers: [{ 
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 10000
        }
      }
    },
    { 
      version: "0.4.18",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      } 
    }],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  contractSizer: {
    alphaSort: false,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  abiExporter: {
    runOnCompile: true,
    clear: true
  }
};

export default config;