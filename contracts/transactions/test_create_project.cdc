import Crowdfunding from 0x0ee0a7ac3ca6d12c

/// Transaction to test creating a project
/// This verifies that the createProject function works correctly
transaction(title: String, description: String, goal: UFix64, deadline: UFix64) {
    
    prepare(signer: auth(BorrowValue) &Account) {
        // Create a new project
        let projectId = Crowdfunding.createProject(
            title: title,
            description: description,
            goal: goal,
            deadline: deadline
        )
        
        log("Project created with ID: ".concat(projectId.toString()))
    }
    
    execute {
        log("Project creation transaction completed successfully")
    }
}
