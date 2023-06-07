import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { AccessControlManager, ERC20Mock, SwETH } from "../typechain-types";
import { setupProtocol } from "./helpers.test";
import { Contract, Signer, utils } from "ethers";


describe("swETH", function () {
	let swETH: SwETH | Contract;
	let manager: AccessControlManager | Contract;
	let owner: Signer;
	let depositor: Signer;
	let erc20Mock: ERC20Mock;

	beforeEach(async () => {
		const controlManager = await loadFixture(setupProtocol);

		swETH = controlManager.swETH;
		manager = controlManager.manager;
		owner = controlManager.owner;
		depositor = controlManager.depositor;
		erc20Mock = controlManager.erc20Mock;
	});

	describe("Deposit", async function () {
		it("Should be reverted on deposit because address is not in the whitelist", async function () {
			await manager.connect(owner).unpauseCoreMethods();

			await expect(swETH.connect(depositor).deposit()).to.be
				.rejectedWith("NotInWhitelist()");
		});

		it("Should be reverted on deposit because ETH deposit is invalid", async function () {
			await manager.connect(owner).unpauseCoreMethods();
			await swETH.connect(owner).addToWhitelist(depositor.getAddress());

			await expect(swETH.connect(depositor).deposit()).to.be
				.rejectedWith("InvalidETHDeposit()");
		});

		it("Should be reverted on deposit because ETH deposit is invalid", async function () {
			await manager.connect(owner).unpauseCoreMethods();
			await swETH.connect(owner).addToWhitelist(depositor.getAddress());

			await expect(swETH.connect(depositor).deposit()).to.be
				.rejectedWith("InvalidETHDeposit()");
		});

		it("Should be reverted on deposit because ETH deposit is invalid", async function () {
			await manager.connect(owner).unpauseCoreMethods();
			await swETH.connect(owner).addToWhitelist(depositor.getAddress());

			const depositAmount = utils.parseEther("1");

			await expect(swETH.connect(depositor).deposit({ value: depositAmount })).to.be
				.emit(swETH, "ETHDepositReceived")
				.withArgs(await depositor.getAddress(), depositAmount, depositAmount, depositAmount);

			expect(await swETH.balanceOf(await depositor.getAddress())).to.equal(depositAmount);
		});
	});
});