/**
 * SyncService Error Handling and Retry Logic Tests
 * 
 * Tests for task 9.5: Add error handling and retry logic
 * Requirements: 6.7
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

describe('SyncService - Error Handling and Retry Logic (Task 9.5)', () => {
  let syncService: SyncService;

  beforeEach(() => {
    jest.clearAllMocks();
    syncService = new SyncService({
      pollInterval: 30000,
      startBlock: 0,
    });
  });

  afterEach(async () => {
    await syncService.stop();
  });

  describe('Exponential Backoff', () => {
    it('should retry failed operations with exponential backoff', async () => {
      let attemptCount = 0;
      const mockOperation = jest.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        // Succeed on third attempt
      });

      const startTime = Date.now();
      await (syncService as any).retryWithBackoff(mockOperation, 5, 100);
      const endTime = Date.now();

      // Should have been called 3 times (2 failures + 1 success)
      expect(mockOperation).toHaveBeenCalledTimes(3);

      // Should have waited: 100ms (first retry) + 200ms (second retry) = 300ms minimum
      expect(endTime - startTime).toBeGreaterThanOrEqual(300);
    });

    it('should throw error after max retries exceeded', async () => {
      const mockOperation = jest.fn(async () => {
        throw new Error('Persistent failure');
      });

      await expect(
        (syncService as any).retryWithBackoff(mockOperation, 3, 50)
      ).rejects.toThrow('Persistent failure');

      // Should have been called 3 times (all failures)
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff delays', async () => {
      const delays: number[] = [];
      let attemptCount = 0;

      const mockOperation = jest.fn(async () => {
        attemptCount++;
        throw new Error('Always fails');
      });

      // Mock setTimeout to capture delays
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback: any, delay: number) => {
        if (delay > 0) {
          delays.push(delay);
        }
        return originalSetTimeout(callback, 0) as any;
      }) as any;

      try {
        await (syncService as any).retryWithBackoff(mockOperation, 4, 100);
      } catch (error) {
        // Expected to fail
      }

      // Restore setTimeout
      global.setTimeout = originalSetTimeout;

      // Should have exponential delays: 100, 200, 400
      expect(delays).toEqual([100, 200, 400]);
    });

    it('should succeed immediately if operation succeeds on first try', async () => {
      const mockOperation = jest.fn(async () => {
        // Success immediately
      });

      await (syncService as any).retryWithBackoff(mockOperation, 5, 100);

      // Should only be called once
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should log retry attempts', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      let attemptCount = 0;

      const mockOperation = jest.fn(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Temporary failure');
        }
      });

      await (syncService as any).retryWithBackoff(mockOperation, 5, 100);

      // Should log retry attempt
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retry 1/5 after 100ms')
      );

      consoleSpy.mockRestore();
    });

    it('should log success after retries', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      let attemptCount = 0;

      const mockOperation = jest.fn(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
      });

      await (syncService as any).retryWithBackoff(mockOperation, 5, 100);

      // Should log success message
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Sync succeeded after 2 retries')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Error Event Emitter', () => {
    it('should emit errors to registered callbacks', async () => {
      const errorCallback = jest.fn();
      syncService.onError(errorCallback);

      const testError = new Error('Test error');
      (syncService as any).emitError(testError);

      expect(errorCallback).toHaveBeenCalledWith(testError);
    });

    it('should emit errors to multiple callbacks', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      syncService.onError(callback1);
      syncService.onError(callback2);
      syncService.onError(callback3);

      const testError = new Error('Test error');
      (syncService as any).emitError(testError);

      expect(callback1).toHaveBeenCalledWith(testError);
      expect(callback2).toHaveBeenCalledWith(testError);
      expect(callback3).toHaveBeenCalledWith(testError);
    });

    it('should not emit to unregistered callbacks', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      const unsubscribe1 = syncService.onError(callback1);
      syncService.onError(callback2);

      // Unsubscribe first callback
      unsubscribe1();

      const testError = new Error('Test error');
      (syncService as any).emitError(testError);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith(testError);
    });

    it('should handle errors in error callbacks gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const faultyCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = jest.fn();

      syncService.onError(faultyCallback);
      syncService.onError(normalCallback);

      const testError = new Error('Test error');
      (syncService as any).emitError(testError);

      // Both callbacks should be called
      expect(faultyCallback).toHaveBeenCalledWith(testError);
      expect(normalCallback).toHaveBeenCalledWith(testError);

      // Error in callback should be logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in error callback:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Sync Error Logging', () => {
    it('should log sync errors with context', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const testError = new Error('Database connection failed');
      testError.stack = 'Error: Database connection failed\n    at test.ts:10:5';

      (syncService as any).logSyncError('syncProjects', testError);

      // Should log structured error information
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SyncService Error]',
        expect.stringContaining('syncProjects')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SyncService Error]',
        expect.stringContaining('Database connection failed')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should include timestamp in error logs', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const testError = new Error('Test error');
      (syncService as any).logSyncError('syncContributions', testError);

      const loggedData = consoleErrorSpy.mock.calls[0][1];
      const parsedLog = JSON.parse(loggedData);

      expect(parsedLog.timestamp).toBeDefined();
      expect(new Date(parsedLog.timestamp).getTime()).toBeGreaterThan(0);

      consoleErrorSpy.mockRestore();
    });

    it('should include last synced block in error logs', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Set last synced block
      (syncService as any).lastSyncedBlock = 12345;

      const testError = new Error('Test error');
      (syncService as any).logSyncError('syncWithdrawals', testError);

      const loggedData = consoleErrorSpy.mock.calls[0][1];
      const parsedLog = JSON.parse(loggedData);

      expect(parsedLog.lastSyncedBlock).toBe(12345);

      consoleErrorSpy.mockRestore();
    });

    it('should include error stack trace in logs', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const testError = new Error('Test error');
      testError.stack = 'Error: Test error\n    at test.ts:100:10';

      (syncService as any).logSyncError('syncRefunds', testError);

      const loggedData = consoleErrorSpy.mock.calls[0][1];
      const parsedLog = JSON.parse(loggedData);

      expect(parsedLog.stack).toContain('test.ts:100:10');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Integration - Error Handling in Sync Methods', () => {
    it('should log errors when syncProjects fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock fetchEvents to throw error
      jest.spyOn(syncService as any, 'fetchEvents').mockRejectedValue(
        new Error('Network error')
      );

      await expect(syncService.syncProjects()).rejects.toThrow('Network error');

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error syncing projects:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should log errors when syncContributions fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      jest.spyOn(syncService as any, 'fetchEvents').mockRejectedValue(
        new Error('API error')
      );

      await expect(syncService.syncContributions()).rejects.toThrow('API error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error syncing contributions:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should log errors when syncWithdrawals fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      jest.spyOn(syncService as any, 'fetchEvents').mockRejectedValue(
        new Error('Timeout error')
      );

      await expect(syncService.syncWithdrawals()).rejects.toThrow('Timeout error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error syncing withdrawals:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should log errors when syncRefunds fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      jest.spyOn(syncService as any, 'fetchEvents').mockRejectedValue(
        new Error('Database error')
      );

      await expect(syncService.syncRefunds()).rejects.toThrow('Database error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error syncing refunds:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Integration - Start with Error Handling', () => {
    it('should handle errors during initial sync', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const errorCallback = jest.fn();
      
      syncService.onError(errorCallback);

      // Mock syncAll to fail
      jest.spyOn(syncService as any, 'syncAll').mockRejectedValue(
        new Error('Initial sync failed')
      );

      // Mock retryWithBackoff to fail immediately without delays
      jest.spyOn(syncService as any, 'retryWithBackoff').mockRejectedValue(
        new Error('Initial sync failed')
      );

      await syncService.start();

      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Initial sync failed'),
        expect.any(Error)
      );

      // Should emit error
      expect(errorCallback).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should continue running after initial sync failure', async () => {
      jest.spyOn(console, 'error').mockImplementation();
      
      // Mock syncAll to fail initially
      jest.spyOn(syncService as any, 'syncAll').mockRejectedValue(
        new Error('Initial sync failed')
      );

      // Mock retryWithBackoff to fail immediately without delays
      jest.spyOn(syncService as any, 'retryWithBackoff').mockRejectedValue(
        new Error('Initial sync failed')
      );

      await syncService.start();

      // Service should still be running
      expect(syncService.isRunning()).toBe(true);

      jest.spyOn(console, 'error').mockRestore();
    });
  });

  describe('Retry Logic in syncAllWithRetry', () => {
    it('should retry syncAll on failure', async () => {
      const syncAllSpy = jest.spyOn(syncService as any, 'syncAll');
      let callCount = 0;

      syncAllSpy.mockImplementation(async () => {
        callCount++;
        if (callCount < 2) {
          throw new Error('Temporary failure');
        }
        // Succeed on second call
      });

      await (syncService as any).syncAllWithRetry();

      // Should have been called twice (1 failure + 1 success)
      expect(syncAllSpy).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries in syncAllWithRetry', async () => {
      const syncAllSpy = jest.spyOn(syncService as any, 'syncAll');
      
      syncAllSpy.mockRejectedValue(new Error('Persistent failure'));

      // Mock retryWithBackoff to use shorter delays
      const originalRetry = (syncService as any).retryWithBackoff.bind(syncService);
      jest.spyOn(syncService as any, 'retryWithBackoff').mockImplementation(
        async (fn: any) => {
          // Use very short delays for testing
          return originalRetry(fn, 3, 10);
        }
      );

      await expect(
        (syncService as any).syncAllWithRetry()
      ).rejects.toThrow('Persistent failure');

      // Should have been called 3 times (reduced for faster test)
      expect(syncAllSpy).toHaveBeenCalledTimes(3);
    });
  });
});
