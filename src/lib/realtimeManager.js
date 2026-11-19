/* ==========================================================================
   CENTRALIZED SUPABASE REALTIME SUBSCRIPTION MANAGER
   Enables zero-latency, cross-account Postgres Changes & Broadcast sync for
   Admins and Supervisors on the Supabase Free Plan with minimal Egress.
   ========================================================================== */

import { supabase, isSupabaseConfigured } from './supabase.js';

class RealtimeSubscriptionManager {
  constructor() {
    this.channel = null;
    this.channelName = 'flocard-central-admin-realtime';
    this.status = 'DISCONNECTED'; // DISCONNECTED, CONNECTING, CONNECTED, ERROR
    this.listeners = new Set();
    this.debounceTimers = new Map();
    this.hasConnectedOnce = false;
    this.subscribedTables = [
      'profiles',
      'orders',
      'nfc_cards',
      'card_designs',
      'invoices',
      'appointments',
      'audit_logs'
    ];
  }

  /**
   * Register a callback listener for realtime database events and broadcasts
   * @param {Function} callback (event) => void
   * @returns {Function} unregister function
   */
  subscribeListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
    }
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all registered listeners of a change
   */
  notifyListeners(eventData) {
    for (const listener of this.listeners) {
      try {
        listener(eventData);
      } catch (err) {
        console.warn('[RealtimeManager] Error in listener callback:', err);
      }
    }
  }

  /**
   * Initialize and attach the centralized Supabase Realtime channel.
   * Ensures singleton subscription with zero duplicate channels.
   */
  init(user) {
    if (!isSupabaseConfigured || !supabase) {
      console.info('[RealtimeManager] Supabase is not configured; running in local mode.');
      return;
    }

    // Only authorized roles (Owner, Admin, Supervisor, Staff) subscribe to the management channel
    const userRole = (user?.role || '').toLowerCase();
    const isAuthorized = ['owner', 'admin', 'supervisor', 'sales', 'designer', 'production', 'accounts'].includes(userRole);
    if (user && !isAuthorized) {
      return;
    }

    if (this.channel) {
      // Channel already initialized
      return;
    }

    this.status = 'CONNECTING';

    try {
      const channel = supabase.channel(this.channelName, {
        config: {
          broadcast: { self: false, ack: true },
          presence: { key: user?.id || user?.email || 'admin-client' }
        }
      });

      // 1. Subscribe to Postgres Changes across all relevant tables (INSERT, UPDATE, DELETE)
      for (const table of this.subscribedTables) {
        channel.on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            this.handlePostgresChange(table, payload);
          }
        );
      }

      // 2. Subscribe to Broadcast channel for instant peer-to-peer admin sync (<50ms)
      channel.on('broadcast', { event: 'flocard_db_change' }, (message) => {
        const payload = message?.payload || {};
        this.notifyListeners({
          source: 'broadcast',
          type: payload.type || 'SYNC_REQUIRED',
          table: payload.table || null,
          record: payload.record || null,
          actor: payload.actor || 'peer_admin',
          timestamp: payload.timestamp || Date.now()
        });
      });

      // 3. Track connection lifecycle and handle reconnects
      channel.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.info('[RealtimeManager] Successfully subscribed to Postgres Changes on:', this.subscribedTables.join(', '));
          const wasDisconnected = this.hasConnectedOnce && this.status !== 'CONNECTED';
          this.status = 'CONNECTED';
          this.hasConnectedOnce = true;

          // If reconnecting after a drop, refetch missed changes immediately
          if (wasDisconnected) {
            console.info('[RealtimeManager] Reconnected. Refetching missed changes...');
            this.debouncedRefetch('ALL', { eventType: 'RECONNECT' });
          }
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[RealtimeManager] Channel state changed to ${status}:`, err?.message || '');
          this.status = 'DISCONNECTED';
        }
      });

      this.channel = channel;
    } catch (err) {
      console.warn('[RealtimeManager] Initialization error:', err?.message || err);
      this.status = 'ERROR';
    }
  }

  /**
   * Handle incoming postgres_changes event with lightweight debouncing
   * to conserve database bandwidth and Supabase Free Plan egress.
   */
  handlePostgresChange(table, payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    // Notify listeners with raw event details
    this.notifyListeners({
      source: 'postgres_changes',
      table,
      eventType, // INSERT, UPDATE, DELETE
      record: newRecord || oldRecord,
      oldRecord: oldRecord || null,
      timestamp: Date.now()
    });

    // Schedule a debounced refetch to avoid duplicate rapid requests
    this.debouncedRefetch(table, { eventType, id: (newRecord || oldRecord)?.id });
  }

  /**
   * Debounce refetch triggers (300ms window) to batch rapid bursts of events
   */
  debouncedRefetch(table, meta = {}) {
    const key = table || 'ALL';
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(key);
      this.notifyListeners({
        source: 'trigger_refetch',
        table: key,
        meta,
        timestamp: Date.now()
      });
    }, 300);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Broadcast an administrative mutation to all other connected Admin/Supervisor sessions.
   * Delivers immediate UI synchronization across tabs and devices without waiting for DB polling.
   */
  broadcast(type, payload = {}) {
    // 1. Cross-tab BroadcastChannel for same-device instant sync
    if (typeof window !== 'undefined' && window.BroadcastChannel) {
      try {
        if (!this.localBus) {
          this.localBus = new BroadcastChannel('flocard_internal_bus');
        }
        this.localBus.postMessage({ type, payload, timestamp: Date.now() });
      } catch (_) {}
    }

    // 2. Global WebSocket broadcast to all other connected Admins and Supervisors
    if (this.channel && this.status === 'CONNECTED') {
      try {
        this.channel.send({
          type: 'broadcast',
          event: 'flocard_db_change',
          payload: {
            type,
            payload,
            timestamp: Date.now()
          }
        }).catch(() => {});
      } catch (_) {}
    }
  }

  /**
   * Gracefully clean up channel on logout or application teardown
   */
  destroy() {
    if (this.channel && supabase) {
      try {
        supabase.removeChannel(this.channel);
      } catch (_) {}
      this.channel = null;
    }
    this.status = 'DISCONNECTED';
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.listeners.clear();
  }
}

// Export singleton instance
export const RealtimeManager = new RealtimeSubscriptionManager();
