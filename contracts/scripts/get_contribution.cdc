import Crowdfunding from "../Crowdfunding.cdc"

/// Script to get the contribution amount for a specific contributor
/// Returns the amount contributed by the given address, or 0.0 if no contribution found
access(all) fun main(projectId: UInt64, contributor: Address): UFix64 {
    let projectRef = Crowdfunding.getProject(projectId: projectId)
        ?? panic("Project does not exist")
    
    return projectRef.contributions[contributor] ?? 0.0
}
