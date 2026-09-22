const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HealthChain Foundation", function () {
  let healthChain;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const HealthChain = await ethers.getContractFactory("HealthChain");
    healthChain = await HealthChain.deploy();
  });

  it("should deploy successfully and report operational status", async function () {
    expect(await healthChain.isOperational()).to.equal(true);
  });

  it("should have correct initial version", async function () {
    expect(await healthChain.VERSION()).to.equal("1.0.0");
  });
});
