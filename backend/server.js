const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Uploads dir
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Global store for the last analysis
let latestAnalysis = null;
const analysisHistory = [];
const MAX_HISTORY = 50;

// ============================================================
// Parse the DPI engine's text output into structured data
// ============================================================
function parseDPIOutput(stdout, originalFilename) {
    // Strip box-drawing chars so regex works cleanly
    const lines = stdout
        .split('\n')
        .map(l => l.replace(/\r/g, '').replace(/[║╠╚╔╗╝╣]/g, '').trim());

    const result = {
        totalPackets: 0,
        tcpPackets:   0,
        udpPackets:   0,
        totalBytes:   0,
        forwarded:    0,
        dropped:      0,
        appBreakdown: [],
        detectedSNIs: [],
        ruleHits:     {},
        filename:     originalFilename || 'upload.pcap',
        timestamp:    new Date().toISOString()
    };

    let inAppSection  = false;
    let inSNISection  = false;

    for (const line of lines) {
        // --- Scalar stats ---
        let m;
        if ((m = line.match(/Total Packets:\s*(\d+)/)))  result.totalPackets = +m[1];
        if ((m = line.match(/TCP Packets:\s*(\d+)/)))    result.tcpPackets   = +m[1];
        if ((m = line.match(/UDP Packets:\s*(\d+)/)))    result.udpPackets   = +m[1];
        if ((m = line.match(/Total Bytes:\s*(\d+)/)))    result.totalBytes   = +m[1];
        if ((m = line.match(/Forwarded:\s*(\d+)/)))      result.forwarded    = +m[1];
        if ((m = line.match(/Dropped:\s*(\d+)/)))        result.dropped      = +m[1];

        // --- Section detection ---
        if (line.includes('APPLICATION BREAKDOWN'))       { inAppSection = true;  inSNISection = false; continue; }
        if (line.match(/Detected Domains\/SNIs/))         { inAppSection = false; inSNISection = true;  continue; }
        if (line.includes('Output written to'))           { inSNISection = false; }

        // --- App breakdown row e.g.: "HTTPS   39   50.6%   ###" ---
        if (inAppSection) {
            const am = line.match(/^([A-Za-z][A-Za-z\/\s\-]*?)\s{2,}(\d+)\s+([\d.]+)%/);
            if (am) {
                result.appBreakdown.push({
                    app:        am[1].trim(),
                    count:      +am[2],
                    percentage: +am[3]
                });
            }
        }

        // --- SNI row e.g.: "- example.com -> HTTPS" ---
        if (inSNISection && line.startsWith('-')) {
            const parts = line.replace(/^-\s+/, '').split(' -> ');
            if (parts.length === 2) {
                result.detectedSNIs.push({
                    domain:  parts[0].trim(),
                    appType: parts[1].trim()
                });
            }
        }

        // --- Rule hit counters e.g.: "BLOCKED 5 packets matching --block-domain facebook" ---
        const hitMatch = line.match(/BLOCKED\s+(\d+)\s+packets?.*?(--[\w\-]+\s+[\w\.]+)/);
        if (hitMatch) {
            const flag = hitMatch[2].trim();
            result.ruleHits[flag] = (result.ruleHits[flag] || 0) + parseInt(hitMatch[1], 10);
        }
    }

    return result;
}

// ============================================================
// Routes
// ============================================================

app.get('/api/health', (req, res) => res.json({ status: 'Engine Bridge Online' }));

// Return last analysis (Dashboard fetches this)
app.get('/api/latest-analysis', (req, res) => {
    if (!latestAnalysis) return res.status(404).json({ error: 'No analysis run yet.' });
    res.json(latestAnalysis);
});

// Legacy stats (Dashboard fallback)
app.get('/api/stats', (req, res) => {
    if (latestAnalysis) {
        return res.json({
            uptime:           '99.9%',
            systemLoad:       (latestAnalysis.totalPackets / 1000).toFixed(2),
            peakProcessing:   String(latestAnalysis.totalPackets),
            threatsMitigated: String(latestAnalysis.dropped),
            globalNodes:      latestAnalysis.appBreakdown.length,
            coreEngine:       'STABLE',
            dbLatency:        '0.02',
            memoryLoad:       (latestAnalysis.totalBytes / 1024).toFixed(1),
        });
    }
    res.json({
        uptime: '99.9%', systemLoad: '0.04', peakProcessing: '---',
        threatsMitigated: '0', globalNodes: 0, coreEngine: 'IDLE',
        dbLatency: '0.02', memoryLoad: '0.0',
    });
});

