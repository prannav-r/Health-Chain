import React from 'react';

export default function WellnessCard({ points = 0, currentDayQualified }) {
  const milestoneTarget = 500;
  const progressPct = Math.min(100, Math.round((points / milestoneTarget) * 100));

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h3 className="card-title" style={{ margin: 0 }}>Wellness Rewards & Points</h3>
          <p className="card-desc" style={{ margin: '4px 0 0 0' }}>
            Earn verifiable reward points for maintaining healthy physical habits
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '6px',
            backgroundColor: '#EFF6FF',
            padding: '6px 14px',
            borderRadius: '999px'
          }}
        >
          <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>{points}</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>PTS</span>
        </div>
      </div>

      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>
          <span>Milestone Progress ({points}/{milestoneTarget} pts for Tier 1 Premium Rebate)</span>
          <span style={{ fontWeight: 600 }}>{progressPct}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${progressPct}%`,
              height: '100%',
              backgroundColor: 'var(--primary)',
              borderRadius: '4px',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          fontSize: '13px'
        }}
      >
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--border)'
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>🏃 Steps Goal (≥ 10,000)</div>
          <div style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '2px' }}>+100 Wellness Points / day</div>
        </div>
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--border)'
          }}
        >
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>🌙 Sleep Goal (≥ 7 Hours)</div>
          <div style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '2px' }}>+50 Wellness Points / day</div>
        </div>
      </div>
    </div>
  );
}
