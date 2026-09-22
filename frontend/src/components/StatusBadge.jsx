import React from 'react';

export default function StatusBadge({ status, type, label }) {
  let badgeClass = 'badge-warning';
  let dotColor = '#D97706';
  let text = label || status;

  if (type === 'success' || status === 'Validated' || status === 'Active' || status === 'Confirmed' || status === 'Granted') {
    badgeClass = 'badge-success';
    dotColor = '#16A34A';
  } else if (type === 'danger' || status === 'Anomaly' || status === 'Rejected' || status === 'Revoked' || status === 'Failed') {
    badgeClass = 'badge-danger';
    dotColor = '#DC2626';
  } else if (type === 'info' || status === 'On-Chain') {
    badgeClass = 'badge-primary';
    dotColor = '#2563EB';
  }

  return (
    <span className={`badge ${badgeClass}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: dotColor,
          display: 'inline-block'
        }}
      />
      {text}
    </span>
  );
}
