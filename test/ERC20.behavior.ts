// Based on https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/test/token/ERC20/ERC20.behavior.js

import { expect } from "chai";
import { Wallet } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
import { AddressZero, MaxUint256 } from "@ethersproject/constants";
// const { expectEvent, expectRevert } = require("@openzeppelin/test-helpers");

import { ERC20Upgradeable } from "../typechain";

export const shouldBehaveLikeERC20 = (
  tokenFN: () => ERC20Upgradeable,
  errorPrefix: string,
  totalSupply: BigNumber,
  initialSupply: BigNumber,
  initialHolder: Wallet,
  recipient: Wallet,
  anotherAccount: Wallet
) => {
  describe("total supply", () => {
    it("returns the total amount of tokens", async () => {
      expect(await tokenFN().totalSupply()).to.equal(totalSupply);
    });
  });

  describe("balanceOf", () => {
    describe("when the requested account has no tokens", () => {
      it("returns zero", async () => {
        expect(await tokenFN().balanceOf(anotherAccount.address)).to.equal("0");
      });
    });

    describe("when the requested account has some tokens", () => {
      it("returns the total amount of tokens", async () => {
        expect(await tokenFN().balanceOf(initialHolder.address)).to.equal(
          initialSupply
        );
      });
    });
  });

  describe("transfer", () => {
    shouldBehaveLikeERC20Transfer(
      tokenFN,
      errorPrefix,
      initialHolder,
      recipient,
      initialSupply
    );
  });

  describe("transfer from", () => {
    const spender = recipient;

    describe("when the token owner is not the zero address", () => {
      const tokenOwner = initialHolder;

      describe("when the recipient is not the zero address", () => {
        const to = anotherAccount;

        describe("when the spender has enough allowance", () => {
          beforeEach(async () => {
            await tokenFN()
              .connect(initialHolder)
              .approve(spender.address, initialSupply);
          });

          describe("when the token owner has enough balance", () => {
            const amount = initialSupply;

            it("transfers the requested amount", async () => {
              await tokenFN()
                .connect(spender)
                .transferFrom(tokenOwner.address, to.address, amount);
              expect(await tokenFN().balanceOf(tokenOwner.address)).to.equal(0);
              expect(await tokenFN().balanceOf(to.address)).to.equal(amount);
            });

            it("decreases the spender allowance", async () => {
              await tokenFN()
                .connect(spender)
                .transferFrom(tokenOwner.address, to.address, amount);
              expect(
                await tokenFN().allowance(tokenOwner.address, spender.address)
              ).to.equal(0);
            });

            it("emits a transfer event", async () => {
              const token = tokenFN();
              await expect(
                token
                  .connect(spender)
                  .transferFrom(tokenOwner.address, to.address, amount)
              )
                .to.emit(token, "Transfer")
                .withNamedArgs({
                  from: tokenOwner.address,
                  to: to.address,
                  value: amount,
                });
            });

            it("emits an approval event", async () => {
              const token = tokenFN();
              const allowance = await token.allowance(
                tokenOwner.address,
                spender.address
              );
              await expect(
                token
                  .connect(spender)
                  .transferFrom(tokenOwner.address, to.address, amount)
              )
                .to.emit(token, "Approval")
                .withNamedArgs({
                  owner: tokenOwner.address,
                  spender: spender.address,
                  value: allowance.sub(amount),
                });
            });
          });

          describe("when the token owner does not have enough balance", () => {
            const amount = initialSupply;

            beforeEach("reducing balance", async () => {
              await tokenFN().connect(tokenOwner).transfer(to.address, 1);
            });

            it("reverts", async () => {
              await expect(
                tokenFN()
                  .connect(spender)
                  .transferFrom(tokenOwner.address, to.address, amount)
              ).to.be.revertedWith(
                `${errorPrefix}: transfer amount exceeds balance`
              );
            });
          });
        });

        describe("when the spender does not have enough allowance", () => {
          const allowance = initialSupply.sub(1);

          beforeEach(async () => {
            await tokenFN()
              .connect(tokenOwner)
              .approve(spender.address, allowance);
          });

          describe("when the token owner has enough balance", () => {
            const amount = initialSupply;

            it("reverts", async () => {
              await expect(
                tokenFN()
                  .connect(spender)
                  .transferFrom(tokenOwner.address, to.address, amount)
              ).to.be.revertedWith(`${errorPrefix}: insufficient allowance`);
            });
          });

          describe("when the token owner does not have enough balance", () => {
            const amount = allowance;

            beforeEach("reducing balance", async () => {
              await tokenFN().connect(tokenOwner).transfer(to.address, 2);
            });

            it("reverts", async () => {
              await expect(
                tokenFN()
                  .connect(spender)
                  .transferFrom(tokenOwner.address, to.address, amount)
              ).to.be.revertedWith(
                `${errorPrefix}: transfer amount exceeds balance`
              );
            });
          });
        });

        describe("when the spender has unlimited allowance", () => {
          beforeEach(async () => {
            await tokenFN()
              .connect(initialHolder)
              .approve(spender.address, MaxUint256);
          });

          it("does not decrease the spender allowance", async () => {
            await tokenFN()
              .connect(spender)
              .transferFrom(tokenOwner.address, to.address, 1);

            expect(
              await tokenFN().allowance(tokenOwner.address, spender.address)
            ).to.equal(MaxUint256);
          });

          it("does not emit an approval event", async () => {
            const token = tokenFN();
            await expect(
              token
                .connect(spender)
                .transferFrom(tokenOwner.address, to.address, 1)
            ).to.not.emit(token, "Approval");
          });
        });
      });

      describe("when the recipient is the zero address", () => {
        const amount = initialSupply;
        const to = AddressZero;

        beforeEach(async () => {
          await tokenFN().connect(tokenOwner).approve(spender.address, amount);
        });

        it("reverts", async () => {
          await expect(
            tokenFN()
              .connect(spender)
              .transferFrom(tokenOwner.address, to, amount)
          ).to.be.revertedWith(`${errorPrefix}: transfer to the zero address`);
        });
      });
    });

    describe("when the token owner is the zero address", () => {
      const amount = 0;
      const tokenOwner = AddressZero;
      const to = recipient;

      it("reverts", async () => {
        await expect(
          tokenFN()
            .connect(spender)
            .transferFrom(tokenOwner, to.address, amount)
        ).to.be.revertedWith(`${errorPrefix}: approve from the zero address`);
      });
    });
  });

  describe("approve", () => {
    shouldBehaveLikeERC20Approve(
      tokenFN,
      errorPrefix,
      initialHolder,
      recipient,
      initialSupply
    );
  });
};

