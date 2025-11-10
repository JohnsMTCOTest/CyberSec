import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { ensureUser, hasAcceptedEthics, markEthicsAccepted, getSession } from './db';
import { LabRunner, loadSessionFromRow } from './labRunner';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const labRoot = path.resolve(__dirname, '..', '..', 'lab-templates');
const labRunner = new LabRunner(labRoot);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/labs', (_req, res) => {
  res.json({ labs: labRunner.listLabs() });
});

app.post('/api/ethics/ack', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  await ensureUser(userId);
  await markEthicsAccepted(userId);
  res.json({ acknowledged: true });
});

app.post('/api/labs/:labId/start', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    await ensureUser(userId);
    const accepted = await hasAcceptedEthics(userId);
    if (!accepted) {
      return res.status(403).json({ error: 'Complete ethics module before accessing labs.' });
    }
    const labId = req.params.labId;
    const session = await labRunner.startLab(labId, userId);
    res.json({ session });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/labs/:labId/submit', async (req, res) => {
  try {
    const { sessionId, submission } = req.body;
    if (!sessionId || !submission) {
      return res.status(400).json({ error: 'sessionId and submission required' });
    }
    const row = await getSession(sessionId);
    if (!row) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const session = loadSessionFromRow(row);
    const passed = await labRunner.runValidators(session, submission);
    res.json({ passed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`OmniHack backend listening on ${port}`);
});
