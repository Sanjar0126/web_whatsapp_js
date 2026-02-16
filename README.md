# Web WhatsApp Wrapper

A Node.js application acting as a wrapper around [whatsapp-web.js](https://wwebjs.dev/), allowing you to programmatically control multiple WhatsApp clients. It exposes functionality via both a standard **REST API** and a **Connect-RPC (gRPC)** service.

## 🚀 Features

-   **Multi-Client Support**: Manage multiple independent WhatsApp sessions concurrently.
-   **Hybrid API**:
    -   **REST**: For simple client management and message sending.
    -   **Connect-RPC**: For advanced workflows with Protobuf, including smart waiting for QR codes.
-   **Flexible Auth Strategy**: Choose between `LocalAuth` (filesystem) or `RemoteAuth` (MongoDB GridFS) for session persistence.
-   **Contact Validation**: Ensures messages are only sent to known contacts (auto-discovered via incoming messages).
-   **Fastify Powered**: Built on Fastify with HTTP/2 support for high performance.
-   **Rate Limiting**: Built-in rate limiting (100 requests/minute).

## 🛠️ Prerequisites

-   **Node.js** v20+ (`.nvmrc` specifies `24.11.1`)
-   **MongoDB** (required for client metadata and contact storage; also for session storage when using `remote` auth)
-   **Chrome/Chromium** (required by Puppeteer for running WhatsApp Web)

## 📦 Installation

1.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

2.  **Configure Environment**:
    Copy the example file and update it with your settings:
    ```bash
    cp .env.example .env
    ```

    | Variable | Description | Default |
    |----------|-------------|---------|
    | `PORT` | Server port | `8008` |
    | `HOST` | Server host | `0.0.0.0` |
    | `LOG_LEVEL` | Pino log level (`debug`, `info`, `warn`, `error`) | `info` |
    | `CORS_ORIGIN` | Allowed CORS origin | `*` |
    | `NODE_ENV` | `development` or `production` | `development` |
    | `AUTH_STRATEGY` | Auth strategy: `local` or `remote` | `local` |
    | `MONGODB_HOST` | MongoDB host | `127.0.0.1` |
    | `MONGODB_PORT` | MongoDB port | `27017` |
    | `MONGODB_DATABASE` | Database name | `whatsapp_integration` |
    | `MONGODB_USER` | MongoDB username (used when `NODE_ENV=production`) | *(empty)* |
    | `MONGODB_PASSWORD` | MongoDB password (used when `NODE_ENV=production`) | *(empty)* |

    > In `development` mode, the MongoDB connection string omits credentials. In `production`, `MONGODB_USER` and `MONGODB_PASSWORD` are included in the URI.

3.  **Start the Server**:
    ```bash
    npm run dev    # Development mode (watch)
    npm start      # Production mode
    ```

## 🔌 API Documentation

### Health Check

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/health` | Server health check |

**Response**:
```json
{ "status": "ok", "timestamp": "2025-01-01T00:00:00.000Z" }
```

### REST API

**Base URL**: `/whatsapp`

| Method | Endpoint | Description | Payload/Query |
|:-------|:---------|:------------|:--------------|
| `POST` | `/whatsapp/clients` | Create or resume a client session | `{"client_id": "string"}` |
| `GET` | `/whatsapp/clients` | List all active client IDs | - |
| `GET` | `/whatsapp/status` | Check client readiness | `?client_id=...` |
| `GET` | `/whatsapp/qr` | Get raw QR code string | `?client_id=...` |
| `GET` | `/whatsapp/qr-page` | View QR code in browser (auto-refreshes) | `?client_id=...` |
| `POST` | `/whatsapp/send-message` | Send a text message | `{"client_id": "...", "receiver_id": "phone", "message": "text"}` |

#### Example: Create a client

```bash
curl -X POST http://localhost:8008/whatsapp/clients \
  -H "Content-Type: application/json" \
  -d '{"client_id": "my-client"}'
```

```json
{ "success": true, "message": "Client my-client created/started" }
```

#### Example: Send a message

```bash
curl -X POST http://localhost:8008/whatsapp/send-message \
  -H "Content-Type: application/json" \
  -d '{"client_id": "my-client", "receiver_id": "5511999999999", "message": "Hello!"}'
```

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "receiver_id": "5511999999999",
    "timestamp": "2025-01-01T00:00:00.000Z",
    "messageId": "true_5511999999999@c.us_AABBCCDD"
  }
}
```

> **Note**: A random delay (0 – 5 seconds) is added before each message is sent via REST to mimic human behavior.

### Connect-RPC Service

**Service**: `whatsapp_service.WhatsappService`
**Proto Definition**: [`protos/whatsapp_service/whatsapp_service.proto`](protos/whatsapp_service/whatsapp_service.proto)
**Transport**: HTTP/2 (Connect protocol)

#### `GetWhatsappClientStatus`

Checks if a client is ready. If the client doesn't exist yet, it is **auto-created**.

-   **Smart Wait**: If the client is initializing and no QR code is available yet, the request will long-poll for up to **20 seconds**, waiting for either a QR code or a `ready` event before responding.

**Request** (`GetRequest`):
```json
{ "client_id": "my-client" }
```

**Response** (`WhatsappClientStatus`):
```json
{ "is_ready": false, "has_client": true, "qr": "2@ABC123..." }
```

#### `PushWhatsappMessage`

Sends a text message. The message is dispatched asynchronously (fire-and-forget) with a random delay of 0 – 10 seconds.

> **Text obfuscation**: Messages sent via Connect-RPC are automatically obfuscated by randomly swapping visually similar Latin and Cyrillic characters (e.g., Latin `A` <-> Cyrillic `А`). This is applied before sending.

**Request** (`PushWhatsappMessageRequest`):
```json
{ "client_id": "my-client", "text": "Hello!", "phone": "5511999999999", "photo": "" }
```

**Response**: `google.protobuf.Empty` (empty `{}`)

#### Proto Messages

Defined in [`protos/whatsapp_service/whatsapp.proto`](protos/whatsapp_service/whatsapp.proto):

```protobuf
message PushWhatsappMessageRequest {
  string client_id = 1;
  string text = 2;
  string phone = 3;
  string photo = 4;   // reserved, not yet implemented
}

message WhatsappClientStatus {
  bool is_ready = 1;
  bool has_client = 2;
  string qr = 3;
}

message GetRequest {
  string client_id = 1;
}
```

## 🗂️ Project Structure

```
├── config/             # Environment configuration
├── connect-rpc/        # Connect-RPC service implementation
├── genproto/           # Generated Protobuf JS code (via buf)
├── helper/             # Utilities (text obfuscation)
├── models/             # Mongoose schemas (Client, Contact)
├── protos/             # Protocol Buffer source definitions
├── routes/             # REST API route handlers
├── storage/            # MongoDB connection logic
├── wweb/
│   ├── clientManager.js  # Manages multiple WhatsAppClient instances
│   ├── client.js         # Wrapper around whatsapp-web.js
│   └── mongo_store.js    # MongoDB GridFS store (used by RemoteAuth)
└── index.js            # Application entry point
```

## 🔐 Authentication Strategies

The application supports two authentication strategies, configured via the `AUTH_STRATEGY` environment variable:

### `local` (default)
- Sessions are stored on the **filesystem** under `.wwebjs_auth/session-{clientId}/`.
- Simpler setup — no GridFS dependency.
- Best for single-server or local development environments.

### `remote`
- Sessions are stored as ZIP files in **MongoDB GridFS** (collection: `whatsapp-session`).
- Sessions survive container restarts and can be shared across instances.
- Session backup sync interval: every 5 minutes.
- Best for Docker / distributed deployments.

> **Note**: MongoDB is required in both modes for client metadata and contact tracking. The auth strategy only affects where WhatsApp session data is stored.

## 📇 Contact Auto-Discovery

The application maintains a contact whitelist to prevent sending messages to arbitrary numbers:

1. When any **incoming message** is received, the sender's number is automatically saved to the `whatsapp_contacts` collection (linked to the receiving `client_id`).
2. When **sending a message**, the recipient must already exist in the contacts database for that client.
3. Phone numbers are automatically formatted to WhatsApp's chat ID format (`<number>@c.us`).

This means you can only reply to numbers that have previously messaged your client.

## 🐳 Docker

A multi-stage `Dockerfile` is provided using **Node.js 24 Alpine** with Chromium pre-installed.

### Build

```bash
docker build -t web-whatsapp .
```

### Run

```bash
docker run -d \
  --name web-whatsapp \
  -p 8008:8008 \
  -e MONGODB_HOST=host.docker.internal \
  -e MONGODB_PORT=27017 \
  -e MONGODB_DATABASE=whatsapp_db \
  -e AUTH_STRATEGY=remote \
  web-whatsapp
```

> For Docker deployments, `AUTH_STRATEGY=remote` is recommended so sessions persist across container rebuilds. The Dockerfile sets `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser` and skips the Chromium download.

## 🔄 Protobuf Code Generation

Protocol Buffer definitions live in `protos/` and are managed with [Buf](https://buf.build/). Generated JS code is output to `genproto/`.

To regenerate after modifying `.proto` files:

```bash
npx buf generate
```

To lint proto files:

```bash
npx buf lint
```

## ⚠️ Important Notes

1.  **First Run**: Create a client via `POST /whatsapp/clients`, then visit `/whatsapp/qr-page?client_id=YOUR_ID` to scan the QR code. The page auto-refreshes and shows connection status.
2.  **Contact Requirement**: Messages can only be sent to contacts that have *previously messaged* your client. See [Contact Auto-Discovery](#-contact-auto-discovery).
3.  **Send Delays**: Both REST and Connect-RPC introduce a random delay before sending messages (REST: 0–5s, RPC: 0–10s) to mimic human behavior.
4.  **Session Restore**: On server restart, all previously created clients are automatically re-initialized from the database.
5.  **Cache Clearing**: The `.wwebjs_cache/` directory is automatically cleared on every server start.

## License

ISC
