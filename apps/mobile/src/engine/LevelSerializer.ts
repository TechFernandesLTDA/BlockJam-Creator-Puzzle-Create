/**
 * LevelSerializer.ts
 * Serialization / deserialization of UGC level data for the BlockJam game.
 *
 * Level format uses a sparse representation: only non-empty cells are stored,
 * keeping payloads small for network transmission and local storage.
 */

import type { BlockColor } from './BlockTypes';
import type { Grid, GridSize } from './GridLogic';
import { createEmptyGrid } from './GridLogic';

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

/** A single pre-filled cell in sparse representation. */
export interface SparseCell {
  row: number;
  col: number;
  color: BlockColor;
}

/** Level metadata stored alongside the grid data. */
export interface LevelMeta {
  name: string;
  creatorId: string;
  targetLines: number;
  targetMoves: number;
  targetScore: number;
  difficulty: 'easy' | 'standard' | 'hard';
  description?: string;
  tags?: string[];
}

/**
 * The complete serialized level payload, suitable for JSON storage / transfer.
 */
export interface SerializedLevel {
  version: number;
  gridSize: GridSize;
  cells: SparseCell[];
  meta: LevelMeta;
  checksum: string;
  createdAt: string;
}

// -------------------------------------------------------------------
// Serialization
// -------------------------------------------------------------------

/**
 * Converts a grid and its metadata into the portable SerializedLevel format.
 *
 * @param grid  The current grid (may contain pre-filled cells).
 * @param meta  Level metadata (name, objectives, etc.).
 * @returns     A SerializedLevel object ready for JSON.stringify.
 */
export function serializeLevel(grid: Grid, meta: LevelMeta): SerializedLevel {
  const gridSize = grid.length as GridSize;
  const cells: SparseCell[] = [];

  for (let r = 0; r < gridSize; r++) {
    const row = grid[r]!;
    for (let c = 0; c < gridSize; c++) {
      const value = row[c];
      if (value !== null && value !== undefined) {
        cells.push({ row: r, col: c, color: value });
      }
    }
  }

  const payload: Omit<SerializedLevel, 'checksum'> = {
    version: 1,
    gridSize,
    cells,
    meta,
    createdAt: new Date().toISOString(),
  };

  const checksum = generateChecksum(payload);

  return { ...payload, checksum };
}

// -------------------------------------------------------------------
// Deserialization
// -------------------------------------------------------------------

/**
 * Rebuilds a Grid from serialized level data.
 *
 * @param data  The SerializedLevel payload.
 * @returns     An object containing the reconstructed grid and extracted meta.
 */
export function deserializeLevel(data: SerializedLevel): {
  grid: Grid;
  gridSize: GridSize;
  meta: LevelMeta;
} {
  const grid = createEmptyGrid(data.gridSize);

  for (const cell of data.cells) {
    if (
      cell.row >= 0 &&
      cell.row < data.gridSize &&
      cell.col >= 0 &&
      cell.col < data.gridSize
    ) {
      grid[cell.row]![cell.col] = cell.color;
    }
  }

  return {
    grid,
    gridSize: data.gridSize,
    meta: data.meta,
  };
}

// -------------------------------------------------------------------
// Integrity
// -------------------------------------------------------------------

/**
 * Generates a SHA-256 checksum of the level data.
 *
 * Uses a pure-JS SHA-256 implementation so it works in React Native
 * environments that may lack the Web Crypto API.
 *
 * @param data  Any JSON-serializable object (typically the level payload
 *              without the checksum field).
 * @returns     A 64-character lowercase hex string.
 */
export function generateChecksum(data: unknown): string {
  const json = JSON.stringify(data, Object.keys(data as object).sort());
  return sha256Simple(json);
}

/**
 * Verifies that a SerializedLevel's checksum matches its content.
 */
export function verifyChecksum(data: SerializedLevel): boolean {
  const { checksum, ...rest } = data;
  const computed = generateChecksum(rest);
  return computed === checksum;
}

// -------------------------------------------------------------------
// Thumbnail generation
// -------------------------------------------------------------------

/**
 * Generates a simple text-based thumbnail representation of the grid.
 * Each cell is encoded as a single character and the result is
 * base64-encoded for compact storage.
 *
 * Character mapping:
 *  - '.' = empty cell
 *  - First character of the color name (R, B, G, Y, P, O, C, K for pink)
 *
 * @param grid      The grid to render.
 * @param gridSize  Dimension of the grid.
 * @returns         A base64-encoded string representing the thumbnail.
 */
export function generateThumbnail(grid: Grid, gridSize: GridSize): string {
  const colorCharMap: Record<BlockColor, string> = {
    red: 'R',
    blue: 'B',
    green: 'G',
    yellow: 'Y',
    purple: 'P',
    orange: 'O',
    cyan: 'C',
    pink: 'K',
  };

  let raw = '';
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cell = grid[r]?.[c];
      if (cell === null || cell === undefined) {
        raw += '.';
      } else {
        raw += colorCharMap[cell] ?? '?';
      }
    }
    if (r < gridSize - 1) {
      raw += '\n';
    }
  }

  return base64Encode(raw);
}

// -------------------------------------------------------------------
// Internal helpers
// -------------------------------------------------------------------

/**
 * Convert a string to a UTF-8 Uint8Array.
 */
