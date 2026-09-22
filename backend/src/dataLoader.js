import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');

/**
 * Read and parse a JSON file from the data directory.
 * @param {string} filename 
 * @returns {Promise<any>}
 */
async function loadJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Retrieve all demo patients.
 */
export async function getAllPatients() {
  return await loadJson('patients.json');
}

/**
 * Retrieve a specific patient by ID.
 * @param {string} patientId 
 */
export async function getPatientById(patientId) {
  const patients = await getAllPatients();
  return patients.find((p) => p.id === patientId) || null;
}

/**
 * Retrieve health records for a patient, optionally filtered by date.
 * @param {string} patientId 
 * @param {string|null} date 
 */
export async function getHealthRecords(patientId, date = null) {
  const records = await loadJson('health-records.json');
  return records.filter((r) => {
    const matchPatient = r.patientId === patientId;
    const matchDate = date ? r.date === date : true;
    return matchPatient && matchDate;
  });
}

/**
 * Group health records for a patient by date, detailing the 3 mock sources per date.
 * @param {string} patientId 
 * @param {string|null} date 
 */
export async function getGroupedSourcesByPatient(patientId, date = null) {
  const records = await getHealthRecords(patientId, date);
  const grouped = {};

  for (const rec of records) {
    if (!grouped[rec.date]) {
      grouped[rec.date] = {
        patientId,
        date: rec.date,
        sources: []
      };
    }
    grouped[rec.date].sources.push(rec);
  }

  return Object.values(grouped);
}

/**
 * Retrieve all policies.
 */
export async function getAllPolicies() {
  return await loadJson('policies.json');
}

/**
 * Retrieve policy for a patient.
 * @param {string} patientId 
 */
export async function getPolicyByPatientId(patientId) {
  const policies = await getAllPolicies();
  return policies.find((p) => p.patientId === patientId) || null;
}

/**
 * Retrieve all claims.
 */
export async function getAllClaims() {
  return await loadJson('claims.json');
}

/**
 * Retrieve claims for a specific patient.
 * @param {string} patientId 
 */
export async function getClaimsByPatientId(patientId) {
  const claims = await getAllClaims();
  return claims.filter((c) => c.patientId === patientId);
}

/**
 * Save a new claim into claims.json.
 * @param {object} claim 
 */
export async function saveNewClaim(claim) {
  const claims = await getAllClaims();
  claims.push(claim);
  const filePath = path.join(DATA_DIR, 'claims.json');
  await fs.writeFile(filePath, JSON.stringify(claims, null, 2), 'utf-8');
  return claim;
}

/**
 * Update claim status in claims.json.
 * @param {number|string} claimId 
 * @param {string} status 
 * @param {string} decisionReason 
 */
export async function updateClaimStatusInStore(claimId, status, decisionReason = '') {
  const claims = await getAllClaims();
  const idNum = Number(claimId);
  const claim = claims.find((c) => c.id === idNum || c.id === claimId);
  if (!claim) {
    throw new Error(`Claim ${claimId} not found`);
  }
  claim.status = status;
  claim.decisionReason = decisionReason;
  claim.resolvedAt = Math.floor(Date.now() / 1000);

  const filePath = path.join(DATA_DIR, 'claims.json');
  await fs.writeFile(filePath, JSON.stringify(claims, null, 2), 'utf-8');
  return claim;
}
