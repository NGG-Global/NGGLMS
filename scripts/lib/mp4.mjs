/**
 * Just enough MP4 box walking to read a file's playable length.
 *
 * Shared by scan-video.mjs (nugget renders) and check-explainers.mjs (instruction
 * videos) so the two cannot drift on how a duration is read. Durations come from the
 * movie header rather than being trusted from anywhere else: a truncated or
 * placeholder file reports a length that will not match what it claims to be.
 */
import { readFileSync } from 'node:fs';

/** Top-level boxes between two offsets. */
function boxes(buf, start, end) {
  const found = [];
  let o = start;
  while (o + 8 <= end) {
    let size = buf.readUInt32BE(o);
    const type = buf.toString('latin1', o + 4, o + 8);
    let head = 8;
    if (size === 1) {
      size = Number(buf.readBigUInt64BE(o + 8));
      head = 16;
    }
    if (size === 0) size = end - o;
    if (size < head) break;
    found.push({ type, start: o + head, end: o + size });
    o += size;
  }
  return found;
}

const find = (buf, type, start, end) => boxes(buf, start, end).find((b) => b.type === type);

/** Seconds, to two decimals, from moov/mvhd. 0 when the header cannot be read. */
export function readDuration(path) {
  const buf = readFileSync(path);
  const moov = find(buf, 'moov', 0, buf.length);
  if (!moov) return 0;
  const mvhd = find(buf, 'mvhd', moov.start, moov.end);
  if (!mvhd) return 0;
  const version = buf.readUInt8(mvhd.start);
  // v1 widens the creation/modification times, pushing timescale and duration along.
  const at = version === 1 ? mvhd.start + 20 : mvhd.start + 12;
  const timescale = buf.readUInt32BE(at);
  const duration = version === 1 ? Number(buf.readBigUInt64BE(at + 4)) : buf.readUInt32BE(at + 4);
  return timescale > 0 ? Number((duration / timescale).toFixed(2)) : 0;
}