// Rules
let activeRules = [
    { id: '1', title: 'BLOCK YOUTUBE', description: 'Drops all packets associated with YouTube traffic.', tags: ['#BANDWIDTH', '#BLOCK-APP'], enabled: false, flag: '--block-app YouTube', severity: 'medium' },
    { id: '2', title: 'BLOCK FACEBOOK', description: 'Drops all packets associated with Facebook traffic.', tags: ['#BANDWIDTH', '#BLOCK-APP'], enabled: false, flag: '--block-domain facebook', severity: 'medium' },
    { id: '3', title: 'BLOCK SUSPICIOUS IP', description: 'Blocks traffic from a specific testing IP (192.168.1.50).', tags: ['#SECURITY', '#BLOCK-IP'], enabled: false, flag: '--block-ip 192.168.1.50', severity: 'high' },
    { id: '4', title: 'RATE LIMIT TORRENTS', description: 'Throttles BitTorrent and P2P traffic to preserve bandwidth.', tags: ['#QOS', '#BANDWIDTH'], enabled: false, flag: '--rate-limit torrent', severity: 'low' },
    { id: '5', title: 'BLOCK MALWARE C2', description: 'Drops connections to known command-and-control domains.', tags: ['#SECURITY', '#COMPLIANCE'], enabled: false, flag: '--block-domain c2.malware.test', severity: 'critical' },
];
app.get('/api/rules', (req, res) => res.json(activeRules));
app.post('/api/rules', (req, res) => {
    const { id, enabled } = req.body;
    activeRules = activeRules.map(r => r.id === id ? { ...r, enabled } : r);
    res.json({ success: true, rules: activeRules });
});
app.put('/api/rules', (req, res) => {
    const { rules } = req.body;
    if (!Array.isArray(rules)) return res.status(400).json({ error: 'rules array required' });
    activeRules = rules.map(r => ({
        id: r.id || String(Date.now() + Math.random()),
        title: r.title || 'UNNAMED RULE',
        description: r.description || '',
        tags: Array.isArray(r.tags) ? r.tags : [],
        enabled: Boolean(r.enabled),
        flag: r.flag || '',
        severity: r.severity || 'medium',
    }));
    res.json({ success: true, rules: activeRules });
});
// Create a new rule
app.post('/api/rules/create', (req, res) => {
    const { title, description, tags, severity, flag } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });
    const newRule = {
        id: String(Date.now()),
        title: title.toUpperCase(),
        description: description || '',
        tags: Array.isArray(tags) ? tags : [],
        enabled: false,
        flag: flag || '',
        severity: severity || 'medium',
        hits: 0,
    };
    activeRules.push(newRule);
    res.json({ success: true, rule: newRule, rules: activeRules });
});
// Delete a rule
app.delete('/api/rules/:id', (req, res) => {
    const idx = activeRules.findIndex(r => r.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Rule not found.' });
    activeRules.splice(idx, 1);
    res.json({ success: true, rules: activeRules });
});

// Engine status for live widget
app.get('/api/engine-status', (req, res) => {
    res.json({
        online: true,
        message: 'Engine Bridge Online',
        lastAnalysis: latestAnalysis ? {
            filename: latestAnalysis.filename,
            totalPackets: latestAnalysis.totalPackets,
            dropped: latestAnalysis.dropped,
            timestamp: latestAnalysis.timestamp,
        } : null,
    });
});

// Analysis history
app.get('/api/history', (req, res) => {
    res.json(analysisHistory.map(h => ({
        id: h.id,
        filename: h.filename,
        timestamp: h.timestamp,
        totalPackets: h.totalPackets,
        dropped: h.dropped,
        fileSize: h.fileSize,
        appBreakdown: h.appBreakdown || [],
    })));
});
app.get('/api/history/:id', (req, res) => {
    const entry = analysisHistory.find(h => h.id === req.params.id);
    if (!entry) return res.status(404).json({ error: 'History entry not found.' });
    res.json(entry);
});
app.delete('/api/history/:id', (req, res) => {
    const idx = analysisHistory.findIndex(h => h.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'History entry not found.' });
    analysisHistory.splice(idx, 1);
    res.json({ success: true });
});



// ============================================================
// Main analyse endpoint
// ============================================================
app.post('/api/analyze', upload.single('pcap'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No PCAP file uploaded.' });

    const inputPath  = req.file.path;
    const outputPath = path.join(__dirname, 'uploads', `output-${Date.now()}.pcap`);
    const enginePath = path.join(__dirname, '..', 'dpi_engine.exe');

    // Build command with active rules
    let ruleFlags = activeRules
        .filter(r => r.enabled && r.flag)
        .map(r => r.flag)
        .join(' ');

    console.log(`[analyze] Running engine on ${req.file.originalname} with rules: ${ruleFlags || 'none'}`);
    const cmd = `"${enginePath}" "${inputPath}" "${outputPath}" ${ruleFlags}`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error('[analyze] engine error:', error.message);
            return res.status(500).json({ error: 'Engine failed.', details: error.message, stderr });
        }

        // Parse and store
        const analytics = parseDPIOutput(stdout, req.file.originalname);
        // Merge rule hits from ruleHits map into rule flags
        activeRules = activeRules.map(r => {
            const hits = r.flag ? (analytics.ruleHits[r.flag] || 0) : 0;
            return { ...r, hits };
        });
        analytics.ruleHits = Object.fromEntries(
            activeRules.filter(r => r.flag).map(r => [r.flag, r.hits || 0])
        );
        latestAnalysis = analytics;

        const historyEntry = {
            id: String(Date.now()),
            fileSize: req.file.size,
            ...analytics,
        };
        analysisHistory.unshift(historyEntry);
        if (analysisHistory.length > MAX_HISTORY) analysisHistory.pop();

        // Build log lines for the ProgressLog component
        const logs = stdout.split('\n')
            .map(l => l.trim()).filter(Boolean)
            .map((l, i) => ({
                id:      String(i),
                time:    new Date().toISOString().slice(11, 19),
                level:   l.includes('BLOCKED') ? 'warn' : l.includes('Dropped') ? 'error' : 'info',
                message: l
            }));

        console.log(`[analyze] done — ${analytics.totalPackets} pkts, ${analytics.appBreakdown.length} apps`);
        res.json({ success: true, logs, analytics });
    });
});

app.listen(PORT, () =>
    console.log(`DPI Bridge running on http://localhost:${PORT}`)
);
 
 
 
