import Crowdfunding from "../Crowdfunding.cdc"

/// Script to get the current status of a project
/// Returns one of: "active", "funded", "expired", or "withdrawn"
access(all) fun main(projectId: UInt64): String {
    let projectRef = Crowdfunding.getProject(projectId: projectId)
        ?? panic("Project does not exist")
    
    return projectRef.getStatus()
}
