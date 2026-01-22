# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Certificate Authority (CA) Management System built with Next.js 15.5.9 (React 19) and TypeScript. The application provides a web interface for creating CAs and issuing client certificates using OpenSSL.

## Common Commands

### Development
```bash
npm run dev       # Start dev server with Turbopack
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

### Testing
Note: Jest is configured as a dev dependency but no test files exist yet. When adding tests, create them alongside source files with `.test.ts` or `.test.tsx` extensions.

## Architecture

### Directory Structure

- **`/src/app/`** - Next.js App Router structure
  - `page.tsx` - Main UI component (Client component with React state)
  - `layout.tsx` - Root layout with metadata and fonts
  - `globals.css` - Tailwind CSS configuration
  - `/api/ca/route.ts` - REST API endpoints for CA operations

- **`/certificates/`** - Certificate storage (not tracked in git)
  - `/cas/{ca-name}/` - CA private keys and certificates
  - `/clients/{client-name}/` - Generated client certificates

- **`/public/`** - Static assets

### Key Technical Details

**OpenSSL Integration**
The backend uses Node.js `child_process.exec` to run OpenSSL commands. All cryptographic operations depend on OpenSSL being installed on the system.

Certificate specifications:
- CA: 4096-bit RSA, 10-year validity, self-signed
- Client: 2048-bit RSA, 1-year validity, CA-signed
- PKCS#12: Encrypted with 16-byte hex password
- Signing: SHA-256 digest algorithm

**API Endpoints**

`GET /api/ca`
- Lists all available CAs from `certificates/cas/` directory
- Returns array of CA objects with name and creation timestamp

`POST /api/ca` with `action: "create-ca"`
- Creates new CA with private key and self-signed certificate
- Body: `{ action: "create-ca", name: "ca-name" }`

`POST /api/ca` with `action: "create-client-cert"`
- Generates client certificate signed by existing CA
- Body: `{ action: "create-client-cert", caName: "existing-ca", clientName: "client-name" }`
- Returns file paths and P12 password

**Frontend Architecture**
The main UI (`page.tsx`) is a Client Component that:
- Fetches CA list on mount
- Manages form state with React hooks
- Handles certificate creation and displays results
- Provides clipboard copy functionality for P12 passwords

### TypeScript Configuration

- Path alias: `@/*` maps to `./src/*`
- Target: ES2017
- Strict mode enabled
- Module resolution: bundler (Next.js)

### Important Files

- `/src/app/api/ca/route.ts` - All certificate generation logic
- `/src/app/page.tsx` - User interface and client-side interactions
- `/.gitignore` - Excludes certificates, keys, and P12 files (security)

## Development Notes

**Security Considerations**
- Private keys and certificates are stored on filesystem
- Ensure proper file permissions on `certificates/` directory
- P12 passwords are randomly generated per client certificate
- Never commit files from `certificates/` directory

**External Dependencies**
- Requires OpenSSL binary installed on system
- Certificate operations fail if OpenSSL is not available

**Existing CA Integration**
To use an existing CA, place `ca.key` and `ca.crt` in `certificates/cas/{ca-name}/` directory. The system will automatically detect and use it for signing client certificates.