export const shouldBehaveLikeERC20Transfer = (
  tokenFN: () => ERC20Upgradeable,
  errorPrefix: string,
  from: Wallet,
  to: Wallet,
  balance: BigNumber
) => {
  describe("when the recipient is not the zero address", () => {
    describe("when the sender does not have enough balance", () => {
      const amount = balance.add(1);

      it("reverts", async () => {
        await expect(
          tokenFN().connect(from).transfer.call(this, to.address, amount)
        ).to.be.revertedWith(`${errorPrefix}: transfer amount exceeds balance`);
      });
    });

    describe("when the sender transfers all balance", () => {
      const amount = balance;

      it("transfers the requested amount", async () => {
        await tokenFN().connect(from).transfer.call(this, to.address, amount);

        expect(await tokenFN().balanceOf(from.address)).to.equal("0");

        expect(await tokenFN().balanceOf(to.address)).to.equal(amount);
      });

      it("emits a transfer event", async () => {
        const token = tokenFN();
        await expect(
          token.connect(from).transfer.call(this, to.address, amount)
        )
          .to.emit(token, "Transfer")
          .withNamedArgs({
            from: from.address,
            to: to.address,
            value: amount,
          });
      });
    });

    describe("when the sender transfers zero tokens", () => {
      const amount = BigNumber.from(0);

      it("transfers the requested amount", async () => {
        await tokenFN().connect(from).transfer.call(this, to.address, amount);

        expect(await tokenFN().balanceOf(from.address)).to.equal(balance);

        expect(await tokenFN().balanceOf(to.address)).to.equal("0");
      });

      it("emits a transfer event", async () => {
        const token = tokenFN();
        await expect(
          token.connect(from).transfer.call(this, to.address, amount)
        )
          .to.emit(token, "Transfer")
          .withNamedArgs({
            from: from.address,
            to: to.address,
            value: amount,
          });
      });
    });
  });

  describe("when the recipient is the zero address", () => {
    it("reverts", async () => {
      await expect(
        tokenFN().connect(from).transfer.call(this, AddressZero, balance)
      ).to.be.revertedWith(`${errorPrefix}: transfer to the zero address`);
    });
  });
};

