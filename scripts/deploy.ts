import { ethers } from "hardhat";

async function main() {
 
  const Exam = await ethers.getContractFactory("Exam");
  const exam = await Exam.deploy();
  await exam.deployed();

  console.log("Address:", exam.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
