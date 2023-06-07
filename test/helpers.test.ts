import { ethers, upgrades } from "hardhat";
import { erc20mockBalance } from "./constants.test";
import { AccessControlManager, ERC20Mock, SwETH } from "../typechain-types";
import { Contract, Signer } from "ethers";

interface ProtocolContext {
	swETH: SwETH | Contract;
	manager: AccessControlManager | Contract;
	erc20Mock: ERC20Mock;
	owner: Signer;
	treasuryAccount: Signer;
	depositor: Signer;
}

export async function setupProtocol(): Promise<ProtocolContext> {
	const [owner, treasuryAccount, depositor] = await ethers.getSigners();
	const initializeParams = {
		admin: owner.address,
		swellTreasury: treasuryAccount.address,
	}

	const Manager = await ethers.getContractFactory("AccessControlManager");
	const manager = await upgrades.deployProxy(
		Manager,
		[initializeParams],
		{
			initializer: 'initialize',
			kind: 'transparent',
		}
	);
	await manager.deployed();

	const SwETH = await ethers.getContractFactory("swETH");
	const swETH = await upgrades.deployProxy(
		SwETH,
		[manager.address],
		{
			initializer: 'initialize',
			kind: 'transparent',
		}
	);


	const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
	const erc20Mock = await ERC20Mock.deploy("Mock Token", "MT");
	await erc20Mock.deployed();

	await erc20Mock.mint(owner.address, erc20mockBalance);

	return { swETH, manager, erc20Mock, owner, treasuryAccount, depositor };
}