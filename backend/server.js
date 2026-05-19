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
    { id: '1', title: 'BLOCK SUSPICIOUS EXIT NODES', description: 'Drops all packets originating from known Tor exit nodes.', tags: ['#SECURITY', '#TOR-BLOCK'], enabled: true },
    { id: '2', title: 'THROTTLE STREAMING',           description: 'Limits video streaming to 5 Mbps during peak hours.',             tags: ['#BANDWIDTH', '#QOS'],        enabled: false },
    { id: '3', title: 'SSH BRUTE PROTECTION',         description: 'Auto-bans IPs with 10+ failed SSH attempts in 60 s.',             tags: ['#COMPLIANCE', '#BRUTE'],     enabled: true },
];
app.get('/api/rules', (req, res) => res.json(activeRules));
app.post('/api/rules', (req, res) => {
    const { id, enabled } = req.body;
    activeRules = activeRules.map(r => r.id === id ? { ...r, enabled } : r);
    res.json({ success: true, rules: activeRules });
});

// Live traffic mock stream
app.get('/api/traffic-stream', (req, res) => {
    const flows = Array.from({ length: Math.floor(Math.random() * 5) + 3 }).map(() => ({
        id:        Math.random().toString(36).substr(2, 9),
        action:    Math.random() > 0.8 ? 'DROP' : 'ALLOW',
        srcIp:     `192.168.1.${Math.floor(Math.random() * 255)}`,
        dstIp:     `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.12.31`,
        proto:     ['HTTPS/TLS','SSH/BRUTE','TCP/KEEPALIVE','DNS/UDP','ICMP/PING'][Math.floor(Math.random() * 5)],
        size:      `${Math.floor(Math.random() * 1024)} B`,
        timestamp: new Date().toISOString().slice(11, 23)
    }));
    res.json(flows);
});

// ============================================================
// Main analyse endpoint
// ============================================================
app.post('/api/analyze', upload.single('pcap'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No PCAP file uploaded.' });

    const inputPath  = req.file.path;
    const outputPath = path.join(__dirname, 'uploads', `output-${Date.now()}.pcap`);
    const enginePath = path.join(__dirname, '..', 'dpi_engine.exe');

    console.log(`[analyze] Running engine on ${req.file.originalname}`);
    const cmd = `"${enginePath}" "${inputPath}" "${outputPath}"`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error('[analyze] engine error:', error.message);
            return res.status(500).json({ error: 'Engine failed.', details: error.message, stderr });
        }

        // Parse and store
        const analytics = parseDPIOutput(stdout, req.file.originalname);
        latestAnalysis  = analytics;

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