export const shouldBehaveLikeERC20Approve = (
  tokenFN: () => ERC20Upgradeable,
  errorPrefix: string,
  owner: Wallet,
  spender: Wallet,
  supply: BigNumber
) => {
  describe("when the spender is not the zero address", () => {
    describe("when the sender has enough balance", () => {
      const amount = supply;

      it("emits an approval event", async () => {
        const token = tokenFN();
        await expect(
          token.connect(owner).approve.call(this, spender.address, amount)
        )
          .to.emit(token, "Approval")
          .withNamedArgs({
            owner: owner.address,
            spender: spender.address,
            value: amount,
          });
      });

      describe("when there was no approved amount before", () => {
        it("approves the requested amount", async () => {
          await tokenFN()
            .connect(owner)
            .approve.call(this, spender.address, amount);

          expect(
            await tokenFN().allowance(owner.address, spender.address)
          ).to.equal(amount);
        });
      });

      describe("when the spender had an approved amount", () => {
        beforeEach(async () => {
          await tokenFN()
            .connect(owner)
            .approve.call(this, spender.address, BigNumber.from(1));
        });

        it("approves the requested amount and replaces the previous one", async () => {
          await tokenFN()
            .connect(owner)
            .approve.call(this, spender.address, amount);

          expect(
            await tokenFN().allowance(owner.address, spender.address)
          ).to.equal(amount);
        });
      });
    });

    describe("when the sender does not have enough balance", () => {
      const amount = supply.add(1);

      it("emits an approval event", async () => {
        const token = tokenFN();
        await expect(
          token.connect(owner).approve.call(this, spender.address, amount)
        )
          .to.emit(token, "Approval")
          .withNamedArgs({
            owner: owner.address,
            spender: spender.address,
            value: amount,
          });
      });

      describe("when there was no approved amount before", () => {
        it("approves the requested amount", async () => {
          await tokenFN()
            .connect(owner)
            .approve.call(this, spender.address, amount);

          expect(
            await tokenFN().allowance(owner.address, spender.address)
          ).to.equal(amount);
        });
      });

      describe("when the spender had an approved amount", () => {
        beforeEach(async () => {
          await tokenFN()
            .connect(owner)
            .approve.call(this, spender.address, BigNumber.from(1));
        });

        it("approves the requested amount and replaces the previous one", async () => {
          await tokenFN()
            .connect(owner)
            .approve.call(this, spender.address, amount);

          expect(
            await tokenFN().allowance(owner.address, spender.address)
          ).to.equal(amount);
        });
      });
    });
  });

  describe("when the spender is the zero address", () => {
    it("reverts", async () => {
      await expect(
        tokenFN().connect(owner).approve.call(this, AddressZero, supply)
      ).to.be.revertedWith(`${errorPrefix}: approve to the zero address`);
    });
  });
};
