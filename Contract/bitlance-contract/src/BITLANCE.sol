// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "./IBITLANCE.sol";
import "./libCheckAddress.sol";
import "./BITLANCEMANAGEMENT.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BITLANCE is IBITLANCE,BITLANCEMANAGEMENT{
    using ArrayForAddress for address[];
    

    /***
    *Stack variables
    */

    /**
    *Events
    **/
    event RequestJob(address indexed _freelancer,string indexed _jobid);
    event InitJob(address indexed  client,address indexed  freelancer,string jobid,uint256 _amout);

    /**
    *Mappings
    **/

    //mapping jobid to job
    mapping(string jobId => Job)public jobs;

    //approve a freelancer for the job
    mapping(address =>mapping(bool =>Job)) public selected;




function requestJob(string memory _jobid,address client,uint256 amount)external returns(string memory){
    Job  storage _Job = jobs[_jobid];
    if (_Job.client == address(0) ) {
            _Job.client = client;
        }
    if (_Job.amount == 0 && amount > 0) {
            _Job.amount = amount;
        }
    
    _Job.freelancers.push(msg.sender);

    emit RequestJob(msg.sender, _jobid);
    
    return _jobid;


}
    function initializeJob(string memory _jobid,address freelancer,address stabletoken)external onlyAllowedTokens(stabletoken){
         Job  storage _Job = jobs[_jobid];
        require(_Job.freelancers.isAddressAvailable(freelancer), "Freelancer didn't request job");
        require(msg.sender == _Job.client,"only job Owner");
        require(!_Job.isStarted,"already started");
        require(IERC20(stabletoken).transferFrom(msg.sender,address(this),_Job.amount),"failed");
        _Job.selectedFreelancer = freelancer;
        _Job.isStarted = true; 
        _Job.stableCoinToken = stabletoken;     
        emit InitJob(msg.sender, freelancer, _jobid, _Job.amount);



         
         
    

    }
    function releasePayament(string memory _jobid)external {
        Job  storage _Job = jobs[_jobid];
        require(_Job.freelancers.isAddressAvailable(_Job.selectedFreelancer), "Freelancer didn't request job");
        require(msg.sender == _Job.client,"only job Owner");
        require(_Job.isStarted,"already started");
        require(!_Job.isPaid,"already Paid");
        require(!_Job.hasConflict,"Can't release payment due to conflict");
        sendFund(_jobid, _Job.selectedFreelancer);
    }
    function raiseConflict(string memory _jobid)external{
        Job  storage _Job = jobs[_jobid];
        
        require(msg.sender == _Job.client || msg.sender == _Job.selectedFreelancer, "only job Owner or selected Freelancer can raise conflict");
        require(_Job.isStarted,"already started");
        _Job.hasConflict = true;

    }
    function refund(string memory _jobid,address _addr)external onlyManager{
        sendFund(_jobid, _addr);

    }

    function sendFund(string memory _jobid,address _addr)internal{
         Job  storage _Job = jobs[_jobid];
         require(IERC20(_Job.stableCoinToken).transfer(_addr,_Job.amount),"failed");

         _Job.isPaid = true;

    }
    
}