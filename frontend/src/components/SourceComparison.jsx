import React from 'react';
import StatusBadge from './StatusBadge.jsx';

export default function SourceComparison({ sources, validationResult }) {
  if (!sources || sources.length === 0) {
    return (
      <div className="card">
        <p style={{ color: 'var(--muted)' }}>No source data recorded for this date.</p>
      </div>
    );
  }

  const isValid = validationResult?.validated;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 className="card-title" style={{ margin: 0 }}>Multi-Source IoT Device Comparison</h3>
          <p className="card-desc" style={{ margin: '4px 0 0 0' }}>
            Cross-verifying 3 independent fitness telemetry feeds to ensure data integrity
          </p>
        </div>
        <StatusBadge
          status={isValid ? 'Validated' : 'Anomaly'}
          type={isValid ? 'success' : 'danger'}
          label={isValid ? '3/3 Sources Consistent' : 'Tolerance Discrepancy'}
        />
      </div>

      {!isValid && validationResult?.reasons && validationResult.reasons.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid #FECACA',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
            <span>⚠ Integrity Anomaly Detected — Not eligible for on-chain recording:</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#991B1B' }}>
            {validationResult.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: '#F8FAFC' }}>
              <th style={{ padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Source Device</th>
              <th style={{ padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Steps</th>
              <th style={{ padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Heart Rate</th>
              <th style={{ padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Sleep</th>
              <th style={{ padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Calories</th>
              <th style={{ padding: '10px 14px', color: 'var(--muted)', fontWeight: 600 }}>Device Status</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{s.source.includes('Fitbit') ? '⌚' : s.source.includes('Smartwatch') ? '⏱' : '📱'}</span>
                  <span>{s.source}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>{s.steps.toLocaleString()}</td>
                <td style={{ padding: '12px 14px' }}>{s.heartRate} bpm</td>
                <td style={{ padding: '12px 14px' }}>{s.sleepHours} hrs</td>
                <td style={{ padding: '12px 14px' }}>{s.calories.toLocaleString()} kcal</td>
                <td style={{ padding: '12px 14px' }}>
                  <span className="badge badge-success" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    Online
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
