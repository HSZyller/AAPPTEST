import { useMemo, useState } from 'react'
import './App.css'

type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary'

type Resource = {
  id: string
  name: string
  category: string
  rarity: Rarity
  description: string
  value: number
  weight: number
  quantityRange: {
    min: number
    max: number
  }
  stats: {
    power: number
    defense: number
    utility: number
  }
  tags: string[]
  dropRate: number
  notes: string
}

type ResourceForm = {
  name: string
  category: string
  rarity: Rarity
  description: string
  value: number
  weight: number
  quantityMin: number
  quantityMax: number
  power: number
  defense: number
  utility: number
  tagsText: string
  dropRate: number
  notes: string
}

const rarityColors: Record<Rarity, string> = {
  Common: '#cbd5e1',
  Uncommon: '#22c55e',
  Rare: '#3b82f6',
  Epic: '#a855f7',
  Legendary: '#f59e0b',
}

const defaultForm: ResourceForm = {
  name: 'Arcstone Fragment',
  category: 'Material',
  rarity: 'Rare',
  description: 'A charged shard used to craft mid-tier gear and enchantments.',
  value: 185,
  weight: 0.3,
  quantityMin: 1,
  quantityMax: 4,
  power: 12,
  defense: 4,
  utility: 8,
  tagsText: 'material, forge, electric, mid-game',
  dropRate: 28,
  notes: 'Combine four shards to stabilize a conduit core.',
}

const starterResources: Resource[] = [
  {
    id: 'iron-ingot',
    name: 'Iron Ingot',
    category: 'Material',
    rarity: 'Common',
    description: 'Refined metal used by most blacksmiths for core crafting recipes.',
    value: 45,
    weight: 1.2,
    quantityRange: { min: 1, max: 6 },
    stats: { power: 4, defense: 6, utility: 3 },
    tags: ['material', 'smithing', 'low-tier'],
    dropRate: 50,
    notes: 'Found in starter regions and mine chests.',
  },
  {
    id: 'void-silk',
    name: 'Void-Silk Thread',
    category: 'Material',
    rarity: 'Epic',
    description: 'Mystic thread harvested from void spiders, ideal for rare cloaks.',
    value: 420,
    weight: 0.1,
    quantityRange: { min: 1, max: 3 },
    stats: { power: 6, defense: 10, utility: 15 },
    tags: ['stealth', 'tailoring', 'magic'],
    dropRate: 12,
    notes: 'Enhances stealth and resistance when woven into armor.',
  },
]

const parseTags = (value: string) =>
  value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `resource-${Date.now()}-${Math.round(Math.random() * 10000)}`

const buildResourceFromForm = (form: ResourceForm, id = 'preview'): Resource => ({
  id,
  name: form.name.trim() || 'Unnamed Resource',
  category: form.category,
  rarity: form.rarity,
  description: form.description.trim(),
  value: Number.isNaN(form.value) ? 0 : form.value,
  weight: Number.isNaN(form.weight) ? 0 : form.weight,
  quantityRange: {
    min: Math.min(form.quantityMin, form.quantityMax),
    max: Math.max(form.quantityMin, form.quantityMax),
  },
  stats: {
    power: Math.max(0, form.power),
    defense: Math.max(0, form.defense),
    utility: Math.max(0, form.utility),
  },
  tags: parseTags(form.tagsText),
  dropRate: Math.max(0, Math.min(100, form.dropRate)),
  notes: form.notes.trim(),
})

