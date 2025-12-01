import { useState } from 'react'
import './App.css'

type StatKey =
  | 'Strength (STR)'
  | 'Speed (SPD)'
  | 'Sight (SIT)'
  | 'Stealth (STH)'
  | 'Search (SRC)'
  | 'Charm (CRM)'
  | 'Special (SPL)'
  | 'Luck (LUK)'

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
  name: string
  durability: string
  status: string
}

type Character = {
  name: string
  wounds: {
    tokens: number
    max: number
    notes: string
  }
  stats: Record<StatKey, string>
  skills: Skill[]
  abilities: Ability[]
  resources: Resource[]
  equipment: Equipment[]
  appearance: {
    description: string
    distinguishing: string
  }
}

const statOrder: StatKey[] = [
  'Strength (STR)',
  'Speed (SPD)',
  'Sight (SIT)',
  'Stealth (STH)',
  'Search (SRC)',
  'Charm (CRM)',
  'Special (SPL)',
  'Luck (LUK)',
]

const starterCharacter: Character = {
  name: 'Rowan Vale',
  wounds: {
    tokens: 1,
    max: 5,
    notes: 'Took a nasty scrape while vaulting a fence. -1 to physical checks until tended.',
  },
  stats: {
    'Strength (STR)': 'd8',
    'Speed (SPD)': 'd10',
    'Sight (SIT)': 'd8',
    'Stealth (STH)': 'd12',
    'Search (SRC)': 'd10',
    'Charm (CRM)': 'd6',
    'Special (SPL)': 'd4',
    'Luck (LUK)': 'd20',
  },
  skills: [
    { name: 'Urban Parkour', stat: 'Speed (SPD)', level: 2, notes: 'Ignore basic difficult terrain.' },
    { name: 'Lock Lore', stat: 'Search (SRC)', level: 1, notes: '+1 when examining old mechanisms.' },
    { name: 'Quick Wit', stat: 'Charm (CRM)', level: 1 },
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
    { name: 'Collapsible staff', durability: '85%', status: 'Bent tip (50% effective on heavy strikes)' },
    { name: 'Worn satchel', durability: '65%', status: 'Advantage on stealth checks unless overfilled' },
    { name: 'Spyglass charm', durability: '100%', status: '+1 to Sight on long-range scans' },
  ],
  appearance: {
    description:
      'Lean figure in layered streetwear; quiet confidence with a habit of scanning rooftops before stepping outside.',
    distinguishing: 'Faint scar on left eyebrow, mismatched gloves, soft violet glow from the spyglass charm.',
  },
}

