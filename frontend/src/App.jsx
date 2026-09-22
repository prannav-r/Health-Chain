import React, { useState, useEffect } from 'react';

function App() {
  const [apiStatus, setApiStatus] = useState({ loading: true, ok: false, data: null, error: null });

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setApiStatus({ loading: false, ok: true, data, error: null }))
      .catch((err) => setApiStatus({ loading: false, ok: false, data: null, error: err.message }));
  }, []);

  return (
    <div className="container">
      <header>
        <div className="brand">
          <div className="brand-icon">H</div>
          <div>
            <h1 className="brand-title">Health-Chain</h1>
            <p className="brand-subtitle">Decentralized Health Data & Insurance MVP</p>
          </div>
        </div>
        <div>
          {apiStatus.loading ? (
            <span className="badge badge-warning">Checking backend API...</span>
          ) : apiStatus.ok ? (
            <span className="badge badge-success">API Online: {apiStatus.data?.message}</span>
          ) : (
            <span className="badge badge-danger">API Offline ({apiStatus.error})</span>
          )}
        </div>
      </header>

      <div className="card">
        <h2 className="card-title">Unit 01: Project Foundation Active</h2>
        <p className="card-desc">
          The Health-Chain full-stack architecture is initialized with React, Express, and Hardhat.
        </p>
        <div className="grid">
          <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>Frontend</h3>
            <p style={{ fontSize: '13px', color: 'var(--muted)' }}>React 18 + Vite running with custom UI design tokens</p>
          </div>
          <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>Backend</h3>
            <p style={{ fontSize: '13px', color: 'var(--muted)' }}>Node.js + Express API server with CORS and health monitoring</p>
          </div>
          <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>Blockchain</h3>
            <p style={{ fontSize: '13px', color: 'var(--muted)' }}>Hardhat workspace prepared for Solidity contracts & ethers.js</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
