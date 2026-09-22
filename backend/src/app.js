import express from 'express';
import cors from 'cors';
import {
  getAllPatients,
  getPatientById,
  getHealthRecords,
  getGroupedSourcesByPatient
} from './dataLoader.js';
import { validatePatientHealthData } from './validation.js';
import blockchainService from './blockchainService.js';

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

// -------------------------------------------------------------
// Blockchain Integration Endpoints (Unit 05)
// -------------------------------------------------------------

// Get blockchain connection and contract metadata
app.get('/api/blockchain/info', async (req, res) => {
  try {
    const info = await blockchainService.getContractInfo();
    res.json({ success: true, data: info });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Commit validated health-record hash to blockchain
// Invariant: Backend validation MUST happen before writing to blockchain
app.post('/api/health/:patientId/record', async (req, res) => {
  const { patientId } = req.params;
  const { date } = req.body;

  if (!date) {
    return res.status(400).json({ success: false, error: 'Date is required in request body' });
  }

  try {
    const patient = await getPatientById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, error: `Patient ${patientId} not found` });
    }

    // Step 1: Validate data first
    const validationResults = await validatePatientHealthData(patientId, date);
    if (validationResults.length === 0) {
      return res.status(404).json({ success: false, error: `No health data found for date ${date}` });
    }

    const dayValidation = validationResults[0];
    if (!dayValidation.validated) {
      return res.status(400).json({
        success: false,
        error: 'Cannot record out-of-tolerance health data to blockchain',
        reasons: dayValidation.reasons
      });
    }

    // Step 2: Write canonical hash to blockchain
    const txResult = await blockchainService.addHealthRecord(
      patientId,
      date,
      dayValidation.canonicalHash,
      'consensus-v1'
    );

    res.json({
      success: true,
      message: 'Health record hash successfully written to blockchain',
      data: {
        ...txResult,
        canonicalHash: dayValidation.canonicalHash,
        consensusMetrics: dayValidation.consensusMetrics
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: `Blockchain transaction failed: ${err.message}`
    });
  }
});

// Retrieve on-chain recorded health record
app.get('/api/health/:patientId/record-onchain', async (req, res) => {
  const { patientId } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ success: false, error: 'Date query parameter is required' });
  }

  try {
    const onChainRecord = await blockchainService.getHealthRecord(patientId, date);
    res.json({ success: true, data: onChainRecord });
  } catch (err) {
    res.status(500).json({ success: false, error: `Failed to query blockchain: ${err.message}` });
  }
});

// Grant or revoke patient consent for an entity
app.post('/api/consent', async (req, res) => {
  const { patientId, entityAddress, granted } = req.body;

  if (!patientId || !entityAddress) {
    return res.status(400).json({
      success: false,
      error: 'patientId and entityAddress are required'
    });
  }

  try {
    let result;
    if (granted !== false) {
      result = await blockchainService.grantConsent(patientId, entityAddress);
    } else {
      result = await blockchainService.revokeConsent(patientId, entityAddress);
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: `Failed to update consent: ${err.message}` });
  }
});

// Check patient consent status
app.get('/api/consent/:patientId', async (req, res) => {
  const { patientId } = req.params;
  const { entity } = req.query;

  if (!entity) {
    return res.status(400).json({ success: false, error: 'entity address query parameter is required' });
  }

  try {
    const status = await blockchainService.hasConsent(patientId, entity);
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(500).json({ success: false, error: `Failed to query consent: ${err.message}` });
  }
});

export default app;
