import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { AccessControlManager, ERC20Mock } from "../typechain-types";
import { setupProtocol } from "./helpers.test";
import { erc20mockBalance } from "./constants.test";
import { Contract, Signer } from "ethers";


describe("AccessControlManager", function () {
	let manager: AccessControlManager | Contract;
	let owner: Signer;
	let treasury: Signer;
	let erc20Mock: ERC20Mock;

	beforeEach(async () => {
		const controlManager = await loadFixture(setupProtocol);

		manager = controlManager.manager;
		owner = controlManager.owner;
		treasury = controlManager.treasuryAccount;
		erc20Mock = controlManager.erc20Mock;
	});

	it("Should check all state changes are right after deployment ", async function () {
		expect(await manager.SwellTreasury()).to.equal(await treasury.getAddress());
		expect(await manager.coreMethodsPaused()).to.be.true;
		expect(await manager.botMethodsPaused()).to.be.true;
		expect(await manager.operatorMethodsPaused()).to.be.true;
		expect(await manager.withdrawalsPaused()).to.be.true;
	});

	it("Should transfer and withdraw erc20 tokens", async function () {
		expect(await erc20Mock.balanceOf(manager.address)).equals(0);
		expect(await erc20Mock.balanceOf(await owner.getAddress())).equals(erc20mockBalance);

		await erc20Mock.transfer(manager.address, erc20mockBalance.div(2));

		expect(await erc20Mock.balanceOf(manager.address)).equals(erc20mockBalance.div(2));
		expect(await erc20Mock.balanceOf(await owner.getAddress())).equals(erc20mockBalance.div(2));

		await manager.connect(owner).withdrawERC20(erc20Mock.address);

		expect(await erc20Mock.balanceOf(manager.address)).equals(0);
		expect(await erc20Mock.balanceOf(await owner.getAddress())).equals(erc20mockBalance);
	});

	it("Should revert on withdrawErc20 function", async function () {
		await expect(manager.connect(owner).withdrawERC20(erc20Mock.address)).to.be
			.rejectedWith("NoTokensToWithdraw()");
	});

	it("Should set new swETH address", async function () {
		await expect(manager.connect(owner).setSwETH(erc20Mock.address)).to
			.emit(manager, "UpdatedSwETH")
			.withArgs(erc20Mock.address, ethers.constants.AddressZero);
	});

	it("Should set Deposit manager", async function () {
		await expect(manager.connect(owner).setDepositManager(await owner.getAddress())).to
			.emit(manager, "UpdatedDepositManager")
			.withArgs(await owner.getAddress(), ethers.constants.AddressZero);
	});

	it("Should set Node Operator Manager", async function () {
		await expect(manager.connect(owner).setNodeOperatorRegistry(await owner.getAddress())).to
			.emit(manager, "UpdatedNodeOperatorRegistry")
			.withArgs(await owner.getAddress(), ethers.constants.AddressZero);
	});

	it("Should set Swell Treasury", async function () {
		await expect(manager.connect(owner).setSwellTreasury(await owner.getAddress())).to
			.emit(manager, "UpdatedSwellTreasury")
			.withArgs(await owner.getAddress(), await treasury.getAddress());
	});

	it("Should unpause and pause core methods", async function () {
		await expect(manager.connect(owner).pauseCoreMethods()).to.be
			.rejectedWith("AlreadyPaused()");

		await expect(manager.connect(owner).unpauseCoreMethods()).to
			.emit(manager, "CoreMethodsPause")
			.withArgs(false);

		await expect(manager.connect(owner).unpauseCoreMethods()).to
			.rejectedWith("AlreadyUnpaused()");

		await expect(manager.connect(owner).pauseCoreMethods()).to
			.emit(manager, "CoreMethodsPause")
			.withArgs(true);
	});

});