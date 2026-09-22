import React, { useState, useEffect, useCallback } from 'react';
import PremiumCard from './PremiumCard.jsx';
import ClaimsTable from './ClaimsTable.jsx';
import ClaimFormModal from './ClaimFormModal.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function InsuranceDashboard() {
  const [authorizedPatients, setAuthorizedPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Fetch authorized patients (those with on-chain consent)
  const loadAuthorizedPatients = useCallback(async () => {
    try {
      const res = await fetch('/api/insurance/authorized-patients');
      const data = await res.json();
      if (data.success) {
        setAuthorizedPatients(data.data || []);
        if (data.data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(data.data[0].id);
        } else if (data.data.length === 0) {
          setSelectedPatientId(null);
        }
      }
    } catch (err) {
      console.error('Failed to load authorized patients:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedPatientId]);

  useEffect(() => {
    loadAuthorizedPatients();
  }, [loadAuthorizedPatients]);

  // Load policy, calculated premium, and claims for the selected authorized patient
  const loadPatientPolicyAndClaims = useCallback(async () => {
    if (!selectedPatientId) {
      setPolicy(null);
      setClaims([]);
      return;
    }

    try {
      // 1. Fetch policy with dynamic premium
      const polRes = await fetch(`/api/policies/${selectedPatientId}`);
      const polData = await polRes.json();
      if (polData.success) {
        setPolicy(polData.data);
      }

      // 2. Fetch claims
      const claimsRes = await fetch(`/api/claims/${selectedPatientId}`);
      const claimsData = await claimsRes.json();
      if (claimsData.success) {
        setClaims(claimsData.data);
      }
    } catch (err) {
      console.error('Failed to load policy or claims:', err);
    }
  }, [selectedPatientId]);

  useEffect(() => {
    loadPatientPolicyAndClaims();
  }, [loadPatientPolicyAndClaims]);

  // Approve claim
  const handleApproveClaim = async (claimId, reason) => {
    const res = await fetch(`/api/claims/${claimId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to approve claim');
    }
    await loadPatientPolicyAndClaims();
  };

  // Reject claim
  const handleRejectClaim = async (claimId, reason) => {
    const res = await fetch(`/api/claims/${claimId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to reject claim');
    }
    await loadPatientPolicyAndClaims();
  };

  // Submit new claim
  const handleSubmitClaim = async (claimPayload) => {
    const res = await fetch('/api/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claimPayload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to submit claim');
    }
    await loadPatientPolicyAndClaims();
  };

  const currentPatient = authorizedPatients.find((p) => p.id === selectedPatientId);

  return (
    <div>
      {/* Insurer Overview Banner */}
      <div className="card" style={{ marginBottom: '24px', backgroundColor: '#F8FAFC' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              Insurance Underwriting & Claims Portal
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '4px 0 0 0' }}>
              Access strictly governed by patient on-chain smart contract consent
            </p>
          </div>
          <button className="btn btn-outline" onClick={loadAuthorizedPatients} style={{ fontSize: '12px' }}>
            ↻ Refresh Consents
          </button>
        </div>
      </div>

      {/* Authorized Patients Selector */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>Authorized Consenting Patients</h3>
            <p className="card-desc" style={{ margin: '4px 0 0 0' }}>
              Only patients who have broadcasted active consent on Ethereum Sepolia appear here
            </p>
          </div>
          <span className="badge badge-success" style={{ fontSize: '12px' }}>
            {authorizedPatients.length} Consented Patient{authorizedPatients.length === 1 ? '' : 's'}
          </span>
        </div>

        {authorizedPatients.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              backgroundColor: '#FEF3C7',
              borderRadius: '8px',
              border: '1px solid #FDE68A',
              color: '#92400E'
            }}
          >
            <strong>No authorized patients currently available.</strong>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>
              Switch to the <strong>Patient Portal</strong> and click <em>"Grant Consent"</em> on a demo patient to authorize insurer access.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {authorizedPatients.map((p) => (
              <button
                key={p.id}
                id={`insurer-select-patient-${p.id}`}
                className={`btn ${selectedPatientId === p.id ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSelectedPatientId(p.id)}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                <strong>{p.id}</strong>: {p.name} ({p.policyId})
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPatientId && currentPatient && (
        <>
          {/* Dynamic Premium Calculation */}
          <PremiumCard policy={policy} metricsUsed={policy?.metricsUsed} />

          {/* Claims Management Panel */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Policy Claims Adjudication</h3>
                <p className="card-desc" style={{ margin: '4px 0 0 0' }}>
                  Review, approve, or reject claims backed by smart contract state changes
                </p>
              </div>

              <button
                id="submit-new-claim-btn"
                className="btn btn-primary"
                onClick={() => setIsClaimModalOpen(true)}
              >
                + New Claim
              </button>
            </div>

            <ClaimsTable
              claims={claims}
              onApproveClaim={handleApproveClaim}
              onRejectClaim={handleRejectClaim}
              isInsurerView={true}
            />
          </div>

          <ClaimFormModal
            isOpen={isClaimModalOpen}
            onClose={() => setIsClaimModalOpen(false)}
            onSubmitClaim={handleSubmitClaim}
            patientId={selectedPatientId}
            policyId={currentPatient.policyId}
          />
        </>
      )}
    </div>
  );
}
