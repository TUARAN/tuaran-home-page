import { chmod, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export class FileTokenStore {
  constructor(path) { this.path = path; }
  async read() {
    try { return JSON.parse(await readFile(this.path, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  async write(token) {
    await mkdir(dirname(this.path), { recursive: true, mode: 0o700 });
    const temp = this.path + '.' + process.pid + '.tmp';
    await writeFile(temp, JSON.stringify(token, null, 2) + '\n', { mode: 0o600 });
    await rename(temp, this.path);
    await chmod(this.path, 0o600);
  }
  async clear() {
    try { await unlink(this.path); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
