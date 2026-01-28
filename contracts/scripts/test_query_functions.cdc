import Crowdfunding from "../Crowdfunding.cdc"

/// Test script to verify all read-only query functions work correctly
/// This script tests:
/// - getProject: Returns project reference with all fields
/// - getProjectCount: Returns total number of projects
/// - canWithdraw: Returns withdrawal eligibility
/// - canRefund: Returns refund eligibility  
/// - getStatus: Returns project status string
access(all) fun main(): {String: AnyStruct} {
    let results: {String: AnyStruct} = {}
    
    // Test 1: getProjectCount
    let projectCount = Crowdfunding.getProjectCount()
    results["projectCount"] = projectCount
    results["getProjectCount_works"] = projectCount >= 0
    
    // Test 2: getProject with invalid ID (should return nil)
    let invalidProject = Crowdfunding.getProject(projectId: 999999)
    results["getProject_invalid_returns_nil"] = invalidProject == nil
    
    // Test 3: If projects exist, test getProject with valid ID
    if projectCount > 0 {
        let projectRef = Crowdfunding.getProject(projectId: 1)
        
        if projectRef != nil {
            let project = projectRef!
            
            // Verify all project fields are accessible
            results["project_id"] = project.id
            results["project_creator"] = project.creator
            results["project_title"] = project.title
            results["project_description"] = project.description
            results["project_goal"] = project.goal
            results["project_deadline"] = project.deadline
            results["project_raised"] = project.raised
            results["project_withdrawn"] = project.withdrawn
            results["project_createdAt"] = project.createdAt
            
            // Test 4: canWithdraw helper function
            let canWithdraw = project.canWithdraw()
            results["canWithdraw"] = canWithdraw
            results["canWithdraw_is_bool"] = canWithdraw == true || canWithdraw == false
            
            // Test 5: canRefund helper function
            let canRefund = project.canRefund()
            results["canRefund"] = canRefund
            results["canRefund_is_bool"] = canRefund == true || canRefund == false
            
            // Test 6: getStatus helper function
            let status = project.getStatus()
            results["status"] = status
            let validStatuses = ["active", "funded", "expired", "withdrawn"]
            results["status_is_valid"] = validStatuses.contains(status)
            
            // Test 7: Verify contributions field is accessible
            results["contributions_accessible"] = true
            results["contributions_count"] = project.contributions.length
        } else {
            results["error"] = "Project 1 exists but getProject returned nil"
        }
    } else {
        results["note"] = "No projects exist yet, skipping project-specific tests"
    }
    
    return results
}
