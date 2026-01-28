import Crowdfunding from "./Crowdfunding.cdc"
import FlowToken from 0xFlowToken
import FungibleToken from 0xFungibleToken

// Transaction to test contribution functionality
transaction(projectId: UInt64, amount: UFix64) {
    
    let contributorVault: &FlowToken.Vault
    let paymentVault: @FungibleToken.Vault
    
    prepare(contributor: AuthAccount) {
        // Get reference to contributor's Flow token vault
        self.contributorVault = contributor.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow reference to Flow token vault")
        
        // Withdraw tokens from contributor's vault
        self.paymentVault <- self.contributorVault.withdraw(amount: amount)
    }
    
    execute {
        // Contribute to the project
        Crowdfunding.contributeToProject(
            projectId: projectId,
            contributor: self.contributorVault.owner!.address,
            vault: <- self.paymentVault
        )
    }
}
