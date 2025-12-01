import { useEffect, useMemo, useState } from 'react'
import './App.css'

type StatKey = 'STR' | 'SPD' | 'SIT' | 'STH' | 'SRC' | 'CRM' | 'SPL' | 'LUK'

type Skill = {
  name: string
  stat: StatKey
  level: number
  notes?: string
}

type Ability = {
  name: string
  effect: string
}

type Resource = {
  name: string
  quantity: string
  detail: string
}

type Equipment = {
  slot: string
  item: string
  durability: string
  status: string
}

type SessionNote = {
  title: string
  date: string
  summary: string
}

type SheetState = {
  characterName: string
  characterImage: string
  appearance: string
  stats: Record<StatKey, string>
  skills: Skill[]
  abilities: Ability[]
  resources: Resource[]
  equipment: Equipment[]
  wounds: {
    tokens: number
    max: number
    notes: string
  }
  notes: string
  sessions: SessionNote[]
}

const statLabels: Record<StatKey, string> = {
  STR: 'Strength (STR)',
  SPD: 'Speed (SPD)',
  SIT: 'Sight (SIT)',
  STH: 'Stealth (STH)',
  SRC: 'Search (SRC)',
  CRM: 'Charm (CRM)',
  SPL: 'Special (SPL)',
  LUK: 'Luck (LUK)',
}

const defaultSheet: SheetState = {
  characterName: 'Lumen Harper',
  characterImage:
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=480&q=80',
  appearance:
    'Weathered trench coat over tactical streetwear; a faint hum of stored kinetic energy surrounds them.',
  stats: {
    STR: 'd8',
    SPD: 'd10',
    SIT: 'd8',
    STH: 'd12',
    SRC: 'd10',
    CRM: 'd6',
    SPL: 'd4',
    LUK: 'd20',
  },
  skills: [
    { name: 'Kinetic Cushion', stat: 'SPD', level: 2, notes: 'Ignore first fall consequence each scene.' },
    { name: 'Lock Lore', stat: 'SRC', level: 1, notes: 'Advantage on ancient mechanisms.' },
    { name: 'Quick Wit', stat: 'CRM', level: 1, notes: 'Bonus when defusing tense moments.' },
  ],
  abilities: [
    { name: 'Lucky Break', effect: 'Once per scene re-roll a failed Luck check; accept new result.' },
    { name: 'Shadow Slip', effect: 'Advantage on first Stealth roll after entering a new area.' },
  ],
  resources: [
    { name: 'Wound tokens', quantity: '1 / 5', detail: '-1 to all rolls per token; at max suffer critical consequence.' },
    { name: 'Bandages', quantity: '2', detail: 'Removes 1 wound token after a short rest.' },
    { name: 'Glow charges', quantity: '3', detail: 'Single-use light sources; dim light for 10 minutes.' },
  ],
  equipment: [
    {
      slot: 'Primary hand',
      item: 'Collapsible staff',
      durability: '85%',
      status: 'Bent tip (50% effective on heavy strikes)',
    },
    {
      slot: 'Pack',
      item: 'Worn satchel',
      durability: '65%',
      status: 'Advantage on stealth checks unless overfilled',
    },
    {
      slot: 'Charm',
      item: 'Spyglass charm',
      durability: '100%',
      status: '+1 to Sight on long-range scans',
    },
  ],
  wounds: {
    tokens: 1,
    max: 5,
    notes: 'Took a nasty scrape while vaulting a fence. -1 to physical checks until tended.',
  },
  notes: '',
  sessions: [
    {
      title: 'Chasing echoes',
      date: 'Session 01',
      summary: 'Tracked stolen relic into the drowned tunnels; secured map fragment and earned favor with the Archivist.',
    },
  ],
}

const STORAGE_KEY = 'deep-character-sheet'

