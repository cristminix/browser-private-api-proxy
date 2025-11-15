/*global Int32Array */
function signed_crc_table(): Int32Array | number[] {
  let c = 0
  const table = new Array(256)

  for (let n = 0; n != 256; ++n) {
    c = n
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1
    c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }

  return typeof Int32Array !== "undefined" ? new Int32Array(table) : table
}

const T0 = signed_crc_table()
function slice_by_16_tables(
  T: Int32Array | number[]
): (Int32Array | number[])[] {
  let c = 0
  let v = 0
  let n = 0
  const table =
    typeof Int32Array !== "undefined" ? new Int32Array(4096) : new Array(4096)

  for (n = 0; n != 256; ++n) table[n] = T[n]
  for (n = 0; n != 256; ++n) {
    v = T[n]
    for (c = 256 + n; c < 4096; c += 256) v = table[c] = (v >>> 8) ^ T[v & 0xff]
  }
  const out: (Int32Array | number[])[] = []
  for (n = 1; n != 16; ++n) {
    const slice =
      typeof Int32Array !== "undefined" && table instanceof Int32Array
        ? table.subarray(n * 256, n * 256 + 256)
        : table.slice(n * 256, n * 256 + 256)
    out[n - 1] = slice
  }
  return out
}
const TT = slice_by_16_tables(T0)
const T1 = TT[0],
  T2 = TT[1],
  T3 = TT[2],
  T4 = TT[3],
  T5 = TT[4]
const T6 = TT[5],
  T7 = TT[6],
  T8 = TT[7],
  T9 = TT[8],
  Ta = TT[9]
const Tb = TT[10],
  Tc = TT[11],
  Td = TT[12],
  Te = TT[13],
  Tf = TT[14]
function crc32_bstr(bstr: string, seed?: number): number {
  let C = (seed || 0) ^ -1
  for (let i = 0, L = bstr.length; i < L; )
    C = (C >>> 8) ^ T0[(C ^ bstr.charCodeAt(i++)) & 0xff]
  return ~C
}

function crc32_buf(B: Uint8Array | number[], seed?: number): number {
  let C = (seed || 0) ^ -1
  let L = B.length - 15
  let i = 0
  for (; i < L; )
    C =
      Tf[B[i++] ^ (C & 255)] ^
      Te[B[i++] ^ ((C >> 8) & 255)] ^
      Td[B[i++] ^ ((C >> 16) & 255)] ^
      Tc[B[i++] ^ (C >>> 24)] ^
      Tb[B[i++]] ^
      Ta[B[i++]] ^
      T9[B[i++]] ^
      T8[B[i++]] ^
      T7[B[i++]] ^
      T6[B[i++]] ^
      T5[B[i++]] ^
      T4[B[i++]] ^
      T3[B[i++]] ^
      T2[B[i++]] ^
      T1[B[i++]] ^
      T0[B[i++]]
  L += 15
  while (i < L) C = (C >>> 8) ^ T0[(C ^ B[i++]) & 0xff]
  return ~C
}

function crc32_str(str: string, seed?: number): number {
  let C = (seed || 0) ^ -1
  for (let i = 0, L = str.length, c = 0, d = 0; i < L; ) {
    c = str.charCodeAt(i++)
    if (c < 0x80) {
      C = (C >>> 8) ^ T0[(C ^ c) & 0xff]
    } else if (c < 0x800) {
      C = (C >>> 8) ^ T0[(C ^ (192 | ((c >> 6) & 31))) & 0xff]
      C = (C >>> 8) ^ T0[(C ^ (128 | (c & 63))) & 0xff]
    } else if (c >= 0xd800 && c < 0xe000) {
      c = (c & 1023) + 64
      d = str.charCodeAt(i++) & 1023
      C = (C >>> 8) ^ T0[(C ^ (240 | ((c >> 8) & 7))) & 0xff]
      C = (C >>> 8) ^ T0[(C ^ (128 | ((c >> 2) & 63))) & 0xff]
      C = (C >>> 8) ^ T0[(C ^ (128 | ((d >> 6) & 15) | ((c & 3) << 4))) & 0xff]
      C = (C >>> 8) ^ T0[(C ^ (128 | (d & 63))) & 0xff]
    } else {
      C = (C >>> 8) ^ T0[(C ^ (224 | ((c >> 12) & 15))) & 0xff]
      C = (C >>> 8) ^ T0[(C ^ (128 | ((c >> 6) & 63))) & 0xff]
      C = (C >>> 8) ^ T0[(C ^ (128 | (c & 63))) & 0xff]
    }
  }
  return ~C
}

// // Export the CRC32 functions as an object
// export const CRC32 = {
//   table: T0,
//   bstr: crc32_bstr,
//   buf: crc32_buf,
//   str: crc32_str,
// }

// // Also provide named exports for convenience
// export { crc32_bstr as crc32Bstr }
// export { crc32_buf as crc32Buf }
// export { crc32_str as crc32Str }

const crc32 = (input: string) => {
  return crc32_str(input).toString(16)
}

export { crc32 }
