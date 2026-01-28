/**
 * Unit tests for WalletService - Auth State Subscriptions
 * 
 * Tests the subscribeToAuthChanges() method implementation
 * Requirements: 2.6
 */

import { WalletService } from '../wallet.service';
import * as fcl from '@onflow/fcl';

// Mock @onflow/fcl
jest.mock('@onflow/fcl', () => ({
  authenticate: jest.fn(),
  unauthenticate: jest.fn(),
  currentUser: {
    subscribe: jest.fn(() => jest.fn()),
    snapshot: jest.fn(),
  },
  query: jest.fn(),
  config: jest.fn(),
}));

describe('WalletService - subscribeToAuthChanges', () => {
  let walletService: WalletService;
  let mockSubscribe: jest.Mock;
  let mockUnsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Setup mock subscribe function
    mockUnsubscribe = jest.fn();
    mockSubscribe = jest.fn(() => mockUnsubscribe);
    (fcl.currentUser.subscribe as jest.Mock) = mockSubscribe;

    walletService = new WalletService({
      appName: 'FlowGives Test',
      network: 'testnet',
    });
  });

  describe('subscribeToAuthChanges', () => {
    it('should call fcl.currentUser.subscribe with callback', () => {
      const callback = jest.fn();
      
      walletService.subscribeToAuthChanges(callback);
      
      expect(fcl.currentUser.subscribe).toHaveBeenCalledWith(callback);
    });

    it('should return unsubscribe function', () => {
      const callback = jest.fn();
      
      const unsubscribe = walletService.subscribeToAuthChanges(callback);
      
      expect(unsubscribe).toBe(mockUnsubscribe);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should notify callback when user connects', () => {
      const callback = jest.fn();
      let subscribedCallback: any;

      // Capture the callback passed to fcl.currentUser.subscribe
      mockSubscribe.mockImplementation((cb: any) => {
        subscribedCallback = cb;
        return mockUnsubscribe;
      });

      walletService.subscribeToAuthChanges(callback);

      // Simulate user connection
      const mockUser = {
        addr: '0x1234567890abcdef',
        loggedIn: true,
      };
      subscribedCallback(mockUser);

      expect(callback).toHaveBeenCalledWith(mockUser);
    });

    it('should notify callback when user disconnects', () => {
      const callback = jest.fn();
      let subscribedCallback: any;

      mockSubscribe.mockImplementation((cb: any) => {
        subscribedCallback = cb;
        return mockUnsubscribe;
      });

      walletService.subscribeToAuthChanges(callback);

      // Simulate user disconnection
      const mockUser = {
        addr: null,
        loggedIn: false,
      };
      subscribedCallback(mockUser);

      expect(callback).toHaveBeenCalledWith(mockUser);
    });

    it('should allow multiple subscriptions', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      walletService.subscribeToAuthChanges(callback1);
      walletService.subscribeToAuthChanges(callback2);
      
      expect(fcl.currentUser.subscribe).toHaveBeenCalledTimes(3); // 1 internal + 2 external
    });

    it('should allow unsubscribing from updates', () => {
      const callback = jest.fn();
      
      const unsubscribe = walletService.subscribeToAuthChanges(callback);
      unsubscribe();
      
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should handle callback receiving user with address', () => {
      const callback = jest.fn();
      let subscribedCallback: any;

      mockSubscribe.mockImplementation((cb: any) => {
        subscribedCallback = cb;
        return mockUnsubscribe;
      });

      walletService.subscribeToAuthChanges(callback);

      const mockUser = {
        addr: '0xabcdef1234567890',
        loggedIn: true,
        cid: 'some-cid',
      };
      subscribedCallback(mockUser);

      expect(callback).toHaveBeenCalledWith(mockUser);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle callback receiving null user', () => {
      const callback = jest.fn();
      let subscribedCallback: any;

      mockSubscribe.mockImplementation((cb: any) => {
        subscribedCallback = cb;
        return mockUnsubscribe;
      });

      walletService.subscribeToAuthChanges(callback);

      subscribedCallback(null);

      expect(callback).toHaveBeenCalledWith(null);
    });

    it('should return no-op function in non-browser environment', () => {
      // Temporarily remove window
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const service = new WalletService({
        appName: 'Test',
        network: 'testnet',
      });

      const callback = jest.fn();
      const unsubscribe = service.subscribeToAuthChanges(callback);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe(); // Should not throw

      // Restore window
      global.window = originalWindow;
    });

    it('should notify multiple callbacks independently', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callbacks: any[] = [];

      // Reset and track all callbacks registered
      mockSubscribe.mockClear();
      mockSubscribe.mockImplementation((cb: any) => {
        callbacks.push(cb);
        return mockUnsubscribe;
      });

      // Create a fresh service to avoid interference from constructor
      const freshService = new WalletService({
        appName: 'Test',
        network: 'testnet',
      });

      freshService.subscribeToAuthChanges(callback1);
      freshService.subscribeToAuthChanges(callback2);

      const mockUser = {
        addr: '0x1234567890abcdef',
        loggedIn: true,
      };

      // Call the second callback (first is internal from constructor)
      callbacks[1](mockUser);
      expect(callback1).toHaveBeenCalledWith(mockUser);
      expect(callback2).not.toHaveBeenCalled();

      // Call the third callback
      callbacks[2](mockUser);
      expect(callback2).toHaveBeenCalledWith(mockUser);
    });

    it('should handle rapid connection state changes', () => {
      const callback = jest.fn();
      let subscribedCallback: any;

      mockSubscribe.mockImplementation((cb: any) => {
        subscribedCallback = cb;
        return mockUnsubscribe;
      });

      walletService.subscribeToAuthChanges(callback);

      // Simulate rapid state changes
      const connectedUser = { addr: '0x1234567890abcdef', loggedIn: true };
      const disconnectedUser = { addr: null, loggedIn: false };

      subscribedCallback(connectedUser);
      subscribedCallback(disconnectedUser);
      subscribedCallback(connectedUser);
      subscribedCallback(disconnectedUser);

      expect(callback).toHaveBeenCalledTimes(4);
      expect(callback).toHaveBeenNthCalledWith(1, connectedUser);
      expect(callback).toHaveBeenNthCalledWith(2, disconnectedUser);
      expect(callback).toHaveBeenNthCalledWith(3, connectedUser);
      expect(callback).toHaveBeenNthCalledWith(4, disconnectedUser);
    });
  });

  describe('internal auth subscription', () => {
    it('should initialize internal subscription on construction', () => {
      // The constructor should have called fcl.currentUser.subscribe once
      expect(fcl.currentUser.subscribe).toHaveBeenCalledTimes(1);
    });

    it('should update internal address state on auth changes', () => {
      let internalCallback: any;

      // Capture the internal callback
      mockSubscribe.mockImplementation((cb: any) => {
        internalCallback = cb;
        return mockUnsubscribe;
      });

      const service = new WalletService({
        appName: 'Test',
        network: 'testnet',
      });

      // Initially no address
      expect(service.getAddress()).toBeNull();

      // Simulate connection
      const mockUser = { addr: '0x1234567890abcdef' };
      internalCallback(mockUser);

      expect(service.getAddress()).toBe('0x1234567890abcdef');

      // Simulate disconnection
      internalCallback({ addr: null });

      expect(service.getAddress()).toBeNull();
    });

    it('should persist session to localStorage on connection', () => {
      let internalCallback: any;
      const mockSetItem = jest.fn();

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(),
          setItem: mockSetItem,
          removeItem: jest.fn(),
        },
        writable: true,
      });

      mockSubscribe.mockImplementation((cb: any) => {
        internalCallback = cb;
        return mockUnsubscribe;
      });

      new WalletService({
        appName: 'Test',
        network: 'testnet',
      });

      const mockUser = { addr: '0x1234567890abcdef' };
      internalCallback(mockUser);

      expect(mockSetItem).toHaveBeenCalledWith(
        'flow_gives_wallet_session',
        expect.stringContaining('0x1234567890abcdef')
      );
    });

    it('should clear session from localStorage on disconnection', () => {
      let internalCallback: any;
      const mockRemoveItem = jest.fn();

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(),
          setItem: jest.fn(),
          removeItem: mockRemoveItem,
        },
        writable: true,
      });

      mockSubscribe.mockImplementation((cb: any) => {
        internalCallback = cb;
        return mockUnsubscribe;
      });

      new WalletService({
        appName: 'Test',
        network: 'testnet',
      });

      internalCallback({ addr: null });

      expect(mockRemoveItem).toHaveBeenCalledWith('flow_gives_wallet_session');
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe from internal subscription on cleanup', () => {
      walletService.cleanup();

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('should handle cleanup when no subscription exists', () => {
      const service = new WalletService({
        appName: 'Test',
        network: 'testnet',
      });

      // Clear the internal subscription
      (service as any).authChangeUnsubscribe = null;

      // Should not throw
      expect(() => service.cleanup()).not.toThrow();
    });
  });
});
