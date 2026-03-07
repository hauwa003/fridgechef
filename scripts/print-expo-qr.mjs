#!/usr/bin/env node
/**
 * Prints a QR code for Expo Go connection.
 * Reads the local IP from apps/mobile/.env (EXPO_PUBLIC_API_URL)
 * or falls back to detecting it automatically.
 */
import { readFileSync } from 'fs';
import { networkInterfaces } from 'os';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getLocalIP() {
  // Try reading from mobile .env first
  try {
    const envPath = resolve(__dirname, '../apps/mobile/.env');
    const env = readFileSync(envPath, 'utf-8');
    const match = env.match(/EXPO_PUBLIC_API_URL=http:\/\/([\d.]+):/);
    if (match) return match[1];
  } catch {}

  // Fallback: detect from network interfaces
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

// QR code generation using simple block characters (no dependencies)
function qrEncode(text) {
  // Use a basic QR encoding via the qr-image-like approach
  // Since we want zero deps, we'll shell out to python if available,
  // otherwise print the URL for manual entry.
  return text;
}

const ip = getLocalIP();
const expoUrl = `exp://${ip}:8081`;

console.log('\n' + '='.repeat(50));
console.log('  EXPO GO CONNECTION');
console.log('='.repeat(50));
console.log(`\n  URL: ${expoUrl}\n`);

// Try to generate QR with python (available on macOS by default)
import { execSync } from 'child_process';
try {
  execSync(`python3 -c "
import sys
try:
    import qrcode
    qr = qrcode.QRCode(box_size=1, border=1)
    qr.add_data('${expoUrl}')
    qr.make()
    qr.print_ascii(invert=True)
except ImportError:
    # Minimal QR using segno (often pre-installed) or skip
    try:
        import segno
        segno.make('${expoUrl}').terminal(compact=True)
    except ImportError:
        print('  Install qrcode for QR display: pip3 install qrcode')
        print('  Or scan from Expo Go using the URL above.')
"`, { stdio: 'inherit' });
} catch {
  console.log('  Open Expo Go and enter the URL above manually.');
}

console.log('\n' + '='.repeat(50) + '\n');
