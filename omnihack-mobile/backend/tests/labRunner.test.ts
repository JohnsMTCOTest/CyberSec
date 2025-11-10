process.env.SQLITE_PATH = require('path').resolve(__dirname, 'test.db');
process.env.MOCK_TTYD = 'true';

import path from 'path';
import fs from 'fs';
import { LabRunner } from '../src/labRunner';
import { ensureUser, markEthicsAccepted, getSession } from '../src/db';

describe('LabRunner', () => {
  const labRoot = path.resolve(__dirname, '..', '..', 'lab-templates');
  const stagingRoot = path.resolve(__dirname, '..', '..', '.jest-sessions');

  beforeAll(async () => {
    if (!fs.existsSync(stagingRoot)) fs.mkdirSync(stagingRoot, { recursive: true });
    await ensureUser('tester');
    await markEthicsAccepted('tester');
  });

  it('instantiates web sqli lab with deterministic artifacts', async () => {
    const runner = new LabRunner(labRoot, stagingRoot);
    const session = await runner.startLab('web-sqli-1', 'tester');
    expect(session.labId).toBe('web-sqli-1');
    expect(session.parameterValues.SEED).toBeDefined();
    expect(session.artifacts.db_flag_template).toContain('OMNIHACK');
    expect(session.stagingDir).toContain('jest-sessions');
    const stored = await getSession(session.sessionId);
    expect(stored.lab_id).toBe('web-sqli-1');
  });
});
