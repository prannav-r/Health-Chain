import React from 'react';

export default function MetricCard({ title, value, unit, icon, subtitle, qualifiesDiscount }) {
  return (
    <div
      className="card"
      style={{
        margin: 0,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
            <span style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)' }}>
              {value !== undefined && value !== null ? value.toLocaleString() : '—'}
            </span>
            {unit && <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>{unit}</span>}
          </div>
        </div>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}
        >
          {icon}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{subtitle || 'Consensus average'}</span>
        {qualifiesDiscount !== undefined && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '999px',
              backgroundColor: qualifiesDiscount ? '#DCFCE7' : '#F1F5F9',
              color: qualifiesDiscount ? '#15803D' : '#64748B'
            }}
          >
            {qualifiesDiscount ? '★ Discount Qualified' : 'Standard'}
          </span>
        )}
      </div>
    </div>
  );
}
