# Certificate Authority (CA) Management System

This project provides a web-based interface for managing Certificate Authorities (CAs) and generating client certificates. It's built with Next.js and provides REST APIs for CA operations.

## Features

- Create and manage Certificate Authorities (CAs)
- Generate client certificates signed by your CAs
- Export certificates in various formats (CRT, KEY, P12)
- Secure password generation for P12 keystores

## Prerequisites

- Node.js (Latest LTS version recommended)
- OpenSSL installed on your system

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### List CAs
```
GET /api/ca
```
Returns a list of all Certificate Authorities.

### Create a new CA
```
POST /api/ca
{
    "action": "create-ca",
    "name": "your-ca-name"
}
```

### Create a Client Certificate
```
POST /api/ca
{
    "action": "create-client-cert",
    "caName": "existing-ca-name",
    "clientName": "client-name"
}
```

## Integrating Existing CAs

To integrate an existing CA into the system:

1. Create a directory with your CA name under `certificates/cas/`
2. Place your existing CA files in this directory:
   - `ca.key` - Your CA private key
   - `ca.crt` - Your CA certificate

Example structure:
```
certificates/
├── cas/
│   └── your-ca-name/
│       ├── ca.key
│       └── ca.crt
└── clients/
```

The system will automatically detect and use your existing CA for signing new client certificates.

## Security Considerations

- CA private keys are stored on the filesystem. Ensure proper file permissions
- P12 passwords are randomly generated for each client certificate
- All cryptographic operations use industry-standard OpenSSL commands
- Default key sizes: CA (4096 bits), Client certificates (2048 bits)

## Certificate Details

- CA certificates are valid for 10 years (3650 days)
- Client certificates are valid for 1 year (365 days)
- SHA-256 is used for signing
- Certificates use the Common Name (CN) format for identification
