import Crowdfunding from 0x0ee0a7ac3ca6d12c

/// Script to verify the Crowdfunding contract deployment
/// This script checks that the contract is deployed and accessible
access(all) fun main(): UInt64 {
    // Get the project count (should be 1 initially since nextProjectId starts at 1)
    let projectCount = Crowdfunding.getProjectCount()
    
    return projectCount
}
