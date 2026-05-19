const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Set up storage for uploaded PCAP files
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'Engine Bridge Online' });
});

// Mock Dashboard Statistics
app.get('/api/stats', (req, res) => {
    res.json({
        uptime: '99.9%',
        systemLoad: '0.04',
        peakProcessing: '1.2B',
        threatsMitigated: '42.8k',
        globalNodes: 128,
        coreEngine: 'STABLE',
        dbLatency: '0.02',
        memoryLoad: '42.1',
    });
});

// Mock Rules Config
let activeRules = [
    {
        id: '1',
        title: 'BLOCK SUSPICIOUS EXIT NODES',
        description: 'Drops all packets originating from known Tor exit nodes in real-time.',
        tags: ['#SECURITY', '#TOR-BLOCK'],
        enabled: true
    },
    {
        id: '2',
        title: 'THROTTLE STREAMING',
        description: 'Limits video streaming services to 5Mbps during peak enterprise hours.',
        tags: ['#BANDWIDTH', '#QOS'],
        enabled: false
    },
    {
        id: '3',
        title: 'SSH BRUTE PROTECTION',
        description: 'Auto-bans IPs with 10+ failed attempts in 60s windows.',
        tags: ['#COMPLIANCE', '#BRUTE-FORCE'],
        enabled: true
    },
];

app.get('/api/rules', (req, res) => {
    res.json(activeRules);
});

app.post('/api/rules', (req, res) => {
    const { id, enabled } = req.body;
    activeRules = activeRules.map(r => r.id === id ? { ...r, enabled } : r);
    res.json({ success: true, rules: activeRules });
});

// Mock Traffic Stream
app.get('/api/traffic-stream', (req, res) => {
    const flowCount = Math.floor(Math.random() * 5) + 3; // 3-8 random flows
    const newFlows = Array.from({ length: flowCount }).map((_, i) => ({
        id: Math.random().toString(36).substr(2, 9),
        action: Math.random() > 0.8 ? 'DROP' : 'ALLOW',
        srcIp: `192.168.1.${Math.floor(Math.random() * 255)}`,
        dstIp: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.12.31`,
        proto: ['HTTPS/TLS', 'SSH/BRUTE', 'TCP/KEEPALIVE', 'DNS/UDP', 'ICMP/PING'][Math.floor(Math.random() * 5)],
        size: `${Math.floor(Math.random() * 1024)} B`,
        timestamp: new Date().toISOString().slice(11, 23)
    }));

    res.json(newFlows);
});

app.post('/api/analyze', upload.single('pcap'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No PCAP file uploaded' });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(__dirname, 'uploads', `output-${Date.now()}.pcap`);

    // Assuming dpi_engine.exe is in the parent directory of backend/
    const enginePath = path.join(__dirname, '..', 'dpi_engine.exe');

    console.log(`Starting analysis on: ${inputPath}`);

    // Executing the C++ engine
    const command = `"${enginePath}" "${inputPath}" "${outputPath}"`;

    exec(command, (error, stdout, stderr) => {
        // Optionally clean up the files after processing
        // fs.unlinkSync(inputPath);
        // if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        if (error) {
            console.error(`Execution error: ${error.message}`);
            return res.status(500).json({
                error: 'Engine Execution Failed',
                details: error.message,
                stdout: stdout,
                stderr: stderr
            });
        }

        if (stderr && !stdout.includes('DPI ENGINE')) {
            console.warn(`Engine stderr: ${stderr}`);
        }

        // Parse the stdout to extract some generic metrics for the dashboard if needed
        // The frontend currently uses mock data, but we can pass the raw logs down.

        // Create an array of log lines
        const logLines = stdout.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map((line, idx) => ({
                id: idx.toString(),
                time: new Date().toISOString().slice(11, 19),
                level: line.includes('BLOCKED') ? 'warn' : line.includes('Dropped') ? 'error' : 'info',
                message: line
            }));

        console.log('Analysis complete!');

        res.json({
            success: true,
            message: 'Analysis completed successfully',
            logs: logLines,
            rawOutput: stdout
        });
    });
});

app.listen(PORT, () => {
    console.log(`DPI Engine Integration Server running on http://localhost:${PORT}`);
});
