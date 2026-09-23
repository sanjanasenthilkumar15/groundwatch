import { useState } from 'react'
import {
  TrendingDown, Gauge, Sprout, BookOpen, MessageSquare, Send,
  Eye, Crosshair, Lightbulb, ClipboardList, BellRing, Check, Loader2, Info,
} from 'lucide-react'
import { Reveal, SectionHead, LiveRegion, useInView, riskClass, Counter } from './ui'
import { STATIONS, bandFor, SCENARIOS } from './data'

/* ===========================================================================
   SECTION 10 — From prediction to the farmer.
   SECTION 11 — Admin / officer workflow.
   =========================================================================== */

const LEVEL = bandFor(SCENARIOS.normal.riskScore)

export default function SectionFarmer() {
  return (
    <div id="farmer">
      <FarmerImpact />
      <OfficerWorkflow />
    </div>
  )
}

/* =========================== SECTION 10 ==================================== */

const CHAIN = [
  { icon: TrendingDown, k: 'Groundwater forecast', v: 'Next-month level per station' },
  { icon: Gauge, k: 'Risk', v: 'Operational band, 0–100' },
  { icon: Sprout, k: 'Current crop', v: 'What is in the ground now' },
  { icon: BookOpen, k: 'Agricultural guidance', v: 'Validated departmental advice' },
  { icon: MessageSquare, k: 'Farmer advisory', v: 'Bilingual, block-specific' },
  { icon: Send, k: 'SMS / WhatsApp', v: 'Delivered to registered numbers' },
]

