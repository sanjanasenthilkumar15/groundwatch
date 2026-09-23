/* Minimal SVG chart helpers — enough for the handful of plots on this page
   without pulling a charting library into the public bundle. */

export type Pt = [number, number]

export function makeScale(
  domain: [number, number],
  range: [number, number],
): (v: number) => number {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1 - d0 || 1
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0)
}

/** Catmull-Rom → cubic bezier. `tension` 0 = straight, 1 = round. */
export function linePath(pts: Pt[], tension = 0.62): string {
  if (pts.length === 0) return ''
  if (pts.length < 3 || tension === 0) {
    return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ')
  }
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension
    d += ` C${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`
  }
  return d
}

/** Closed band between an upper and lower series (uncertainty envelopes). */
export function bandPath(upper: Pt[], lower: Pt[], tension = 0.62): string {
  const top = linePath(upper, tension)
  const bottom = linePath([...lower].reverse(), tension).replace(/^M/, 'L')
  return `${top} ${bottom} Z`
}

/** Area under a series down to a baseline. */
export function areaPath(pts: Pt[], baseY: number, tension = 0.62): string {
  if (!pts.length) return ''
  const line = linePath(pts, tension)
  const last = pts[pts.length - 1]
  return `${line} L${last[0].toFixed(2)} ${baseY} L${pts[0][0].toFixed(2)} ${baseY} Z`
}

/** Ordinary least-squares trend line across a series. */
export function trend(values: number[]): (i: number) => number {
  const n = values.length
  let sx = 0, sy = 0, sxy = 0, sxx = 0
  for (let i = 0; i < n; i++) {
    sx += i; sy += values[i]; sxy += i * values[i]; sxx += i * i
  }
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx || 1)
  const intercept = (sy - slope * sx) / n
  return (i: number) => intercept + slope * i
}
