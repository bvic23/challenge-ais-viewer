# AIS Vessel Tracking Backend

A real-time vessel tracking backend system that processes AIS (Automatic Identification System) data streams and provides vessel position information via REST API and WebSocket connections.

## Prerequisites

* **Docker**: [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)
* **Docker Compose**: Usually included with Docker Desktop
* **Node.js**: Version 18+ (for local development without Docker)

## Environment Setup

1. **Create Environment File**

   ```bash
   cd backend
   # Create a .env file with the following variables:
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the `backend/` directory with:

   ```bash
   # Database Configuration
   POSTGRES_USER=ais_user
   POSTGRES_PASSWORD=your_secure_password
   POSTGRES_DB=ais_vessels

   # AIS Stream API Key (get from https://aisstream.io/)
   AISSTREAM_API_KEY=your_api_key_here

   # Node Environment
   NODE_ENV=development
   ```

## Quick Start

```bash
cd backend
chmod +x setup.sh
./setup.sh
```

## API Endpoints

### GET /vessels

Retrieve vessels within a specified geographic bounding box.

**Query Parameters:**

* `min_lon`: Minimum longitude (-180 to 180)
* `min_lat`: Minimum latitude (-90 to 90)
* `max_lon`: Maximum longitude (-180 to 180)
* `max_lat`: Maximum latitude (-90 to 90)

**Example Request:**

```bash
curl "http://localhost:3000/vessels?min_lon=-180&min_lat=-90&max_lon=180&max_lat=90"
```

**Response Format:**

```json
[
  {
    "mmsi": 366773150,
    "lon": -76.343085,
    "lat": 36.905723333333334,
    "bearing": 352.6, // calculated from COG/SOG and heading
    "nav_status": 0,
    "position_accuracy": false
  }
]
```

## Database Schema

The system uses PostgreSQL with the PostGIS extension for spatial data:

```sql
CREATE TABLE vessels (
  mmsi BIGINT PRIMARY KEY,                    -- Maritime Mobile Service Identity
  position GEOMETRY(POINT, 4326),             -- GPS coordinates (PostGIS)
  bearing FLOAT,                              -- True heading
  position_accuracy BOOLEAN,                  -- Position accuracy indicator
  timestamp INT,                              -- AIS timestamp
  last_updated TIMESTAMP WITH TIME ZONE       -- Last database update
);
```

## Future Considerations

### Performance Optimizations

* **Language Migration**: Consider Rust or Go for improved performance and cost efficiency.
* **Caching Layer**: Add Redis to cache frequently accessed vessel data.
* **Message Broker**: Implement Kafka or Redis Streams for decoupled ingest/API scaling.
* **Horizontal Scaling**: Separate ingest and API servers for independent scaling.

### Real-time Enhancements

* **WebSocket API**: Replace polling with WebSockets for sub-2-second latency requirements.
* **Protocol Buffers**: Use Protobuf for bandwidth optimization.
* **Authentication**: Add proper authentication and authorization for production.

## Developer Experience & Code Quality

* Extract database-related code into separate modules to improve maintainability.
* Consider using an ORM to abstract SQL complexity where appropriate.
