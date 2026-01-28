import Crowdfunding from 0x0ee0a7ac3ca6d12c

/// Script to get project details
access(all) fun main(projectId: UInt64): ProjectInfo? {
    let projectRef = Crowdfunding.getProject(projectId: projectId)
    
    if projectRef == nil {
        return nil
    }
    
    let project = projectRef!
    
    return ProjectInfo(
        id: project.id,
        creator: project.creator,
        title: project.title,
        description: project.description,
        goal: project.goal,
        deadline: project.deadline,
        raised: project.raised,
        withdrawn: project.withdrawn,
        createdAt: project.createdAt,
        status: project.getStatus()
    )
}

access(all) struct ProjectInfo {
    access(all) let id: UInt64
    access(all) let creator: Address
    access(all) let title: String
    access(all) let description: String
    access(all) let goal: UFix64
    access(all) let deadline: UFix64
    access(all) let raised: UFix64
    access(all) let withdrawn: Bool
    access(all) let createdAt: UFix64
    access(all) let status: String
    
    init(
        id: UInt64,
        creator: Address,
        title: String,
        description: String,
        goal: UFix64,
        deadline: UFix64,
        raised: UFix64,
        withdrawn: Bool,
        createdAt: UFix64,
        status: String
    ) {
        self.id = id
        self.creator = creator
        self.title = title
        self.description = description
        self.goal = goal
        self.deadline = deadline
        self.raised = raised
        self.withdrawn = withdrawn
        self.createdAt = createdAt
        self.status = status
    }
}
