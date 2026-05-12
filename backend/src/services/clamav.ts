import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);

export async function scanFile(filePath: string): Promise<{
  clean: boolean;
  virus?: string;
  raw: string;
}> {
  try {
    // Try clamdscan first (uses daemon, much faster)
    const { stdout, stderr } = await execAsync(
      `clamdscan --no-summary --infected "${filePath}" 2>&1`
    ).catch(() =>
      // Fallback to clamscan CLI if daemon not available
      execAsync(`clamscan --no-summary "${filePath}" 2>&1`)
    );

    const output = stdout || stderr || '';
    const isInfected = output.includes('FOUND');

    if (isInfected) {
      const match = output.match(/: (.+) FOUND/);
      return { clean: false, virus: match?.[1] || 'Unknown', raw: output };
    }

    return { clean: true, raw: output };
  } catch (err: any) {
    // ClamAV returns exit code 1 when virus found
    const output = err.stdout || err.stderr || err.message || '';
    if (output.includes('FOUND')) {
      const match = output.match(/: (.+) FOUND/);
      return { clean: false, virus: match?.[1] || 'Unknown', raw: output };
    }
    throw new Error(`ClamAV scan failed: ${output}`);
  } finally {
    // Clean up uploaded file after scan
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
