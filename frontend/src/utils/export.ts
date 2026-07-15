import type { AnalyticsData } from '../context/AnalyticsContext';
import type { FlowGuardRule } from '../components/RuleCard';

export function downloadBlob(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function exportAnalyticsJSON(analytics: AnalyticsData) {
    downloadBlob(
        JSON.stringify(analytics, null, 2),
        `flowguard-analysis-${Date.now()}.json`,
        'application/json'
    );
}

export function exportAnalyticsCSV(analytics: AnalyticsData) {
    const rows: string[][] = [
        ['Metric', 'Value'],
        ['Filename', analytics.filename],
        ['Timestamp', analytics.timestamp],
        ['Total Packets', String(analytics.totalPackets)],
        ['TCP Packets', String(analytics.tcpPackets)],
        ['UDP Packets', String(analytics.udpPackets)],
        ['Total Bytes', String(analytics.totalBytes)],
        ['Forwarded', String(analytics.forwarded)],
        ['Dropped', String(analytics.dropped)],
        ['', ''],
        ['Application', 'Count', 'Percentage'],
        ...analytics.appBreakdown.map(a => [a.app, String(a.count), String(a.percentage)]),
        ['', ''],
        ['Domain', 'App Type'],
        ...analytics.detectedSNIs.map(s => [s.domain, s.appType]),
    ];
    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadBlob(csv, `flowguard-analysis-${Date.now()}.csv`, 'text/csv');
}

export function exportRulesJSON(rules: FlowGuardRule[]) {
    downloadBlob(
        JSON.stringify(rules, null, 2),
        `flowguard-rules-${Date.now()}.json`,
        'application/json'
    );
}

export function parseRulesJSON(text: string): FlowGuardRule[] {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error('Rules file must be a JSON array');
    return parsed.map((r, i) => ({
        id: r.id ?? String(Date.now() + i),
        title: r.title ?? 'UNNAMED RULE',
        description: r.description ?? '',
        tags: Array.isArray(r.tags) ? r.tags : [],
        enabled: Boolean(r.enabled),
        severity: r.severity ?? 'medium',
        flag: r.flag,
    }));
}

export function exportPDFReport(analytics: AnalyticsData, threatScore: number, rules: FlowGuardRule[]) {
    const date = new Date(analytics.timestamp).toLocaleString();
    const dropRate = analytics.totalPackets > 0
        ? ((analytics.dropped / analytics.totalPackets) * 100).toFixed(1) : '0';
    const tcpPct = analytics.totalPackets > 0
        ? ((analytics.tcpPackets / analytics.totalPackets) * 100).toFixed(1) : '0';
    const udpPct = analytics.totalPackets > 0
        ? ((analytics.udpPackets / analytics.totalPackets) * 100).toFixed(1) : '0';
    const scoreColor = threatScore < 30 ? '#059669' : threatScore < 60 ? '#d97706' : '#dc2626';
    const scoreLabel = threatScore < 20 ? 'CLEAN' : threatScore < 40 ? 'LOW RISK' : threatScore < 60 ? 'MODERATE' : threatScore < 80 ? 'HIGH RISK' : 'CRITICAL';
    const activeRules = rules.filter(r => r.enabled);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>FlowGuard DPI Report — ${analytics.filename}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;900&family=JetBrains+Mono&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Space Grotesk', sans-serif; background: #fff; color: #111; padding: 40px; max-width: 900px; margin: auto; }
  h1 { font-size: 36px; font-weight: 900; letter-spacing: -1px; margin-bottom: 4px; }
  h2 { font-size: 13px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; color: #888; margin: 32px 0 12px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 20px; margin-bottom: 24px; }
  .logo { font-size: 22px; font-weight: 900; letter-spacing: -1px; }
  .meta { font-size: 11px; color: #888; font-family: 'JetBrains Mono', monospace; text-align: right; line-height: 1.8; }
  .grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .card { border: 1px solid #eee; border-radius: 12px; padding: 16px; }
  .card .label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: #aaa; margin-bottom: 6px; }
  .card .value { font-size: 28px; font-weight: 900; }
  .card .sub { font-size: 10px; color: #aaa; margin-top: 2px; }
  .threat-box { border-radius: 16px; padding: 20px 24px; background: ${scoreColor}12; border: 2px solid ${scoreColor}40; display: flex; align-items: center; gap: 24px; margin-bottom: 24px; }
  .threat-score { font-size: 56px; font-weight: 900; color: ${scoreColor}; line-height: 1; }
  .threat-label { font-size: 14px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; color: ${scoreColor}; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px; }
  th { text-align: left; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: #aaa; padding: 8px 12px; border-bottom: 1px solid #eee; }
  td { padding: 10px 12px; border-bottom: 1px solid #f5f5f5; }
  .bar-cell { width: 100px; }
  .bar { height: 6px; border-radius: 3px; background: #4B8DFF; }
  .tag { display: inline-block; font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 20px; background: #f0f0f0; margin-right: 4px; text-transform: uppercase; letter-spacing: 1px; }
  .severity { font-size: 9px; font-weight: 900; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px; }
  .sev-critical { background: #fee2e2; color: #dc2626; }
  .sev-high { background: #ffedd5; color: #ea580c; }
  .sev-medium { background: #fef9c3; color: #ca8a04; }
  .sev-low { background: #f0fdf4; color: #16a34a; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; font-size: 10px; color: #aaa; display: flex; justify-content: space-between; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo">⚡ FLOWGUARD</div>
    <h1>${analytics.filename}</h1>
    <div style="font-size:12px;color:#888;margin-top:4px;">Deep Packet Inspection Analysis Report</div>
  </div>
  <div class="meta">
    Generated: ${new Date().toLocaleString()}<br/>
    Analysed: ${date}<br/>
    Engine: FlowGuard DPI v1.0
  </div>
</div>

<h2>Key Metrics</h2>
<div class="grid4">
  <div class="card"><div class="label">Total Packets</div><div class="value">${analytics.totalPackets.toLocaleString()}</div><div class="sub">captured</div></div>
  <div class="card"><div class="label">TCP / UDP</div><div class="value">${tcpPct}%</div><div class="sub">TCP · UDP ${udpPct}%</div></div>
  <div class="card"><div class="label">Forwarded</div><div class="value" style="color:#059669">${analytics.forwarded}</div><div class="sub">${(analytics.totalBytes/1024).toFixed(1)} KB total</div></div>
  <div class="card"><div class="label">Dropped</div><div class="value" style="color:${analytics.dropped>0?'#dc2626':'#059669'}">${analytics.dropped}</div><div class="sub">${dropRate}% drop rate</div></div>
</div>

<h2>Threat Assessment</h2>
<div class="threat-box">
  <div class="threat-score">${threatScore}</div>
  <div>
    <div class="threat-label">${scoreLabel}</div>
    <div style="font-size:12px;color:#555;margin-top:6px;max-width:500px;">Computed from drop rate (${dropRate}%), unknown traffic ratio, and high-risk application presence.</div>
  </div>
</div>

<h2>Application Breakdown</h2>
<table>
  <thead><tr><th>Application</th><th>Packets</th><th>Share</th><th class="bar-cell">Distribution</th></tr></thead>
  <tbody>
    ${analytics.appBreakdown.map(a => `
    <tr>
      <td><b>${a.app}</b></td>
      <td style="font-family:'JetBrains Mono',monospace">${a.count.toLocaleString()}</td>
      <td style="font-family:'JetBrains Mono',monospace">${a.percentage.toFixed(1)}%</td>
      <td><div class="bar" style="width:${Math.round(a.percentage)}px"></div></td>
    </tr>`).join('')}
  </tbody>
</table>

<h2>Detected Domains / SNIs (top 20)</h2>
<table>
  <thead><tr><th>Domain</th><th>Application Type</th></tr></thead>
  <tbody>
    ${analytics.detectedSNIs.slice(0, 20).map(s => `
    <tr><td style="font-family:'JetBrains Mono',monospace">${s.domain}</td><td>${s.appType}</td></tr>`).join('')}
    ${analytics.detectedSNIs.length > 20 ? `<tr><td colspan="2" style="color:#aaa;font-size:11px;">... and ${analytics.detectedSNIs.length - 20} more domains</td></tr>` : ''}
  </tbody>
</table>

<h2>Active Rules (${activeRules.length})</h2>
${activeRules.length === 0 ? '<p style="color:#aaa;font-size:12px;">No rules were active during this analysis.</p>' : `
<table>
  <thead><tr><th>Rule</th><th>Severity</th><th>Tags</th><th>Flag</th></tr></thead>
  <tbody>
    ${activeRules.map(r => `
    <tr>
      <td><b>${r.title}</b><br/><span style="color:#888;font-size:11px">${r.description}</span></td>
      <td><span class="severity sev-${r.severity??'medium'}">${r.severity??'medium'}</span></td>
      <td>${(r.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#888">${r.flag||'—'}</td>
    </tr>`).join('')}
  </tbody>
</table>`}

<div class="footer">
  <span>FlowGuard DPI Engine — Confidential Analysis Report</span>
  <span>Generated ${new Date().toLocaleString()}</span>
</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 600);
}
