import Crowdfunding from "../Crowdfunding.cdc"

/// Script to check if a project can withdraw funds
/// Returns true if the project meets withdrawal conditions:
/// - Funding goal has been met
/// - Deadline has not passed
/// - Funds have not already been withdrawn
access(all) fun main(projectId: UInt64): Bool {
    let projectRef = Crowdfunding.getProject(projectId: projectId)
        ?? panic("Project does not exist")
    
    return projectRef.canWithdraw()
}
