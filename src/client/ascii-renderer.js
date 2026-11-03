// Interactive ASCII computer.
//
// A late-80s style all-in-one computer (generic, no logos) is modelled as a signed
// distance field, raymarched once per character cell, and shaded into ASCII. The
// pointer tilts the machine and drags a "lens" over it that magnifies, ripples and
// glitches the characters underneath. Click cycles the words on its screen.
//
// This module is environment-agnostic: no DOM access. It draws into any 2D context
// (a regular canvas or an OffscreenCanvas inside a Worker). See ascii-computer.js for
// the host that wires it to the page, and ascii-worker.js for the worker entry.

const RAMP = ' .,:;-=+*#%@'; // dark → bright
const GLITCH = '01<>/\\|[]{}#$%&*+=~?!';

// ---- 3x5 pixel font for the on-screen message --------------------------------
const FONT = {
  A: '.#.|#.#|###|#.#|#.#', B: '##.|#.#|##.|#.#|##.', C: '.##|#..|#..|#..|.##',
  D: '##.|#.#|#.#|#.#|##.', E: '###|#..|##.|#..|###', F: '###|#..|##.|#..|#..',
  G: '.##|#..|#.#|#.#|.##', H: '#.#|#.#|###|#.#|#.#', I: '###|.#.|.#.|.#.|###',
  J: '..#|..#|..#|#.#|.#.', K: '#.#|#.#|##.|#.#|#.#', L: '#..|#..|#..|#..|###',
  M: '#.#|###|###|#.#|#.#', N: '##.|#.#|#.#|#.#|#.#', O: '.#.|#.#|#.#|#.#|.#.',
  P: '##.|#.#|##.|#..|#..', Q: '.#.|#.#|#.#|##.|.##', R: '##.|#.#|##.|#.#|#.#',
  S: '.##|#..|.#.|..#|##.', T: '###|.#.|.#.|.#.|.#.', U: '#.#|#.#|#.#|#.#|###',
  V: '#.#|#.#|#.#|#.#|.#.', W: '#.#|#.#|###|###|#.#', X: '#.#|#.#|.#.|#.#|#.#',
  Y: '#.#|#.#|.#.|.#.|.#.', Z: '###|..#|.#.|#..|###',
  0: '###|#.#|#.#|#.#|###', 1: '.#.|##.|.#.|.#.|###', 2: '##.|..#|.#.|#..|###',
  3: '##.|..#|.#.|..#|##.', 4: '#.#|#.#|###|..#|..#', 5: '###|#..|##.|..#|##.',
  6: '.##|#..|###|#.#|###', 7: '###|..#|.#.|.#.|.#.', 8: '###|#.#|###|#.#|###',
  9: '###|#.#|###|..#|##.',
  ' ': '...|...|...|...|...', '>': '#..|.#.|..#|.#.|#..', _: '...|...|...|...|###',
  '!': '.#.|.#.|.#.|...|.#.', '?': '##.|..#|.#.|...|.#.', '.': '...|...|...|...|.#.',
  '-': '...|...|###|...|...', ':': '...|.#.|...|.#.|...', ')': '#..|.#.|.#.|.#.|#..',
  '(': '..#|.#.|.#.|.#.|..#', '█': '###|###|###|###|###',
};

export function textBitmap(text) {
  const chars = [...text.toUpperCase()].map((ch) => FONT[ch] ?? FONT['?']);
  const w = chars.length * 4 - 1;
  const bits = new Uint8Array(w * 5);
  chars.forEach((glyph, i) => {
    glyph.split('|').forEach((row, y) => {
      for (let x = 0; x < 3; x++) if (row[x] === '#') bits[y * w + i * 4 + x] = 1;
    });
  });
  return { w, h: 5, bits };
}

// ---- Model -------------------------------------------------------------------
// Object space: x right, y up, z toward the viewer. Units are arbitrary.
const SCREEN = { cx: 0, cy: 0.25, hw: 0.35, hh: 0.27, z: 0.565 };
const BOUND_R = 1.25;

