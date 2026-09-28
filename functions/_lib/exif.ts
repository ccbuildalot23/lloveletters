/**
 * Strips metadata from uploaded images (11.1 "strip EXIF"):
 * - JPEG: removes APP1 (Exif/XMP), APP2 (ICC is kept), COM segments.
 * - PNG: removes eXIf, tEXt, iTXt, zTXt chunks.
 * - HEIC: not rewritten (container is complex); documented in README. Stored as-is.
 */
export function stripExif(buf: ArrayBuffer, contentType: string): ArrayBuffer {
  const bytes = new Uint8Array(buf);
  if (contentType === 'image/jpeg' && bytes[0] === 0xff && bytes[1] === 0xd8)
    return stripJpeg(bytes).buffer as ArrayBuffer;
  if (contentType === 'image/png' && bytes[0] === 0x89 && bytes[1] === 0x50)
    return stripPng(bytes).buffer as ArrayBuffer;
  return buf;
}

function stripJpeg(b: Uint8Array): Uint8Array {
  const out: number[] = [0xff, 0xd8];
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) break;
    const marker = b[i + 1]!;
    if (marker === 0xda) {
      // Start of scan: copy the rest verbatim.
      for (let k = i; k < b.length; k++) out.push(b[k]!);
      return Uint8Array.from(out);
    }
    const len = (b[i + 2]! << 8) | b[i + 3]!;
    const drop = marker === 0xe1 || marker === 0xfe || (marker >= 0xe3 && marker <= 0xef); // APP1 (Exif/XMP), COM, APP3–15
    if (!drop) for (let k = i; k < i + 2 + len; k++) out.push(b[k]!);
    i += 2 + len;
  }
  return Uint8Array.from(out);
}

function stripPng(b: Uint8Array): Uint8Array {
  const out: number[] = Array.from(b.subarray(0, 8));
  let i = 8;
  const dropTypes = new Set(['eXIf', 'tEXt', 'iTXt', 'zTXt', 'tIME']);
  while (i + 8 <= b.length) {
    const len = (b[i]! << 24) | (b[i + 1]! << 16) | (b[i + 2]! << 8) | b[i + 3]!;
    const type = String.fromCharCode(b[i + 4]!, b[i + 5]!, b[i + 6]!, b[i + 7]!);
    const total = 12 + len;
    if (!dropTypes.has(type)) for (let k = i; k < i + total && k < b.length; k++) out.push(b[k]!);
    i += total;
    if (type === 'IEND') break;
  }
  return Uint8Array.from(out);
}

export const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/heic', 'image/heif']);
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Sniffs the real type from magic bytes so a renamed file can't lie. */
export function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    return 'image/png';
  const ftyp = String.fromCharCode(...bytes.subarray(4, 12));
  if (ftyp.startsWith('ftyp') && /heic|heix|hevc|mif1|msf1|heif/.test(ftyp)) return 'image/heic';
  return null;
}
