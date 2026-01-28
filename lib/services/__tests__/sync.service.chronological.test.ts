/**
 * SyncService Chronological Event Processing Tests
 * 
 * Tests for task 9.3: Implement chronological event processing
 * Requirements: 6.6
 */

// Mock supabaseAdmin before importing SyncService
jest.mock('../../supabase/server', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null })),
        })),
      })),
      insert: jest.fn(() => ({ data: null, error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({ data: null, error: null })),
      })),
    })),
  },
}));

import { SyncService } from '../sync.service';

describe('SyncService - Chronological Event Processing (Task 9.3)', () => {
  let syncService: SyncService;

  beforeEach(() => {
    syncService = new SyncService({
      pollInterval: 30000,
      startBlock: 0,
    });
  });

  afterEach(async () => {
    await syncService.stop();
  });

  describe('sortEventsByBlockHeight', () => {
    it('should sort events by block height in ascending order', () => {
      const events = [
        {
          type: 'ProjectCreated',
          transactionId: 'tx3',
          transactionIndex: 0,
          eventIndex: 0,
          blockHeight: 300,
          blockTimestamp: '2024-01-03T00:00:00Z',
          data: { projectId: 3 },
        },
        {
          type: 'ProjectCreated',
          transactionId: 'tx1',
          transactionIndex: 0,
          eventIndex: 0,
          blockHeight: 100,
          blockTimestamp: '2024-01-01T00:00:00Z',
          data: { projectId: 1 },
        },
        {
          type: 'ProjectCreated',
          transactionId: 'tx2',
          transactionIndex: 0,
          eventIndex: 0,
          blockHeight: 200,
          blockTimestamp: '2024-01-02T00:00:00Z',
          data: { projectId: 2 },
        },
      ];

      // Access private method via type assertion
      const sortedEvents = (syncService as any).sortEventsByBlockHeight(events);

      expect(sortedEvents[0].blockHeight).toBe(100);
      expect(sortedEvents[1].blockHeight).toBe(200);
      expect(sortedEvents[2].blockHeight).toBe(300);
      expect(sortedEvents[0].data.projectId).toBe(1);
      expect(sortedEvents[1].data.projectId).toBe(2);
      expect(sortedEvents[2].data.projectId).toBe(3);
    });

    it('should sort events by event index when block heights are equal', () => {
      const events = [
        {
          type: 'ContributionMade',
          transactionId: 'tx1',
          transactionIndex: 0,
          eventIndex: 2,
          blockHeight: 100,
          blockTimestamp: '2024-01-01T00:00:00Z',
          data: { projectId: 1, amount: 300 },
        },
        {
          type: 'ProjectCreated',
          transactionId: 'tx1',
          transactionIndex: 0,
          eventIndex: 0,
          blockHeight: 100,
          blockTimestamp: '2024-01-01T00:00:00Z',
          data: { projectId: 1 },
        },
        {
          type: 'ContributionMade',
          transactionId: 'tx1',
          transactionIndex: 0,
          eventIndex: 1,
          blockHeight: 100,
          blockTimestamp: '2024-01-01T00:00:00Z',
          data: { projectId: 1, amount: 200 },
        },
      ];

      const sortedEvents = (syncService as any).sortEventsByBlockHeight(events);

      expect(sortedEvents[0].eventIndex).toBe(0);
      expect(sortedEvents[1].eventIndex).toBe(1);
      expect(sortedEvents[2].eventIndex).toBe(2);
      expect(sortedEvents[0].type).toBe('ProjectCreated');
      expect(sortedEvents[1].data.amount).toBe(200);
      expect(sortedEvents[2].data.amount).toBe(300);
    });

    it('should handle mixed block heights and event indices correctly', () => {
      const events = [
        {
          type: 'FundsWithdrawn',
          transactionId: 'tx3',
          transactionIndex: 0,
          eventIndex: 0,
          blockHeight: 300,
          blockTimestamp: '2024-01-03T00:00:00Z',
          data: { projectId: 1 },
        },
        {
          type: 'ContributionMade',
          transactionId: 'tx2',
          transactionIndex: 0,
          eventIndex: 1,
          blockHeight: 200,
          blockTimestamp: '2024-01-02T00:00:00Z',
          data: { projectId: 1, amount: 200 },
        },
        {
          type: 'ProjectCreated',
          transactionId: 'tx1',
          transactionIndex: 0,
          eventIndex: 0,
          blockHeight: 100,
          blockTimestamp: '2024-01-01T00:00:00Z',
          data: { projectId: 1 },
        },
        {
          type: 'ContributionMade',
          transactionId: 'tx2',
          transactionIndex: 0,
          eventIndex: 0,
          blockHeight: 200,
          blockTimestamp: '2024-01-02T00:00:00Z',
          data: { projectId: 1, amount: 100 },
        },
      ];

      const sortedEvents = (syncService as any).sortEventsByBlockHeight(events);

      // Should be sorted: block 100, block 200 (event 0), block 200 (event 1), block 300
      expect(sortedEvents[0].blockHeight).toBe(100);
      expect(sortedEvents[0].type).toBe('ProjectCreated');

      expect(sortedEvents[1].blockHeight).toBe(200);
      expect(sortedEvents[1].eventIndex).toBe(0);
      expect(sortedEvents[1].data.amount).toBe(100);

      expect(sortedEvents[2].blockHeight).toBe(200);
      expect(sortedEvents[2].eventIndex).toBe(1);
      expect(sortedEvents[2].data.amount).toBe(200);

      expect(sortedEvents[3].blockHeight).toBe(300);
      expect(sortedEvents[3].type).toBe('FundsWithdrawn');
    });

    it('should handle empty event array', () => {
      const events: any[] = [];
      const sortedEvents = (syncService as any).sortEventsByBlockHeight(events);
      expect(sortedEvents).toEqual([]);
    });

    it('should handle single event', () => {
      const events = [
        {
          type: 'ProjectCreated',
          transactionId: 'tx1',
          transactionIndex: 0,
          eventIndex: 0,
          blockHeight: 100,
          blockTimestamp: '2024-01-01T00:00:00Z',
          data: { projectId: 1 },
        },
      ];

      const sortedEvents = (syncService as any).sortEventsByBlockHeight(events);
      expect(sortedEvents).toEqual(events);
    });

    it('should not mutate original array', () => {
      const events = [
        {
          type: 'ProjectCreated',
          transactionId: 'tx2',
          transactionIndex: 0,
          eventIndex: 0,
          blockHeight: 200,
          blockTimestamp: '2024-01-02T00:00:00Z',
          data: { projectId: 2 },
        },
        {
          type: 'ProjectCreated',
          transactionId: 'tx1',
          transactionIndex: 0,
          eventIndex: 0,
          blockHeight: 100,
          blockTimestamp: '2024-01-01T00:00:00Z',
          data: { projectId: 1 },
        },
      ];

      const originalFirstEvent = events[0];
      const sortedEvents = (syncService as any).sortEventsByBlockHeight(events);

      // Original array should not be modified
      expect(events[0]).toBe(originalFirstEvent);
      expect(events[0].blockHeight).toBe(200);

      // Sorted array should be different
      expect(sortedEvents[0].blockHeight).toBe(100);
    });
  });

  describe('processEvent - last synced block tracking', () => {
    it('should update lastSyncedBlock when processing events', async () => {
      const event = {
        type: 'ProjectCreated',
        transactionId: 'tx1',
        transactionIndex: 0,
        eventIndex: 0,
        blockHeight: 150,
        blockTimestamp: '2024-01-01T00:00:00Z',
        data: {
          projectId: 1,
          creator: '0x1234567890abcdef',
          title: 'Test Project',
          goal: 1000,
          deadline: Date.now() / 1000 + 86400,
        },
      };

      // Initial lastSyncedBlock should be 0 (from startBlock config)
      expect((syncService as any).lastSyncedBlock).toBe(0);

      // Process event (will fail due to missing database, but should update lastSyncedBlock)
      try {
        await syncService.processEvent(event);
      } catch (error) {
        // Expected to fail due to database not being available in test
      }

      // lastSyncedBlock should be updated
      expect((syncService as any).lastSyncedBlock).toBe(150);
    });

    it('should not update lastSyncedBlock if event block is lower', async () => {
      // Set initial lastSyncedBlock to 200
      (syncService as any).lastSyncedBlock = 200;

      const event = {
        type: 'ProjectCreated',
        transactionId: 'tx1',
        transactionIndex: 0,
        eventIndex: 0,
        blockHeight: 100,
        blockTimestamp: '2024-01-01T00:00:00Z',
        data: {
          projectId: 1,
          creator: '0x1234567890abcdef',
          title: 'Test Project',
          goal: 1000,
          deadline: Date.now() / 1000 + 86400,
        },
      };

      try {
        await syncService.processEvent(event);
      } catch (error) {
        // Expected to fail due to database not being available in test
      }

      // lastSyncedBlock should remain 200
      expect((syncService as any).lastSyncedBlock).toBe(200);
    });

    it('should update lastSyncedBlock to highest block processed', async () => {
      const events = [
        {
          type: 'ProjectCreated',
          transactionId: 'tx1',
          transactionIndex: 0,
          eventIndex: 0,
          blockHeight: 100,
          blockTimestamp: '2024-01-01T00:00:00Z',
          data: {
            projectId: 1,
            creator: '0x1234567890abcdef',
            title: 'Test Project 1',
            goal: 1000,
            deadline: Date.now() / 1000 + 86400,
          },
        },
        {
          type: 'ProjectCreated',
          transactionId: 'tx2',
          transactionIndex: 0,
          eventIndex: 0,
          blockHeight: 250,
          blockTimestamp: '2024-01-02T00:00:00Z',
          data: {
            projectId: 2,
            creator: '0x1234567890abcdef',
            title: 'Test Project 2',
            goal: 2000,
            deadline: Date.now() / 1000 + 86400,
          },
        },
        {
          type: 'ProjectCreated',
          transactionId: 'tx3',
          transactionIndex: 0,
          eventIndex: 0,
          blockHeight: 150,
          blockTimestamp: '2024-01-01T12:00:00Z',
          data: {
            projectId: 3,
            creator: '0x1234567890abcdef',
            title: 'Test Project 3',
            goal: 1500,
            deadline: Date.now() / 1000 + 86400,
          },
        },
      ];

      for (const event of events) {
        try {
          await syncService.processEvent(event);
        } catch (error) {
          // Expected to fail due to database not being available in test
        }
      }

      // lastSyncedBlock should be 250 (highest block)
      expect((syncService as any).lastSyncedBlock).toBe(250);
    });
  });

  describe('Integration - chronological processing in sync methods', () => {
    it('should call sortEventsByBlockHeight in syncProjects', async () => {
      const sortSpy = jest.spyOn(syncService as any, 'sortEventsByBlockHeight');

      try {
        await syncService.syncProjects();
      } catch (error) {
        // Expected to fail due to fetchEvents returning empty array
      }

      expect(sortSpy).toHaveBeenCalled();
    });

    it('should call sortEventsByBlockHeight in syncContributions', async () => {
      const sortSpy = jest.spyOn(syncService as any, 'sortEventsByBlockHeight');

      try {
        await syncService.syncContributions();
      } catch (error) {
        // Expected to fail due to fetchEvents returning empty array
      }

      expect(sortSpy).toHaveBeenCalled();
    });

    it('should call sortEventsByBlockHeight in syncWithdrawals', async () => {
      const sortSpy = jest.spyOn(syncService as any, 'sortEventsByBlockHeight');

      try {
        await syncService.syncWithdrawals();
      } catch (error) {
        // Expected to fail due to fetchEvents returning empty array
      }

      expect(sortSpy).toHaveBeenCalled();
    });

    it('should call sortEventsByBlockHeight in syncRefunds', async () => {
      const sortSpy = jest.spyOn(syncService as any, 'sortEventsByBlockHeight');

      try {
        await syncService.syncRefunds();
      } catch (error) {
        // Expected to fail due to fetchEvents returning empty array
      }

      expect(sortSpy).toHaveBeenCalled();
    });
  });
});
