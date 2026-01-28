import Crowdfunding from 0x0ee0a7ac3ca6d12c
import FlowToken from 0x7e60df042a9c0868
import FungibleToken from 0x9a0766d93b6608b7

/// Transaction to withdraw funds from a successful crowdfunding project
/// This transaction can only be executed by the project creator when:
/// - The funding goal has been met
/// - The deadline has not passed
/// - Funds have not already been withdrawn
transaction(projectId: UInt64) {
    
    let creatorVault: &{FungibleToken.Receiver}
    
    prepare(signer: auth(BorrowValue) &Account) {
        // Get reference to the signer's Flow token vault receiver
        self.creatorVault = signer.storage.borrow<&{FungibleToken.Receiver}>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow reference to the Flow token vault")
    }
    
    execute {
        // Withdraw funds from the project
        Crowdfunding.withdrawFromProject(
            projectId: projectId,
            creatorVault: self.creatorVault
        )
    }
}
