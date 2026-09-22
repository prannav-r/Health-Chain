import React, { useState } from 'react';

export default function ClaimFormModal({ isOpen, onClose, onSubmitClaim, patientId, policyId }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Please provide a valid claim amount');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a description of the claim');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmitClaim({
        patientId,
        policyId,
        amount: Number(amount),
        description: description.trim()
      });
      setAmount('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '480px',
          margin: 0,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="card-title" style={{ margin: 0 }}>Submit Insurance Claim</h3>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: 'var(--muted)' }}
          >
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '14px'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              Patient ID & Policy
            </label>
            <input
              type="text"
              value={`${patientId} (${policyId})`}
              disabled
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                backgroundColor: '#F8FAFC',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              Claim Amount (₹)
            </label>
            <input
              type="number"
              min="100"
              placeholder="e.g. 3500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
              Medical Procedure / Treatment Description
            </label>
            <textarea
              rows="3"
              placeholder="Detail the consultation, treatment, or hospitalisation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting to Blockchain...' : 'Submit Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
