// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Exam is Ownable {

    uint256 ENTRY_FEE = 10000000000000000;
    uint256 public votingPeriodInSeconds = 3 * 24 * 60 * 60; //seconds
    uint256 public ownerFee;

    struct Voting {
        address[] applicants;
        uint256[] votes;
        address winner;
        uint256 endTimestamp;
        uint256 sumEther;
        bool archived;
    }
    mapping(address => mapping(uint256 => bool)) voted;

    mapping(uint256 => Voting) votings;
    uint256 votingCounter;

    function getVoting(uint index) external view returns(address[] memory, uint256[] memory, address, uint256) {
        return (votings[index].applicants, votings[index].votes, votings[index].winner, votings[index].endTimestamp);
    }

    function addVoting(address[] memory applicants) external onlyOwner {
        Voting storage newVoting = votings[votingCounter++];

        newVoting.endTimestamp = block.timestamp + votingPeriodInSeconds;

        for(uint256 i = 0; i < applicants.length; i++){
            newVoting.applicants.push(applicants[i]);
            newVoting.votes.push(0);
        }
    }

    function finish(uint256 votingIndex) external {
        require(!votings[votingIndex].archived, "ALREADY ARCHIVED");
        require(votingIndex < votingCounter, "INDEX OUT OF BOUNDS");
        require(votings[votingIndex].endTimestamp < block.timestamp, "NOT ENOUGH TIME");

        uint256 max = 0;
        address payable winner;
        for (uint i = 0; i < votings[votingIndex].votes.length; i++) {
            if (votings[votingIndex].votes[i] > max) {
                max = votings[votingIndex].votes[i];
                winner = payable(votings[votingIndex].applicants[i]);
            }
        }
        votings[votingIndex].winner = winner;
        winner.transfer(votings[votingIndex].sumEther * 90 / 100);

        ownerFee += votings[votingIndex].sumEther * 10 / 100;

        votings[votingIndex].archived = true;
    }

    function withdraw() external onlyOwner {
        payable(msg.sender).transfer(ownerFee);
        ownerFee = 0;
    }

    function vote(uint256 indexVoting, uint256 indexPerson) external payable {
        require(voted[msg.sender][indexVoting] == false, "YOU ALREADY VOTED");
        require(msg.value == ENTRY_FEE, "BAD AMOUNT INPUT");
        require(indexVoting < votingCounter, "INDEX OUT OF BOUNDS");

        voted[msg.sender][indexVoting] = true;
        votings[indexVoting].votes[indexPerson]++;
        votings[indexVoting].sumEther += msg.value;
    }
}