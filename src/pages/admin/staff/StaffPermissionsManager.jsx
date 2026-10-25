/* ==========================================================================
   FLOCARDS STAFF & ROLE-BASED ACCESS CONTROL (RBAC) MANAGER
   Strictly Owner-Only: Provision staff, assign roles, override permissions,
   toggle active status, and audit access modifications.
   ========================================================================== */

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Sliders,
  Trash2,
  Lock,
  Layers,
  Info,
  Check,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { StorageEngine } from '../../../lib/storage';
import { useAuth } from '../../../context/AuthContext';
import {
  ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  PERMISSION_CATALOG,
  DEFAULT_ROLE_PERMISSIONS
} from '../../../lib/permissions';

export default function StaffPermissionsManager() {
  const { user, isOwner } = useAuth();
  const [staffList, setStaffList] = useState(() => StorageEngine.getAdminAccounts());
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editPermissionsModalUser, setEditPermissionsModalUser] = useState(null);
  const [customPermsDraft, setCustomPermsDraft] = useState([]);
  const [editRoleDraft, setEditRoleDraft] = useState('sales');

  // New Staff Invite Form State
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'sales'
  });
  const [inviteError, setInviteError] = useState('');

  // Confirmation modal for sensitive actions
  const [confirmAction, setConfirmAction] = useState(null);

  const reloadStaff = () => {
    setStaffList(StorageEngine.getAdminAccounts());
  };

  // Guard: Owner only
  if (!isOwner) {
    return (
      <div
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          backgroundColor: '#130B21',
          borderRadius: '16px',
          border: '1px solid #EF444433',
          maxWidth: '680px',
          margin: '40px auto'
        }}
      >
        <ShieldAlert size={48} color="#EF4444" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
          Access Restricted: Platform Owner Only
        </h3>
        <p style={{ color: '#B8AEC8', fontSize: '0.9rem', marginTop: '8px', lineHeight: 1.5 }}>
          Staff administration and permission assignment are strictly reserved for the verified Platform Owner.
        </p>
      </div>
    );
  }

  // Handle Invite / Provision
  const handleInviteSubmit = (e) => {
    e.preventDefault();
    setInviteError('');

    const cleanEmail = inviteForm.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setInviteError('Please provide a valid email address.');
      return;
    }

    if (cleanEmail === 'admin@flocard.in' || cleanEmail === 'hello.flocard@gmail.com') {
      setInviteError('Root owner accounts already exist.');
      return;
    }

    StorageEngine.addAdminAccount({
      email: cleanEmail,
      name: inviteForm.name.trim() || cleanEmail.split('@')[0],
      role: inviteForm.role,
      grantedBy: user?.email || 'admin@flocard.in'
    });

    reloadStaff();
    setInviteModalOpen(false);
    setInviteForm({ name: '', email: '', role: 'sales' });
  };

  // Open Edit Permissions Modal
  const openEditModal = (account) => {
    setEditPermissionsModalUser(account);
    setEditRoleDraft(account.role || 'sales');
    // If account has customPermissions, use them, otherwise copy role defaults
    const currentPerms = account.customPermissions && account.customPermissions.length > 0
      ? [...account.customPermissions]
      : [...(DEFAULT_ROLE_PERMISSIONS[account.role] || [])];
    setCustomPermsDraft(currentPerms);
  };

  // Toggle specific permission checkbox
  const togglePermission = (permId) => {
    setCustomPermsDraft((prev) => {
      if (prev.includes(permId)) {
        return prev.filter((p) => p !== permId);
      } else {
        return [...prev, permId];
      }
    });
  };

  // Reset custom permissions to default for selected role
  const resetToRoleDefaults = (roleKey) => {
    setCustomPermsDraft([...(DEFAULT_ROLE_PERMISSIONS[roleKey] || [])]);
  };

  // Save Permissions
  const savePermissions = () => {
    if (!editPermissionsModalUser) return;
    StorageEngine.updateAdminAccount(
      editPermissionsModalUser.email,
      {
        role: editRoleDraft,
        customPermissions: customPermsDraft
      },
      user
    );
    reloadStaff();
    setEditPermissionsModalUser(null);
  };

  // Toggle Staff Status (Active / Deactivated)
  const toggleStatus = (account) => {
    setConfirmAction({
      type: 'toggleStatus',
      title: account.status === 'deactivated' ? 'Activate Staff Account' : 'Deactivate Staff Account',
      message: `Are you sure you want to ${account.status === 'deactivated' ? 'activate' : 'deactivate'} access for ${account.name} (${account.email})?`,
      account,
      onConfirm: () => {
        StorageEngine.toggleAdminStatus(account.email, user);
        reloadStaff();
        setConfirmAction(null);
      }
    });
  };

  // Revoke Staff
  const revokeStaff = (account) => {
    setConfirmAction({
      type: 'revoke',
      title: 'Revoke All Staff Access',
      message: `Permanently revoke administrative access for ${account.name} (${account.email})? This action cannot be undone.`,
      account,
      onConfirm: () => {
        StorageEngine.revokeAdminAccount(account.email, user);
        reloadStaff();
        setConfirmAction(null);
      }
    });
  };

  // Group permissions by category
  const categorizedPermissions = useMemo(() => {
    const map = {};
    PERMISSION_CATALOG.forEach((p) => {
      if (p.id === 'audit.read' || p.id === 'audit.export' || p.id === 'staff.manage') return; // Strict Owner-only
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    });
    return map;
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(27, 16, 44, 0.95) 0%, rgba(13, 8, 22, 0.98) 100%)',
          border: '1px solid #6B00FF35',
          borderRadius: '18px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #6B00FF 0%, #A855F7 100%)',
                  color: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}
              >
                <ShieldCheck size={13} />
                Owner Privileged
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                Staff Roles & Permissions Governance
              </h2>
            </div>
            <p style={{ color: '#A59BB6', fontSize: '0.86rem', marginTop: '6px', marginBottom: 0 }}>
              Centrally manage staff accounts across 5 core roles: Owner, Sales, Designer, Production, and Accounts.
              Deny-by-default authorization with custom granular permission overrides.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #6B00FF 0%, #8B5CF6 100%)',
              border: 'none',
              color: '#FFFFFF',
              padding: '10px 18px',
              borderRadius: '12px',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 18px rgba(107, 0, 255, 0.35)'
            }}
          >
            <UserPlus size={16} />
            <span>Provision Staff Member</span>
          </button>
        </div>

        {/* Roles Quick Reference */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '10px',
            marginTop: '20px'
          }}
        >
          {Object.entries(ROLES).map(([key, roleVal]) => {
            const label = ROLE_LABELS[roleVal] || roleVal;
            const desc = ROLE_DESCRIPTIONS[roleVal] || '';
            const isRoot = roleVal === 'owner';

            const badgeColor = {
              owner: '#C084FC',
              sales: '#60A5FA',
              designer: '#F472B6',
              production: '#FBBF24',
              accounts: '#34D399'
            }[roleVal] || '#C084FC';

            return (
              <div
                key={key}
                style={{
                  background: '#160E25',
                  border: '1px solid #2B1B44',
                  borderRadius: '12px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: badgeColor }}>
                    {label}
                  </span>
                  {isRoot && (
                    <span style={{ fontSize: '0.68rem', background: '#6B00FF33', color: '#E9D5FF', padding: '1px 6px', borderRadius: '4px' }}>
                      Full Access
                    </span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#9387A6', lineHeight: 1.4 }}>
                  {desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Staff Accounts List */}
      <div
        style={{
          background: '#130B22',
          border: '1px solid #291A42',
          borderRadius: '16px',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
              Registered Staff Accounts ({staffList.length})
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#8F82A4' }}>
              Enforced at UI navigation, API handlers, and backend data services.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {staffList.map((account) => {
            const isSuperOwner = account.role === 'owner';
            const isCurrentUser = account.email.toLowerCase() === user?.email?.toLowerCase();
            const isDeactivated = account.status === 'deactivated';

            const roleBadgeStyle = {
              owner: { bg: '#6B00FF25', color: '#C084FC', border: '#6B00FF50' },
              sales: { bg: '#2563EB25', color: '#60A5FA', border: '#2563EB50' },
              designer: { bg: '#EC489925', color: '#F472B6', border: '#EC489950' },
              production: { bg: '#F59E0B25', color: '#FBBF24', border: '#F59E0B50' },
              accounts: { bg: '#10B98125', color: '#34D399', border: '#10B98150' },
              admin: { bg: '#6B00FF20', color: '#D8B4FE', border: '#6B00FF40' }
            }[account.role] || { bg: '#6B00FF20', color: '#D8B4FE', border: '#6B00FF40' };

            const hasCustomOverrides = account.customPermissions && account.customPermissions.length > 0;

            return (
              <div
                key={account.email}
                style={{
                  background: isDeactivated ? '#0D0817' : '#19102B',
                  border: isDeactivated ? '1px solid #25183B' : '1px solid #332053',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  opacity: isDeactivated ? 0.65 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Left: Avatar & Identity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: isSuperOwner
                        ? 'linear-gradient(135deg, #6B00FF, #A855F7)'
                        : '#281745',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.94rem',
                      border: '1px solid #4E2F80'
                    }}
                  >
                    {account.avatar ? (
                      <img
                        src={account.avatar}
                        alt={account.name}
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      account.name?.charAt(0) || account.email?.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.95rem' }}>
                        {account.name || account.email.split('@')[0]}
                      </span>
                      {isCurrentUser && (
                        <span style={{ fontSize: '0.7rem', background: '#6B00FF35', color: '#D8B4FE', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                          You
                        </span>
                      )}

                      {/* Role Pill */}
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 10px',
                          borderRadius: '12px',
                          background: roleBadgeStyle.bg,
                          color: roleBadgeStyle.color,
                          border: `1px solid ${roleBadgeStyle.border}`,
                          textTransform: 'uppercase'
                        }}
                      >
                        {ROLE_LABELS[account.role] || account.role}
                      </span>

                      {/* Status Pill */}
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: isDeactivated ? '#37415140' : '#10B98120',
                          color: isDeactivated ? '#9CA3AF' : '#34D399',
                          border: isDeactivated ? '1px solid #4B556350' : '1px solid #10B98150'
                        }}
                      >
                        {isDeactivated ? 'Deactivated' : 'Active'}
                      </span>

                      {hasCustomOverrides && (
                        <span style={{ fontSize: '0.7rem', background: '#F59E0B20', color: '#FBBF24', padding: '2px 8px', borderRadius: '10px', border: '1px solid #F59E0B40' }}>
                          Custom Permissions ({account.customPermissions.length})
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '0.78rem', color: '#9387A6' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Mail size={13} />
                        {account.email}
                      </span>
                      {account.grantedAt && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={13} />
                          Added {new Date(account.grantedAt).toLocaleDateString()}
                        </span>
                      )}
                      {account.lastActive && (
                        <span>Last active: {new Date(account.lastActive).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {!isSuperOwner && (
                    <>
                      {/* Edit Role & Permissions */}
                      <button
                        type="button"
                        onClick={() => openEditModal(account)}
                        style={{
                          background: '#24143D',
                          border: '1px solid #48297A',
                          color: '#C4B5FD',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Sliders size={14} />
                        <span>Edit Permissions</span>
                      </button>

                      {/* Toggle Active / Deactivated */}
                      <button
                        type="button"
                        onClick={() => toggleStatus(account)}
                        style={{
                          background: isDeactivated ? '#10B98120' : '#37204F',
                          border: isDeactivated ? '1px solid #10B98140' : '1px solid #5A3587',
                          color: isDeactivated ? '#34D399' : '#D1C4E9',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {isDeactivated ? 'Activate' : 'Deactivate'}
                      </button>

                      {/* Revoke */}
                      <button
                        type="button"
                        onClick={() => revokeStaff(account)}
                        title="Revoke All Access"
                        style={{
                          background: '#EF444415',
                          border: '1px solid #EF444435',
                          color: '#F87171',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: Provision New Staff */}
      {inviteModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#130B22',
              border: '1px solid #482B78',
              borderRadius: '18px',
              width: '100%',
              maxWidth: '520px',
              padding: '28px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Provision Staff Member
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#8F82A4' }}>
                  Grant authorized role-based credentials for staff onboarding.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#9387A6', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {inviteError && (
              <div style={{ background: '#EF444420', border: '1px solid #EF444440', color: '#FCA5A5', padding: '10px 14px', borderRadius: '10px', fontSize: '0.84rem', marginBottom: '16px' }}>
                {inviteError}
              </div>
            )}

            <form onSubmit={handleInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#C4B5FD', fontWeight: 600, marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  placeholder="e.g. Priya Nair"
                  style={{
                    width: '100%',
                    background: '#0B0515',
                    border: '1px solid #362254',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#C4B5FD', fontWeight: 600, marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="e.g. priya.sales@flocard.in"
                  style={{
                    width: '100%',
                    background: '#0B0515',
                    border: '1px solid #362254',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#C4B5FD', fontWeight: 600, marginBottom: '6px' }}>
                  Assign Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#0B0515',
                    border: '1px solid #362254',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    outline: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="sales">Sales Representative</option>
                  <option value="designer">Creative Designer</option>
                  <option value="production">Production & NFC Fulfillment</option>
                  <option value="accounts">Finance & Accounts</option>
                </select>
                <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: '#9387A6' }}>
                  {ROLE_DESCRIPTIONS[inviteForm.role]}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  style={{
                    background: '#1F1530',
                    border: '1px solid #3E2963',
                    color: '#C4B9D8',
                    padding: '10px 18px',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #6B00FF 0%, #8B5CF6 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Confirm Provisioning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Granular Permissions & Role Override */}
      {editPermissionsModalUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#130B22',
              border: '1px solid #482B78',
              borderRadius: '18px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Manage Staff Permissions: {editPermissionsModalUser.name}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#8F82A4' }}>
                  Email: {editPermissionsModalUser.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditPermissionsModalUser(null)}
                style={{ background: 'none', border: 'none', color: '#9387A6', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {/* Role Selector & Reset Defaults */}
            <div
              style={{
                background: '#0B0515',
                border: '1px solid #362254',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#9387A6', fontWeight: 600 }}>
                  Assigned Primary Role:
                </label>
                <select
                  value={editRoleDraft}
                  onChange={(e) => {
                    const newRole = e.target.value;
                    setEditRoleDraft(newRole);
                    resetToRoleDefaults(newRole);
                  }}
                  style={{
                    background: '#19102B',
                    border: '1px solid #4F2E82',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    marginTop: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="sales">Sales Representative</option>
                  <option value="designer">Creative Designer</option>
                  <option value="production">Production & Fulfillment</option>
                  <option value="accounts">Finance & Accounts</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => resetToRoleDefaults(editRoleDraft)}
                style={{
                  background: '#1E1236',
                  border: '1px solid #3F236A',
                  color: '#C4B5FD',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <RotateCcw size={13} />
                <span>Reset to {ROLE_LABELS[editRoleDraft]} Defaults</span>
              </button>
            </div>

            {/* Categorized Permissions Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {Object.entries(categorizedPermissions).map(([category, perms]) => (
                <div
                  key={category}
                  style={{
                    background: '#0E071A',
                    border: '1px solid #281742',
                    borderRadius: '12px',
                    padding: '14px 16px'
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#C084FC', textTransform: 'uppercase', marginBottom: '10px' }}>
                    {category}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                    {perms.map((p) => {
                      const isChecked = customPermsDraft.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            background: isChecked ? '#1C1033' : '#140A24',
                            border: isChecked ? '1px solid #6B00FF50' : '1px solid #271640',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(p.id)}
                            style={{ marginTop: '3px', accentColor: '#6B00FF', cursor: 'pointer' }}
                          />
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isChecked ? '#FFFFFF' : '#A59BB6' }}>
                              {p.label}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#7E7194', marginTop: '2px' }}>
                              {p.description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setEditPermissionsModalUser(null)}
                style={{
                  background: '#1F1530',
                  border: '1px solid #3E2963',
                  color: '#C4B9D8',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePermissions}
                style={{
                  background: 'linear-gradient(135deg, #6B00FF 0%, #8B5CF6 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Check size={16} />
                <span>Save Permissions</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      {confirmAction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#130B22',
              border: '1px solid #EF444455',
              borderRadius: '18px',
              maxWidth: '440px',
              padding: '24px',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#EF4444', marginBottom: '12px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#FFFFFF' }}>
                {confirmAction.title}
              </h3>
            </div>
            <p style={{ color: '#D1C4E9', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 20px' }}>
              {confirmAction.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                style={{
                  background: '#1F1530',
                  border: '1px solid #3E2963',
                  color: '#C4B9D8',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAction.onConfirm}
                style={{
                  background: '#EF4444',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '8px 18px',
                  borderRadius: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