function App() {
  const [character, setCharacter] = useState<Character>(starterCharacter)

  const updateStat = (key: StatKey, value: string) => {
    setCharacter((current) => ({
      ...current,
      stats: { ...current.stats, [key]: value },
    }))
  }

  const updateWounds = (field: 'tokens' | 'max' | 'notes', value: string | number) => {
    setCharacter((current) => ({
      ...current,
      wounds: { ...current.wounds, [field]: typeof value === 'number' ? value : value },
    }))
  }

  const updateAppearance = (field: keyof Character['appearance'], value: string) => {
    setCharacter((current) => ({
      ...current,
      appearance: { ...current.appearance, [field]: value },
    }))
  }

  const updateSkill = (index: number, field: keyof Skill, value: string | number) => {
    setCharacter((current) => {
      const next = [...current.skills]
      next[index] = { ...next[index], [field]: value }
      return { ...current, skills: next }
    })
  }

  const updateAbility = (index: number, field: keyof Ability, value: string) => {
    setCharacter((current) => {
      const next = [...current.abilities]
      next[index] = { ...next[index], [field]: value }
      return { ...current, abilities: next }
    })
  }

  const updateResource = (index: number, field: keyof Resource, value: string) => {
    setCharacter((current) => {
      const next = [...current.resources]
      next[index] = { ...next[index], [field]: value }
      return { ...current, resources: next }
    })
  }

  const updateEquipment = (index: number, field: keyof Equipment, value: string) => {
    setCharacter((current) => {
      const next = [...current.equipment]
      next[index] = { ...next[index], [field]: value }
      return { ...current, equipment: next }
    })
  }

  const addSkill = () => {
    setCharacter((current) => ({
      ...current,
      skills: [...current.skills, { name: 'New skill', stat: 'Strength (STR)', level: 1, notes: '' }],
    }))
  }

  const addAbility = () => {
    setCharacter((current) => ({
      ...current,
      abilities: [...current.abilities, { name: 'New ability', effect: 'Describe what it does.' }],
    }))
  }

  const addResource = () => {
    setCharacter((current) => ({
      ...current,
      resources: [...current.resources, { name: 'New resource', quantity: '1', detail: 'Usage notes.' }],
    }))
  }

  const addEquipment = () => {
    setCharacter((current) => ({
      ...current,
      equipment: [
        ...current.equipment,
        { name: 'New equipment', durability: '100%', status: 'Ready for action.' },
      ],
    }))
  }

  const totalSkillBonus = character.skills.reduce((sum, skill) => sum + (Number(skill.level) || 0), 0)

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Character tracking sheet</p>
          <h1>{character.name}</h1>
          <p className="lede">
            Manage stats, wounds, and gear according to the Deep Stories rules. Track wound tokens and
            make quick tweaks before each roll or push.
          </p>
          <div className="hero-stats">
            <div>
              <p className="label">Wound tokens</p>
              <strong>
                {character.wounds.tokens} / {character.wounds.max}
              </strong>
            </div>
            <div>
              <p className="label">Total skill bonus</p>
              <strong>+{totalSkillBonus}</strong>
            </div>
            <div>
              <p className="label">Signature stat</p>
              <strong>{character.stats['Luck (LUK)']}</strong>
            </div>
          </div>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Core info</p>
            <h2>Identity & wounds</h2>
            <p className="muted">Keep the name and wound tokens current before starting a scene.</p>
          </div>
        </div>

        <div className="form-grid">
          <label className="field span-2">
            <span>Character name</span>
            <input
              value={character.name}
              onChange={(event) => setCharacter({ ...character, name: event.target.value })}
            />
          </label>

          <label className="field">
            <span>Wound tokens</span>
            <input
              type="number"
              min={0}
              max={character.wounds.max}
              value={character.wounds.tokens}
              onChange={(event) => updateWounds('tokens', Number(event.target.value))}
            />
          </label>

          <label className="field">
            <span>Maximum wounds</span>
            <input
              type="number"
              min={1}
              value={character.wounds.max}
              onChange={(event) => updateWounds('max', Number(event.target.value))}
            />
          </label>

          <label className="field span-2">
            <span>Consequence notes</span>
            <textarea
              rows={2}
              value={character.wounds.notes}
              onChange={(event) => updateWounds('notes', event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Stats</p>
            <h2>Dice for each stat</h2>
            <p className="muted">Use d4-d20 values based on the Deep Stories stat table.</p>
          </div>
        </div>

        <div className="stat-grid">
          {statOrder.map((key) => (
            <label key={key} className="field">
              <span>{key}</span>
              <input
                value={character.stats[key]}
                onChange={(event) => updateStat(key, event.target.value)}
                placeholder="d8"
              />
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
          <button className="secondary" onClick={addSkill}>
            Add skill
          </button>
        </div>

        <div className="list-grid">
          {character.skills.map((skill, index) => (
            <div key={`${skill.name}-${index}`} className="list-card">
              <div className="inline-grid">
                <label className="field">
                  <span>Name</span>
                  <input
                    value={skill.name}
                    onChange={(event) => updateSkill(index, 'name', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Stat</span>
                  <select
                    value={skill.stat}
                    onChange={(event) => updateSkill(index, 'stat', event.target.value)}
                  >
                    {statOrder.map((option) => (
                      <option key={option}>{option}</option>
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
          <button className="secondary" onClick={addAbility}>
            Add ability
          </button>
        </div>

        <div className="list-grid">
          {character.abilities.map((ability, index) => (
            <div key={`${ability.name}-${index}`} className="list-card">
              <label className="field">
                <span>Name</span>
                <input
                  value={ability.name}
                  onChange={(event) => updateAbility(index, 'name', event.target.value)}
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
          <button className="secondary" onClick={addResource}>
            Add resource
          </button>
        </div>

        <div className="list-grid">
          {character.resources.map((resource, index) => (
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
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Equipment</p>
            <h2>Gear with durability</h2>
            <p className="muted">Track the durability drops on natural 1s and note any penalties.</p>
          </div>
          <button className="secondary" onClick={addEquipment}>
            Add equipment
          </button>
        </div>

        <div className="list-grid">
          {character.equipment.map((item, index) => (
            <div key={`${item.name}-${index}`} className="list-card">
              <div className="inline-grid">
                <label className="field">
                  <span>Name</span>
                  <input
                    value={item.name}
                    onChange={(event) => updateEquipment(index, 'name', event.target.value)}
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
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Appearance</p>
            <h2>How they look right now</h2>
            <p className="muted">Note any scene-specific changes like dirt, torn clothing, or glow effects.</p>
          </div>
        </div>

        <div className="form-grid">
          <label className="field span-2">
            <span>Core description</span>
            <textarea
              rows={3}
              value={character.appearance.description}
              onChange={(event) => updateAppearance('description', event.target.value)}
            />
          </label>
          <label className="field span-2">
            <span>Current distinguishing details</span>
            <textarea
              rows={2}
              value={character.appearance.distinguishing}
              onChange={(event) => updateAppearance('distinguishing', event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Quick reference</p>
            <h2>JSON snapshot</h2>
            <p className="muted">Copy this into your session notes or share with players.</p>
          </div>
        </div>
        <div className="json-preview">
          <pre>
            <code>{JSON.stringify(character, null, 2)}</code>
          </pre>
        </div>
      </section>
    </main>
  )
}

export default App
