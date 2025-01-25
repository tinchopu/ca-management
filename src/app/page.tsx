'use client';

import { useState, useEffect } from 'react';

interface CAInfo {
  name: string;
  created: string;
}

interface CertificateResult {
  files: {
    cert: string;
    key: string;
    p12: string;
  };
  p12Password: string;
}

export default function Home() {
  const [cas, setCAs] = useState<CAInfo[]>([]);
  const [selectedCA, setSelectedCA] = useState<string>('');
  const [newCAName, setNewCAName] = useState('');
  const [clientName, setClientName] = useState('');
  const [message, setMessage] = useState('');
  const [certResult, setCertResult] = useState<CertificateResult | null>(null);

  useEffect(() => {
    const fetchCAs = async () => {
      try {
        const response = await fetch('/api/ca');
        if (!response.ok) throw new Error('Failed to fetch CAs');
        const data = await response.json();
        setCAs(data);
      } catch (error) {
        console.error('Error fetching CAs:', error);
        setMessage('Error loading CAs');
      }
    };
    fetchCAs();
  }, []);

  const handleCreateCA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/ca', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-ca',
          name: newCAName,
        }),
      });

      if (!response.ok) throw new Error('Failed to create CA');
      const newCA = await response.json();
      setCAs([...cas, newCA]);
      setNewCAName('');
      setMessage('CA created successfully');
    } catch (error) {
      console.error('Error creating CA:', error);
      setMessage('Error creating CA');
    }
  };

  const handleCreateClientCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCA) {
      setMessage('Please select a CA first');
      return;
    }
    try {
      const response = await fetch('/api/ca', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-client-cert',
          caName: selectedCA,
          clientName: clientName,
        }),
      });

      if (!response.ok) throw new Error('Failed to create client certificate');
      const result = await response.json();
      setCertResult(result);
      setMessage('Client certificate created successfully');
      setClientName('');
    } catch (error) {
      console.error('Error creating client certificate:', error);
      setMessage('Error creating client certificate');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      // Try the modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setMessage('Copied to clipboard!');
        return;
      }

      // Fallback to the older execCommand method
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Avoid scrolling to bottom
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        setMessage('Copied to clipboard!');
      } catch (err) {
        setMessage('Press Ctrl+C to copy');
        // Keep the textarea selected for manual copying
        setTimeout(() => textArea.remove(), 3000);
        return;
      }

      textArea.remove();
    } catch (err) {
      console.error('Copy failed:', err);
      setMessage('Press Ctrl+C to copy');
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Certificate Authority Management</h1>
      
      {/* Create CA Section */}
      <section className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Create New CA</h2>
        <form onSubmit={handleCreateCA} className="space-y-4">
          <div>
            <label htmlFor="caName" className="block text-sm font-medium text-gray-700">
              CA Name
            </label>
            <input
              type="text"
              id="caName"
              value={newCAName}
              onChange={(e) => setNewCAName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Create CA
          </button>
        </form>
      </section>

      {/* Create Client Certificate Section */}
      <section className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Issue Client Certificate</h2>
        <form onSubmit={handleCreateClientCert} className="space-y-4">
          <div>
            <label htmlFor="caSelect" className="block text-sm font-medium text-gray-700">
              Select CA
            </label>
            <select
              id="caSelect"
              value={selectedCA}
              onChange={(e) => setSelectedCA(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select a CA</option>
              {cas.map((ca) => (
                <option key={ca.name} value={ca.name}>
                  {ca.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">
              Client Name
            </label>
            <input
              type="text"
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Create Client Certificate
          </button>
        </form>
      </section>

      {/* Certificate Result Section */}
      {certResult && (
        <section className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Certificate Details</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div className="flex-grow">
                <p className="text-sm font-medium text-gray-700">P12 File Path</p>
                <p className="text-sm text-gray-600 break-all select-all">{certResult.files.p12}</p>
              </div>
              <button
                onClick={() => copyToClipboard(certResult.files.p12)}
                className="ml-4 text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
              >
                Copy Path
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div className="flex-grow">
                <p className="text-sm font-medium text-gray-700">P12 Password</p>
                <p className="text-sm text-gray-600 font-mono break-all select-all">{certResult.p12Password}</p>
              </div>
              <button
                onClick={() => copyToClipboard(certResult.p12Password)}
                className="ml-4 text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
              >
                Copy Password
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Message Display */}
      {message && (
        <div className="p-4 rounded bg-blue-100 text-blue-900">
          {message}
        </div>
      )}
    </main>
  );
}
