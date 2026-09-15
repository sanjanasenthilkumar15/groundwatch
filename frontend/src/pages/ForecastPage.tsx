import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart2, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import Nav from '../components/Nav'
import { api, IntelligenceResponse } from '../lib/api'
import { fmtGW } from '../lib/utils'

export default function ForecastPage() {
  const { station } = useParams<{ station: string }>()
  const navigate    = useNavigate()
  const stationName = station ? decodeURIComponent(station) : ''
  const [data, setData]   = useState<IntelligenceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!stationName) return
    api.intelligence(stationName).then(setData).finally(() => setLoading(false))
  }, [stationName])

  useEffect(() => {
    if (!data || !canvasRef.current) return
    const canvas = canvasRef.current
    const parent = canvas.parentElement
    if (!parent) return
    
    // Set actual size
    const dpr = window.devicePixelRatio || 1
    const rect = parent.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = 300 * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = '300px'
    
    const forecasts = data.forecast?.forecasts ?? []
    if (forecasts.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)

    const W = rect.width
    const H = 300
    const pad = { top: 20, right: 20, bottom: 40, left: 50 }
    const plotW = W - pad.left - pad.right
    const plotH = H - pad.top - pad.bottom

    // Data
    const points = forecasts.map((f, i) => ({
      x: i,
      pred: Math.abs(f.predicted_groundwater),
      lo:   Math.abs(f.lower_bound),
      hi:   Math.abs(f.upper_bound),
      label: f.horizon_months + 'M',
    }))
    const allVals = points.flatMap(p => [p.pred, p.lo, p.hi])
    const minV = Math.min(...allVals) * 0.98
    const maxV = Math.max(...allVals) * 1.02
    const toY = (v: number) => pad.top + plotH - ((v - minV) / (maxV - minV)) * plotH
    const toX = (i: number) => pad.left + (i / Math.max(points.length - 1, 1)) * plotW

    ctx.clearRect(0, 0, W, H)

    // Extract CSS Variables dynamically for theme support
    const rootStyles = getComputedStyle(document.documentElement);
    const getVar = (name: string) => rootStyles.getPropertyValue(name).trim();
    const cCritical = '#D62828';
    const cHigh     = '#E2691A';
    const cWatch    = '#F0A80C';
    const cNormal   = '#2F9E44';

    const textSec   = getVar('--color-text-secondary') || '#5C5A52';
    const borderUi  = getVar('--color-border-ui') || 'rgba(128,128,128,0.2)';

    // Grid lines
    ctx.strokeStyle = borderUi;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * plotH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
    }

    // Y axis labels
    ctx.fillStyle = textSec;
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const v = minV + ((4 - i) / 4) * (maxV - minV);
      const y = pad.top + (i / 4) * plotH;
      ctx.fillText(v.toFixed(1) + 'm', pad.left - 6, y + 4);
    }

    // Uncertainty band
    const riskLevel = data.risk.risk_level;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const alpha = isDark ? '0.15' : '0.1';
    let lineColor = cNormal, bandColor = `rgba(47, 158, 68, ${alpha})`;
    if (riskLevel === 'CRITICAL') { lineColor = cCritical; bandColor = `rgba(214, 40, 40, ${alpha})`; }
    else if (riskLevel === 'HIGH') { lineColor = cHigh; bandColor = `rgba(226, 105, 26, ${alpha})`; }
    else if (riskLevel === 'MODERATE') { lineColor = cWatch; bandColor = `rgba(240, 168, 12, ${alpha})`; }

    ctx.fillStyle = bandColor;
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(points[0].hi));
    points.forEach((p, i) => ctx.lineTo(toX(i), toY(p.hi)));
    for (let i = points.length - 1; i >= 0; i--) {
      ctx.lineTo(toX(i), toY(points[i].lo));
    }
    ctx.closePath();
    ctx.fill();

    // Forecast line
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(points[0].pred));
    points.forEach((p, i) => { if (i > 0) ctx.lineTo(toX(i), toY(p.pred)); });
    ctx.stroke();

    // X axis labels
    ctx.fillStyle = textSec;
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    points.forEach((p, i) => ctx.fillText(p.label, toX(i), H - 12))

  }, [data])

  const forecasts = data?.forecast?.forecasts ?? []
  const f1 = forecasts.find(f => f.horizon_months === 1)
  const trend = data?.stress_clock?.status
  const TrendIcon = trend === 'declining' ? TrendingDown : trend === 'improving' ? TrendingUp : Minus
  const trendCls  = trend === 'declining' ? 'text-risk-high' : trend === 'improving' ? 'text-success' : 'text-text-secondary'

  return (
    <div className="min-h-screen bg-surface-page">
      <Nav />
      <div className="pt-20 px-4 md:px-6 max-w-4xl mx-auto pb-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary font-ui tracking-tight">{stationName}</h1>
            <p className="text-text-secondary text-sm flex items-center gap-1.5"><BarChart2 className="w-4 h-4" /> Groundwater Forecast</p>
          </div>
        </div>

        {loading ? (
          <div className="gw-card h-64 gw-skeleton" />
        ) : data ? (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div className="gw-card col-span-2">
                <div className="gw-section-label mb-1">Next Month</div>
                <div className="text-3xl font-mono font-bold text-text-primary mt-1">{f1 ? fmtGW(f1.predicted_groundwater) : '—'}</div>
                {f1 && <div className="text-text-primary0 text-xs mt-1 font-mono">Range: {Math.abs(f1.lower_bound).toFixed(1)}–{Math.abs(f1.upper_bound).toFixed(1)} m</div>}
              </div>
              <div className="gw-card flex flex-col justify-between">
                <div className="gw-section-label mb-1">Trend</div>
                <TrendIcon className={"w-8 h-8 " + trendCls} />
                <div className={"text-sm font-semibold " + trendCls + " capitalize"}>{trend ?? '—'}</div>
              </div>
            </div>

            <div className="gw-card">
              <div className="flex items-center justify-between mb-4">
                <div className="gw-section-label">6-Month Outlook — Depth Below Ground (m)</div>
                <div className="flex items-center gap-3 text-xs text-text-primary0">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary inline-block"></span> Forecast</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-2 bg-primary inline-block rounded-sm"></span> Uncertainty</span>
                </div>
              </div>
              {forecasts.length > 0 ? (
                <canvas ref={canvasRef} className="block w-full" />
              ) : (
                <div className="h-48 flex items-center justify-center text-text-primary0 text-sm border border-dashed border-border-ui rounded-md">
                  Forecast data unavailable — insufficient training data for this station.
                </div>
              )}
            </div>

            <div className="gw-card">
              <div className="gw-section-label mb-4">All Forecast Horizons</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {forecasts.map(f => (
                  <div key={f.horizon_months} className="text-center border-r border-border-ui last:border-0">
                    <div className="gw-section-label mb-2">{f.horizon_months} Month{f.horizon_months > 1 ? 's' : ''}</div>
                    <div className="text-xl font-mono font-bold text-text-primary">{fmtGW(f.predicted_groundwater)}</div>
                    <div className="text-text-primary0 text-xs mt-1 font-mono">{Math.abs(f.lower_bound).toFixed(1)}–{Math.abs(f.upper_bound).toFixed(1)} m</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}


