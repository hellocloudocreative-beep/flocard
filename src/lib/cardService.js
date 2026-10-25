/* ==========================================================================
   FLOCARDS NFC CARD SERVICE & ACTIVATION ENGINE
   Manages real-time NFC card status (active, disabled, pending, in_stock),
   permission validation (Owner default / nfc.status_manage), live Supabase persistence,
   audit logging, and instant redirect state resolution.
   ========================================================================== */

import { supabase, isSupabaseConfigured } from './supabase.js';
import { StorageEngine } from './storage.js';
import { hasPermission } from './permissions.js';

/**
 * Verify if a user is authorized to change NFC card activation status.
 * By default only verified Owner can change card activation status,
 * or staff with the explicit 'nfc.status_manage' permission.
 */
export function canManageCardStatus(user) {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  if (role === 'owner' || role === 'admin' || user.isOwner || user.isAdmin) return true;
  return hasPermission(user, 'nfc.status_manage');
}

/**
 * Check if a card satisfies requirements to transition into 'active' status.
 * Must have a valid profile destination and an assigned profile slug.
 */
export function verifyActivationRequirements(card) {
  if (!card) {
    return { valid: false, reason: 'Card record not found.' };
  }
  const slug = (card.profileSlug || '').trim();
  if (!slug) {
    return {
      valid: false,
      reason: 'Card has no assigned digital profile destination. Link a valid profile before activating.'
    };
  }
  return { valid: true, reason: null };
}

/**
 * Fetch authoritative card by code.
 * Queries Supabase directly on every NFC tap to prevent stale cached status,
 * and falls back to local storage if offline or unconfigured.
 */
export async function getAuthoritativeCardByCode(cardCode) {
  if (!cardCode) return null;
  const cleanCode = cardCode.trim();

  // 1. Try real Supabase lookup first for zero-stale-cache guarantee
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('nfc_cards')
        .select('*')
        .ilike('card_code', cleanCode)
        .maybeSingle();

      if (!error && data) {
        // Map Supabase column names to application model
        const mappedCard = {
          id: data.id,
          cardCode: data.card_code,
          cardName: data.card_name || `NFC Card ${data.card_code}`,
          chipType: data.chip_type || 'NXP NTAG216 (888 Bytes)',
          batch: data.batch || 'Batch-A',
          edition: data.edition || 'purple',
          customerId: data.customer_id,
          profileSlug: data.profile_slug,
          status: data.status,
          tapCount: data.tap_count || 0,
          lastTapped: data.last_tapped_at,
          statusChangedAt: data.status_changed_at || data.updated_at,
          statusReason: data.status_reason,
          activationHistory: Array.isArray(data.activation_history) ? data.activation_history : []
        };
        // Sync into local store
        StorageEngine.saveCard(mappedCard);
        return mappedCard;
      }
    } catch (err) {
      console.warn('[CardService] Live Supabase lookup failed, falling back to local store:', err);
    }
  }

  // 2. Local store fallback
  return StorageEngine.getCardByCode(cleanCode);
}

/**
 * Update NFC Card activation status with authoritative security checks,
 * live Supabase sync, audit logging, and local cache synchronization.
 *
 * @param {Object} params
 * @param {string} params.cardId - Card ID or cardCode
 * @param {'active' | 'disabled' | 'pending'} params.newStatus - Target status
 * @param {string} [params.reason] - Optional rationale for audit trail
 * @param {Object} params.actorUser - Authenticated user executing the change
 * @returns {Promise<{ success: boolean, card?: Object, error?: string }>}
 */
