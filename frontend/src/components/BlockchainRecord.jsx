import React, { useState } from 'react';
import StatusBadge from './StatusBadge.jsx';

export default function BlockchainRecord({
  patientId,
  date,
  validationResult,
  onChainRecord,
  onRecordToBlockchain,
  loading
}) {
  const [submitting, setSubmitting] = useState(false);
  const [txFeedback, setTxFeedback] = useState(null);

  const isValid = validationResult?.validated;
  const isRecordedOnChain = onChainRecord?.exists;
  const canonicalHash = validationResult?.canonicalHash || onChainRecord?.dataHash;

  const handleRecord = async () => {
    setSubmitting(true);
    setTxFeedback(null);
    try {
      const result = await onRecordToBlockchain(date);
      setTxFeedback({
        success: true,
        txHash: result.data?.txHash,
        blockNumber: result.data?.blockNumber
      });
    } catch (err) {
      setTxFeedback({ success: false, error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 className="card-title" style={{ margin: 0 }}>Blockchain Cryptographic Proof</h3>
          <p className="card-desc" style={{ margin: '4px 0 0 0' }}>
            Only deterministic SHA-256 digests are stored on Ethereum (zero personal medical data on-chain)
          </p>
        </div>
        <StatusBadge
          status={isRecordedOnChain ? 'On-Chain' : isValid ? 'Pending' : 'Rejected'}
          type={isRecordedOnChain ? 'info' : isValid ? 'warning' : 'danger'}
          label={isRecordedOnChain ? 'Recorded On-Chain' : isValid ? 'Validated (Off-Chain Only)' : 'Rejected (Integrity Anomaly)'}
        />
      </div>

      <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '16px', border: '1px solid var(--border)', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '13px' }}>
          <span style={{ fontWeight: 600, color: 'var(--muted)' }}>Canonical SHA-256 Digest:</span>
          {canonicalHash && (
            <button
              className="btn btn-outline"
              style={{ padding: '2px 8px', fontSize: '11px' }}
              onClick={() => navigator.clipboard.writeText(canonicalHash)}
            >
              Copy Hash
            </button>
          )}
        </div>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: '13px',
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            padding: '10px 12px',
            borderRadius: '6px',
            wordBreak: 'break-all',
            color: canonicalHash ? 'var(--text)' : 'var(--muted)'
          }}
        >
          {canonicalHash || 'No cryptographic hash generated (Record has unresolved source discrepancies)'}
        </div>

        {onChainRecord?.exists && (
          <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: '12px', color: 'var(--muted)' }}>
            <div>
              Source: <strong style={{ color: 'var(--text)' }}>{onChainRecord.source}</strong>
            </div>
            <div>
              Recorded Timestamp:{' '}
              <strong style={{ color: 'var(--text)' }}>
                {new Date(onChainRecord.timestamp * 1000).toLocaleString()}
              </strong>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
          {isRecordedOnChain ? (
            <span style={{ color: 'var(--success)', fontWeight: 500 }}>
              ✔ Immutably verified on smart contract. Available to consented insurers.
            </span>
          ) : isValid ? (
            <span>Data validated across 3 sources. Ready to broadcast to smart contract.</span>
          ) : (
            <span style={{ color: 'var(--danger)' }}>
              Source variance exceeds tolerance. Invariant: Anomaly records cannot be written on-chain.
            </span>
          )}
        </div>

        {!isRecordedOnChain && isValid && (
          <button
            id="record-to-blockchain-btn"
            className="btn btn-primary"
            onClick={handleRecord}
            disabled={submitting || loading}
          >
            {submitting ? 'Writing to Blockchain...' : 'Record Hash to Blockchain'}
          </button>
        )}
      </div>

      {txFeedback && (
        <div
          style={{
            marginTop: '14px',
            padding: '10px 14px',
            borderRadius: '6px',
            backgroundColor: txFeedback.success ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: txFeedback.success ? '#15803D' : '#991B1B',
            fontSize: '13px'
          }}
        >
          {txFeedback.success ? (
            <div>
              <strong>Transaction Confirmed!</strong> Tx Hash:{' '}
              <span style={{ fontFamily: 'monospace' }}>{txFeedback.txHash}</span>
              {txFeedback.blockNumber && <span> (Block #{txFeedback.blockNumber})</span>}
            </div>
          ) : (
            <div>
              <strong>Transaction Failed:</strong> {txFeedback.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
