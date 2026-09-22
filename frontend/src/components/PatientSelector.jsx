import React from 'react';

export default function PatientSelector({
  patients = [],
  selectedPatientId,
  onSelectPatient,
  availableDates = [],
  selectedDate,
  onSelectDate,
  currentPatient
}) {
  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Active Demo Patient
          </span>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
            {patients.map((p) => (
              <button
                key={p.id}
                id={`select-patient-${p.id}`}
                className={`btn ${selectedPatientId === p.id ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 14px', fontSize: '13px' }}
                onClick={() => onSelectPatient(p.id)}
              >
                <strong>{p.id}</strong>: {p.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Telemetry Date
          </span>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
            {availableDates.map((d) => (
              <button
                key={d}
                id={`select-date-${d}`}
                className={`btn ${selectedDate === d ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 12px', fontSize: '13px' }}
                onClick={() => onSelectDate(d)}
              >
                {d === '2026-09-20' ? '⚠ 2026-09-20 (Anomaly)' : d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {currentPatient && (
        <div
          style={{
            display: 'flex',
            gap: '20px',
            flexWrap: 'wrap',
            padding: '10px 14px',
            backgroundColor: '#F8FAFC',
            borderRadius: '8px',
            fontSize: '13px',
            border: '1px solid var(--border)'
          }}
        >
          <div>
            <span style={{ color: 'var(--muted)' }}>Policy ID:</span>{' '}
            <strong style={{ color: 'var(--text)' }}>{currentPatient.policyId}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--muted)' }}>Demographics:</span>{' '}
            <strong style={{ color: 'var(--text)' }}>
              {currentPatient.age} yrs • {currentPatient.gender} • {currentPatient.bloodGroup}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--muted)' }}>Wallet:</span>{' '}
            <span style={{ fontFamily: 'monospace', color: 'var(--text)' }}>
              {currentPatient.walletAddress ? `${currentPatient.walletAddress.slice(0, 8)}...${currentPatient.walletAddress.slice(-6)}` : '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