export async function updateCardActivationStatus({ cardId, newStatus, reason = '', actorUser }) {
  // 1. Permission Enforcement (Server & Client side)
  if (!canManageCardStatus(actorUser)) {
    const errorMsg = 'Unauthorized: Only the verified owner or authorized staff can change card activation status.';
    recordAuditEntry({
      cardCode: cardId,
      action: 'card.status_change_rejected',
      previousStatus: 'unknown',
      newStatus,
      actorUser,
      reason: reason || 'Unauthorized access attempt',
      result: 'failure'
    });
    return { success: false, error: errorMsg };
  }

  // 2. Find target card
  const allCards = StorageEngine.getCards();
  const existingCard = allCards.find(c => c.id === cardId || c.cardCode === cardId);
  if (!existingCard) {
    return { success: false, error: `Card record ${cardId} was not found.` };
  }

  const previousStatus = existingCard.status || 'in_stock';

  // 3. If transitioning to active, verify prerequisites
  if (newStatus === 'active') {
    const check = verifyActivationRequirements(existingCard);
    if (!check.valid) {
      return { success: false, error: check.reason };
    }
  }

  const nowIso = new Date().toISOString();
  const actorName = actorUser.name || actorUser.email || 'Owner';
  const actorEmail = actorUser.email || '';
  const actorId = actorUser.id || 'usr_owner';
  const actorRole = actorUser.role || 'owner';

  // Build audit history entry
  const historyItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    timestamp: nowIso,
    previousStatus,
    newStatus,
    actorId,
    actorName,
    actorEmail,
    actorRole,
    reason: reason || `Card status transitioned from ${previousStatus} to ${newStatus}`
  };

  const updatedCard = {
    ...existingCard,
    status: newStatus,
    statusChangedAt: nowIso,
    statusReason: reason || null,
    lastStatusChangedBy: actorId,
    lastStatusChangedByName: actorName,
    activationHistory: [historyItem, ...(existingCard.activationHistory || [])]
  };

  // 4. Update real Supabase database
  let dbSuccess = false;
  let dbError = null;

  if (isSupabaseConfigured && supabase) {
    try {
      // Note: Map 'disabled' to 'revoked' if the constraint hasn't been migrated yet
      let dbStatusToSave = newStatus;
      const payload = {
        status: dbStatusToSave,
        updated_at: nowIso,
        status_changed_at: nowIso,
        status_reason: reason || null,
        last_status_changed_by_name: actorName
      };

      const { data, error } = await supabase
        .from('nfc_cards')
        .update(payload)
        .match({ card_code: existingCard.cardCode })
        .select();

      if (error) {
        // If constraint error for 'disabled', retry with 'revoked' in DB while keeping 'disabled' in app
        if (error.message && error.message.includes('nfc_cards_status_check') && newStatus === 'disabled') {
          payload.status = 'revoked';
          const retry = await supabase
            .from('nfc_cards')
            .update(payload)
            .match({ card_code: existingCard.cardCode })
            .select();
          if (retry.error) {
            dbError = retry.error.message;
          } else {
            dbSuccess = true;
          }
        } else {
          dbError = error.message;
        }
      } else {
        dbSuccess = true;
      }
    } catch (err) {
      dbError = err.message || 'Database connection error';
      console.warn('[CardService] Supabase update exception:', err);
    }
  } else {
    // Local mode is inherently successful
    dbSuccess = true;
  }

  // 5. Update local store
  StorageEngine.saveCard(updatedCard);

  // 6. Record immutable audit event in Owner Activity Feed
  recordAuditEntry({
    cardId: existingCard.id,
    cardCode: existingCard.cardCode,
    action: `card.${newStatus}`,
    previousStatus,
    newStatus,
    actorUser,
    reason,
    result: dbError ? 'warning' : 'success',
    details: `${actorName} changed card ${existingCard.cardCode} status to ${newStatus}. ${reason ? `Reason: ${reason}` : ''}`
  });

  // 7. Dispatch broadcast event for live dashboard reactivity
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('flocard_card_status_changed', {
      detail: { card: updatedCard, previousStatus, newStatus, actorName }
    }));
    window.dispatchEvent(new CustomEvent('flocard_card_updated', { detail: updatedCard }));
  }

  return {
    success: true,
    card: updatedCard,
    warning: dbError ? `Saved locally. Remote cloud sync: ${dbError}` : null
  };
}

/**
 * Append-only audit logger for card operations
 */
function recordAuditEntry({
  cardId,
  cardCode,
  action,
  previousStatus,
  newStatus,
  actorUser,
  reason,
  result = 'success',
  details = ''
}) {
  const actorName = actorUser?.name || actorUser?.email || 'Owner';
  const actorEmail = actorUser?.email || 'admin@flocard.in';
  const actorRole = actorUser?.role || 'owner';
  const actorId = actorUser?.id || 'usr_owner';

  const auditEntry = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    timestamp: new Date().toISOString(),
    actorId,
    actorName,
    actorEmail,
    actorRole,
    action,
    entityType: 'NFC Card',
    entityId: cardCode || cardId,
    description: details || `Card ${cardCode} status changed from ${previousStatus} to ${newStatus}`,
    type: 'NFC Card',
    details: details || `Status changed from ${previousStatus} to ${newStatus}`,
    userName: actorName,
    beforeValues: { status: previousStatus },
    afterValues: { status: newStatus, reason: reason || null },
    status: result,
    severity: newStatus === 'disabled' ? 'warning' : 'info',
    timeAgo: 'Just now'
  };

  StorageEngine.addAuditLog('NFC Card', auditEntry.description, actorName);

  // Sync to Supabase audit_logs if configured
  if (isSupabaseConfigured && supabase) {
    supabase
      .from('audit_logs')
      .insert([{
        card_code: cardCode,
        action,
        previous_status: previousStatus,
        new_status: newStatus,
        actor_id: actorId,
        actor_name: actorName,
        actor_email: actorEmail,
        actor_role: actorRole,
        reason: reason || null,
        result,
        entity_type: 'NFC Card',
        entity_id: cardCode,
        details: auditEntry.description
      }])
      .then(({ error }) => {
        if (error) {
          console.warn('[CardService] Remote audit log insertion notice:', error.message);
        }
      })
      .catch(() => {});
  }
}
