import express from 'express';
import cors from 'cors';
import {
  getAllPatients,
  getPatientById,
  getHealthRecords,
  getGroupedSourcesByPatient
} from './dataLoader.js';
import { validatePatientHealthData } from './validation.js';

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Health-Chain API is running',
    timestamp: new Date().toISOString()
  });
});

// List all demo patients
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await getAllPatients();
    res.json({ success: true, data: patients });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load patients data' });
  }
});

// Get a single patient by ID
app.get('/api/patients/:patientId', async (req, res) => {
  try {
    const patient = await getPatientById(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ success: false, error: `Patient ${req.params.patientId} not found` });
    }
    res.json({ success: true, data: patient });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load patient data' });
  }
});

// Get health records for a patient (optional query: ?date=YYYY-MM-DD)
app.get('/api/health/:patientId', async (req, res) => {
  const { patientId } = req.params;
  const { date } = req.query;

  try {
    const patient = await getPatientById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, error: `Patient ${patientId} not found` });
    }

    const records = await getHealthRecords(patientId, date);
    res.json({
      success: true,
      patientId,
      filterDate: date || null,
      count: records.length,
      data: records
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load health records' });
  }
});

// Get multi-source comparison data grouped by date (optional query: ?date=YYYY-MM-DD)
app.get('/api/health/:patientId/sources', async (req, res) => {
  const { patientId } = req.params;
  const { date } = req.query;

  try {
    const patient = await getPatientById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, error: `Patient ${patientId} not found` });
    }

    const groupedSources = await getGroupedSourcesByPatient(patientId, date);
    res.json({
      success: true,
      patientId,
      filterDate: date || null,
      data: groupedSources
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load source comparison data' });
  }
});

// Validate multi-source health records and compute canonical hash (optional query: ?date=YYYY-MM-DD)
app.get('/api/health/:patientId/validation', async (req, res) => {
  const { patientId } = req.params;
  const { date } = req.query;

  try {
    const patient = await getPatientById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, error: `Patient ${patientId} not found` });
    }

    const validationResults = await validatePatientHealthData(patientId, date);
    res.json({
      success: true,
      patientId,
      filterDate: date || null,
      count: validationResults.length,
      data: validationResults
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to perform health data validation' });
  }
});

export default app;
