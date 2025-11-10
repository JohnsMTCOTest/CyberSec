import crypto from 'crypto';
import { spawn } from 'child_process';

interface TtySessionOptions {
  sessionId: string;
  workingDirectory: string;
  seed: string;
}

interface TtySessionResult {
  url: string;
  token: string;
}

export async function spawnTtySession(options: TtySessionOptions): Promise<TtySessionResult> {
  const token = crypto.createHash('sha256').update(options.sessionId + options.seed).digest('hex');
  const port = 10000 + Math.floor(Math.random() * 40000);

  if (process.env.MOCK_TTYD === 'true') {
    return { url: `wss://mock-ttyd/${options.sessionId}`, token };
  }

  const ttydCmd = process.env.TTYD_BINARY || 'ttyd';
  const args = ['-p', String(port), '--once', '-t', `token=${token}`, 'bash'];
  const child = spawn(ttydCmd, args, {
    cwd: options.workingDirectory,
    stdio: 'ignore',
    detached: true
  });
  child.unref();

  return {
    url: `ws://localhost:${port}/?token=${token}`,
    token
  };
}
