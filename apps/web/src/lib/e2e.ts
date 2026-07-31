export function encryptContent(content: string, hexKey: string): string {
  if (!hexKey) return content;
  const keyBytes = hexToBytes(hexKey.slice(0, 64));
  const data = new TextEncoder().encode(content);
  const encrypted = xorBytes(data, keyBytes);
  return `e2e:${bytesToBase64(encrypted)}`;
}

export function getE2eKey(): string | null {
  return localStorage.getItem('matusms_e2e_key');
}

export function shouldEncryptByDefault(): boolean {
  return localStorage.getItem('matusms_encrypt_default') === 'true';
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

function xorBytes(data: Uint8Array, key: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i]! ^ key[i % key.length]!;
  }
  return out;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
