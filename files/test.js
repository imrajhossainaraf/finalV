const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(cors());

// Log all incoming requests for debugging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Original endpoint
app.post("/api/attendance", (req, res) => {
    console.log("--- Received Attendance ---");
    console.log(JSON.stringify(req.body, null, 2));
    res.send("Attendance recorded successfully");
});

// Sync endpoint that Arduino Attendly_v2 uses
app.post("/api/sync", (req, res) => {
    console.log("--- Received Sync Data from Arduino ---");
    const { mac, logs } = req.body;
    console.log(`MAC Address: ${mac}`);
    if (logs && Array.isArray(logs)) {
        console.log(`Logs count: ${logs.length}`);
        logs.forEach((log, index) => {
            console.log(`  [${index}] UID: ${log.uid}, Time: ${log.time}`);
        });
    } else {
        console.log("No logs received or invalid format");
        console.log(JSON.stringify(req.body, null, 2));
    }
    res.status(200).send("Sync successful");
});

app.get("/", (req, res) => {
    res.send("Arduino Test Server is running");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Test Server is running on http://0.0.0.0:${PORT}`);
    console.log(`Make sure your Arduino is configured to send data to this IP.`);
});
