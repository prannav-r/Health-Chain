import React, { useState } from 'react';
import StatusBadge from './StatusBadge.jsx';

export default function ClaimsTable({ claims = [], onApproveClaim, onRejectClaim, isInsurerView = true }) {
  const [processingId, setProcessingId] = useState(null);

  const handleApprove = async (claimId) => {
    setProcessingId(claimId);
    try {
      await onApproveClaim(claimId, 'Verified against verified health records and policy criteria');
    } catch (err) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (claimId) => {
    const reason = prompt('Please specify rejection reason:', 'Claim documentation does not satisfy policy guidelines');
    if (!reason) return;

    setProcessingId(claimId);
    try {
      await onRejectClaim(claimId, reason);
    } catch (err) {
      alert(`Rejection error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (!claims || claims.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '14px' }}>
        No insurance claims recorded.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', background: '#F8FAFC' }}>
            <th style={{ padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Claim ID</th>
            <th style={{ padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Patient</th>
            <th style={{ padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Policy</th>
            <th style={{ padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Amount</th>
            <th style={{ padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Description</th>
            <th style={{ padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Status</th>
            {isInsurerView && (
              <th style={{ padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Adjudication</th>
            )}
          </tr>
        </thead>
        <tbody>
          {claims.map((c) => (
            <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '12px 14px', fontWeight: 600, fontFamily: 'monospace' }}>
                {c.claimCode || `CLM-${c.id}`}
              </td>
              <td style={{ padding: '12px 14px' }}>
                <strong>{c.patientId}</strong>
              </td>
              <td style={{ padding: '12px 14px', color: 'var(--muted)' }}>{c.policyId}</td>
              <td style={{ padding: '12px 14px', fontWeight: 700 }}>₹{c.amount.toLocaleString()}</td>
              <td style={{ padding: '12px 14px', maxWidth: '280px' }}>
                <div>{c.description}</div>
                {c.decisionReason && (
                  <div style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic', marginTop: '3px' }}>
                    Note: {c.decisionReason}
                  </div>
                )}
              </td>
              <td style={{ padding: '12px 14px' }}>
                <StatusBadge
                  status={c.status}
                  type={c.status === 'Approved' ? 'success' : c.status === 'Rejected' ? 'danger' : 'warning'}
                  label={c.status}
                />
              </td>
              {isInsurerView && (
                <td style={{ padding: '12px 14px' }}>
                  {c.status === 'Pending' ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '4px 10px', fontSize: '11px', backgroundColor: 'var(--success)' }}
                        onClick={() => handleApprove(c.id)}
                        disabled={processingId === c.id}
                      >
                        {processingId === c.id ? '...' : 'Approve'}
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--danger)', borderColor: '#FECACA' }}
                        onClick={() => handleReject(c.id)}
                        disabled={processingId === c.id}
                      >
                        {processingId === c.id ? '...' : 'Reject'}
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Resolved</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
