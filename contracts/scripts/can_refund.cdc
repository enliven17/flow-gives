import Crowdfunding from "../Crowdfunding.cdc"

/// Script to check if a project can be refunded
/// Returns true if the project failed to meet its goal and the deadline has passed
access(all) fun main(projectId: UInt64): Bool {
    let projectRef = Crowdfunding.getProject(projectId: projectId)
        ?? panic("Project does not exist")
    
    return projectRef.canRefund()
}
