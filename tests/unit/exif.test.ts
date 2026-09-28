import { describe, expect, it } from 'vitest';
import { stripExif, sniffImageType } from '../../functions/_lib/exif';

function jpegWithExif(): Uint8Array {
  const soi = [0xff, 0xd8];
  const exif = [0x45, 0x78, 0x69, 0x66, 0, 0, 1, 2, 3, 4];
  const app1 = [0xff, 0xe1, 0x00, exif.length + 2, ...exif];
  const app0 = [0xff, 0xe0, 0x00, 0x04, 0x4a, 0x46];
  const sos = [0xff, 0xda, 0x00, 0x02, 0xaa, 0xbb, 0xff, 0xd9];
  return Uint8Array.from([...soi, ...app0, ...app1, ...sos]);
}

describe('EXIF stripping (11.1)', () => {
  it('removes APP1 from JPEG and keeps image data', () => {
    const input = jpegWithExif();
    const out = new Uint8Array(stripExif(input.buffer as ArrayBuffer, 'image/jpeg'));
    const hex = Array.from(out)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    expect(hex).not.toContain('ffe1');
    expect(hex).toContain('ffe0');
    expect(hex.endsWith('ffd9')).toBe(true);
  });
  it('removes tEXt/eXIf chunks from PNG', () => {
    const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    const chunk = (type: string, data: number[]) => [
      0,
      0,
      0,
      data.length,
      ...type.split('').map((c) => c.charCodeAt(0)),
      ...data,
      0,
      0,
      0,
      0,
    ];
    const png = Uint8Array.from([
      ...sig,
      ...chunk('IHDR', [1, 2, 3]),
      ...chunk('tEXt', [9, 9]),
      ...chunk('eXIf', [7]),
      ...chunk('IDAT', [5]),
      ...chunk('IEND', []),
    ]);
    const out = new TextDecoder('latin1').decode(
      new Uint8Array(stripExif(png.buffer as ArrayBuffer, 'image/png')),
    );
    expect(out).not.toContain('tEXt');
    expect(out).not.toContain('eXIf');
    expect(out).toContain('IDAT');
  });
  it('sniffs types from magic bytes', () => {
    expect(sniffImageType(jpegWithExif())).toBe('image/jpeg');
    expect(sniffImageType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47]))).toBe('image/png');
    expect(
      sniffImageType(
        Uint8Array.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]),
      ),
    ).toBe('image/heic');
    expect(sniffImageType(Uint8Array.from([1, 2, 3, 4]))).toBeNull();
  });
});
