import React from 'react';

export default function PremiumCard({ policy, metricsUsed }) {
  if (!policy) {
    return (
      <div className="card">
        <p style={{ color: 'var(--muted)' }}>Loading policy details...</p>
      </div>
    );
  }

  const basePremium = policy.basePremium || 10000;
  const finalPremium = policy.finalPremium || basePremium;
  const discountAmount = policy.discountAmount || 0;
  const discountPercent = policy.discountPercent || 0;

  const hasStepsDiscount = (metricsUsed?.steps || 0) >= 10000;
  const hasSleepDiscount = (metricsUsed?.sleepHours || 0) >= 7.0;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h3 className="card-title" style={{ margin: 0 }}>Smart Contract Premium Calculation</h3>
          <p className="card-desc" style={{ margin: '4px 0 0 0' }}>
            Policy: <strong>{policy.planName || policy.policyId}</strong>
          </p>
        </div>
        {discountPercent > 0 ? (
          <span className="badge badge-success" style={{ fontSize: '13px', padding: '6px 12px' }}>
            ★ {discountPercent}% Smart Discount Applied
          </span>
        ) : (
          <span className="badge badge-warning" style={{ fontSize: '13px', padding: '6px 12px' }}>
            Standard Base Rate
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text)' }}>
          ₹{finalPremium.toLocaleString()}
        </span>
        <span style={{ fontSize: '14px', color: 'var(--muted)' }}>/ annual premium</span>
        {discountAmount > 0 && (
          <span style={{ fontSize: '14px', color: 'var(--muted)', textDecoration: 'line-through', marginLeft: '8px' }}>
            ₹{basePremium.toLocaleString()}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          padding: '14px',
          backgroundColor: '#F8FAFC',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          fontSize: '13px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px' }}>{hasStepsDiscount ? '✔' : '○'}</span>
          <div>
            <div style={{ fontWeight: 600, color: hasStepsDiscount ? 'var(--success)' : 'var(--muted)' }}>
              10% Step Activity Discount
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {metricsUsed?.steps ? `${metricsUsed.steps.toLocaleString()} steps logged` : 'Requires ≥ 10,000 steps'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px' }}>{hasSleepDiscount ? '✔' : '○'}</span>
          <div>
            <div style={{ fontWeight: 600, color: hasSleepDiscount ? 'var(--success)' : 'var(--muted)' }}>
              5% Restful Sleep Discount
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {metricsUsed?.sleepHours ? `${metricsUsed.sleepHours}h sleep logged` : 'Requires ≥ 7.0 hours sleep'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--muted)' }}>
        ⚡ Computed deterministically by Solidity contract <code style={{ color: 'var(--primary)' }}>HealthChain.calculatePremium()</code>
      </div>
    </div>
  );
}
