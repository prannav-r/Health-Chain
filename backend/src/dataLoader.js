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
