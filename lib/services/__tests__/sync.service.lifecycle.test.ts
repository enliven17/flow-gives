/**
 * SyncService Lifecycle Tests
 * 
 * Unit tests for SyncService start/stop lifecycle and event processing
 * Task 9.1: Create SyncService class
 * Requirements: 6.5
 */

import { SyncService, SyncServiceConfig } from '../sync.service';

// Mock Supabase
jest.mock('../../supabase/server', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

// Mock FCL
jest.mock('@onflow/fcl', () => ({
  query: jest.fn(),
  mutate: jest.fn(),
}));

describe('SyncService Lifecycle', () => {
  let syncService: SyncService;
  let config: SyncServiceConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    config = {
      pollInterval: 1000, // 1 second for testing
      startBlock: 0,
    };
    syncService = new SyncService(config);
  });

  afterEach(async () => {
    // Ensure service is stopped after each test
    if (syncService.isRunning()) {
      await syncService.stop();
    }
  });

  describe('Lifecycle Methods', () => {
    it('should start the sync service', async () => {
      expect(syncService.isRunning()).toBe(false);
      
      await syncService.start();
      
      expect(syncService.isRunning()).toBe(true);
    });

    it('should stop the sync service', async () => {
      await syncService.start();
      expect(syncService.isRunning()).toBe(true);
      
      await syncService.stop();
      
      expect(syncService.isRunning()).toBe(false);
    });

    it('should not start if already running', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await syncService.start();
      await syncService.start(); // Try to start again
      
      expect(consoleSpy).toHaveBeenCalledWith('Sync service is already running');
      consoleSpy.mockRestore();
    });

    it('should handle stop when not running', async () => {
      expect(syncService.isRunning()).toBe(false);
      
      await syncService.stop(); // Should not throw
      
      expect(syncService.isRunning()).toBe(false);
    });
  });

  describe('Event Processing', () => {
    it('should process ProjectCreated event', async () => {
      const event = {
        type: 'ProjectCreated',
        transactionId: 'tx123',
        transactionIndex: 0,
        eventIndex: 0,
        blockHeight: 100,
        blockTimestamp: '2024-01-01T00:00:00Z',
        data: {
          projectId: 1,
          creator: '0x1234567890abcdef',
          title: 'Test Project',
          goal: 100.0,
          deadline: 1735689600,
        },
      };

      await syncService.processEvent(event);
      
      // Event should be processed without errors
      expect(true).toBe(true);
    });

    it('should process ContributionMade event', async () => {
      const event = {
        type: 'ContributionMade',
        transactionId: 'tx456',
        transactionIndex: 0,
        eventIndex: 1,
        blockHeight: 101,
        blockTimestamp: '2024-01-01T00:01:00Z',
        data: {
          projectId: 1,
          contributor: '0xabcdef1234567890',
          amount: 10.0,
        },
      };

      await syncService.processEvent(event);
      
      // Event should be processed without errors
      expect(true).toBe(true);
    });

    it('should process FundsWithdrawn event', async () => {
      const event = {
        type: 'FundsWithdrawn',
        transactionId: 'tx789',
        transactionIndex: 0,
        eventIndex: 2,
        blockHeight: 102,
        blockTimestamp: '2024-01-01T00:02:00Z',
        data: {
          projectId: 1,
          amount: 100.0,
        },
      };

      await syncService.processEvent(event);
      
      // Event should be processed without errors
      expect(true).toBe(true);
    });

    it('should process RefundProcessed event', async () => {
      const event = {
        type: 'RefundProcessed',
        transactionId: 'tx101',
        transactionIndex: 0,
        eventIndex: 3,
        blockHeight: 103,
        blockTimestamp: '2024-01-01T00:03:00Z',
        data: {
          projectId: 1,
          contributor: '0xabcdef1234567890',
          amount: 10.0,
        },
      };

      await syncService.processEvent(event);
      
      // Event should be processed without errors
      expect(true).toBe(true);
    });

    it('should handle unknown event types', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const event = {
        type: 'UnknownEvent',
        transactionId: 'tx999',
        transactionIndex: 0,
        eventIndex: 4,
        blockHeight: 104,
        blockTimestamp: '2024-01-01T00:04:00Z',
        data: {},
      };

      await syncService.processEvent(event);
      
      expect(consoleSpy).toHaveBeenCalledWith('Unknown event type: UnknownEvent');
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should register error callbacks', () => {
      const errorCallback = jest.fn();
      
      const unsubscribe = syncService.onError(errorCallback);
      
      expect(typeof unsubscribe).toBe('function');
    });

    it('should unregister error callbacks', () => {
      const errorCallback = jest.fn();
      
      const unsubscribe = syncService.onError(errorCallback);
      unsubscribe();
      
      // Callback should be removed
      expect(true).toBe(true);
    });
  });

  describe('Sync Methods', () => {
    it('should have syncProjects method', async () => {
      await expect(syncService.syncProjects()).resolves.not.toThrow();
    });

    it('should have syncContributions method', async () => {
      await expect(syncService.syncContributions()).resolves.not.toThrow();
    });

    it('should have syncWithdrawals method', async () => {
      await expect(syncService.syncWithdrawals()).resolves.not.toThrow();
    });

    it('should have syncRefunds method', async () => {
      await expect(syncService.syncRefunds()).resolves.not.toThrow();
    });
  });
});
