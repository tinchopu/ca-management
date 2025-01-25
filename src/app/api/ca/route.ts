import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

const execAsync = promisify(exec);
const CA_DIR = path.join(process.cwd(), 'certificates');

async function initializeCADirectory() {
  try {
    await fs.mkdir(CA_DIR, { recursive: true });
    await fs.mkdir(path.join(CA_DIR, 'cas'), { recursive: true });
    await fs.mkdir(path.join(CA_DIR, 'clients'), { recursive: true });
  } catch (error) {
    console.error('Error initializing CA directory:', error);
    throw error;
  }
}

export async function GET() {
  try {
    await initializeCADirectory();
    const casDir = path.join(CA_DIR, 'cas');
    const entries = await fs.readdir(casDir, { withFileTypes: true });
    
    const cas = entries
      .filter(entry => entry.isDirectory())
      .map(entry => ({
        name: entry.name,
        created: new Date().toISOString(),
      }));

    return NextResponse.json(cas);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list CAs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action, name, caName, clientName } = await request.json();

    if (action === 'create-ca') {
      const caPath = path.join(CA_DIR, 'cas', name);
      await fs.mkdir(caPath, { recursive: true });

      await execAsync(`openssl genrsa -out "${path.join(caPath, 'ca.key')}" 4096`);
      await execAsync(
        `openssl req -x509 -new -nodes -key "${path.join(caPath, 'ca.key')}" \
        -sha256 -days 3650 -out "${path.join(caPath, 'ca.crt')}" \
        -subj "/CN=${name} CA"`
      );

      return NextResponse.json({
        name,
        created: new Date().toISOString(),
      });
    }

    if (action === 'create-client-cert') {
      const caPath = path.join(CA_DIR, 'cas', caName);
      const clientPath = path.join(CA_DIR, 'clients', clientName);
      
      await fs.mkdir(clientPath, { recursive: true });

      await execAsync(`openssl genrsa -out "${path.join(clientPath, 'client.key')}" 2048`);
      await execAsync(
        `openssl req -new -key "${path.join(clientPath, 'client.key')}" \
        -out "${path.join(clientPath, 'client.csr')}" \
        -subj "/CN=${clientName}"`
      );

      await execAsync(
        `openssl x509 -req -in "${path.join(clientPath, 'client.csr')}" \
        -CA "${path.join(caPath, 'ca.crt')}" \
        -CAkey "${path.join(caPath, 'ca.key')}" \
        -CAcreateserial \
        -out "${path.join(clientPath, 'client.crt')}" \
        -days 365 -sha256`
      );

      await execAsync(
        `openssl pkcs12 -export -out "${path.join(clientPath, 'client.p12')}" \
        -inkey "${path.join(clientPath, 'client.key')}" \
        -in "${path.join(clientPath, 'client.crt')}" \
        -certfile "${path.join(caPath, 'ca.crt')}" \
        -passout pass:changeit`
      );

      return NextResponse.json({
        clientName,
        files: {
          cert: path.join(clientPath, 'client.crt'),
          key: path.join(clientPath, 'client.key'),
          p12: path.join(clientPath, 'client.p12'),
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
} 