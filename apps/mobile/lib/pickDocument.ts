import { Platform } from 'react-native';

export type PickedDocument = {
  name: string;
  mime: string;
  bytes: ArrayBuffer;
};

const CV_ACCEPT =
  'application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx';

const ALLOWED = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function mimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  return 'application/octet-stream';
}

/**
 * Scelta file per il CV. Sulla PWA usa l'input nativo del browser.
 */
export function pickDocument(): Promise<PickedDocument | null> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = CV_ACCEPT;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const mime = file.type || mimeFromName(file.name);
      if (!ALLOWED.has(mime)) {
        resolve(null);
        return;
      }
      void file.arrayBuffer().then((bytes) => {
        resolve({ name: file.name, mime, bytes });
      });
    };
    input.click();
  });
}

export function canPickDocument(): boolean {
  return Platform.OS === 'web' && typeof document !== 'undefined';
}
