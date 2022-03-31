import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Contract, ContractFactory } from "ethers";

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Exam contract", function () {

  let price = "10000000000000000"
  let tenPercentsFromPrice = "1000000000000000"

  let timeDelay = 3 * 24 * 60 * 60;

  let owner: SignerWithAddress
  let applicant1: SignerWithAddress
  let applicant2: SignerWithAddress
  let voter1: SignerWithAddress
  let voter2: SignerWithAddress
  let exam: Contract
  let Exam: ContractFactory
  
  beforeEach(async ()=>{
    [owner, applicant1, applicant2, voter1, voter2] = await ethers.getSigners()
    Exam = await ethers.getContractFactory("Exam");
    exam = await Exam.deploy();
    await exam.deployed();
  })

  it("Should return voting", async function () {
    await exam.addVoting([await applicant1.getAddress(), await applicant2.getAddress()])
    expect(await exam.ownerFee()).to.be.equal(BigNumber.from(0))
  })

  it("Should add vote", async() => {
    await exam.addVoting([await applicant1.getAddress(), await applicant2.getAddress()])
    await exam.vote(0, 1, {value:price});
    expect((await exam.getVoting(0))[1][1]).to.be.equal(1);
  })

  it("Should withdraw to the owner", async() => {
    await exam.addVoting([await applicant1.getAddress(), await applicant2.getAddress()])
    await exam.vote(0, 1, {value:price});
    expect(await exam.ownerFee()).to.be.equal(0);
    await increaseTime(timeDelay)

    let applicant2BalanceBefore = await ethers.provider.getBalance(applicant2.address);
    await exam.finish(0);
    expect((await exam.getVoting(0))[2]).to.be.equal(applicant2.address)

    let applicant2BalanceAfter = await ethers.provider.getBalance(applicant2.address);
    expect(applicant2BalanceAfter).to.be.above(applicant2BalanceBefore)

    expect(await exam.ownerFee()).to.be.equal(tenPercentsFromPrice);

    let ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
    await exam.withdraw()
    let ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
    expect(ownerBalanceAfter).to.be.above(ownerBalanceBefore)
  })

  it("Should not finish -- INDEX OUT OF BOUNDS", async() => {
    await exam.addVoting([await applicant1.getAddress(), await applicant2.getAddress()])
    await increaseTime(timeDelay)
    await expect(exam.finish(2)).to.be.revertedWith("INDEX OUT OF BOUNDS")
  })


  it("Should not finish -- ALREADY ARCHIVED", async() => {
    await exam.addVoting([await applicant1.getAddress(), await applicant2.getAddress()])
    await increaseTime(timeDelay)
    await exam.finish(0)
    await expect(exam.finish(0)).to.be.revertedWith("ALREADY ARCHIVED")
  })    

  it("Should not finish -- NOT ENOUGH TIME", async() => {
    await exam.addVoting([await applicant1.getAddress(), await applicant2.getAddress()])
    await expect(exam.finish(0)).to.be.revertedWith("NOT ENOUGH TIME")
  })    


  it("Should not vote -- YOU ALREADY VOTED", async() => {
    await exam.addVoting([await applicant1.getAddress(), await applicant2.getAddress()])
    await exam.vote(0, 1, {value:price});
    await expect(exam.vote(0, 1, {value:price})).to.be.revertedWith("YOU ALREADY VOTED")
  })    

  it("Should not vote -- BAD AMOUNT INPUT", async() => {
    await exam.addVoting([await applicant1.getAddress(), await applicant2.getAddress()])
    await expect(exam.vote(0, 1, {value:"10"})).to.be.revertedWith("BAD AMOUNT INPUT")
  })    

  it("Should not vote -- INDEX OUT OF BOUNDS", async() => {
    await exam.addVoting([await applicant1.getAddress(), await applicant2.getAddress()])
    await expect(exam.vote(4, 1, {value:price})).to.be.revertedWith("INDEX OUT OF BOUNDS")
  })    

  async function increaseTime(seconds: any) {
    await ethers.provider.send("evm_increaseTime", [seconds])
    await ethers.provider.send("evm_mine")
  }

});
