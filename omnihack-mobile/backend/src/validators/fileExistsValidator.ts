import fs from 'fs';

export async function fileExistsValidator(filePath: string): Promise<boolean> {
  return fs.existsSync(filePath);
}
