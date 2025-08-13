require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const WebSocket = require('ws');

const app = express();
const port = 3000;

/*  Example AIS message
    -- to store in db
    UserID: 366773150, // mmsi
    Latitude: 36.905723333333334,
    Longitude: -76.343085,
    Cog: 352.6, // course over ground
    Sog: 2.6,
    TrueHeading: 354,
    NavigationalStatus: 0 // https://documentation.spire.com/ais-fundamentals/how-to-interpret-navigational-status-codes/
    PositionAccuracy: false
    Timestamp: 57,

    -- for filtering
    Valid: true
    MessageID: 3 // message type, < 4 is position report

    -- to drop
    Raim: false,
    CommunicationState: 8608, - communication state
    RepeatIndicator: 0,
    RateOfTurn: 127,
    Spare: 0,
    SpecialManoeuvreIndicator: 0,
*/

/* Example query: http://localhost:3000/vessels?min_lon=-180&min_lat=-90&max_lon=180&max_lat=90 */

const WS_CONFIG = {
    url: 'wss://stream.aisstream.io/v0/stream',
    maxReconnectAttempts: 10,
    reconnectDelay: 1000,
};

let ws = null;
let reconnectAttempts = 0;

const dbPool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const scheduleReconnect = () => {
    if (reconnectAttempts >= WS_CONFIG.maxReconnectAttempts) {
        if (reconnectAttempts >= WS_CONFIG.maxReconnectAttempts) {
            console.error(`Max reconnection attempts (${WS_CONFIG.maxReconnectAttempts}) reached. Giving up.`);
        }
        return;
    }

    reconnectAttempts++;

    console.log(`Scheduling reconnection attempt ${reconnectAttempts}/${WS_CONFIG.maxReconnectAttempts}`);

    reconnectTimeout = setTimeout(() => {
        startWebSocket();
    }, WS_CONFIG.reconnectDelay);
}

const setupWebSocketHandlers = () => {
    ws.on('open', subscribeToAISStream);
    ws.on('message', ingestMessage);
    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });

    ws.on('close', (code, reason) => {
        console.log(`WebSocket closed with code ${code}: ${reason}`);

        // Don't reconnect if it was a clean close
        if (code === 1000) {
            return;
        }

        scheduleReconnect();
    });
}

const startWebSocket = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
    }

    console.log(`Attempting to connect to ${WS_CONFIG.url}...`);

    try {
        ws = new WebSocket(WS_CONFIG.url);
        setupWebSocketHandlers();
    } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        scheduleReconnect();
    }
}

const subscribeToAISStream = () => {
    console.log('WebSocket connected successfully');
    reconnectAttempts = 0;

    const subscription = {
        APIKey: process.env.AISSTREAM_API_KEY,
        BoundingBoxes: [
            [[-90, -180], [90, -1]],  // Western hemisphere
            [[-90, 1], [90, 180]]     // Eastern hemisphere
        ],
        FilterMessageTypes: ['PositionReport']
    };
    ws.send(JSON.stringify(subscription));
    console.log('Subscription sent to aisstream.io');
}

const getVesselBearing = (cogDeg, sogKn, hdgDeg) => {
    const isValidCog = Number.isFinite(cogDeg) && cogDeg >= 0 && cogDeg < 360;
    const isValidHdg = Number.isFinite(hdgDeg) && hdgDeg >= 0 && hdgDeg < 360; // AIS uses 511 for N/A

    // if cog is valid and vessel is moving, use cog
    if (isValidCog && sogKn >= 0.5) {
        return cogDeg;
    } else if (isValidHdg) {
        return hdgDeg;
    } else {
        return 0;
    }
}

const ingestMessage = async (data) => {
    const msg = JSON.parse(data);
    if (msg.MessageType !== 'PositionReport') {
        return;
    }
    const positionReport = msg.Message.PositionReport;
    if (!positionReport.Valid || positionReport.MessageID > 3) {
        return;
    }


    const { UserID, Latitude, Longitude, Cog, Sog, TrueHeading, PositionAccuracy, Timestamp } = positionReport;
    const bearing = getVesselBearing(Cog, Sog, TrueHeading);
    try {
        await dbPool.query(`
      INSERT INTO vessels (mmsi, position, bearing, position_accuracy, timestamp, last_updated)
      VALUES ($1, ST_MakePoint($2, $3), $4, $5, $6, NOW())
      ON CONFLICT (mmsi) DO UPDATE SET
        position = EXCLUDED.position,
        bearing = EXCLUDED.bearing,
        position_accuracy = EXCLUDED.position_accuracy,
        timestamp = EXCLUDED.timestamp,
        last_updated = NOW();
    `, [UserID, Longitude, Latitude, bearing, PositionAccuracy, Timestamp]);
    } catch (err) {
        console.error('DB error:', err);
    }
}

const startDB = async () => {
    await dbPool.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS vessels (
        mmsi BIGINT PRIMARY KEY,
        position GEOMETRY(POINT, 4326),
        bearing FLOAT,
        position_accuracy BOOLEAN,
        timestamp INT,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS vessels_position_idx ON vessels USING GIST(position);
    `);
    console.log('Database schema initialized');
};

const startWebServer = () => {
    app.get('/vessels', async (req, res) => {
        const { min_lon, min_lat, max_lon, max_lat } = req.query;
        try {
            const result = await dbPool.query(`
          SELECT mmsi, ST_X(geometry(position)) AS lon, ST_Y(geometry(position)) AS lat, bearing, position_accuracy
          FROM vessels
          WHERE position && ST_MakeEnvelope($1, $2, $3, $4, 4326)
            AND last_updated > NOW() - INTERVAL '2 minutes';
        `, [min_lon, min_lat, max_lon, max_lat]);
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: 'Database query failed' });
        }
    });
    app.listen(port, () => console.log(`Server running on port ${port}`));
}

(async () => {
    try {
        await startDB();
        startWebSocket();
        startWebServer();
    } catch (err) {
        console.error('Initialization error:', err);
    }
})();