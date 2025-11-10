import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import yaml from 'js-yaml';
import Mustache from 'mustache';
import { v4 as uuidv4 } from 'uuid';
import { createSession, updateSessionStatus } from './db';
import { spawnTtySession } from './ttyProxy';
import { flagValidator } from './validators/flagValidator';
import { fileExistsValidator } from './validators/fileExistsValidator';

export interface LabDefinition {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  seeded: boolean;
  topology: Record<string, string>;
  artifacts?: Record<string, string>;
  parameters?: Array<{ name: string; type: string; length?: number; min?: number; max?: number; choices?: string[] }>;
  validators?: Array<Record<string, any>>;
  hints?: string[];
  cleanup?: boolean;
}

export interface LabSession {
  sessionId: string;
  labId: string;
  seed: string;
  parameterValues: Record<string, string | number>;
  artifacts: Record<string, string>;
  tty?: { url: string; token: string };
  stagingDir: string;
}

const validatorRegistry: Record<string, (submission: string, validatorConfig: any, session: LabSession) => Promise<boolean>> = {
  flag_contains: async (submission, validatorConfig, session) => {
    const expected = Mustache.render(validatorConfig.value, session.parameterValues);
    return flagValidator(submission, expected);
  },
  file_exists: async (_submission, validatorConfig, session) => {
    const targetPath = Mustache.render(validatorConfig.path, session.parameterValues);
    const sanitized = targetPath.replace(/^\//, '');
    const fullPath = path.join(session.stagingDir, sanitized);
    return fileExistsValidator(fullPath);
  }
};

export class LabRunner {
  constructor(private labRoot: string, private stagingRoot: string = path.resolve(process.cwd(), '.lab-sessions')) {
    if (!fs.existsSync(this.stagingRoot)) {
      fs.mkdirSync(this.stagingRoot, { recursive: true });
    }
  }

  listLabs(): LabDefinition[] {
    const entries = fs.readdirSync(this.labRoot, { withFileTypes: true });
    const labs: LabDefinition[] = [];
    entries.forEach((entry) => {
      if (entry.isDirectory()) {
        const labPath = path.join(this.labRoot, entry.name, 'lab.yaml');
        if (fs.existsSync(labPath)) {
          const data = yaml.load(fs.readFileSync(labPath, 'utf-8')) as LabDefinition;
          labs.push(data);
        }
      }
    });
    return labs;
  }

  getLab(labId: string): LabDefinition | undefined {
    const labs = this.listLabs();
    return labs.find((lab) => lab.id === labId);
  }

  private deterministicValue(seed: string, name: string, length = 8): string {
    const hash = crypto.createHmac('sha256', seed).update(name).digest('hex');
    return hash.substring(0, length);
  }

  private generateParameters(lab: LabDefinition, seed: string): Record<string, any> {
    const values: Record<string, any> = { SEED: seed };
    (lab.parameters || []).forEach((param, index) => {
      const key = param.name || `param_${index}`;
      switch (param.type) {
        case 'random_hex': {
          const length = param.length || 8;
          values[key] = this.deterministicValue(seed, key, length);
          break;
        }
        case 'random_int': {
          const min = param.min ?? 0;
          const max = param.max ?? 1000;
          const hash = this.deterministicValue(seed, key, 12);
          const numeric = parseInt(hash, 16);
          values[key] = min + (numeric % (max - min + 1));
          break;
        }
        case 'choice': {
          const choices = param.choices || [];
          if (!choices.length) {
            throw new Error(`Choice parameter ${key} missing choices`);
          }
          const hash = this.deterministicValue(seed, key, 8);
          const idx = parseInt(hash, 16) % choices.length;
          values[key] = choices[idx];
          break;
        }
        default:
          throw new Error(`Unsupported parameter type: ${param.type}`);
      }
    });
    return values;
  }

  private expandArtifacts(lab: LabDefinition, parameters: Record<string, any>): Record<string, string> {
    const outputs: Record<string, string> = {};
    Object.entries(lab.artifacts || {}).forEach(([key, template]) => {
      outputs[key] = Mustache.render(template, parameters);
    });
    return outputs;
  }

  private createStagingDir(sessionId: string): string {
    const dir = path.join(this.stagingRoot, sessionId);
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  async startLab(labId: string, userId: string): Promise<LabSession> {
    const lab = this.getLab(labId);
    if (!lab) {
      throw new Error(`Lab ${labId} not found`);
    }

    const sessionId = uuidv4();
    const seed = crypto.randomBytes(8).toString('hex');
    const parameters = this.generateParameters(lab, seed);
    const artifacts = this.expandArtifacts(lab, parameters);
    const stagingDir = this.createStagingDir(sessionId);

    Object.entries(artifacts).forEach(([key, value]) => {
      const fileName = `${key}.txt`;
      const outPath = path.join(stagingDir, fileName);
      fs.writeFileSync(outPath, value);
    });

    for (const validator of lab.validators || []) {
      if (validator.type === 'file_exists') {
        const resolved = Mustache.render(validator.path, parameters).replace(/^\//, '');
        const fullPath = path.join(stagingDir, resolved);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        if (!fs.existsSync(fullPath)) {
          fs.writeFileSync(fullPath, `placeholder for ${resolved}`);
        }
      }
    }

    await createSession({
      id: sessionId,
      userId,
      labId,
      seed,
      parameters: JSON.stringify(parameters),
      status: 'running'
    });

    const tty = await spawnTtySession({
      sessionId,
      workingDirectory: stagingDir,
      seed
    });

    return {
      sessionId,
      labId,
      seed,
      parameterValues: parameters,
      artifacts,
      tty,
      stagingDir
    };
  }

  async runValidators(session: LabSession, submission: string): Promise<boolean> {
    const lab = this.getLab(session.labId);
    if (!lab) {
      throw new Error('Lab definition missing');
    }
    const validatorResults = await Promise.all(
      (lab.validators || []).map(async (validatorConfig) => {
        const type = validatorConfig.type;
        if (!type) {
          throw new Error('Validator missing type');
        }
        const handler = validatorRegistry[type];
        if (!handler) {
          throw new Error(`Unsupported validator type ${type}`);
        }
        return handler(submission, validatorConfig, session);
      })
    );
    const passed = validatorResults.every(Boolean);
    await updateSessionStatus(session.sessionId, passed ? 'passed' : 'failed');
    return passed;
  }
}

export function loadSessionFromRow(row: any): LabSession {
  return {
    sessionId: row.id,
    labId: row.lab_id,
    seed: row.seed,
    parameterValues: JSON.parse(row.parameters),
    artifacts: {},
    stagingDir: path.resolve(process.cwd(), '.lab-sessions', row.id)
  };
}
