import React, { useState } from 'react';
import StatusBadge from './StatusBadge.jsx';

export default function ConsentToggle({ patientId, hasConsent, onToggle, loading }) {
  const defaultInsurerAddress = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null);

  const handleToggle = async () => {
    setUpdating(true);
    setMessage(null);
    try {
      await onToggle(!hasConsent, defaultInsurerAddress);
      setMessage({ type: 'success', text: !hasConsent ? 'Consent granted on-chain!' : 'Consent revoked on-chain!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h3 className="card-title" style={{ margin: 0 }}>Smart Contract Access Consent</h3>
            <StatusBadge
              status={hasConsent ? 'Granted' : 'Revoked'}
              type={hasConsent ? 'success' : 'danger'}
              label={hasConsent ? 'Access Granted' : 'Access Revoked'}
            />
          </div>
          <p className="card-desc" style={{ margin: 0 }}>
            Authorize the insurance company to read your validated health proofs on the Ethereum network.
          </p>
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--muted)', fontFamily: 'monospace' }}>
            Authorized Insurer: <span style={{ color: 'var(--text)' }}>{defaultInsurerAddress}</span>
          </div>
        </div>

        <div>
          <button
            id="consent-toggle-btn"
            className={`btn ${hasConsent ? 'btn-outline' : 'btn-primary'}`}
            onClick={handleToggle}
            disabled={updating || loading}
            style={{ minWidth: '140px' }}
          >
            {updating ? 'Updating...' : hasConsent ? 'Revoke Consent' : 'Grant Consent'}
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            marginTop: '12px',
            fontSize: '13px',
            color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
            fontWeight: 500
          }}
        >
          {message.type === 'success' ? '✔' : '✖'} {message.text}
        </div>
      )}
    </div>
  );
}
