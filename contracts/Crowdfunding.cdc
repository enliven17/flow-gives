import FungibleToken from 0x9a0766d93b6608b7
import FlowToken from 0x7e60df042a9c0868

/// Crowdfunding contract for managing crowdfunding projects on Flow blockchain
/// This contract allows users to create projects, contribute funds, withdraw when goals are met,
/// and request refunds when projects fail to meet their goals.
access(all) contract Crowdfunding {
    
    // ========================================
    // Events
    // ========================================
    
    /// Emitted when a new project is created
    access(all) event ProjectCreated(
        projectId: UInt64,
        creator: Address,
        title: String,
        goal: UFix64,
        deadline: UFix64
    )
    
    /// Emitted when a contribution is made to a project
    access(all) event ContributionMade(
        projectId: UInt64,
        contributor: Address,
        amount: UFix64
    )
    
    /// Emitted when funds are withdrawn from a successful project
    access(all) event FundsWithdrawn(
        projectId: UInt64,
        amount: UFix64
    )
    
    /// Emitted when a refund is processed for a failed project
    access(all) event RefundProcessed(
        projectId: UInt64,
        contributor: Address,
        amount: UFix64
    )
    
    // ========================================
    // Storage Paths
    // ========================================
    
    access(all) let ProjectStoragePath: StoragePath
    access(all) let ProjectPublicPath: PublicPath
    
    // ========================================
    // Contract State
    // ========================================
    
    /// Counter for generating unique project IDs
    access(all) var nextProjectId: UInt64
    
    /// Mapping of project IDs to Project resources
    access(self) let projects: @{UInt64: Project}
    
    // ========================================
    // Project Resource
    // ========================================
    
    /// Project resource representing a crowdfunding project
    /// This resource stores all project data and manages contributions, withdrawals, and refunds
    access(all) resource Project {
        /// Unique identifier for the project
        access(all) let id: UInt64
        
        /// Address of the project creator
        access(all) let creator: Address
        
        /// Project title
        access(all) let title: String
        
        /// Project description
        access(all) let description: String
        
        /// Funding goal amount in Flow tokens
        access(all) let goal: UFix64
        
        /// Project deadline as Unix timestamp
        access(all) let deadline: UFix64
        
        /// Total amount raised so far
        access(all) var raised: UFix64
        
        /// Whether funds have been withdrawn
        access(all) var withdrawn: Bool
        
        /// Timestamp when project was created
        access(all) let createdAt: UFix64
        
        /// Mapping of contributor addresses to their contribution amounts
        access(all) let contributions: {Address: UFix64}
        
        /// Vault to store contributed Flow tokens
        access(self) let vault: @FlowToken.Vault
        
        /// Initialize a new project
        init(
            id: UInt64,
            creator: Address,
            title: String,
            description: String,
            goal: UFix64,
            deadline: UFix64
        ) {
            pre {
                title.length > 0: "Title cannot be empty"
                description.length > 0: "Description cannot be empty"
                goal > 0.0: "Goal must be greater than zero"
                deadline > getCurrentBlock().timestamp: "Deadline must be in the future"
            }
            
            self.id = id
            self.creator = creator
            self.title = title
            self.description = description
            self.goal = goal
            self.deadline = deadline
            self.raised = 0.0
            self.withdrawn = false
            self.createdAt = getCurrentBlock().timestamp
            self.contributions = {}
            self.vault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>()) as! @FlowToken.Vault
        }
        
        /// Record a contribution to the project
        /// @param contributor: Address of the contributor
        /// @param vault: Vault containing the contribution amount
        access(all) fun contribute(contributor: Address, vault: @{FungibleToken.Vault}) {
            pre {
                getCurrentBlock().timestamp < self.deadline: "Project deadline has passed"
                !self.withdrawn: "Funds have already been withdrawn"
                vault.balance > 0.0: "Contribution amount must be greater than zero"
            }
            
            let amount = vault.balance
            
            // Deposit the vault into the project's vault
            self.vault.deposit(from: <- vault)
            
            // Update contribution tracking
            if let existingContribution = self.contributions[contributor] {
                self.contributions[contributor] = existingContribution + amount
            } else {
                self.contributions[contributor] = amount
            }
            
            // Update total raised amount
            self.raised = self.raised + amount
        }
        
        /// Withdraw funds from a successful project
        /// @return Vault containing the withdrawn funds
        access(all) fun withdraw(): @{FungibleToken.Vault} {
            pre {
                self.raised >= self.goal: "Goal not met"
                getCurrentBlock().timestamp < self.deadline: "Deadline has passed"
                !self.withdrawn: "Already withdrawn"
            }
            
            self.withdrawn = true
            let amount = self.vault.balance
            
            return <- self.vault.withdraw(amount: amount)
        }
        
        /// Process a refund for a failed project
        /// @param contributor: Address of the contributor requesting refund
        /// @return Vault containing the refund amount
        access(all) fun refund(contributor: Address): @{FungibleToken.Vault} {
            pre {
                self.raised < self.goal: "Goal was met"
                getCurrentBlock().timestamp >= self.deadline: "Deadline not passed"
                self.contributions.containsKey(contributor): "No contribution found for this address"
            }
            
            let amount = self.contributions[contributor]!
            self.contributions.remove(key: contributor)
            
            return <- self.vault.withdraw(amount: amount)
        }
        
        /// Check if funds can be withdrawn
        /// @return true if withdrawal conditions are met
        access(all) fun canWithdraw(): Bool {
            return self.raised >= self.goal 
                && getCurrentBlock().timestamp < self.deadline 
                && !self.withdrawn
        }
        
        /// Check if refunds can be processed
        /// @return true if refund conditions are met
        access(all) fun canRefund(): Bool {
            return self.raised < self.goal 
                && getCurrentBlock().timestamp >= self.deadline
        }
        
        /// Get the current status of the project
        /// @return Status string: "active", "funded", "expired", or "withdrawn"
        access(all) fun getStatus(): String {
            if self.withdrawn {
                return "withdrawn"
            }
            
            if getCurrentBlock().timestamp >= self.deadline {
                if self.raised >= self.goal {
                    return "funded"
                } else {
                    return "expired"
                }
            }
            
            return "active"
        }
        
        /// Get the vault reference for depositing funds
        /// @return Reference to the project's vault
        access(contract) fun getVaultRef(): &FlowToken.Vault {
            return &self.vault as &FlowToken.Vault
        }
    }
    
    // ========================================
    // Public Functions
    // ========================================
    
    /// Create a new crowdfunding project
    /// @param title: Project title
    /// @param description: Project description
    /// @param goal: Funding goal in Flow tokens
    /// @param deadline: Project deadline as Unix timestamp
    /// @return The ID of the newly created project
    access(all) fun createProject(
        title: String,
        description: String,
        goal: UFix64,
        deadline: UFix64
    ): UInt64 {
        let projectId = self.nextProjectId
        let creator = self.account.address
        
        // Create new project resource
        let project <- create Project(
            id: projectId,
            creator: creator,
            title: title,
            description: description,
            goal: goal,
            deadline: deadline
        )
        
        // Store project in contract
        self.projects[projectId] <-! project
        
        // Increment project ID counter
        self.nextProjectId = self.nextProjectId + 1
        
        // Emit event
        emit ProjectCreated(
            projectId: projectId,
            creator: creator,
            title: title,
            goal: goal,
            deadline: deadline
        )
        
        return projectId
    }
    
    /// Get a reference to a project
    /// @param projectId: The ID of the project
    /// @return Reference to the project, or nil if not found
    access(all) fun getProject(projectId: UInt64): &Project? {
        return &self.projects[projectId] as &Project?
    }
    
    /// Get the total number of projects
    /// @return The count of all projects
    access(all) fun getProjectCount(): UInt64 {
        return self.nextProjectId
    }
    
    /// Contribute to a project
    /// @param projectId: The ID of the project to contribute to
    /// @param contributor: Address of the contributor
    /// @param vault: Vault containing the contribution amount
    access(all) fun contributeToProject(projectId: UInt64, contributor: Address, vault: @{FungibleToken.Vault}) {
        pre {
            self.projects.containsKey(projectId): "Project does not exist"
        }
        
        let amount = vault.balance
        
        // Get project reference and contribute
        let projectRef = &self.projects[projectId] as &Project?
        projectRef!.contribute(contributor: contributor, vault: <- vault)
        
        // Emit event
        emit ContributionMade(
            projectId: projectId,
            contributor: contributor,
            amount: amount
        )
    }
    
    /// Withdraw funds from a successful project
    /// @param projectId: The ID of the project to withdraw from
    /// @param creatorVault: Reference to the creator's Flow token vault receiver
    access(all) fun withdrawFromProject(projectId: UInt64, creatorVault: &{FungibleToken.Receiver}) {
        pre {
            self.projects.containsKey(projectId): "Project does not exist"
        }
        
        // Get project reference
        let projectRef = &self.projects[projectId] as &Project?
        let project = projectRef!
        
        // Withdraw funds from project
        let withdrawnVault <- project.withdraw()
        let amount = withdrawnVault.balance
        
        // Deposit funds to creator's vault
        creatorVault.deposit(from: <- withdrawnVault)
        
        // Emit event
        emit FundsWithdrawn(
            projectId: projectId,
            amount: amount
        )
    }
    
    /// Request a refund from a failed project
    /// @param projectId: The ID of the project to refund from
    /// @param contributor: Address of the contributor requesting refund
    /// @param contributorVault: Reference to the contributor's Flow token vault receiver
    access(all) fun refundFromProject(projectId: UInt64, contributor: Address, contributorVault: &{FungibleToken.Receiver}) {
        pre {
            self.projects.containsKey(projectId): "Project does not exist"
        }
        
        // Get project reference
        let projectRef = &self.projects[projectId] as &Project?
        let project = projectRef!
        
        // Process refund from project
        let refundVault <- project.refund(contributor: contributor)
        let amount = refundVault.balance
        
        // Deposit refund to contributor's vault
        contributorVault.deposit(from: <- refundVault)
        
        // Emit event
        emit RefundProcessed(
            projectId: projectId,
            contributor: contributor,
            amount: amount
        )
    }
    
    // ========================================
    // Contract Initialization
    // ========================================
    
    init() {
        // Initialize storage paths
        self.ProjectStoragePath = /storage/CrowdfundingProjects
        self.ProjectPublicPath = /public/CrowdfundingProjects
        
        // Initialize state
        self.nextProjectId = 1
        self.projects <- {}
    }
}