export default function DeepCharacterSheet() {
  const [sheet, setSheet] = useState<SheetState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return defaultSheet
    try {
      return { ...defaultSheet, ...JSON.parse(saved) }
    } catch (error) {
      console.warn('Failed to parse saved sheet', error)
      return defaultSheet
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sheet))
  }, [sheet])

  const totalSkillBonus = useMemo(
    () => sheet.skills.reduce((sum, skill) => sum + (Number(skill.level) || 0), 0),
    [sheet.skills],
  )

  const updateStat = (key: StatKey, value: string) => {
    setSheet((current) => ({
      ...current,
      stats: { ...current.stats, [key]: value },
    }))
  }

  const updateSkill = (index: number, field: keyof Skill, value: string | number) => {
    setSheet((current) => {
      const next = [...current.skills]
      next[index] = { ...next[index], [field]: value as never }
      return { ...current, skills: next }
    })
  }

  const updateAbility = (index: number, field: keyof Ability, value: string) => {
    setSheet((current) => {
      const next = [...current.abilities]
      next[index] = { ...next[index], [field]: value }
      return { ...current, abilities: next }
    })
  }

  const updateResource = (index: number, field: keyof Resource, value: string) => {
    setSheet((current) => {
      const next = [...current.resources]
      next[index] = { ...next[index], [field]: value }
      return { ...current, resources: next }
    })
  }

  const updateEquipment = (index: number, field: keyof Equipment, value: string) => {
    setSheet((current) => {
      const next = [...current.equipment]
      next[index] = { ...next[index], [field]: value }
      return { ...current, equipment: next }
    })
  }

  const updateSession = (index: number, field: keyof SessionNote, value: string) => {
    setSheet((current) => {
      const next = [...current.sessions]
      next[index] = { ...next[index], [field]: value }
      return { ...current, sessions: next }
    })
  }

  const removeFromList = (key: keyof SheetState, index: number) => {
    if (!Array.isArray((sheet as never)[key])) return
    setSheet((current) => ({
      ...current,
      [key]: (current[key] as unknown as Array<unknown>).filter((_, i) => i !== index),
    }))
  }

  const statOrder: StatKey[] = ['STR', 'SPD', 'SIT', 'STH', 'SRC', 'CRM', 'SPL', 'LUK']

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Deep character sheet</p>
            <h1>{sheet.characterName}</h1>
            <p className="lede">
              Track wounds, dice, and scene notes. This template mirrors the layout from the Deep Character Sheet
              prototype without the AI helpers.
            </p>
            <div className="hero-stats">
              <div>
                <p className="label">Wound tokens</p>
                <strong>
                  {sheet.wounds.tokens} / {sheet.wounds.max}
                </strong>
              </div>
              <div>
                <p className="label">Total skill bonus</p>
                <strong>+{totalSkillBonus}</strong>
              </div>
              <div>
                <p className="label">Signature stat</p>
                <strong>{sheet.stats.LUK}</strong>
              </div>
            </div>
          </div>
          {sheet.characterImage && (
            <img
              src={sheet.characterImage}
              alt={`${sheet.characterName} portrait`}
              style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 12, border: '1px solid #1e293b' }}
            />
          )}
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Identity & wounds</p>
            <h2>Core details</h2>
            <p className="muted">Keep these updated before each scene.</p>
          </div>
        </div>
        <div className="form-grid">
          <label className="field span-2">
            <span>Character name</span>
            <input
              value={sheet.characterName}
              onChange={(event) => setSheet({ ...sheet, characterName: event.target.value })}
            />
          </label>
          <label className="field span-2">
            <span>Portrait URL</span>
            <input
              value={sheet.characterImage}
              onChange={(event) => setSheet({ ...sheet, characterImage: event.target.value })}
              placeholder="https://..."
            />
          </label>
          <label className="field">
            <span>Wound tokens</span>
            <input
              type="number"
              min={0}
              max={sheet.wounds.max}
              value={sheet.wounds.tokens}
              onChange={(event) =>
                setSheet({ ...sheet, wounds: { ...sheet.wounds, tokens: Number(event.target.value) } })
              }
            />
          </label>
          <label className="field">
            <span>Maximum wounds</span>
            <input
              type="number"
              min={1}
              value={sheet.wounds.max}
              onChange={(event) => setSheet({ ...sheet, wounds: { ...sheet.wounds, max: Number(event.target.value) } })}
            />
          </label>
          <label className="field span-2">
            <span>Consequence notes</span>
            <textarea
              rows={2}
              value={sheet.wounds.notes}
              onChange={(event) => setSheet({ ...sheet, wounds: { ...sheet.wounds, notes: event.target.value } })}
            />
          </label>
          <label className="field span-2">
            <span>Appearance</span>
            <textarea
              rows={3}
              value={sheet.appearance}
              onChange={(event) => setSheet({ ...sheet, appearance: event.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Stats</p>
            <h2>Dice per stat</h2>
            <p className="muted">Use d4-d20 values from the Deep Stories stat table.</p>
          </div>
        </div>
        <div className="stat-grid">
          {statOrder.map((key) => (
            <label key={key} className="field">
              <span>{statLabels[key]}</span>
              <input value={sheet.stats[key]} onChange={(event) => updateStat(key, event.target.value)} />
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Skills</p>
            <h2>Bonuses tied to stats</h2>
            <p className="muted">Skills add direct bonuses to related stat rolls.</p>
          </div>
          <button
            className="secondary"
            onClick={() =>
              setSheet((current) => ({
                ...current,
                skills: [...current.skills, { name: 'New skill', stat: 'STR', level: 1, notes: '' }],
              }))
            }
          >
            ＋ Add skill
          </button>
        </div>
        <div className="list-grid">
          {sheet.skills.map((skill, index) => (
            <div key={`${skill.name}-${index}`} className="list-card">
              <div className="inline-grid">
                <label className="field">
                  <span>Name</span>
                  <input value={skill.name} onChange={(event) => updateSkill(index, 'name', event.target.value)} />
                </label>
                <label className="field">
                  <span>Stat</span>
                  <select value={skill.stat} onChange={(event) => updateSkill(index, 'stat', event.target.value)}>
                    {statOrder.map((option) => (
                      <option key={option} value={option}>
                        {statLabels[option]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Level (+)</span>
                  <input
                    type="number"
                    min={0}
                    value={skill.level}
                    onChange={(event) => updateSkill(index, 'level', Number(event.target.value))}
                  />
                </label>
              </div>
              <label className="field">
                <span>Notes</span>
                <input
                  value={skill.notes ?? ''}
                  onChange={(event) => updateSkill(index, 'notes', event.target.value)}
                  placeholder="When does this apply?"
                />
              </label>
              <button className="ghost" onClick={() => removeFromList('skills', index)}>
                Remove skill
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Abilities</p>
            <h2>Active & passive effects</h2>
            <p className="muted">Capture special moves, advantages, or automatic successes.</p>
          </div>
          <button
            className="secondary"
            onClick={() =>
              setSheet((current) => ({
                ...current,
                abilities: [...current.abilities, { name: 'New ability', effect: 'Describe what it does.' }],
              }))
            }
          >
            ＋ Add ability
          </button>
        </div>
        <div className="list-grid">
          {sheet.abilities.map((ability, index) => (
            <div key={`${ability.name}-${index}`} className="list-card">
              <label className="field">
                <span>Name</span>
                <input
                  value={ability.name}
                  onChange={(event) => updateAbility(index, 'name', event.target.value)}
                  placeholder="Ability name"
                />
              </label>
              <label className="field">
                <span>Effect</span>
                <textarea
                  rows={2}
                  value={ability.effect}
                  onChange={(event) => updateAbility(index, 'effect', event.target.value)}
                />
              </label>
              <button className="ghost" onClick={() => removeFromList('abilities', index)}>
                Remove ability
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Resources</p>
            <h2>Consumables & scene trackers</h2>
            <p className="muted">Use this for wound tokens, temporary boosts, and limited-use items.</p>
          </div>
          <button
            className="secondary"
            onClick={() =>
              setSheet((current) => ({
                ...current,
                resources: [...current.resources, { name: 'New resource', quantity: '1', detail: 'Usage notes.' }],
              }))
            }
          >
            ＋ Add resource
          </button>
        </div>
        <div className="list-grid">
          {sheet.resources.map((resource, index) => (
            <div key={`${resource.name}-${index}`} className="list-card">
              <div className="inline-grid">
                <label className="field">
                  <span>Name</span>
                  <input
                    value={resource.name}
                    onChange={(event) => updateResource(index, 'name', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Quantity</span>
                  <input
                    value={resource.quantity}
                    onChange={(event) => updateResource(index, 'quantity', event.target.value)}
                  />
                </label>
              </div>
              <label className="field">
                <span>Detail</span>
                <input
                  value={resource.detail}
                  onChange={(event) => updateResource(index, 'detail', event.target.value)}
                />
              </label>
              <button className="ghost" onClick={() => removeFromList('resources', index)}>
                Remove resource
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Equipment</p>
            <h2>Gear with durability</h2>
            <p className="muted">Track durability drops on natural 1s and note any penalties.</p>
          </div>
          <button
            className="secondary"
            onClick={() =>
              setSheet((current) => ({
                ...current,
                equipment: [
                  ...current.equipment,
                  { slot: 'New slot', item: 'New equipment', durability: '100%', status: 'Ready for action.' },
                ],
              }))
            }
          >
            ＋ Add equipment
          </button>
        </div>
        <div className="list-grid">
          {sheet.equipment.map((item, index) => (
            <div key={`${item.item}-${index}`} className="list-card">
              <div className="inline-grid">
                <label className="field">
                  <span>Slot</span>
                  <input
                    value={item.slot}
                    onChange={(event) => updateEquipment(index, 'slot', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Item</span>
                  <input
                    value={item.item}
                    onChange={(event) => updateEquipment(index, 'item', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Durability</span>
                  <input
                    value={item.durability}
                    onChange={(event) => updateEquipment(index, 'durability', event.target.value)}
                  />
                </label>
              </div>
              <label className="field">
                <span>Status / effect</span>
                <input
                  value={item.status}
                  onChange={(event) => updateEquipment(index, 'status', event.target.value)}
                />
              </label>
              <button className="ghost" onClick={() => removeFromList('equipment', index)}>
                Remove equipment
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Session log</p>
            <h2>Quick session notes</h2>
            <p className="muted">Track what happened each time you play.</p>
          </div>
          <button
            className="secondary"
            onClick={() =>
              setSheet((current) => ({
                ...current,
                sessions: [
                  ...current.sessions,
                  { title: 'New session', date: 'Session', summary: 'Key beats, discoveries, and consequences.' },
                ],
              }))
            }
          >
            ＋ Add session
          </button>
        </div>
        <div className="list-grid">
          {sheet.sessions.map((session, index) => (
            <div key={`${session.title}-${index}`} className="list-card">
              <div className="inline-grid">
                <label className="field">
                  <span>Title</span>
                  <input
                    value={session.title}
                    onChange={(event) => updateSession(index, 'title', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Date / number</span>
                  <input
                    value={session.date}
                    onChange={(event) => updateSession(index, 'date', event.target.value)}
                  />
                </label>
              </div>
              <label className="field">
                <span>Summary</span>
                <textarea
                  rows={2}
                  value={session.summary}
                  onChange={(event) => updateSession(index, 'summary', event.target.value)}
                />
              </label>
              <button className="ghost" onClick={() => removeFromList('sessions', index)}>
                Remove session
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Notes</p>
            <h2>Loose thoughts</h2>
            <p className="muted">Scratchpad for NPC names, leads, or reminders.</p>
          </div>
        </div>
        <label className="field">
          <span>Notes</span>
          <textarea
            rows={4}
            value={sheet.notes}
            onChange={(event) => setSheet({ ...sheet, notes: event.target.value })}
          />
        </label>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Quick reference</p>
            <h2>JSON snapshot</h2>
            <p className="muted">Copy this into session notes or share with players.</p>
          </div>
        </div>
        <div className="json-preview">
          <pre>
            <code>{JSON.stringify(sheet, null, 2)}</code>
          </pre>
        </div>
      </section>
    </main>
  )
}
