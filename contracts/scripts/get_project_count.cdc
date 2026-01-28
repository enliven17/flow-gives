import Crowdfunding from "../Crowdfunding.cdc"

/// Script to get the total number of projects created
/// Returns the count of all projects (including completed/expired ones)
access(all) fun main(): UInt64 {
    return Crowdfunding.getProjectCount()
}