function sdRoundBox(px, py, pz, bx, by, bz, r) {
  const qx = Math.abs(px) - bx + r;
  const qy = Math.abs(py) - by + r;
  const qz = Math.abs(pz) - bz + r;
  const ox = qx > 0 ? qx : 0, oy = qy > 0 ? qy : 0, oz = qz > 0 ? qz : 0;
  const inside = Math.max(qx, Math.max(qy, qz));
  return Math.sqrt(ox * ox + oy * oy + oz * oz) + (inside < 0 ? inside : 0) - r;
}

export function sdf(x, y, z) {
  // Main case + slightly narrower foot.
  let d = sdRoundBox(x, y - 0.06, z, 0.56, 0.76, 0.6, 0.07);
  d = Math.min(d, sdRoundBox(x, y + 0.74, z, 0.52, 0.06, 0.56, 0.03));
  // Bezel recess around the CRT.
  d = Math.max(d, -sdRoundBox(x, y - SCREEN.cy, z - 0.62, 0.44, 0.36, 0.06, 0.06));
  // The CRT glass, sitting just proud of the recess floor.
  d = Math.min(d, sdRoundBox(x, y - SCREEN.cy, z - 0.525, SCREEN.hw, SCREEN.hh, 0.04, 0.08));
  // Floppy slot.
  d = Math.max(d, -sdRoundBox(x - 0.2, y + 0.36, z - 0.6, 0.17, 0.026, 0.05, 0.01));
  // A groove separating the chin from the foot.
  d = Math.max(d, -sdRoundBox(x, y + 0.6, z - 0.6, 0.6, 0.012, 0.016, 0.004));
  // Cooling vents on both sides, near the back.
  const ax = Math.abs(x);
  if (ax > 0.45 && y > 0.2 && z < 0.1) {
    const i = Math.max(-3, Math.min(3, Math.round((y - 0.48) / 0.07)));
    d = Math.max(d, -sdRoundBox(ax - 0.56, y - (0.48 + i * 0.07), z + 0.24, 0.02, 0.009, 0.26, 0.004));
  }
  return d;
}

// ---- Helpers -----------------------------------------------------------------
const hash = (a, b, c) => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

const FRAME_MS = 1000 / 45;

/**
 * @param {CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D} ctx
 * @param {{
 *   theme: { bg: string, shades: string[], fontFamily: string },
 *   messages: string[],
 *   reduceMotion: boolean,
 * }} options
 */