function FarmerImpact() {
  return (
    <section className="gwl-sec" style={{ background: 'var(--bg-raise)' }}>
      <div className="gwl-gridlines" />
      <div className="gwl-wrap relative">
        <SectionHead
          eyebrow="Farmer impact"
          title="From prediction to the farmer."
          lead="A risk score changes nothing until it reaches the person deciding what to plant and when to irrigate. GroundWatch is built so that last step is short — and so an officer stays in the loop before anything is sent."
        />

        <div className="mt-14 grid lg:grid-cols-[minmax(0,1fr)_auto] gap-12 lg:gap-16 items-start">

          {/* chain */}
          <div>
            <ol className="flex flex-col">
              {CHAIN.map((c, i) => (
                <ChainStep key={c.k} item={c} index={i} last={i === CHAIN.length - 1} />
              ))}
            </ol>

            <Reveal delay={120}>
              <div
                className="mt-8 flex gap-3 p-5 rounded-[12px]"
                style={{
                  background: 'color-mix(in srgb, var(--aqua) 5%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--aqua) 18%, transparent)',
                }}
              >
                <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--aqua)' }} />
                <p className="gwl-body">
                  <strong style={{ color: 'var(--ink)', fontWeight: 550 }}>Where the line sits.</strong>{' '}
                  GroundWatch provides decision support using groundwater forecasts and validated
                  agricultural guidance. It does not independently determine which crop will give a
                  farmer a better yield, and every advisory points back to the local Agriculture
                  Officer before a crop plan changes.
                </p>
              </div>
            </Reveal>
          </div>

          {/* phone */}
          <Reveal delay={200} className="mx-auto lg:sticky lg:top-24">
            <Phone />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function ChainStep({ item, index, last }: { item: typeof CHAIN[number]; index: number; last: boolean }) {
  const [ref, inView] = useInView<HTMLLIElement>({ threshold: 0.6 })
  return (
    <li ref={ref} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-4">
      <div className="flex flex-col items-center">
        <span
          className="w-7 h-7 rounded-md grid place-items-center shrink-0 transition-all duration-500"
          style={{
            background: inView ? 'color-mix(in srgb, var(--aqua) 12%, transparent)' : 'var(--panel)',
            border: `1px solid ${inView ? 'color-mix(in srgb, var(--aqua) 40%, transparent)' : 'var(--line)'}`,
          }}
        >
          <item.icon className="w-3.5 h-3.5 transition-colors duration-500"
            style={{ color: inView ? 'var(--aqua)' : 'var(--ink-3)' }} />
        </span>
        {!last && (
          <span className="relative w-px flex-1 my-1" style={{ background: 'var(--line)' }}>
            <span
              className="absolute inset-x-0 top-0 bottom-0 origin-top transition-transform duration-700"
              style={{ background: 'var(--aqua)', opacity: 0.55, transform: inView ? 'scaleY(1)' : 'scaleY(0)' }}
            />
          </span>
        )}
      </div>
      <div className="pb-6" style={{ opacity: inView ? 1 : 0.4, transition: 'opacity 500ms ease' }}>
        <div className="text-[14px] font-medium tracking-[-0.01em]">{item.k}</div>
        <div className="gwl-note mt-1">{item.v}</div>
      </div>
      <span className="sr-only">Step {index + 1}</span>
    </li>
  )
}

const SMS_BODY = `Groundwater stress is expected to increase in your block during the coming season. Review irrigation availability and consider lower-water-demand crop options suitable for your area. Contact your Agriculture Officer before changing your crop plan.`

/* The phone mockup is a fixed dark device screenshot — like a real phone
   screen, it doesn't follow the page's light/dark toggle — so its accent
   colour is a plain constant, not the theme-linked var(--aqua). */
const PHONE_ACCENT = '#3FC9AF'

function Phone() {
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.4 })

  return (
    <div ref={ref} className="gwl-phone">
      <div className="gwl-phone-screen">
        {/* status bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <span className="gwl-mono text-[10px]" style={{ color: 'var(--ink-2)' }}>9:41</span>
          <span className="w-16 h-[18px] rounded-full" style={{ background: '#000' }} />
          <span className="flex gap-1 items-center">
            {[3, 5, 7, 9].map(h => (
              <i key={h} className="w-[2.5px] rounded-sm block"
                style={{ height: h, background: 'var(--ink-3)' }} />
            ))}
          </span>
        </div>

        {/* conversation header */}
        <div className="px-4 py-2.5 flex items-center gap-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="w-7 h-7 rounded-full grid place-items-center"
            style={{ background: 'rgba(63,201,175,0.14)' }}>
            <MessageSquare className="w-3.5 h-3.5" style={{ color: PHONE_ACCENT }} />
          </span>
          <span>
            <span className="block text-[12px] font-medium">GroundWatch</span>
            <span className="gwl-note block">SMS · Salem</span>
          </span>
        </div>

        {/* message */}
        <div className="flex-1 px-3.5 py-4 flex flex-col gap-2 justify-end">
          <div
            className="self-start max-w-[92%]"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? 'none' : 'translateY(12px) scale(0.97)',
              transition: 'all 650ms cubic-bezier(0.22,1,0.36,1) 400ms',
            }}
          >
            <div
              className="px-3.5 py-3 rounded-[16px] rounded-bl-[5px]"
              style={{ background: '#141C23', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="text-[11.5px] font-semibold mb-2" style={{ color: PHONE_ACCENT }}>
                GroundWatch Advisory – Salem
              </div>
              <p className="text-[12px] leading-[1.55]" style={{ color: 'var(--ink-2)' }}>
                {SMS_BODY}
              </p>
            </div>
            <div className="gwl-note mt-1.5 pl-1">Delivered · registered alert subscriber</div>
          </div>
        </div>

        {/* input affordance */}
        <div className="px-3.5 pb-4 pt-2">
          <div className="h-8 rounded-full px-3.5 flex items-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="gwl-note">Text message</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================== SECTION 11 ==================================== */

const FLOW = [
  { icon: Eye, k: 'Monitor', v: 'Watch the district network month to month' },
  { icon: Crosshair, k: 'Identify', v: 'Surface the stations crossing into HIGH' },
  { icon: Lightbulb, k: 'Understand', v: 'Read the WHY behind each score' },
  { icon: ClipboardList, k: 'Plan', v: 'Test rainfall scenarios and interventions' },
  { icon: BellRing, k: 'Alert', v: 'Approve and send the block advisory' },
]

type SendState = 'idle' | 'sending' | 'sent'

function OfficerWorkflow() {
  const [state, setState] = useState<SendState>('idle')
  const priority = STATIONS.filter(s => s.score >= 50).length

  const send = () => {
    if (state !== 'idle') return
    setState('sending')
    window.setTimeout(() => setState('sent'), 1400)
  }

  return (
    <section className="gwl-sec">
      <div className="gwl-wrap">
        <SectionHead
          eyebrow="Officer workflow"
          title="Built around how the work actually runs."
          lead="Monitoring, prioritising, understanding and acting are one continuous loop for a groundwater officer. The platform follows that loop rather than asking anyone to work around it."
        />

        {/* flow */}
        <Reveal className="mt-12">
          <ol className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {FLOW.map((f, i) => (
              <li key={f.k} className="gwl-card gwl-card--hover p-4 relative overflow-hidden">
                <span className="gwl-note absolute top-3 right-3" style={{ color: 'var(--line-strong)' }}>
                  0{i + 1}
                </span>
                <f.icon className="w-4 h-4" style={{ color: 'var(--aqua)' }} />
                <div className="mt-4 text-[14px] font-medium tracking-[-0.01em]">{f.k}</div>
                <p className="gwl-note mt-1.5 leading-relaxed">{f.v}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        {/* mini dashboard */}
        <Reveal className="mt-4" delay={100}>
          <div className="gwl-panel overflow-hidden">
            <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              style={{ borderBottom: '1px solid var(--line)' }}>
              <div className="flex items-baseline gap-3">
                <h3 className="text-[15px] font-semibold tracking-[-0.02em]">Salem District</h3>
                <span className="gwl-note">District command view</span>
              </div>
              <LiveRegion>
                <span className="gwl-badge">
                  <i className="w-1.5 h-1.5 rounded-full gwl-breathe" style={{ background: 'var(--aqua)' }} />
                  Live
                </span>
              </LiveRegion>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'var(--line-soft)' }}>
              <Tile k="Groundwater risk" v={LEVEL} tone accent />
              <Tile k="Priority locations" v={<Counter to={priority} />} />
              <Tile k="Forecast trend" v="Declining" />
              <Tile k="Rainfall" v="Below expected" />
            </div>

            <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
              {/* advisory preview — mirrors the platform's bilingual advisory block */}
              <div className="p-5">
                <div className="gwl-note mb-3">Advisory queued for HIGH-risk blocks</div>
                <div className="rounded-[10px] overflow-hidden" style={{ border: '1px solid var(--line)' }}>
                  <div className="px-4 py-2.5 gwl-note" style={{ background: 'color-mix(in srgb, var(--high) 14%, transparent)', color: 'var(--high)', letterSpacing: '0.14em' }}>
                    Farmer advisory · English / தமிழ்
                  </div>
                  <p className="px-4 py-3.5 text-[13px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                    Groundwater decline is significant. Reduce unnecessary irrigation and prioritize
                    efficient water use.
                  </p>
                  <div className="h-px mx-4" style={{ background: 'var(--line-soft)' }} />
                  <p className="px-4 py-3.5 text-[13.5px] leading-[1.8] font-tamil" style={{ color: 'var(--ink-2)' }}>
                    நிலத்தடி நீர் அளவு குறிப்பிடத்தக்க அளவில் குறைந்து வருகிறது.
                    தேவையற்ற நீர்ப்பாசனத்தை குறைத்து நீர் பயன்பாட்டு திறனை மேம்படுத்தவும்.
                  </p>
                </div>
                <p className="gwl-note mt-3">
                  Officer action · Prioritize the block for field verification and water-management
                  intervention.
                </p>
              </div>

              {/* send */}
              <div className="p-5 flex flex-col" style={{ borderLeft: '1px solid var(--line)' }}>
                <div className="gwl-note">Dispatch</div>
                <p className="gwl-body mt-2" style={{ fontSize: 12.5 }}>
                  Nothing leaves the platform automatically. An officer reviews the advisory and
                  approves the send.
                </p>

                <button
                  onClick={send}
                  disabled={state !== 'idle'}
                  className="gwl-btn gwl-btn--primary w-full mt-5"
                  style={state === 'sent' ? { background: 'var(--low)', color: '#04120A' } : undefined}
                >
                  {state === 'idle' && <>Send Farmer Alert <Send className="w-4 h-4" /></>}
                  {state === 'sending' && <>Sending <Loader2 className="w-4 h-4 animate-spin" /></>}
                  {state === 'sent' && <>Advisory sent <Check className="w-4 h-4" /></>}
                </button>

                <div className="mt-4 flex flex-col gap-2 min-h-[92px]">
                  {(['Queued for HIGH-risk blocks', 'Bilingual advisory composed', 'Delivered to registered numbers'] as const)
                    .map((line, i) => {
                      const on = state === 'sent' || (state === 'sending' && i === 0)
                      return (
                        <div
                          key={line}
                          className="flex items-center gap-2.5"
                          style={{
                            opacity: on ? 1 : 0.25,
                            transform: on ? 'none' : 'translateX(-4px)',
                            transition: `all 450ms cubic-bezier(0.22,1,0.36,1) ${i * 180}ms`,
                          }}
                        >
                          <Check className="w-3 h-3 shrink-0" style={{ color: on ? 'var(--low)' : 'var(--ink-3)' }} />
                          <span className="gwl-note">{line}</span>
                        </div>
                      )
                    })}
                </div>

                {state === 'sent' && (
                  <p className="gwl-note mt-auto pt-3" style={{ borderTop: '1px solid var(--line-soft)' }}>
                    Demonstration only — no message is sent from this page.
                  </p>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Tile({ k, v, tone, accent }: { k: string; v: React.ReactNode; tone?: boolean; accent?: boolean }) {
  return (
    <div className={`px-5 py-4 ${tone ? riskClass[LEVEL] : ''}`} style={{ background: 'var(--bg)' }}>
      <div className="gwl-note">{k}</div>
      <div className="mt-2 flex items-center gap-2.5">
        <span
          className="text-[1.35rem] leading-none font-semibold gwl-num tracking-[-0.03em]"
          style={{ color: accent ? 'var(--risk)' : 'var(--ink)' }}
        >
          {v}
        </span>
      </div>
    </div>
  )
}
