import Crowdfunding from 0x0ee0a7ac3ca6d12c
import FlowToken from 0x7e60df042a9c0868
import FungibleToken from 0x9a0766d93b6608b7

/// Transaction to test contribution functionality
/// This transaction contributes Flow tokens to a crowdfunding project
transaction(projectId: UInt64, amount: UFix64) {
    
    let paymentVault: @{FungibleToken.Vault}
    let contributorAddress: Address
    
    prepare(contributor: auth(BorrowValue) &Account) {
        // Get contributor's address
        self.contributorAddress = contributor.address
        
        // Get reference to contributor's Flow token vault
        let vaultRef = contributor.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow reference to Flow token vault")
        
        // Withdraw tokens from contributor's vault
        self.paymentVault <- vaultRef.withdraw(amount: amount)
    }
    
    execute {
        // Contribute to the project
        Crowdfunding.contributeToProject(
            projectId: projectId,
            contributor: self.contributorAddress,
            vault: <- self.paymentVault
        )
    }
}
