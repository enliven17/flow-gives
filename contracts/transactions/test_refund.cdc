import Crowdfunding from 0x0ee0a7ac3ca6d12c
import FlowToken from 0x7e60df042a9c0868
import FungibleToken from 0x9a0766d93b6608b7

/// Transaction to test refund functionality
/// This transaction requests a refund from a failed project
transaction(projectId: UInt64) {
    
    let contributorVault: &{FungibleToken.Receiver}
    let contributorAddress: Address
    
    prepare(contributor: auth(BorrowValue) &Account) {
        // Get reference to contributor's Flow token vault
        self.contributorVault = contributor.storage.borrow<&{FungibleToken.Receiver}>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow reference to Flow token vault")
        
        self.contributorAddress = contributor.address
    }
    
    execute {
        // Request refund from the project
        Crowdfunding.refundFromProject(
            projectId: projectId,
            contributor: self.contributorAddress,
            contributorVault: self.contributorVault
        )
    }
}
