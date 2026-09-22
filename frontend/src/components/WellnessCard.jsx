import React, { useState } from 'react';
import StatusBadge from './StatusBadge.jsx';

export default function WellnessCard({
  points = 0,
  selectedDate,
  rewardStatus,
  onClaimReward,
  loading
}) {
  const [claiming, setClaiming] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const milestoneTarget = 500;
  const progressPct = Math.min(100, Math.round((points / milestoneTarget) * 100));

  const eligiblePoints = rewardStatus?.points || 0;
  const isClaimed = rewardStatus?.isClaimed || false;
  const isEligible = rewardStatus?.eligible && !isClaimed;

  const handleClaim = async () => {
    setClaiming(true);
    setFeedback(null);
    try {
      const res = await onClaimReward(selectedDate);
      setFeedback({ success: true, message: res.message || 'Points awarded on-chain!' });
    } catch (err) {
      setFeedback({ success: false, message: err.message });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 className="card-title" style={{ margin: 0 }}>Wellness Rewards & Points</h3>
          <p className="card-desc" style={{ margin: '4px 0 0 0' }}>
            Smart contract verified rewards for physical activity and healthy sleep
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

      {/* Progress Bar towards Milestone */}
      <div style={{ marginBottom: '16px' }}>
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

      {/* Daily Claim Status Box */}
      <div
        style={{
          padding: '14px',
          backgroundColor: '#F8FAFC',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              Daily Reward Status ({selectedDate})
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
              {isClaimed ? (
                <span style={{ color: 'var(--success)', fontWeight: 500 }}>
                  ✔ Points successfully awarded on Ethereum smart contract.
                </span>
              ) : isEligible ? (
                <span>
                  Eligible for <strong>+{eligiblePoints} PTS</strong> based on validated daily consensus telemetry.
                </span>
              ) : (
                <span>Not eligible (Does not meet target thresholds or has source anomalies).</span>
              )}
            </div>
          </div>

          <div>
            {isClaimed ? (
              <StatusBadge status="Confirmed" type="success" label="Claimed On-Chain" />
            ) : isEligible ? (
              <button
                id="claim-reward-btn"
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '13px' }}
                onClick={handleClaim}
                disabled={claiming || loading}
              >
                {claiming ? 'Writing to Chain...' : `Claim +${eligiblePoints} Points`}
              </button>
            ) : (
              <StatusBadge status="Inactive" type="warning" label="0 Points Available" />
            )}
          </div>
        </div>

        {feedback && (
          <div
            style={{
              marginTop: '10px',
              fontSize: '12px',
              color: feedback.success ? 'var(--success)' : 'var(--danger)',
              fontWeight: 500
            }}
          >
            {feedback.success ? '✔' : '✖'} {feedback.message}
          </div>
        )}
      </div>

      {/* Rule Targets */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          fontSize: '12px'
        }}
      >
        <div style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: '#FFFFFF', border: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 600 }}>🏃 Steps (≥ 10,000)</div>
          <div style={{ color: 'var(--muted)', marginTop: '2px' }}>+100 Points / day</div>
        </div>
        <div style={{ padding: '8px 10px', borderRadius: '6px', backgroundColor: '#FFFFFF', border: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 600 }}>🌙 Sleep (≥ 7.0 hrs)</div>
          <div style={{ color: 'var(--muted)', marginTop: '2px' }}>+50 Points / day</div>
        </div>
      </div>
    </div>
  );
}
