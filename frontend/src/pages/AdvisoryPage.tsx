import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sprout, HardHat, Send, CheckCircle2, Users } from 'lucide-react'
import Nav from '../components/Nav'
import { api, Subscriber } from '../lib/api'

type BlockResult = {
  notified_count: number
  message_en: string
  message_ta: string
}

type Category = 'farmer' | 'construction'

export default function AdvisoryPage() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<Category>('farmer')
  const [blocks, setBlocks] = useState<string[]>([])
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)

  const [sendingBlock, setSendingBlock] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, BlockResult>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setResults({})
    setError(null)
    Promise.all([api.blocks(), api.listSubscribers({ category })])
      .then(([b, s]) => {
        setBlocks(b.blocks)
        setSubscribers(s.subscribers)
      })
      .finally(() => setLoading(false))
  }, [category])

  const sendToBlock = async (block: string) => {
    setError(null)
    setSendingBlock(block)
    try {
      const res = category === 'farmer'
        ? await api.notifyFarmersInBlock(block)
        : await api.notifyConstructionWorkersInBlock(block)
      setResults(prev => ({
        ...prev,
        [block]: {
          notified_count: res.notified_count,
          message_en: res.message_preview_english,
          message_ta: res.message_preview_tamil,
        },
      }))
    } catch (e: any) {
      setError(e.message || `Failed to send advisory for ${block}`)
    } finally {
      setSendingBlock(null)
    }
  }

  const audienceLabel = category === 'farmer' ? 'farmer' : 'construction worker'

  return (
    <div className="min-h-screen bg-surface-page">
      <Nav />
      <div className="pt-20 px-4 md:px-6 max-w-3xl mx-auto pb-8 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary transition-colors p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary font-ui tracking-tight">Advisory Broadcasts</h1>
            <p className="text-text-secondary text-sm flex items-center gap-1.5">Send a seasonal groundwater advisory SMS by block</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setCategory('farmer')}
            className={"py-2.5 rounded-lg font-ui font-semibold text-sm flex items-center justify-center gap-2 transition-all " +
              (category === 'farmer' ? 'bg-primary text-white' : 'bg-surface-card text-text-secondary border border-border-ui')}
          >
            <Sprout className="w-4 h-4" /> Farmers
          </button>
          <button
            onClick={() => setCategory('construction')}
            className={"py-2.5 rounded-lg font-ui font-semibold text-sm flex items-center justify-center gap-2 transition-all " +
              (category === 'construction' ? 'bg-primary text-white' : 'bg-surface-card text-text-secondary border border-border-ui')}
          >
            <HardHat className="w-4 h-4" /> Construction Workers
          </button>
        </div>

        <div className="gw-card flex items-center gap-3 py-4">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-ui text-text-secondary">{loading ? '—' : subscribers.length} registered {audienceLabel} subscriber{subscribers.length === 1 ? '' : 's'} across {blocks.length} blocks</span>
        </div>

        {error && (
          <div className="gw-card border-l-4 border-l-risk-critical p-4">
            <p className="text-risk-critical text-sm font-ui">{error}</p>
          </div>
        )}

        <div className="gw-card p-0 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-text-secondary font-ui text-sm">Loading blocks…</div>
          ) : (
            <div>
              {blocks.map((block, i) => {
                const result = results[block]
                return (
                  <div key={block} className={`border-b border-border-ui last:border-0 px-5 py-4 ${i % 2 === 0 ? '' : 'bg-surface-page/50'}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-ui font-semibold text-sm text-text-primary">{block}, Salem</div>
                      <button
                        onClick={() => sendToBlock(block)}
                        disabled={sendingBlock === block}
                        className="gw-btn flex items-center gap-2 disabled:opacity-60"
                      >
                        <Send className="w-4 h-4" />
                        {sendingBlock === block ? 'Sending…' : 'Send SMS'}
                      </button>
                    </div>

                    {result && (
                      <div className="mt-3 rounded-md border border-border-ui bg-surface-page p-3 space-y-3">
                        <div className="flex items-center gap-1.5 text-xs font-ui font-bold text-success">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Preview generated for {result.notified_count} {audienceLabel}{result.notified_count === 1 ? '' : 's'} — SMS not actually sent (demo)
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">English</div>
                          <p className="text-xs font-mono text-text-secondary whitespace-pre-wrap">{result.message_en}</p>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1 font-tamil">தமிழ்</div>
                          <p className="text-xs font-tamil text-text-secondary whitespace-pre-wrap leading-relaxed">{result.message_ta}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
