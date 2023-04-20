// Based on https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/token/ERC20/ERC20.test.js

import chai, {expect} from "chai";
import {waffle} from "hardhat";
import {Wallet, providers, constants, Contract} from "ethers";
import {BigNumber, BigNumberish} from "@ethersproject/bignumber";
import {AddressZero} from "@ethersproject/constants";
import {formatEther, parseEther, parseUnits} from "ethers/lib/utils";
// const { expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
import {mine, time} from "@nomicfoundation/hardhat-network-helpers";

import {createFixture} from "./shared/fixtures";
import {shouldBehaveLikeERC20, shouldBehaveLikeERC20Transfer, shouldBehaveLikeERC20Approve} from "./ERC20.behavior";

import {IDexRouter, Solareum, WETH} from "../typechain";
import {expandTo18Decimals, mineBlocks} from "./shared/utilities";

chai.use(waffle.solidity);

describe("ERC20", () => {
  const {provider, createFixtureLoader} = waffle;
  const [owner, marketingWallet, recipient, anotherAccount] = provider.getWallets();

  const name = "Solareum";
  const symbol = "SRM";
  const liquidity = parseUnits("3625650", 18);
  const maximumSupply = expandTo18Decimals(100000000);
  const totalSupply = expandTo18Decimals(33618820);
  const initialSupply = totalSupply.sub(liquidity);

  const loadFixture = createFixtureLoader([owner, marketingWallet], provider);
  let ERC20Token: Solareum;
  let router: IDexRouter;
  let WETH: WETH;
  beforeEach(async () => {
    const fixture = await loadFixture(createFixture);
    ERC20Token = fixture.token;
    router = fixture.router;
    WETH = fixture.WETH;

    await ERC20Token.approve(router.address, constants.MaxUint256);
    await WETH.approve(router.address, constants.MaxUint256);
    await router.addLiquidity(ERC20Token.address, WETH.address, liquidity, parseUnits("100", 9), 0, 0, owner.address, constants.MaxUint256);
    await ERC20Token.setAutomatedMarketMakerPair(fixture.pair.address, true, true);
    await ERC20Token.setTradingEnabled(true);
  });

  it("has a name", async () => {
    expect(await ERC20Token.name()).to.equal(name);
  });

  it("has a symbol", async () => {
    expect(await ERC20Token.symbol()).to.equal(symbol);
  });

  it("has 18 decimals", async () => {
    expect(await ERC20Token.decimals()).to.equal(18);
  });

  shouldBehaveLikeERC20(
    () => ERC20Token,
    "ERC20",
    totalSupply,
    initialSupply,
    owner,
    recipient,
    anotherAccount
  );

  describe("decrease allowance", () => {
    describe("when the spender is not the zero address", () => {
      const spender = recipient;

      const shouldDecreaseApproval = (amount: BigNumber) => {
        describe("when there was no approved amount before", () => {
          it("reverts", async () => {
            await expect(
              ERC20Token.decreaseAllowance(spender.address, amount)
            ).to.be.revertedWith("ERC20: decreased allowance below zero");
          });
        });

        describe("when the spender had an approved amount", () => {
          const approvedAmount = amount;

          beforeEach(async () => {
            await ERC20Token.approve(spender.address, approvedAmount);
          });

          it("emits an approval event", async () => {
            await expect(
              ERC20Token.decreaseAllowance(spender.address, approvedAmount)
            )
              .to.emit(ERC20Token, "Approval")
              .withNamedArgs({
                owner: owner.address,
                spender: spender.address,
                value: BigNumber.from(0),
              });
          });

          it("decreases the spender allowance subtracting the requested amount", async () => {
            await ERC20Token.decreaseAllowance(
              spender.address,
              approvedAmount.sub(1)
            );

            expect(
              await ERC20Token.allowance(owner.address, spender.address)
            ).to.equal("1");
          });

          it("sets the allowance to zero when all allowance is removed", async () => {
            await ERC20Token.decreaseAllowance(spender.address, approvedAmount);
            expect(
              await ERC20Token.allowance(owner.address, spender.address)
            ).to.equal("0");
          });

          it("reverts when more than the full allowance is removed", async () => {
            await expect(
              ERC20Token.decreaseAllowance(
                spender.address,
                approvedAmount.add(1)
              )
            ).to.be.revertedWith("ERC20: decreased allowance below zero");
          });
        });
      };

      describe("when the sender has enough balance", () => {
        const amount = initialSupply;

        shouldDecreaseApproval(amount);
      });

      describe("when the sender does not have enough balance", () => {
        const amount = initialSupply.add(1);
        shouldDecreaseApproval(amount);
      });
    });

    describe("when the spender is the zero address", () => {
      const amount = initialSupply;
      const spender = AddressZero;

      it("reverts", async () => {
        await expect(
          ERC20Token.decreaseAllowance(spender, amount)
        ).to.be.revertedWith("ERC20: decreased allowance below zero");
      });
    });
  });

  describe("increase allowance", () => {
    const amount = initialSupply;

    describe("when the spender is not the zero address", () => {
      const spender = recipient;

      describe("when the sender has enough balance", () => {
        it("emits an approval event", async () => {
          await expect(ERC20Token.increaseAllowance(spender.address, amount))
            .to.emit(ERC20Token, "Approval")
            .withNamedArgs({
              owner: owner.address,
              spender: spender.address,
              value: amount,
            });
        });

        describe("when there was no approved amount before", () => {
          it("approves the requested amount", async () => {
            await ERC20Token.increaseAllowance(spender.address, amount);

            expect(
              await ERC20Token.allowance(owner.address, spender.address)
            ).to.equal(amount);
          });
        });

        describe("when the spender had an approved amount", () => {
          beforeEach(async () => {
            await ERC20Token.approve(spender.address, BigNumber.from(1));
          });

          it("increases the spender allowance adding the requested amount", async () => {
            await ERC20Token.increaseAllowance(spender.address, amount);

            expect(
              await ERC20Token.allowance(owner.address, spender.address)
            ).to.equal(amount.add(1));
          });
        });
      });

      describe("when the sender does not have enough balance", () => {
        const amount = initialSupply.add(1);

        it("emits an approval event", async () => {
          await expect(ERC20Token.increaseAllowance(spender.address, amount))
            .to.emit(ERC20Token, "Approval")
            .withNamedArgs({
              owner: owner.address,
              spender: spender.address,
              value: amount,
            });
        });

        describe("when there was no approved amount before", () => {
          it("approves the requested amount", async () => {
            await ERC20Token.increaseAllowance(spender.address, amount);

            expect(
              await ERC20Token.allowance(owner.address, spender.address)
            ).to.equal(amount);
          });
        });

        describe("when the spender had an approved amount", () => {
          beforeEach(async () => {
            await ERC20Token.approve(spender.address, BigNumber.from(1));
          });

          it("increases the spender allowance adding the requested amount", async () => {
            await ERC20Token.increaseAllowance(spender.address, amount);

            expect(
              await ERC20Token.allowance(owner.address, spender.address)
            ).to.equal(amount.add(1));
          });
        });
      });
    });

    describe("when the spender is the zero address", () => {
      const spender = AddressZero;

      it("reverts", async () => {
        await expect(
          ERC20Token.increaseAllowance(spender, amount)
        ).to.be.revertedWith("ERC20: approve to the zero address");
      });
    });
  });

  // describe("_mint", () => {
  //   const amount = BigNumber.from(50);
  //   it("rejects a null account", async () => {
  //     await expect(ERC20Token.mint(AddressZero, amount)).to.be.revertedWith(
  //       "ERC20: mint to the zero address"
  //     );
  //   });

  //   describe("for a non zero account", () => {
  //     it("increments totalSupply", async () => {
  //       await ERC20Token.mint(recipient.address, amount);
  //       const expectedSupply = initialSupply.add(amount);
  //       expect(await ERC20Token.totalSupply()).to.equal(expectedSupply);
  //     });

  //     it("increments recipient balance", async () => {
  //       await ERC20Token.mint(recipient.address, amount);
  //       expect(await ERC20Token.balanceOf(recipient.address)).to.equal(amount);
  //     });

  //     it("emits Transfer event", async () => {
  //       await expect(ERC20Token.mint(recipient.address, amount))
  //         .to.emit(ERC20Token, "Transfer")
  //         .withNamedArgs({
  //           from: AddressZero,
  //           to: recipient.address,
  //           value: amount,
  //         });
  //     });
  //   });
  // });

  // describe("_burn", () => {
  //   describe("for a non zero account", () => {
  //     it("rejects burning more than balance", async () => {
  //       await expect(ERC20Token.burn(initialSupply.add(1))).to.be.revertedWith(
  //         "ERC20: burn amount exceeds balance"
  //       );
  //     });

  //     const describeBurn = (description: string, amount: BigNumber) => {
  //       describe(description, () => {
  //         it("decrements totalSupply", async () => {
  //           await ERC20Token.burn(amount);
  //           const expectedSupply = initialSupply.sub(amount);
  //           expect(await ERC20Token.totalSupply()).to.equal(expectedSupply);
  //         });

  //         it("decrements owner balance", async () => {
  //           await ERC20Token.burn(amount);
  //           const expectedBalance = initialSupply.sub(amount);
  //           expect(await ERC20Token.balanceOf(owner.address)).to.equal(
  //             expectedBalance
  //           );
  //         });

  //         it("emits Transfer event", async () => {
  //           await expect(ERC20Token.burn(amount))
  //             .to.emit(ERC20Token, "Transfer")
  //             .withNamedArgs({
  //               from: owner.address,
  //               to: AddressZero,
  //               value: amount,
  //             });
  //         });
  //       });
  //     };

  //     describeBurn("for entire balance", initialSupply);
  //     describeBurn("for less amount than balance", initialSupply.sub(1));
  //   });
  // });

  describe("_transfer", () => {
    shouldBehaveLikeERC20Transfer(
      () => ERC20Token,
      "ERC20",
      owner,
      recipient,
      initialSupply
    );

    describe("when the sender is the zero address", () => {
      it("reverts", async () => {
        await expect(
          ERC20Token.transferFrom(AddressZero, recipient.address, initialSupply)
        ).to.be.revertedWith("ERC20: insufficient allowance");
      });
    });
  });

  describe("_approve", () => {
    shouldBehaveLikeERC20Approve(
      () => ERC20Token,
      "ERC20",
      owner,
      recipient,
      initialSupply
    );
  });

  describe("transfers", () => {
    it("takes fees correctly", async () => {
      const amountToTrade = parseUnits("1000000", 18);
      await ERC20Token.transfer(anotherAccount.address, amountToTrade);
      await ERC20Token.connect(anotherAccount).approve(router.address, amountToTrade);
      await router
        .connect(anotherAccount)
        .swapExactTokensForTokensSupportingFeeOnTransferTokens(
          amountToTrade,
          0,
          [ERC20Token.address, WETH.address],
          anotherAccount.address,
          constants.MaxUint256
        );
			
			expect(await ERC20Token.balanceOf(ERC20Token.address)).to.equal(amountToTrade.mul(50).div(1000));
      expect(await ERC20Token.balanceOf(anotherAccount.address)).to.equal(0);
			
      await ERC20Token.transfer(anotherAccount.address, amountToTrade);
      await ERC20Token.connect(anotherAccount).approve(router.address, amountToTrade);
      await router
        .connect(anotherAccount)
        .swapExactTokensForTokensSupportingFeeOnTransferTokens(
          amountToTrade,
          0,
          [ERC20Token.address, WETH.address],
          anotherAccount.address,
          constants.MaxUint256
        );
			
			// still at 5% of amountToTrade, previous amount is swapped back
			expect(await ERC20Token.balanceOf(ERC20Token.address)).to.equal(amountToTrade.mul(50).div(1000));
			expect(await ERC20Token.balanceOf(anotherAccount.address)).to.equal(0);
    });
  });

  describe("rebase", () => {
    it("Does not work before enabling", async () => {
      let increases = 0
      let currentTime = await time.latest();
      const finalTime = currentTime + (20 * 24 * 60 * 60)
      while (currentTime < finalTime) {
        increases++
        currentTime += 60 * 60 * 12 // 12 hours
        await time.increaseTo(currentTime);
        await ERC20Token.manualRebase()
      }

      expect(await ERC20Token.totalSupply()).to.equal(totalSupply);
    });

    it("done fully after 540 days", async () => {
      await ERC20Token.setRebasing(true, true)

      let increases = 0
      let currentTime = await time.latest();
      const finalTime = currentTime + (540 * 24 * 60 * 60)
      console.log("current Supply", await ERC20Token.totalSupply(), currentTime, finalTime, `0 days`)
      while (currentTime < finalTime) {
        increases++
        currentTime += 60 * 60 * 12 // 12 hours
        await time.increaseTo(currentTime);
        await ERC20Token.manualRebase()
        if (((increases * 12) / 24 % 60) === 0) console.log("current Supply", await ERC20Token.totalSupply(), currentTime, `${(increases * 12) / 24} days`)

        if (increases === 539.5 * 2) {
          console.log("current Supply", await ERC20Token.totalSupply(), currentTime, `${(increases * 12) / 24} days`)
          expect(await ERC20Token.totalSupply()).to.not.equal(maximumSupply);
        } else if (increases === 540 * 2) {
          expect(await ERC20Token.totalSupply()).to.equal(maximumSupply);
        }
      }
    });
  });
});