function App() {
  const [form, setForm] = useState<ResourceForm>(defaultForm)
  const [resources, setResources] = useState<Resource[]>(starterResources)
  const [status, setStatus] = useState('Ready to build a new resource file.')
  const [simulationAttempts, setSimulationAttempts] = useState(5)
  const [simulationResult, setSimulationResult] = useState('')

  const previewResource = useMemo(() => buildResourceFromForm(form), [form])

  const averageValue = useMemo(() => {
    if (!resources.length) return 0
    const total = resources.reduce((sum, item) => sum + item.value, 0)
    return Math.round((total / resources.length) * 100) / 100
  }, [resources])

  const handleInputChange = (
    field: keyof ResourceForm,
    value: string | number | Rarity,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: typeof value === 'number' ? Number(value) : value,
    }))
  }

  const addResourceToList = () => {
    if (!form.name.trim()) {
      setStatus('Please provide a name before saving the resource.')
      return
    }

    const prepared = buildResourceFromForm(form, createId())
    setResources((list) => [prepared, ...list])
    setStatus(`Added ${prepared.name} to the local test pack.`)
  }

  const resetForm = () => {
    setForm(defaultForm)
    setStatus('Form reset to defaults.')
  }

  const copyJson = async () => {
    const payload = JSON.stringify(resources, null, 2)
    try {
      await navigator.clipboard.writeText(payload)
      setStatus('Resource pack copied to clipboard as JSON.')
    } catch (error) {
      console.error(error)
      setStatus('Copy failed. You can still download the JSON file.')
    }
  }

  const downloadJson = () => {
    const payload = JSON.stringify(resources, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'resource-pack.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('Download started for resource-pack.json')
  }

  const runSimulation = () => {
    if (!resources.length) {
      setSimulationResult('Add at least one resource before simulating drops.')
      return
    }

    if (simulationAttempts < 1) {
      setSimulationResult('Simulation attempts must be at least 1.')
      return
    }

    const totals = new Map<string, number>()
    const weightSum = resources.reduce((sum, res) => sum + res.dropRate, 0)

    for (let attempt = 0; attempt < simulationAttempts; attempt += 1) {
      const roll = Math.random() * weightSum
      let cumulative = 0
      const choice = resources.find((res) => {
        cumulative += res.dropRate
        return roll <= cumulative
      })

      if (!choice) continue
      totals.set(choice.name, (totals.get(choice.name) ?? 0) + 1)
    }

    const lines = Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => `${name}: ${count}`)

    setSimulationResult(
      lines.length
        ? `Drop test (${simulationAttempts} rolls): ${lines.join(' | ')}`
        : 'No drops recorded. Adjust drop rates and try again.',
    )
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Game Resource Kit</p>
          <h1>Build & test game-ready resource files</h1>
          <p className="lede">
            Create structured resources, validate their values, and simulate drop
            rates before shipping them to your game. Everything saves locally so
            you can export a clean JSON pack at any time.
          </p>
          <div className="hero-stats">
            <div>
              <p className="label">Resources in pack</p>
              <strong>{resources.length}</strong>
            </div>
            <div>
              <p className="label">Average value</p>
              <strong>{averageValue}</strong>
            </div>
          </div>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Resource builder</p>
            <h2>Define a new resource</h2>
            <p className="muted">
              Fill out the fields below, then add the resource to the local test
              pack. You can tweak values as you iterate.
            </p>
          </div>
          <div className="status">{status}</div>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Name</span>
            <input
              value={form.name}
              onChange={(event) => handleInputChange('name', event.target.value)}
              placeholder="Sunspire Ember"
            />
          </label>

          <label className="field">
            <span>Category</span>
            <select
              value={form.category}
              onChange={(event) =>
                handleInputChange('category', event.target.value)
              }
            >
              <option>Material</option>
              <option>Consumable</option>
              <option>Weapon</option>
              <option>Armor</option>
              <option>Quest Item</option>
              <option>Currency</option>
            </select>
          </label>

          <label className="field">
            <span>Rarity</span>
            <select
              value={form.rarity}
              onChange={(event) => handleInputChange('rarity', event.target.value as Rarity)}
            >
              {Object.keys(rarityColors).map((rarity) => (
                <option key={rarity}>{rarity}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Value</span>
            <input
              type="number"
              value={form.value}
              onChange={(event) => handleInputChange('value', event.target.value)}
              min={0}
              step={1}
            />
          </label>

          <label className="field">
            <span>Weight</span>
            <input
              type="number"
              value={form.weight}
              onChange={(event) => handleInputChange('weight', event.target.value)}
              min={0}
              step={0.1}
            />
          </label>

          <label className="field">
            <span>Drop chance weight (0-100)</span>
            <input
              type="number"
              value={form.dropRate}
              onChange={(event) => handleInputChange('dropRate', event.target.value)}
              min={0}
              max={100}
              step={1}
            />
          </label>

          <label className="field">
            <span>Quantity (min)</span>
            <input
              type="number"
              value={form.quantityMin}
              onChange={(event) => handleInputChange('quantityMin', event.target.value)}
              min={0}
              step={1}
            />
          </label>

          <label className="field">
            <span>Quantity (max)</span>
            <input
              type="number"
              value={form.quantityMax}
              onChange={(event) => handleInputChange('quantityMax', event.target.value)}
              min={0}
              step={1}
            />
          </label>

          <label className="field span-2">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(event) =>
                handleInputChange('description', event.target.value)
              }
              rows={3}
            />
          </label>

          <label className="field">
            <span>Power</span>
            <input
              type="number"
              value={form.power}
              onChange={(event) => handleInputChange('power', event.target.value)}
              min={0}
            />
          </label>

          <label className="field">
            <span>Defense</span>
            <input
              type="number"
              value={form.defense}
              onChange={(event) => handleInputChange('defense', event.target.value)}
              min={0}
            />
          </label>

          <label className="field">
            <span>Utility</span>
            <input
              type="number"
              value={form.utility}
              onChange={(event) => handleInputChange('utility', event.target.value)}
              min={0}
            />
          </label>

          <label className="field">
            <span>Tags (comma separated)</span>
            <input
              value={form.tagsText}
              onChange={(event) => handleInputChange('tagsText', event.target.value)}
              placeholder="fire, dungeon, mid-tier"
            />
          </label>

          <label className="field span-2">
            <span>Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => handleInputChange('notes', event.target.value)}
              rows={2}
            />
          </label>
        </div>

        <div className="actions">
          <button className="primary" onClick={addResourceToList}>
            Add to test pack
          </button>
          <button className="ghost" onClick={resetForm}>
            Reset form
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Live preview</p>
            <h2>JSON payload ready for your game</h2>
          </div>
          <div className="preview-actions">
            <button className="ghost" onClick={copyJson}>
              Copy JSON
            </button>
            <button className="secondary" onClick={downloadJson}>
              Download file
            </button>
          </div>
        </div>

        <div className="preview-grid">
          <article className="resource-card">
            <header>
              <div>
                <p className="label">Preview resource</p>
                <h3>{previewResource.name}</h3>
              </div>
              <span
                className="rarity"
                style={{ borderColor: rarityColors[previewResource.rarity] }}
              >
                {previewResource.rarity}
              </span>
            </header>
            <p className="muted">{previewResource.description}</p>
            <dl className="stats">
              <div>
                <dt>Category</dt>
                <dd>{previewResource.category}</dd>
              </div>
              <div>
                <dt>Value</dt>
                <dd>{previewResource.value}</dd>
              </div>
              <div>
                <dt>Weight</dt>
                <dd>{previewResource.weight}</dd>
              </div>
              <div>
                <dt>Drop weight</dt>
                <dd>{previewResource.dropRate}</dd>
              </div>
              <div>
                <dt>Qty range</dt>
                <dd>
                  {previewResource.quantityRange.min} -
                  {` ${previewResource.quantityRange.max}`}
                </dd>
              </div>
            </dl>
            <div className="stat-bars">
              <div>
                <p className="label">Power</p>
                <div className="bar">
                  <span style={{ width: `${previewResource.stats.power}%` }} />
                </div>
              </div>
              <div>
                <p className="label">Defense</p>
                <div className="bar">
                  <span style={{ width: `${previewResource.stats.defense}%` }} />
                </div>
              </div>
              <div>
                <p className="label">Utility</p>
                <div className="bar">
                  <span style={{ width: `${previewResource.stats.utility}%` }} />
                </div>
              </div>
            </div>
            <div className="tags">
              {previewResource.tags.length ? (
                previewResource.tags.map((tag) => <span key={tag}>{tag}</span>)
              ) : (
                <span className="muted">Add tags to quickly filter later.</span>
              )}
            </div>
            {previewResource.notes && (
              <p className="muted">Notes: {previewResource.notes}</p>
            )}
          </article>

          <article className="json-preview">
            <pre>
              <code>{JSON.stringify(previewResource, null, 2)}</code>
            </pre>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Resource pack</p>
            <h2>Current test resources</h2>
            <p className="muted">
              Saved locally for this session. Re-run simulations after tweaking
              drop weights to see how your loot table behaves.
            </p>
          </div>
        </div>

        <div className="resource-list">
          {resources.map((item) => (
            <div key={item.id} className="resource-row">
              <div>
                <p className="name">{item.name}</p>
                <p className="muted small">{item.description}</p>
              </div>
              <div className="row-meta">
                <span className="pill" style={{ color: rarityColors[item.rarity] }}>
                  {item.rarity}
                </span>
                <span className="pill">Drop {item.dropRate}</span>
                <span className="pill">Value {item.value}</span>
              </div>
            </div>
          ))}

          {!resources.length && (
            <p className="muted">Add resources to start simulating drops.</p>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Simulation</p>
            <h2>Test the drop table</h2>
            <p className="muted">
              Uses the drop weight values above to roll a loot drop several
              times. Increase the attempts for a clearer distribution sample.
            </p>
          </div>
        </div>

        <div className="simulation">
          <label className="field">
            <span>Number of rolls</span>
            <input
              type="number"
              value={simulationAttempts}
              onChange={(event) => setSimulationAttempts(Number(event.target.value))}
              min={1}
              step={1}
            />
          </label>
          <button className="primary" onClick={runSimulation}>
            Run drop test
          </button>
          <p className="muted">{simulationResult}</p>
        </div>
      </section>
    </main>
  )
}

export default App