export function createRenderer(ctx, { theme, messages, reduceMotion }) {
  const BG = theme.bg;
  const SHADES = theme.shades;
  const MONO = theme.fontFamily;
  const bitmaps = messages.map((m) => [textBitmap(m + '█'), textBitmap(m + ' ')]);
  let msgIndex = 0;

  // Layout state
  let W = 0, H = 0, cols = 0, rows = 0, cw = 0, ch = 0, fs = 10, scale = 1;
  let hit, mat, shade, nxA, nyA, nzA; // per-cell buffers (world-space normals)
  let rowBuf = [];

  // Interaction / animation state
  const pointer = { x: 0, y: 0, inside: false };
  let lens = 0; // 0..1, eases in/out
  let yaw = -0.5, pitch = 0.12;
  let burst = 0; // click glitch burst, 0..1
  let start = -1, lastStep = 0;

  function resize(width, height, dpr) {
    W = width;
    H = height;
    ctx.canvas.width = Math.max(1, Math.round(W * dpr));
    ctx.canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    fs = Math.max(7, Math.min(11, Math.round(Math.min(W / 90, H / 46))));
    ctx.font = `500 ${fs}px ${MONO}`;
    ctx.textBaseline = 'top';
    if ('fontKerning' in ctx) ctx.fontKerning = 'none';
    cw = ctx.measureText('M').width;
    ch = Math.round(fs * 1.2);
    cols = Math.max(1, Math.floor(W / cw));
    rows = Math.max(1, Math.floor(H / ch));
    scale = Math.min(H / 1.95, W / 1.8);

    const n = cols * rows;
    hit = new Uint8Array(n);
    mat = new Uint8Array(n);
    shade = new Float32Array(n);
    nxA = new Float32Array(n);
    nyA = new Float32Array(n);
    nzA = new Float32Array(n);
    rowBuf = SHADES.map(() => new Array(cols).fill(' '));
  }

  // Raymarch every cell into the per-cell buffers.
  function trace(t) {
    const sa = Math.sin(pitch), ca = Math.cos(pitch);
    const sb = Math.sin(yaw), cb = Math.cos(yaw);
    // Ray direction (world 0,0,-1) in object space = R^T * d.
    const dx = ca * sb, dy = -sa, dz = -ca * cb;
    // Key light, transformed into object space.
    const lw = [-0.45, 0.9, 0.38];
    const ln = Math.hypot(...lw);
    const L = [lw[0] / ln, lw[1] / ln, lw[2] / ln];
    const lx = cb * L[0] + sa * sb * L[1] - ca * sb * L[2];
    const ly = ca * L[1] + sa * L[2];
    const lz = sb * L[0] - sa * cb * L[1] + ca * cb * L[2];

    const mx = pointer.x, my = pointer.y;
    const lensR = Math.min(W, H) * 0.2;
    const bob = reduceMotion ? 0 : Math.sin(t * 1.3) * 0.015;

    // Only cells inside the projected bounding sphere (plus lens slack) can hit.
    const cxPx = W / 2, cyPx = H / 2 + bob * scale;
    const reach = BOUND_R * scale + (lens > 0.001 ? lensR * 0.5 : 0);
    const r0 = Math.max(0, Math.floor((cyPx - reach) / ch));
    const r1 = Math.min(rows - 1, Math.ceil((cyPx + reach) / ch));
    const c0 = Math.max(0, Math.floor((cxPx - reach) / cw));
    const c1 = Math.min(cols - 1, Math.ceil((cxPx + reach) / cw));
    hit.fill(0);

    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const i = r * cols + c;
        let px = (c + 0.5) * cw;
        let py = (r + 0.5) * ch;

        // Lens morph: magnify + ripple around the pointer.
        if (lens > 0.001) {
          const ddx = px - mx, ddy = py - my;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < lensR) {
            const f = 1 - d / lensR;
            const ripple = reduceMotion ? 0 : Math.sin(d * 0.09 - t * 7) * 6 * f;
            const k = 1 - 0.38 * f * f * lens;
            px = mx + ddx * k + (d > 0 ? (ddx / d) * ripple * lens : 0);
            py = my + ddy * k + (d > 0 ? (ddy / d) * ripple * lens : 0);
          }
        }

        const wx = (px - W / 2) / scale;
        const wy = (H / 2 - py) / scale + bob;
        const wz = 3;
        // Ray origin in object space.
        const ox = cb * wx + sa * sb * wy - ca * sb * wz;
        const oy = ca * wy + sa * wz;
        const oz = sb * wx - sa * cb * wy + ca * cb * wz;

        // Bounding sphere.
        const b = ox * dx + oy * dy + oz * dz;
        const cc = ox * ox + oy * oy + oz * oz - BOUND_R * BOUND_R;
        const disc = b * b - cc;
        if (disc < 0) continue;
        const sq = Math.sqrt(disc);
        let tt = -b - sq;
        const tmax = -b + sq;

        let found = false, x = 0, y = 0, z = 0;
        for (let s = 0; s < 64; s++) {
          x = ox + dx * tt; y = oy + dy * tt; z = oz + dz * tt;
          const dist = sdf(x, y, z);
          if (dist < 0.0015) { found = true; break; }
          tt += dist;
          if (tt > tmax) break;
        }
        if (!found) continue;

        // Normal (tetrahedral central differences).
        const e = 0.002;
        const f1 = sdf(x + e, y - e, z - e), f2 = sdf(x - e, y - e, z + e);
        const f3 = sdf(x - e, y + e, z - e), f4 = sdf(x + e, y + e, z + e);
        let nx = f1 - f2 - f3 + f4, ny = -f1 - f2 + f3 + f4, nz = -f1 + f2 - f3 + f4;
        const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        nx /= nl; ny /= nl; nz /= nl;

        const isScreen = z > SCREEN.z - 0.03 && Math.abs(x - SCREEN.cx) < SCREEN.hw - 0.02 && Math.abs(y - SCREEN.cy) < SCREEN.hh - 0.02;
        hit[i] = 1;
        mat[i] = isScreen ? 2 : 1;

        if (isScreen) {
          shade[i] = screenPixel(x, y, r, t);
        } else {
          const diff = Math.max(0, nx * lx + ny * ly + nz * lz);
          const facing = -(nx * dx + ny * dy + nz * dz);
          shade[i] = clamp01(0.06 + 0.86 * diff * diff + 0.1 * (1 - facing));
        }
        // World-space normal (n_w = R * n), used for edge detection and glyph orientation.
        nxA[i] = cb * nx + sb * nz;
        nyA[i] = sa * sb * nx + ca * ny - sa * cb * nz;
        nzA[i] = -ca * sb * nx + sa * ny + ca * cb * nz;
      }
    }
  }

  // Brightness of the CRT at object-space (x, y). Values > 1 mean "lit text pixel".
  function screenPixel(x, y, row, t) {
    const blinkOn = reduceMotion || Math.floor(t / 0.53) % 2 === 0;
    const bm = bitmaps[msgIndex][blinkOn ? 0 : 1];
    const sw = SCREEN.hw * 2, sh = SCREEN.hh * 2;
    // Font pixels are whole multiples of a character cell so the text stays crisp head-on.
    const cellX = cw / scale, cellY = ch / scale;
    const sx = cellX * Math.max(1, Math.floor((sw * 0.86) / bm.w / cellX));
    const sy = cellY * Math.max(1, Math.floor((sh * 0.6) / bm.h / cellY));
    const tx = Math.floor((x - SCREEN.cx + (bm.w * sx) / 2) / sx);
    const ty = Math.floor((SCREEN.cy + (bm.h * sy) / 2 - y) / sy);
    if (tx >= 0 && ty >= 0 && tx < bm.w && ty < bm.h && bm.bits[ty * bm.w + tx]) return 2;
    // Phosphor glow: faint scanlines that fade toward the bottom.
    const v = (SCREEN.cy + SCREEN.hh - y) / sh;
    return row % 2 === 0 ? 0.16 - v * 0.08 : 0.03;
  }

  function edgeGlyph(nx, ny) {
    const a = Math.atan2(ny, nx); // direction the surface faces on screen
    const k = Math.round(((a + Math.PI) / Math.PI) * 4) % 4; // octant
    return k === 0 ? '|' : k === 1 ? '\\' : k === 2 ? '-' : '/';
  }

  function draw(t) {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    const reveal = reduceMotion ? 1 : clamp01((t - 0.15) / 1.1);
    const lensR = Math.min(W, H) * 0.2;
    const tick = Math.floor(t * 14);
    const used = new Uint8Array(SHADES.length);

    for (let r = 0; r < rows; r++) {
      used.fill(0);

      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        let chr = ' ';
        let bucket = 0;

        // Pointer distance (for the glitch overlay and lens ring).
        let lf = 0, ring = false;
        if (lens > 0.001) {
          const ddx = (c + 0.5) * cw - pointer.x, ddy = (r + 0.5) * ch - pointer.y;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);
          lf = d < lensR ? (1 - d / lensR) * lens : 0;
          ring = Math.abs(d - lensR) < cw * 0.55;
        }

        if (!hit[i]) {
          // Background: a faint dot grid, plus the lens ring.
          if (ring) { chr = hash(c, r, tick) > 0.5 ? '.' : ':'; bucket = 1; }
          else if (c % 4 === 0 && r % 2 === 0) { chr = '.'; bucket = 0; }
        } else {
          const s = shade[i];
          if (mat[i] === 2) {
            if (s > 1) { chr = '#'; bucket = 4; }
            else { chr = s > 0.1 ? '-' : s > 0.02 ? '.' : ' '; bucket = s > 0.1 ? 1 : 0; }
          } else {
            const left = c > 0 ? hit[i - 1] : 0, right = c < cols - 1 ? hit[i + 1] : 0;
            const up = r > 0 ? hit[i - cols] : 0, down = r < rows - 1 ? hit[i + cols] : 0;
            const silhouette = !left || !right || !up || !down;
            let creaseH = false, creaseV = false;
            if (!silhouette) {
              // A crease is a sharp change in surface normal between neighbouring cells.
              const j = i + 1, k = i + cols;
              creaseV = mat[j] !== 2 && nxA[i] * nxA[j] + nyA[i] * nyA[j] + nzA[i] * nzA[j] < 0.75;
              creaseH = mat[k] !== 2 && nxA[i] * nxA[k] + nyA[i] * nyA[k] + nzA[i] * nzA[k] < 0.75;
            }
            if (silhouette) {
              chr = edgeGlyph(nxA[i], nyA[i]);
              bucket = 3;
            } else if (creaseH || creaseV) {
              chr = creaseH && creaseV ? '+' : creaseH ? '_' : '|';
              bucket = 2;
            } else {
              const idx = Math.min(RAMP.length - 1, Math.max(1, Math.round(s * (RAMP.length - 1))));
              chr = RAMP[idx];
              bucket = s < 0.22 ? 0 : s < 0.42 ? 1 : s < 0.68 ? 2 : 3;
            }
          }

          // Glitch overlay under the lens, and the click burst.
          const g = Math.max(lf * 0.55, burst * 0.7);
          if (g > 0 && hash(c, r, tick) < g * g * 1.6) {
            chr = GLITCH[Math.floor(hash(r, c, tick + 7) * GLITCH.length)];
            bucket = 4;
          } else if (lf > 0.05 && bucket < 3) {
            bucket += 1;
          }
        }

        // Boot-up reveal: cells resolve out of noise.
        if (reveal < 1 && hash(c, r, 99) > reveal) {
          chr = hash(c, r, tick) > 0.86 ? GLITCH[(c * 7 + r * 3 + tick) % GLITCH.length] : ' ';
          bucket = 1;
        }

        if (chr !== ' ') {
          rowBuf[bucket][c] = chr;
          used[bucket] = 1;
        }
      }

      // One fillText per colour per row. In a monospace font every glyph advances by the
      // same width, so characters land on the grid exactly as per-character draws would.
      const y = r * ch;
      for (let b = 0; b < SHADES.length; b++) {
        if (!used[b]) continue;
        ctx.fillStyle = SHADES[b];
        ctx.fillText(rowBuf[b].join(''), 0, y);
        rowBuf[b].fill(' ');
      }
    }
  }

  /** Advance and draw one frame. Returns true while more frames are wanted. */
  function step(now) {
    if (start < 0) start = now;
    const t = (now - start) / 1000;
    const dt = Math.min(0.1, (now - (lastStep || now)) / 1000);
    lastStep = now;

    // Target orientation: follow the pointer, otherwise idle sway.
    let ty, tp;
    if (pointer.inside) {
      ty = -0.45 + (pointer.x / W - 0.5) * 1.5;
      tp = 0.1 + (pointer.y / H - 0.5) * 0.55;
    } else if (reduceMotion) {
      ty = -0.5; tp = 0.12;
    } else {
      ty = -0.45 + Math.sin(t * 0.35) * 0.45;
      tp = 0.12 + Math.sin(t * 0.23) * 0.06;
    }
    const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 5);
    yaw += (ty - yaw) * k;
    pitch += (tp - pitch) * k;
    lens += ((pointer.inside ? 1 : 0) - lens) * (reduceMotion ? 1 : 1 - Math.exp(-dt * 8));
    burst = Math.max(0, burst - dt * 2.5);

    trace(t);
    draw(t);

    // With reduced motion, stop once settled; pointer/click events restart the loop.
    return !reduceMotion || burst > 0;
  }

  return {
    resize,
    step,
    setPointer(x, y, inside) {
      pointer.x = x;
      pointer.y = y;
      pointer.inside = inside;
    },
    setMessage(index) {
      msgIndex = ((index % bitmaps.length) + bitmaps.length) % bitmaps.length;
      if (!reduceMotion) burst = 1;
    },
  };
}

/**
 * Frame scheduler shared by the worker and inline hosts. Caps at ~45fps and backs off
 * further on slow devices (never spends more than ~2/3 of the time rendering).
 *
 * @param {{ step(now: number): boolean }} renderer
 * @param {(cb: (now: number) => void) => void} requestFrame
 */
export function createLoop(renderer, requestFrame) {
  let pending = false, active = true, last = 0, cost = 0;

  function tick(now) {
    pending = false;
    if (!active) return;
    if (last && now - last < Math.max(FRAME_MS, cost * 1.5)) return request();
    const t0 = performance.now();
    const more = renderer.step(now);
    cost = cost * 0.9 + (performance.now() - t0) * 0.1;
    last = now;
    if (more) request();
  }

  function request() {
    if (!pending && active) {
      pending = true;
      requestFrame(tick);
    }
  }

  return {
    request,
    setActive(value) {
      active = value;
      if (value) request();
    },
  };
}
