pragma circom 2.0.0;

include "comparators.circom";

template ScoreVerifier(threshold) {
   
    signal input score;          
    signal input userAddress;    
    
   
    signal output isEligible;    

    component geq = GreaterEqualThan(32);
    
    geq.in[0] <== score;
    geq.in[1] <== threshold;

    isEligible <== geq.out;
    
    isEligible === 1;
}

component main {public [userAddress]} = ScoreVerifier(25);