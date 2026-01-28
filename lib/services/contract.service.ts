/**
 * ContractService - Manages Flow smart contract interactions
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */

import * as fcl from '@onflow/fcl';
import * as t from '@onflow/types';

export interface CreateProjectParams {
  title: string;
  description: string;
  goal: string;
  deadline: number;
}

export interface ContributeParams {
  projectId: string;
  amount: string;
}

export interface ContractProject {
  id: string;
  creator: string;
  title: string;
  description: string;
  goal: string;
  deadline: number;
  raised: string;
  withdrawn: boolean;
  createdAt: number;
}

export class ContractService {
  private contractAddress: string;

  constructor() {
    this.contractAddress = process.env.NEXT_PUBLIC_CROWDFUNDING_CONTRACT_ADDRESS || '';
  }

  async createProject(params: CreateProjectParams): Promise<string> {
    const txId = await fcl.mutate({
      cadence: `
        import Crowdfunding from ${this.contractAddress}
        
        transaction(title: String, description: String, goal: UFix64, deadline: UFix64) {
          prepare(signer: auth(BorrowValue) &Account) {}
          execute {
            Crowdfunding.createProject(
              title: title,
              description: description,
              goal: goal,
              deadline: deadline
            )
          }
        }
      `,
      args: (arg, t) => [
        arg(params.title, t.String),
        arg(params.description, t.String),
        arg(params.goal, t.UFix64),
        arg(params.deadline.toString(), t.UFix64),
      ],
      limit: 9999,
    });
    return txId;
  }

  async contribute(params: ContributeParams): Promise<string> {
    const txId = await fcl.mutate({
      cadence: `
        import Crowdfunding from ${this.contractAddress}
        import FlowToken from 0x7e60df042a9c0868
        import FungibleToken from 0x9a0766d93b6608b7
        
        transaction(projectId: UInt64, amount: UFix64) {
          let paymentVault: @{FungibleToken.Vault}
          let contributorAddress: Address
          
          prepare(contributor: auth(BorrowValue) &Account) {
            self.contributorAddress = contributor.address
            let vaultRef = contributor.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
              from: /storage/flowTokenVault
            ) ?? panic("Could not borrow vault")
            self.paymentVault <- vaultRef.withdraw(amount: amount)
          }
          
          execute {
            Crowdfunding.contributeToProject(
              projectId: projectId,
              contributor: self.contributorAddress,
              vault: <- self.paymentVault
            )
          }
        }
      `,
      args: (arg, t) => [
        arg(params.projectId, t.UInt64),
        arg(params.amount, t.UFix64),
      ],
      limit: 9999,
    });
    return txId;
  }

  async withdrawFunds(projectId: string): Promise<string> {
    const txId = await fcl.mutate({
      cadence: `
        import Crowdfunding from ${this.contractAddress}
        import FlowToken from 0x7e60df042a9c0868
        import FungibleToken from 0x9a0766d93b6608b7
        
        transaction(projectId: UInt64) {
          let creatorVault: &{FungibleToken.Receiver}
          
          prepare(signer: auth(BorrowValue) &Account) {
            self.creatorVault = signer.storage.borrow<&{FungibleToken.Receiver}>(
              from: /storage/flowTokenVault
            ) ?? panic("Could not borrow vault")
          }
          
          execute {
            Crowdfunding.withdrawFromProject(
              projectId: projectId,
              creatorVault: self.creatorVault
            )
          }
        }
      `,
      args: (arg, t) => [arg(projectId, t.UInt64)],
      limit: 9999,
    });
    return txId;
  }

  async requestRefund(projectId: string): Promise<string> {
    const txId = await fcl.mutate({
      cadence: `
        import Crowdfunding from ${this.contractAddress}
        import FlowToken from 0x7e60df042a9c0868
        import FungibleToken from 0x9a0766d93b6608b7
        
        transaction(projectId: UInt64) {
          let contributorVault: &{FungibleToken.Receiver}
          let contributorAddress: Address
          
          prepare(contributor: auth(BorrowValue) &Account) {
            self.contributorVault = contributor.storage.borrow<&{FungibleToken.Receiver}>(
              from: /storage/flowTokenVault
            ) ?? panic("Could not borrow vault")
            self.contributorAddress = contributor.address
          }
          
          execute {
            Crowdfunding.refundFromProject(
              projectId: projectId,
              contributor: self.contributorAddress,
              contributorVault: self.contributorVault
            )
          }
        }
      `,
      args: (arg, t) => [arg(projectId, t.UInt64)],
      limit: 9999,
    });
    return txId;
  }

  async getProject(projectId: string): Promise<ContractProject | null> {
    try {
      const result = await fcl.query({
        cadence: `
          import Crowdfunding from ${this.contractAddress}
          
          access(all) fun main(projectId: UInt64): {String: AnyStruct}? {
            let projectRef = Crowdfunding.getProject(projectId: projectId)
            if projectRef == nil { return nil }
            let project = projectRef!
            return {
              "id": project.id,
              "creator": project.creator,
              "title": project.title,
              "description": project.description,
              "goal": project.goal,
              "deadline": project.deadline,
              "raised": project.raised,
              "withdrawn": project.withdrawn,
              "createdAt": project.createdAt
            }
          }
        `,
        args: (arg, t) => [arg(projectId, t.UInt64)],
      });
      return result as ContractProject;
    } catch {
      return null;
    }
  }

  async getProjectCount(): Promise<number> {
    const count = await fcl.query({
      cadence: `
        import Crowdfunding from ${this.contractAddress}
        access(all) fun main(): UInt64 {
          return Crowdfunding.getProjectCount()
        }
      `,
      args: () => [],
    });
    return Number(count);
  }

  async canWithdraw(projectId: string): Promise<boolean> {
    const result = await fcl.query({
      cadence: `
        import Crowdfunding from ${this.contractAddress}
        access(all) fun main(projectId: UInt64): Bool {
          let projectRef = Crowdfunding.getProject(projectId: projectId)
          return projectRef?.canWithdraw() ?? false
        }
      `,
      args: (arg, t) => [arg(projectId, t.UInt64)],
    });
    return result as boolean;
  }

  async canRefund(projectId: string): Promise<boolean> {
    const result = await fcl.query({
      cadence: `
        import Crowdfunding from ${this.contractAddress}
        access(all) fun main(projectId: UInt64): Bool {
          let projectRef = Crowdfunding.getProject(projectId: projectId)
          return projectRef?.canRefund() ?? false
        }
      `,
      args: (arg, t) => [arg(projectId, t.UInt64)],
    });
    return result as boolean;
  }

  async waitForTransaction(txId: string, timeout = 60000): Promise<'confirmed' | 'failed'> {
    try {
      await fcl.tx(txId).onceSealed();
      return 'confirmed';
    } catch {
      return 'failed';
    }
  }
}
