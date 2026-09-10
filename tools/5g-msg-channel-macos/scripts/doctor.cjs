'use strict';
const AcpClient = require('../src/acp-client.cjs');
(async () => {
  const report = { platform: process.platform, arch: process.arch, node: process.version, dependency: false, acp: [] };
  try { require('ws'); report.dependency = true; } catch {}
  for (const port of AcpClient.ports()) {
    const client = new AcpClient({ port, timeoutMs: 3000 });
    try { const result = await client.connect(); report.acp.push({ port, handshake: true, initialize: result }); break; }
    catch (e) { report.acp.push({ port, handshake: false, error: e.message }); }
    finally { await client.close(); }
  }
  report.readyForLocalTest = report.dependency && report.acp.some(x => x.handshake);
  console.log(JSON.stringify(report, null, 2));
  if (!report.readyForLocalTest) process.exitCode = 1;
})();