function stringToUtf8Bytes(str: string): Uint8Array {
  const out: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0x80) {
      out.push(code);
    } else if (code < 0x800) {
      out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      out.push(
        0xe0 | (code >> 12),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    } else {
      // Surrogate pair
      i++;
      const lo = i < str.length ? str.charCodeAt(i) : 0;
      const codePoint = 0x10000 + (((code & 0x3ff) << 10) | (lo & 0x3ff));
      out.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }
  return new Uint8Array(out);
}

/**
 * Safe typed-array accessor — avoids noUncheckedIndexedAccess noise
 * while retaining runtime safety (typed arrays always return a number).
 */
function u8(arr: Uint8Array, i: number): number {
  return arr[i] as number;
}
function i32(arr: Int32Array, i: number): number {
  return arr[i] as number;
}

/**
 * A pure-JS SHA-256 implementation using typed arrays.
 * Produces a standard 64-character lowercase hex digest.
 */
function sha256Simple(message: string): string {
  // Round constants
  const K = new Int32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);

  function rr(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  // Convert to bytes and pad
  const msgBytes = stringToUtf8Bytes(message);
  const bitLength = msgBytes.length * 8;

  // Padding: 1 byte 0x80, then zeros, then 8-byte big-endian length
  // Total padded length must be multiple of 64
  const padLen = 64 - ((msgBytes.length + 9) % 64);
  const totalLen = msgBytes.length + 1 + (padLen === 64 ? 0 : padLen) + 8;
  const padded = new Uint8Array(totalLen);
  padded.set(msgBytes);
  padded[msgBytes.length] = 0x80;

  // Write 64-bit big-endian length at the end
  const highBits = Math.floor(bitLength / 0x100000000);
  const lenOffset = totalLen - 8;
  padded[lenOffset] = (highBits >>> 24) & 0xff;
  padded[lenOffset + 1] = (highBits >>> 16) & 0xff;
  padded[lenOffset + 2] = (highBits >>> 8) & 0xff;
  padded[lenOffset + 3] = highBits & 0xff;
  padded[lenOffset + 4] = (bitLength >>> 24) & 0xff;
  padded[lenOffset + 5] = (bitLength >>> 16) & 0xff;
  padded[lenOffset + 6] = (bitLength >>> 8) & 0xff;
  padded[lenOffset + 7] = bitLength & 0xff;

  // Hash state
  const h = new Int32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);

  const w = new Int32Array(64);

  // Process each 64-byte block
  for (let offset = 0; offset < padded.length; offset += 64) {
    // Build message schedule
    for (let ii = 0; ii < 16; ii++) {
      const j = offset + ii * 4;
      w[ii] =
        (u8(padded, j) << 24) |
        (u8(padded, j + 1) << 16) |
        (u8(padded, j + 2) << 8) |
        u8(padded, j + 3);
    }
    for (let ii = 16; ii < 64; ii++) {
      const s0 = rr(i32(w, ii - 15), 7) ^ rr(i32(w, ii - 15), 18) ^ (i32(w, ii - 15) >>> 3);
      const s1 = rr(i32(w, ii - 2), 17) ^ rr(i32(w, ii - 2), 19) ^ (i32(w, ii - 2) >>> 10);
      w[ii] = (i32(w, ii - 16) + s0 + i32(w, ii - 7) + s1) | 0;
    }

    // Working variables
    let a: number = i32(h, 0);
    let b: number = i32(h, 1);
    let c: number = i32(h, 2);
    let d: number = i32(h, 3);
    let e: number = i32(h, 4);
    let f: number = i32(h, 5);
    let g: number = i32(h, 6);
    let hh: number = i32(h, 7);

    // Compression
    for (let ii = 0; ii < 64; ii++) {
      const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + S1 + ch + i32(K, ii) + i32(w, ii)) | 0;
      const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      hh = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h[0] = (i32(h, 0) + a) | 0;
    h[1] = (i32(h, 1) + b) | 0;
    h[2] = (i32(h, 2) + c) | 0;
    h[3] = (i32(h, 3) + d) | 0;
    h[4] = (i32(h, 4) + e) | 0;
    h[5] = (i32(h, 5) + f) | 0;
    h[6] = (i32(h, 6) + g) | 0;
    h[7] = (i32(h, 7) + hh) | 0;
  }

  // Produce hex string
  let hex = '';
  for (let ii = 0; ii < 8; ii++) {
    hex += (i32(h, ii) >>> 0).toString(16).padStart(8, '0');
  }
  return hex;
}

/**
 * Base64 encode a string. Works in environments without btoa (React Native).
 */
function base64Encode(input: string): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  const bytes = stringToUtf8Bytes(input);
  let result = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const b0: number = u8(bytes, i);
    const b1: number = i + 1 < bytes.length ? u8(bytes, i + 1) : 0;
    const b2: number = i + 2 < bytes.length ? u8(bytes, i + 2) : 0;

    const triplet = (b0 << 16) | (b1 << 8) | b2;

    result += chars.charAt((triplet >> 18) & 0x3f);
    result += chars.charAt((triplet >> 12) & 0x3f);
    result += i + 1 < bytes.length ? chars.charAt((triplet >> 6) & 0x3f) : '=';
    result += i + 2 < bytes.length ? chars.charAt(triplet & 0x3f) : '=';
  }

  return result;
}
