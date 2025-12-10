# Web WhatsApp Wrapper

A Node.js application acting as a wrapper around [whatsapp-web.js](https://wwebjs.dev/), allowing you to programmatically control multiple WhatsApp clients. It exposes functionality via both a standard **REST API** and a **Connect-RPC (gRPC)** service.

## 🚀 Features

-   **Multi-Client Support**: Manage multiple independent WhatsApp sessions concurrently.
-   **Hybrid API**:
    -   **REST**: For simple client management and message sending.
    -   **Connect-RPC**: For advanced workflows with Protobuf, including smart waiting for QR codes.
-   **Session Persistence**: Automatically saves authentication tokens to MongoDB (no need to scan QR codes after restart).
-   **Contact Validation**: Ensures messages are only sent to known contacts (auto-discovered via incoming messages).
-   **Fastify Powered**: Built on Fastify with HTTP/2 support for high performance.

## 🛠️ Prerequisites

-   **Node.js** (v20+ recommended)
-   **MongoDB** (Required for session and client storage)
-   **Chrome/Chromium** (Required by Puppeteer)

## 📦 Installation

1.  **Install dependencies**:
    ```bash
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
    | `MONGODB_HOST` | MongoDB Host | `127.0.0.1` |
    | `MONGODB_PORT` | MongoDB Port | `27017` |
    | `MONGODB_DATABASE` | Database name | `whatsapp_integration` |

3.  **Start the Server**:
    ```bash
    yarn dev    # Development mode (watch)
    yarn start  # Production mode
    ```

## 🔌 API Documentation

### REST API

**Base URL**: `/`

| Method | Endpoint | Description | Payload/Query |
|:-------|:---------|:------------|:--------------|
| `POST` | `/whatsapp/clients` | Create or resume a client session | `{"client_id": "string"}` |
| `GET` | `/whatsapp/clients` | List all active client IDs | - |
| `GET` | `/whatsapp/status` | Check client readiness | `?client_id=...` |
| `GET` | `/whatsapp/qr` | Get raw QR code string | `?client_id=...` |
| `GET` | `/whatsapp/qr-page` | View QR code in browser | `?client_id=...` |
| `POST` | `/whatsapp/send-message` | Send a text message | `{"client_id": "...", "receiver_id": "phone", "message": "text"}` |

### Connect-RPC Service

**Service**: `whatsapp_service.WhatsappService`
**Proto Definition**: `protos/whatsapp_service/whatsapp_service.proto`

1.  **`GetWhatsappClientStatus`**
    -   Checks if a client is ready.
    -   **Smart Wait**: If the client is initializing, this request will hold (long-poll) for up to 20 seconds waiting for the QR code or 'Ready' state.

2.  **`PushWhatsappMessage`**
    -   Sends a message.
    -   **Feature**: Automatically applies text obfuscation.

## 🗂️ Project Structure

```
├── config/             # Environment configuration
├── connect-rpc/        # gRPC service implementations
├── helper/             # Utilities (e.g., text obfuscation)
├── models/             # Mongoose schemas (Client, Contact)
├── protos/             # Protocol Buffer definitions
├── routes/             # REST API routes
├── storage/            # Database connection logic
├── wweb/
│   ├── clientManager.js  # Manages multiple WhatsAppClient instances
│   └── client.js         # Wrapper around whatsapp-web.js
└── index.js            # Entry point
```

## ⚠️ Important Notes

1.  **First Run**: When you create a client, go to `/whatsapp/qr-page?client_id=YOUR_ID` to scan the QR code.
2.  **Sending Messages**: You can generally only send messages to contacts that have *previously messaged one of your clients*. This is a restriction enforced to ensure the contact exists in the database.
3.  **Docker**: A `Dockerfile` is included for containerized deployment.

## License

ISC
