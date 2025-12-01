import React, { useState, useEffect } from 'react';
import { Plus, Minus, X, PlusCircle, Dices, Save, Upload, Trash2 } from 'lucide-react';

export default function CharacterSheet() {
  const [characterName, setCharacterName] = useState('');
  const [characterImage, setCharacterImage] = useState('');
  const [imageError, setImageError] = useState(false);
  const [appearance, setAppearance] = useState('');
  const [stats, setStats] = useState({
    STR: 'D8',
    SPD: 'D8',
    SIT: 'D10',
    STH: 'D6',
    SRC: 'D10',
    CRM: 'D12',
    SPL: 'D20',
    LUK: 'D4'
  });
  
  const [skills, setSkills] = useState([]);
  const [abilities, setAbilities] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [editingAbility, setEditingAbility] = useState(null);
  const [equipment, setEquipment] = useState({
    head: null,
    topPrimary: null,
    topSecondary: null,
    bottomPrimary: null,
    bottomSecondary: null,
    underwear: null,
    gloves: null,
    socks: null,
    shoes: null,
    leftHand: null,
    rightHand: null,
    accessory1: null,
    accessory2: null,
    accessory3: null
  });
  const [resources, setResources] = useState([]);
  const [wounds, setWounds] = useState(0);
  const [maxWounds, setMaxWounds] = useState(5);
  const [consequences, setConsequences] = useState([]);
  const [notes, setNotes] = useState('');
  const [editingConsequence, setEditingConsequence] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Session Notes
  const [sessions, setSessions] = useState([]);
  const [editingSession, setEditingSession] = useState(null);
  const [expandedSessions, setExpandedSessions] = useState([]);

  // Save/Load State
  const [savedCharacters, setSavedCharacters] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveCharacterName, setSaveCharacterName] = useState('');
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [characterSummary, setCharacterSummary] = useState('');
  const [showNewCharacterDialog, setShowNewCharacterDialog] = useState(false);
  const [showAICreateDialog, setShowAICreateDialog] = useState(false);
  const [aiCharacterPrompt, setAICharacterPrompt] = useState('');
  const [generatingCharacter, setGeneratingCharacter] = useState(false);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [overwriteCharacterName, setOverwriteCharacterName] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteCharacterName, setDeleteCharacterName] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');

  // Load saved characters list on mount
  useEffect(() => {
    loadCharactersList();
  }, []);

  const loadCharactersList = async () => {
    try {
      console.log('Loading characters list...');
      const keys = await window.storage.list('character:');
      console.log('Storage keys result:', keys);
      
      if (keys && keys.keys) {
        const charNames = keys.keys.map(k => k.replace('character:', ''));
        console.log('Character names found:', charNames);
        
        // Load preview data for each character
        const previews = await Promise.all(
          charNames.map(async (name) => {
            try {
              const result = await window.storage.get(`character:${name}`);
              if (result && result.value) {
                const data = JSON.parse(result.value);
                return {
                  name,
                  image: data.characterImage || '',
                  savedAt: data.savedAt || ''
                };
              }
            } catch (error) {
              console.error(`Failed to load preview for ${name}:`, error);
            }
            return { name, image: '', savedAt: '' };
          })
        );
        
        console.log('Character previews loaded:', previews);
        setSavedCharacters(previews);
      } else {
        console.log('No keys found or keys is null');
        setSavedCharacters([]);
      }
    } catch (error) {
      console.error('Error loading characters list:', error);
      setSavedCharacters([]);
    }
  };

  const saveCharacter = async () => {
    const name = saveCharacterName.trim() || characterName.trim() || 'Unnamed Character';
    
    // Check if character already exists
    try {
      const existing = await window.storage.get(`character:${name}`);
      if (existing && existing.value) {
        // Character exists, show overwrite confirmation
        setOverwriteCharacterName(name);
        setShowOverwriteDialog(true);
        return;
      }
    } catch (error) {
      // Character doesn't exist, proceed with save
    }
    
    // Save the character
    await performSave(name);
  };

  const performSave = async (name) => {
    const characterData = {
      characterName,
      characterImage,
      appearance,
      stats,
      skills,
      abilities,
      inventory,
      equipment,
      resources,
      wounds,
      maxWounds,
      consequences,
      sessions,
      notes,
      savedAt: new Date().toISOString()
    };

    try {
      // If character exists, delete it first to avoid 409 conflict
      try {
        await window.storage.delete(`character:${name}`);
      } catch (e) {
        // Character doesn't exist, that's fine
      }
      
      // Now save the character
      await window.storage.set(`character:${name}`, JSON.stringify(characterData));
      await loadCharactersList();
      setShowSaveDialog(false);
      setSaveCharacterName('');
      setShowOverwriteDialog(false);
      alert(`Character "${name}" saved successfully!`);
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save character: ' + error.message);
    }
  };

  const loadCharacter = async (name) => {
    try {
      const result = await window.storage.get(`character:${name}`);
      if (result && result.value) {
        const data = JSON.parse(result.value);
        
        setCharacterName(data.characterName || '');
        setCharacterImage(data.characterImage || '');
        setAppearance(data.appearance || '');
        setStats(data.stats || {});
        setSkills(data.skills || []);
        setAbilities(data.abilities || []);
        setInventory(data.inventory || []);
        
        // Migrate old equipment format to new layered format
        let loadedEquipment = data.equipment || {};
        console.log('Loaded equipment before migration:', JSON.stringify(loadedEquipment, null, 2));
        
        const migratedEquipment = {
          head: loadedEquipment.head ?? null,
          topPrimary: loadedEquipment.topPrimary ?? loadedEquipment.top ?? null,
          topSecondary: loadedEquipment.topSecondary ?? null,
          bottomPrimary: loadedEquipment.bottomPrimary ?? loadedEquipment.bottom ?? null,
          bottomSecondary: loadedEquipment.bottomSecondary ?? null,
          underwear: loadedEquipment.underwear ?? null,
          gloves: loadedEquipment.gloves ?? null,
          socks: loadedEquipment.socks ?? null,
          shoes: loadedEquipment.shoes ?? null,
          leftHand: loadedEquipment.leftHand ?? null,
          rightHand: loadedEquipment.rightHand ?? null,
          accessory1: loadedEquipment.accessory1 ?? null,
          accessory2: loadedEquipment.accessory2 ?? null,
          accessory3: loadedEquipment.accessory3 ?? null
        };
        
        console.log('Migrated equipment:', JSON.stringify(migratedEquipment, null, 2));
        setEquipment(migratedEquipment);
        
        setResources(data.resources || []);
        setWounds(data.wounds || 0);
        setMaxWounds(data.maxWounds || 5);
        setConsequences(data.consequences || []);
        setSessions(data.sessions || []);
        setNotes(data.notes || '');
        
        setShowLoadDialog(false);
        setRollHistory([]);
        setCurrentRoll(null);
        setActiveConsequences([]);
        
        alert(`Character "${name}" loaded successfully!`);
      }
    } catch (error) {
      alert('Failed to load character: ' + error.message);
    }
  };

  const deleteCharacter = async (name) => {
    setDeleteCharacterName(name);
    setShowDeleteDialog(true);
  };

  const performDelete = async () => {
    try {
      await window.storage.delete(`character:${deleteCharacterName}`);
      await loadCharactersList();
      setShowDeleteDialog(false);
      setDeleteCharacterName('');
      alert(`Character "${deleteCharacterName}" deleted.`);
    } catch (error) {
      alert('Failed to delete character: ' + error.message);
    }
  };

  const exportCharacter = () => {
    const characterData = {
      characterName,
      characterImage,
      appearance,
      stats,
      skills,
      abilities,
      inventory,
      equipment,
      resources,
      wounds,
      maxWounds,
      consequences,
      sessions,
      notes,
      exportedAt: new Date().toISOString()
    };

    const jsonString = JSON.stringify(characterData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${characterName || 'character'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importCharacter = () => {
    try {
      const data = JSON.parse(importText);
      
      setCharacterName(data.characterName || '');
      setCharacterImage(data.characterImage || '');
      setAppearance(data.appearance || '');
      setStats(data.stats || {});
      setSkills(data.skills || []);
      setAbilities(data.abilities || []);
      setInventory(data.inventory || []);
      
      let loadedEquipment = data.equipment || {};
      const migratedEquipment = {
        head: loadedEquipment.head ?? null,
        topPrimary: loadedEquipment.topPrimary ?? loadedEquipment.top ?? null,
        topSecondary: loadedEquipment.topSecondary ?? null,
        bottomPrimary: loadedEquipment.bottomPrimary ?? loadedEquipment.bottom ?? null,
        bottomSecondary: loadedEquipment.bottomSecondary ?? null,
        underwear: loadedEquipment.underwear ?? null,
        gloves: loadedEquipment.gloves ?? null,
        socks: loadedEquipment.socks ?? null,
        shoes: loadedEquipment.shoes ?? null,
        leftHand: loadedEquipment.leftHand ?? null,
        rightHand: loadedEquipment.rightHand ?? null,
        accessory1: loadedEquipment.accessory1 ?? null,
        accessory2: loadedEquipment.accessory2 ?? null,
        accessory3: loadedEquipment.accessory3 ?? null
      };
      setEquipment(migratedEquipment);
      
      setResources(data.resources || []);
      setWounds(data.wounds || 0);
      setMaxWounds(data.maxWounds || 5);
      setConsequences(data.consequences || []);
      setSessions(data.sessions || []);
      setNotes(data.notes || '');
      
      setRollHistory([]);
      setCurrentRoll(null);
      setActiveConsequences([]);
      
      setShowImportDialog(false);
      setImportText('');
      alert('Character imported successfully!');
    } catch (error) {
      alert('Failed to import character. Please check the file format: ' + error.message);
    }
  };

  const handleImportFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImportText(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const newCharacter = () => {
    console.log('New Character button clicked');
    
    try {
      console.log('Resetting character data...');
      
      setCharacterName('');
      setCharacterImage('');
      setAppearance('');
      setStats({
        STR: 'D8',
        SPD: 'D8',
        SIT: 'D10',
        STH: 'D6',
        SRC: 'D10',
        CRM: 'D12',
        SPL: 'D20',
        LUK: 'D4'
      });
      setSkills([]);
      setAbilities([]);
      setInventory([]);
      setEquipment({
        head: null,
        topPrimary: null,
        topSecondary: null,
        bottomPrimary: null,
        bottomSecondary: null,
        underwear: null,
        gloves: null,
        socks: null,
        shoes: null,
        leftHand: null,
        rightHand: null,
        accessory1: null,
        accessory2: null,
        accessory3: null
      });
      setResources([]);
      setWounds(0);
      setMaxWounds(5);
      setConsequences([]);
      setSessions([]);
      setNotes('');
      setRollHistory([]);
      setCurrentRoll(null);
      setActiveConsequences([]);
      setSelectedStat('STR');
      setSelectedSkill(null);
      setModifier(0);
      setEditingConsequence(null);
      setEditingItem(null);
      setEditingSession(null);
      setExpandedSessions([]);
      setShowNewCharacterDialog(false);
      
      console.log('New character creation completed successfully!');
    } catch (error) {
      console.error('Error creating new character:', error);
      alert('Error creating new character: ' + error.message);
    }
  };

  const createCharacterWithAI = async () => {
    if (!aiCharacterPrompt.trim()) {
      alert('Please enter a character description!');
      return;
    }

    setGeneratingCharacter(true);

    try {
      const prompt = `Create a character for the Deep Stories RPG system based on this description: "${aiCharacterPrompt}"

The Deep Stories system uses these stats with dice values (D4, D6, D8, D10, D12, D20):
- Strength (STR)
- Speed (SPD)
- Sight (SIT)
- Stealth (STH)
- Search (SRC)
- Charm (CRM)
- Special (SPL)
- Luck (LUK)

Standard distribution: 1×D4, 1×D6, 2×D8, 2×D10, 1×D12, 1×D20

Equipment slots available: head, top, bottom, underwear, gloves, socks, shoes, leftHand, rightHand, accessory1, accessory2, accessory3

For accessories that can go in any accessory slot, use just "accessory" and the system will find an empty slot automatically.

Please respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "name": "character name",
  "appearance": "physical description",
  "stats": {"STR": "D8", "SPD": "D10", "SIT": "D8", "STH": "D6", "SRC": "D10", "CRM": "D12", "SPL": "D20", "LUK": "D4"},
  "skills": [{"name": "Lockpicking", "stat": "STH", "level": 3}],
  "abilities": [{"name": "Shadow Step", "type": "Active", "description": "+2 to stealth in darkness"}],
  "inventory": [
    {"name": "Leather Armor", "durability": 100, "condition": "Well-worn", "equippable": true, "slots": ["top", "bottom"], "effects": "+1 to STH"},
    {"name": "Iron Sword", "durability": 100, "condition": "", "equippable": true, "slots": ["rightHand"], "effects": "+2 to combat"},
    {"name": "Magic Ring", "durability": 100, "condition": "", "equippable": true, "slots": ["accessory"], "effects": "+1 to SPL"},
    {"name": "Health Potion", "durability": 100, "condition": "", "equippable": false, "slots": [], "effects": "Restores health"}
  ],
  "notes": "background and personality"
}

IMPORTANT: 
- For equippable items, use exact slot names: head, top, bottom, underwear, gloves, socks, shoes, leftHand, rightHand
- For accessories (rings, amulets, etc.), use "accessory" (singular) and it will auto-assign to an empty slot
- Items can occupy multiple slots (e.g., full armor uses ["top", "bottom"]).`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });

      const data = await response.json();
      let aiResponse = '';
      for (const block of data.content) {
        if (block.type === 'text') {
          aiResponse = block.text.trim();
          break;
        }
      }

      // Remove markdown code blocks if present
      aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const characterData = JSON.parse(aiResponse);

      // Apply the AI-generated character data
      setCharacterName(characterData.name || '');
      setAppearance(characterData.appearance || '');
      setStats(characterData.stats || {
        STR: 'D8', SPD: 'D8', SIT: 'D10', STH: 'D6',
        SRC: 'D10', CRM: 'D12', SPL: 'D20', LUK: 'D4'
      });
      setSkills(characterData.skills || []);
      setAbilities(characterData.abilities || []);
      setInventory(characterData.inventory || []);
      setNotes(characterData.notes || '');

      // Reset other fields
      setCharacterImage('');
      setEquipment({
        head: null,
        topPrimary: null,
        topSecondary: null,
        bottomPrimary: null,
        bottomSecondary: null,
        underwear: null,
        gloves: null,
        socks: null,
        shoes: null,
        leftHand: null,
        rightHand: null,
        accessory1: null,
        accessory2: null,
        accessory3: null
      });
      setResources([]);
      setWounds(0);
      setMaxWounds(5);
      setConsequences([]);
      setSessions([]);

      setShowAICreateDialog(false);
      setAICharacterPrompt('');
      alert('Character created successfully!');

    } catch (error) {
      console.error('Error creating character with AI:', error);
      alert('Failed to create character: ' + error.message);
    } finally {
      setGeneratingCharacter(false);
    }
  };

  // Dice Roller State
  const [selectedStat, setSelectedStat] = useState('STR');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [modifier, setModifier] = useState(0);
  const [rollHistory, setRollHistory] = useState([]);
  const [currentRoll, setCurrentRoll] = useState(null);
  const [showPushOption, setShowPushOption] = useState(false);
  const [activeConsequences, setActiveConsequences] = useState([]);

  const diceOptions = ['D4', 'D6', 'D8', 'D10', 'D12', 'D20'];

  const rollDice = (diceType) => {
    const max = parseInt(diceType.substring(1));
    return Math.floor(Math.random() * max) + 1;
  };

  const rollWithExplosion = (diceType) => {
    const max = parseInt(diceType.substring(1));
    let total = 0;
    let rolls = [];
    let currentRoll;
    
    do {
      currentRoll = rollDice(diceType);
      rolls.push(currentRoll);
      total += currentRoll;
    } while (currentRoll === max);
    
    return { total, rolls, exploded: rolls.length > 1 };
  };

  const performRoll = () => {
    const diceType = stats[selectedStat];
    const result = rollWithExplosion(diceType);
    
    // Calculate skill bonus if a skill is selected
    const skillBonus = selectedSkill !== null ? skills[selectedSkill].level : 0;
    
    // Calculate consequence penalty for this stat
    const consequencePenalty = consequences
      .filter((c, i) => activeConsequences.includes(i) && c.affectedStats.includes(selectedStat))
      .reduce((sum, c) => sum + (c.penalty || 0), 0);
    
    const finalTotal = result.total + modifier + skillBonus + consequencePenalty - wounds;
    
    const newRoll = {
      stat: selectedStat,
      skill: selectedSkill !== null ? skills[selectedSkill].name : null,
      skillBonus: skillBonus,
      diceType: diceType,
      mainRoll: result.total,
      rolls: result.rolls,
      exploded: result.exploded,
      modifier: modifier,
      consequencePenalty: consequencePenalty,
      wounds: wounds,
      finalTotal: finalTotal,
      pushed: false,
      pushedRoll: null,
      timestamp: new Date().toLocaleTimeString(),
      affectedConsequences: activeConsequences.filter(i => 
        consequences[i].affectedStats.includes(selectedStat) && 
        consequences[i].durationType === 'Rolls'
      )
    };
    
    setCurrentRoll(newRoll);
    setShowPushOption(true);
  };

  const decrementConsequences = () => {
    if (!currentRoll || !currentRoll.affectedConsequences) return;
    
    const newConsequences = [...consequences];
    const indicesToRemove = [];
    
    currentRoll.affectedConsequences.forEach(i => {
      if (newConsequences[i].durationValue > 1) {
        newConsequences[i].durationValue -= 1;
      } else {
        indicesToRemove.push(i);
      }
    });
    
    setConsequences(newConsequences);
    
    // Remove from active consequences
    setActiveConsequences(activeConsequences.filter(i => !indicesToRemove.includes(i)));
    
    // Remove expired consequences
    indicesToRemove.sort((a, b) => b - a);
    indicesToRemove.forEach(i => {
      newConsequences.splice(i, 1);
    });
    setConsequences(newConsequences);
  };

  const pushRoll = () => {
    if (!currentRoll) return;
    
    const diceType = stats[selectedStat];
    const pushedResult = rollWithExplosion(diceType);
    
    // Consequence penalty and skill bonus already calculated in main roll
    const newTotal = currentRoll.mainRoll + pushedResult.total + modifier + currentRoll.skillBonus + currentRoll.consequencePenalty - wounds;
    
    const pushedRollData = {
      ...currentRoll,
      pushed: true,
      pushedRoll: pushedResult.total,
      pushedRolls: pushedResult.rolls,
      pushedExploded: pushedResult.exploded,
      finalTotal: newTotal
    };
    
    setRollHistory([pushedRollData, ...rollHistory]);
    setCurrentRoll(null);
    setShowPushOption(false);
    
    // Decrement consequences when pushing too
    decrementConsequences();
  };

  const acceptRoll = () => {
    if (!currentRoll) return;
    setRollHistory([currentRoll, ...rollHistory]);
    setCurrentRoll(null);
    setShowPushOption(false);
  };

  const addSkill = () => {
    setSkills([...skills, { name: '', stat: 'STR', level: 0 }]);
  };

  const updateSkill = (index, field, value) => {
    const newSkills = [...skills];
    newSkills[index][field] = value;
    setSkills(newSkills);
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addAbility = () => {
    setAbilities([...abilities, { name: '', description: '', type: 'Active', sourceItem: null }]);
    setEditingAbility(abilities.length);
  };

  const updateAbility = (index, field, value) => {
    const newAbilities = [...abilities];
    newAbilities[index][field] = value;
    
    // If this ability is linked to an item, update the item too
    if (newAbilities[index].sourceItem !== null && newAbilities[index].sourceItem !== undefined) {
      const itemIndex = newAbilities[index].sourceItem;
      const newInventory = [...inventory];
      if (newInventory[itemIndex]) {
        // Update the item's effects to match the ability description
        newInventory[itemIndex].effects = newAbilities[index].description;
        setInventory(newInventory);
      }
    }
    
    setAbilities(newAbilities);
  };

  const removeAbility = (index) => {
    const ability = abilities[index];
    
    // If linked to an item, clear the item's effects
    if (ability.sourceItem !== null && ability.sourceItem !== undefined) {
      const itemIndex = ability.sourceItem;
      const newInventory = [...inventory];
      if (newInventory[itemIndex]) {
        newInventory[itemIndex].effects = '';
        setInventory(newInventory);
      }
    }
    
    setAbilities(abilities.filter((_, i) => i !== index));
    if (editingAbility === index) setEditingAbility(null);
  };

  const addItem = () => {
    const newItem = { 
      name: '', 
      appearance: '',
      durability: 100, 
      condition: '', 
      equippable: false, 
      slots: [],
      effects: ''
    };
    setInventory([...inventory, newItem]);
    setEditingItem(inventory.length); // Auto-open edit mode for new item
  };

  const updateItem = (index, field, value) => {
    const newInventory = [...inventory];
    newInventory[index][field] = value;
    
    // If effects changed and this item has a linked ability, update the ability too
    if (field === 'effects') {
      const linkedAbilityIndex = abilities.findIndex(a => a.sourceItem === index);
      if (linkedAbilityIndex !== -1) {
        const newAbilities = [...abilities];
        newAbilities[linkedAbilityIndex].description = value;
        setAbilities(newAbilities);
      } else if (value && value.trim()) {
        // Item has effects but no linked ability - create one
        const itemName = newInventory[index].name || 'Item';
        const newAbility = {
          name: `${itemName} Effect`,
          description: value,
          type: 'Passive',
          sourceItem: index
        };
        setAbilities([...abilities, newAbility]);
      }
    }
    
    // If item name changed and has a linked ability, update ability name
    if (field === 'name') {
      const linkedAbilityIndex = abilities.findIndex(a => a.sourceItem === index);
      if (linkedAbilityIndex !== -1) {
        const newAbilities = [...abilities];
        newAbilities[linkedAbilityIndex].name = `${value} Effect`;
        setAbilities(newAbilities);
      }
    }
    
    setInventory(newInventory);
  };

  const toggleItemSlot = (itemIndex, slot) => {
    const newInventory = [...inventory];
    const item = newInventory[itemIndex];
    if (!item.slots) item.slots = [];
    
    if (item.slots.includes(slot)) {
      item.slots = item.slots.filter(s => s !== slot);
    } else {
      item.slots = [...item.slots, slot];
    }
    setInventory(newInventory);
  };

  const removeItem = (index) => {
    // Check if item is equipped and unequip it first
    Object.keys(equipment).forEach(slot => {
      if (equipment[slot] === index) {
        unequipItem(index);
      }
    });
    
    // Remove any linked abilities
    const newAbilities = abilities.filter(a => a.sourceItem !== index);
    // Update sourceItem indices for abilities linked to items after this one
    const updatedAbilities = newAbilities.map(a => {
      if (a.sourceItem !== null && a.sourceItem !== undefined && a.sourceItem > index) {
        return { ...a, sourceItem: a.sourceItem - 1 };
      }
      return a;
    });
    setAbilities(updatedAbilities);
    
    // Remove any linked consequences
    const newConsequences = consequences.filter(c => c.sourceItem !== index);
    // Update sourceItem indices for consequences linked to items after this one
    const updatedConsequences = newConsequences.map(c => {
      if (c.sourceItem !== null && c.sourceItem !== undefined && c.sourceItem > index) {
        return { ...c, sourceItem: c.sourceItem - 1 };
      }
      return c;
    });
    setConsequences(updatedConsequences);
    
    setInventory(inventory.filter((_, i) => i !== index));
    if (editingItem === index) setEditingItem(null);
  };

  const equipItem = (itemIndex) => {
    const item = inventory[itemIndex];
    console.log('Attempting to equip item:', item);
    console.log('Current equipment state:', equipment);
    
    if (!item.equippable || !item.slots || item.slots.length === 0) {
      console.log('Item is not equippable or has no slots');
      return;
    }
    
    // Add consequence if the item has one defined
    if (item.consequence && item.consequence.name) {
      const newConsequences = [...consequences];
      // Check if this item's consequence already exists
      const existingIndex = newConsequences.findIndex(c => c.sourceItem === itemIndex);
      if (existingIndex === -1) {
        // Add the consequence with a link back to the item
        newConsequences.push({
          ...item.consequence,
          sourceItem: itemIndex
        });
        setConsequences(newConsequences);
      }
    }
    
    // Special handling for accessory items
    if (item.slots.length === 1 && item.slots[0] === 'accessory') {
      // Find the first empty accessory slot
      let targetSlot = null;
      if (equipment.accessory1 === null) targetSlot = 'accessory1';
      else if (equipment.accessory2 === null) targetSlot = 'accessory2';
      else if (equipment.accessory3 === null) targetSlot = 'accessory3';
      
      if (!targetSlot) {
        alert('All accessory slots are occupied. Unequip an accessory first.');
        return;
      }
      
      const newEquipment = {...equipment};
      newEquipment[targetSlot] = itemIndex;
      setEquipment(newEquipment);
      console.log('Equipped to accessory slot:', targetSlot);
      return;
    }
    
    // Handle layering for top and bottom
    const newEquipment = {...equipment};
    const slotsToEquip = [];
    
    for (const slot of item.slots) {
      console.log('Processing slot:', slot);
      console.log('topPrimary value:', equipment.topPrimary);
      console.log('topSecondary value:', equipment.topSecondary);
      
      if (slot === 'top') {
        // Try primary layer first, then secondary
        if (equipment.topPrimary === null || equipment.topPrimary === itemIndex) {
          slotsToEquip.push('topPrimary');
          console.log('Assigning to topPrimary');
        } else if (equipment.topSecondary === null || equipment.topSecondary === itemIndex) {
          slotsToEquip.push('topSecondary');
          console.log('Assigning to topSecondary');
        } else {
          console.log('Both top layers occupied');
          alert('Both top layers are occupied. Unequip a top first.');
          return;
        }
      } else if (slot === 'bottom') {
        // Try primary layer first, then secondary
        if (equipment.bottomPrimary === null || equipment.bottomPrimary === itemIndex) {
          slotsToEquip.push('bottomPrimary');
          console.log('Assigning to bottomPrimary');
        } else if (equipment.bottomSecondary === null || equipment.bottomSecondary === itemIndex) {
          slotsToEquip.push('bottomSecondary');
          console.log('Assigning to bottomSecondary');
        } else {
          console.log('Both bottom layers occupied');
          alert('Both bottom layers are occupied. Unequip bottoms first.');
          return;
        }
      } else {
        // Other slots (head, gloves, etc.)
        if (equipment[slot] === null || equipment[slot] === itemIndex) {
          slotsToEquip.push(slot);
          console.log('Assigning to slot:', slot);
        } else {
          console.log(`Slot ${slot} is occupied`);
          alert(`Cannot equip: ${slot} slot is occupied by another item.`);
          return;
        }
      }
    }
    
    // Equip to all determined slots
    console.log('Final slots to equip:', slotsToEquip);
    slotsToEquip.forEach(slot => {
      newEquipment[slot] = itemIndex;
    });
    setEquipment(newEquipment);
    console.log('Equipment updated successfully');
  };

  const unequipItem = (itemIndex) => {
    const newEquipment = {...equipment};
    Object.keys(newEquipment).forEach(slot => {
      if (newEquipment[slot] === itemIndex) {
        newEquipment[slot] = null;
      }
    });
    setEquipment(newEquipment);
    
    // Remove any consequence linked to this item
    const consequenceIndex = consequences.findIndex(c => c.sourceItem === itemIndex);
    if (consequenceIndex !== -1) {
      const newConsequences = [...consequences];
      newConsequences.splice(consequenceIndex, 1);
      setConsequences(newConsequences);
      // Also remove from active consequences if present
      setActiveConsequences(activeConsequences.filter(i => i !== consequenceIndex));
    }
  };

  const isItemEquipped = (itemIndex) => {
    return Object.values(equipment).includes(itemIndex);
  };

  const getEquipmentSlotLabel = (slot) => {
    const labels = {
      head: 'Head/Hat',
      topPrimary: 'Top (Inner)',
      topSecondary: 'Top (Outer)',
      bottomPrimary: 'Bottom (Inner)',
      bottomSecondary: 'Bottom (Outer)',
      underwear: 'Underwear',
      gloves: 'Gloves',
      socks: 'Socks',
      shoes: 'Shoes',
      leftHand: 'Left Hand',
      rightHand: 'Right Hand',
      accessory1: 'Accessory 1',
      accessory2: 'Accessory 2',
      accessory3: 'Accessory 3'
    };
    return labels[slot] || slot;
  };

  const addResource = () => {
    setResources([...resources, { name: '', tokens: 0 }]);
  };

  const updateResource = (index, field, value) => {
    const newResources = [...resources];
    newResources[index][field] = value;
    setResources(newResources);
  };

  const adjustResourceTokens = (index, amount) => {
    const newResources = [...resources];
    newResources[index].tokens = Math.max(0, newResources[index].tokens + amount);
    setResources(newResources);
  };

  const removeResource = (index) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const addConsequence = () => {
    setConsequences([...consequences, { 
      name: '',
      description: '',
      severity: 'Soft', 
      durationType: 'Rolls',
      durationValue: 1,
      affectedStats: [],
      penalty: -1
    }]);
    setEditingConsequence(consequences.length); // Auto-open edit mode for new consequence
  };

  const updateConsequence = (index, field, value) => {
    const newConsequences = [...consequences];
    newConsequences[index][field] = value;
    setConsequences(newConsequences);
  };

  const toggleConsequenceStat = (index, stat) => {
    const newConsequences = [...consequences];
    const stats = newConsequences[index].affectedStats || [];
    if (stats.includes(stat)) {
      newConsequences[index].affectedStats = stats.filter(s => s !== stat);
    } else {
      newConsequences[index].affectedStats = [...stats, stat];
    }
    setConsequences(newConsequences);
  };

  const removeConsequence = (index) => {
    setConsequences(consequences.filter((_, i) => i !== index));
  };

  const addSession = () => {
    const newSession = {
      name: '',
      date: new Date().toISOString(),
      summary: ''
    };
    setSessions([newSession, ...sessions]);
    setEditingSession(0);
  };

  const updateSession = (index, field, value) => {
    const newSessions = [...sessions];
    newSessions[index][field] = value;
    setSessions(newSessions);
  };

  const removeSession = (index) => {
    setSessions(sessions.filter((_, i) => i !== index));
    if (editingSession === index) setEditingSession(null);
    setExpandedSessions(expandedSessions.filter(i => i !== index));
  };

  const toggleSessionExpanded = (index) => {
    if (expandedSessions.includes(index)) {
      setExpandedSessions(expandedSessions.filter(i => i !== index));
    } else {
      setExpandedSessions([...expandedSessions, index]);
    }
  };

  const generateCharacterSummary = async () => {
    let summary = `CHARACTER SUMMARY\n`;
    summary += `═══════════════════════════════════\n\n`;
    
    // Basic Info
    summary += `📋 BASIC INFORMATION\n`;
    summary += `Name: ${characterName || 'Unnamed Character'}\n`;
    if (appearance) summary += `Appearance: ${appearance}\n`;
    summary += `\n`;
    
    // Stats
    summary += `📊 STATS\n`;
    Object.entries(stats).forEach(([stat, dice]) => {
      summary += `${stat}: ${dice}\n`;
    });
    summary += `\n`;
    
    // Health
    summary += `❤️ HEALTH\n`;
    summary += `Wounds: ${wounds}/${maxWounds}\n`;
    summary += `\n`;
    
    // Skills
    if (skills.length > 0) {
      summary += `🎯 SKILLS\n`;
      skills.forEach(skill => {
        summary += `${skill.name} (${skill.stat}) +${skill.level}\n`;
      });
      summary += `\n`;
    }
    
    // Abilities
    if (abilities.length > 0) {
      summary += `✨ ABILITIES\n`;
      abilities.forEach(ability => {
        summary += `${ability.name} (${ability.type})\n`;
        if (ability.description) summary += `  ${ability.description}\n`;
      });
      summary += `\n`;
    }
    
    // Equipment
    const equippedItems = Object.entries(equipment)
      .filter(([slot, itemIndex]) => itemIndex !== null && inventory[itemIndex])
      .map(([slot, itemIndex]) => ({ slot, item: inventory[itemIndex] }));
    
    if (equippedItems.length > 0) {
      summary += `⚔️ EQUIPPED ITEMS\n`;
      equippedItems.forEach(({ slot, item }) => {
        summary += `${getEquipmentSlotLabel(slot)}: ${item.name}`;
        if (item.effects) summary += ` - ${item.effects}`;
        summary += `\n`;
      });
      summary += `\n`;
    }
    
    // Inventory
    const unequippedItems = inventory.filter((item, index) => !Object.values(equipment).includes(index));
    if (unequippedItems.length > 0) {
      summary += `🎒 INVENTORY\n`;
      unequippedItems.forEach(item => {
        summary += `${item.name} (${item.durability}%)`;
        if (item.condition) summary += ` - ${item.condition}`;
        summary += `\n`;
      });
      summary += `\n`;
    }
    
    // Resources
    if (resources.length > 0) {
      summary += `💎 RESOURCES\n`;
      resources.forEach(resource => {
        summary += `${resource.name}: ${resource.tokens} tokens\n`;
      });
      summary += `\n`;
    }
    
    // Active Consequences
    if (consequences.length > 0) {
      summary += `⚠️ ACTIVE CONSEQUENCES\n`;
      consequences.forEach(consequence => {
        summary += `${consequence.name || 'Unnamed'} (${consequence.severity})`;
        summary += ` - ${consequence.penalty >= 0 ? '+' : ''}${consequence.penalty}`;
        if (consequence.durationType === 'Rolls') {
          summary += ` for ${consequence.durationValue} roll${consequence.durationValue !== 1 ? 's' : ''}`;
        } else if (consequence.durationType === 'Rest') {
          summary += ` until rest`;
        } else {
          summary += ` (Permanent)`;
        }
        if (consequence.affectedStats && consequence.affectedStats.length > 0) {
          summary += ` [${consequence.affectedStats.join(', ')}]`;
        }
        summary += `\n`;
      });
      summary += `\n`;
    }
    
    // Session History with AI Summary
    if (sessions.length > 0) {
      summary += `📖 CAMPAIGN STORY (${sessions.length} sessions)\n`;
      summary += `Generating AI summary...\n`;
      
      setCharacterSummary(summary);
      setShowSummaryDialog(true);
      
      // Generate AI summary of sessions
      try {
        const sessionData = sessions.map(s => `${s.name} (${new Date(s.date).toLocaleDateString()}): ${s.summary}`).join('\n\n');
        
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 500,
            messages: [
              { 
                role: "user", 
                content: `Please write a concise 1-2 paragraph summary of this character's campaign story based on these session notes. Focus on the major events, character development, and current situation:\n\n${sessionData}`
              }
            ]
          })
        });

        const data = await response.json();
        let aiSummary = '';
        for (const block of data.content) {
          if (block.type === 'text') {
            aiSummary = block.text.trim();
            break;
          }
        }
        
        // Replace the "Generating..." text with the actual summary
        summary = summary.replace(`📖 CAMPAIGN STORY (${sessions.length} sessions)\nGenerating AI summary...\n`, 
                                   `📖 CAMPAIGN STORY (${sessions.length} sessions)\n${aiSummary}\n`);
        summary += `\n`;
      } catch (error) {
        summary = summary.replace(`Generating AI summary...\n`, `Failed to generate AI summary. Session list:\n`);
        sessions.slice(0, 3).forEach((session, index) => {
          summary += `${session.name || `Session ${index + 1}`} - ${new Date(session.date).toLocaleDateString()}\n`;
        });
        if (sessions.length > 3) {
          summary += `... and ${sessions.length - 3} more session${sessions.length - 3 !== 1 ? 's' : ''}\n`;
        }
        summary += `\n`;
      }
    }
    
    // Notes
    if (notes) {
      summary += `📝 NOTES\n`;
      summary += `${notes}\n`;
    }
    
    setCharacterSummary(summary);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto bg-slate-800 rounded-lg shadow-2xl p-8 text-white">
        <h1 className="text-4xl font-bold text-center mb-2 text-purple-300">Deep Stories Character Sheet</h1>
        
        {/* Save/Load Buttons */}
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setShowNewCharacterDialog(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
          >
            <PlusCircle size={20} /> New Character
          </button>
          <button
            onClick={() => setShowAICreateDialog(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
          >
            ✨ AI Create Character
          </button>
          <button
            onClick={() => setShowSaveDialog(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
          >
            <Save size={20} /> Save Character
          </button>
          <button
            onClick={() => {
              setShowLoadDialog(true);
              loadCharactersList();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
          >
            <Upload size={20} /> Load Character
          </button>
          <button
            onClick={exportCharacter}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
          >
            📥 Export to File
          </button>
          <button
            onClick={() => setShowImportDialog(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
          >
            📤 Import from File
          </button>
          <button
            onClick={generateCharacterSummary}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
          >
            📋 Character Summary
          </button>
        </div>

        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border-2 border-purple-500">
              <h2 className="text-2xl font-bold text-purple-300 mb-4">Save Character</h2>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2 text-purple-300">Character Name</label>
                <input
                  type="text"
                  value={saveCharacterName}
                  onChange={(e) => setSaveCharacterName(e.target.value)}
                  placeholder={characterName || 'Enter character name...'}
                  className="w-full bg-slate-700 border border-purple-500 rounded px-3 py-2 text-white"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={saveCharacter}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveCharacterName('');
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Load Dialog */}
        {showLoadDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border-2 border-purple-500 max-h-96 overflow-y-auto">
              <h2 className="text-2xl font-bold text-purple-300 mb-4">Load Character</h2>
              {savedCharacters.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No saved characters found.</p>
              ) : (
                <div className="space-y-2">
                  {savedCharacters.map((char) => (
                    <div key={char.name} className="bg-slate-700 rounded p-3 flex items-center gap-3">
                      <div className="w-16 h-16 bg-slate-600 rounded border border-slate-500 overflow-hidden flex-shrink-0">
                        {char.image ? (
                          <img src={char.image} alt={char.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">No Image</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-bold">{char.name}</div>
                        {char.savedAt && (
                          <div className="text-xs text-slate-400">
                            {new Date(char.savedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadCharacter(char.name)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-bold"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteCharacter(char.name)}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowLoadDialog(false)}
                className="w-full mt-4 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Character Summary Dialog */}
        {showSummaryDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg p-6 max-w-4xl w-full border-2 border-purple-500 flex flex-col" style={{maxHeight: '90vh'}}>
              <h2 className="text-2xl font-bold text-purple-300 mb-4">Character Summary</h2>
              <div className="bg-slate-700 rounded p-4 mb-4 overflow-y-auto flex-1">
                <pre className="text-sm text-white whitespace-pre-wrap font-mono">{characterSummary}</pre>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(characterSummary);
                    alert('Character summary copied to clipboard!');
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded"
                >
                  📋 Copy to Clipboard
                </button>
                <button
                  onClick={() => setShowSummaryDialog(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* New Character Confirmation Dialog */}
        {showNewCharacterDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border-2 border-orange-500">
              <h2 className="text-2xl font-bold text-orange-300 mb-4">Create New Character?</h2>
              <p className="text-white mb-6">This will clear all current character data. Any unsaved changes will be lost.</p>
              <div className="flex gap-3">
                <button
                  onClick={newCharacter}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded"
                >
                  Yes, Create New
                </button>
                <button
                  onClick={() => setShowNewCharacterDialog(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Create Character Dialog */}
        {showAICreateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 border-2 border-indigo-500">
              <h2 className="text-2xl font-bold text-indigo-300 mb-4">✨ AI Create Character</h2>
              <p className="text-white mb-4">Describe your character concept and AI will generate stats, skills, abilities, and more!</p>
              
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2 text-indigo-300">Character Description</label>
                <textarea
                  value={aiCharacterPrompt}
                  onChange={(e) => setAICharacterPrompt(e.target.value)}
                  placeholder="e.g., 'A cunning elven rogue with a mysterious past, skilled in stealth and deception' or 'A brave human knight devoted to protecting the innocent' or 'A wise old wizard specializing in fire magic'"
                  className="w-full bg-slate-700 border border-indigo-500 rounded px-3 py-2 text-white placeholder-slate-400"
                  rows="4"
                  disabled={generatingCharacter}
                />
              </div>

              <div className="bg-slate-700 rounded p-3 mb-4 text-sm text-slate-300">
                <div className="font-bold text-indigo-300 mb-1">Examples:</div>
                <div>• "A stealthy assassin with exceptional agility and deadly precision"</div>
                <div>• "A charismatic bard who uses charm and magic to influence others"</div>
                <div>• "A scholarly mage focused on research and arcane knowledge"</div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={createCharacterWithAI}
                  disabled={generatingCharacter}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white font-bold py-2 rounded"
                >
                  {generatingCharacter ? 'Generating Character...' : '✨ Generate Character'}
                </button>
                <button
                  onClick={() => {
                    setShowAICreateDialog(false);
                    setAICharacterPrompt('');
                  }}
                  disabled={generatingCharacter}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 text-white font-bold py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overwrite Character Confirmation Dialog */}
        {showOverwriteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border-2 border-yellow-500">
              <h2 className="text-2xl font-bold text-yellow-300 mb-4">⚠️ Overwrite Character?</h2>
              <p className="text-white mb-6">A character named "<strong>{overwriteCharacterName}</strong>" already exists. Do you want to overwrite it?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => performSave(overwriteCharacterName)}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 rounded"
                >
                  Yes, Overwrite
                </button>
                <button
                  onClick={() => {
                    setShowOverwriteDialog(false);
                    setOverwriteCharacterName('');
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Character Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border-2 border-red-500">
              <h2 className="text-2xl font-bold text-red-300 mb-4">🗑️ Delete Character?</h2>
              <p className="text-white mb-6">Are you sure you want to delete "<strong>{deleteCharacterName}</strong>"? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={performDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeleteCharacterName('');
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Character Dialog */}
        {showImportDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full border-2 border-teal-500 flex flex-col" style={{maxHeight: '90vh'}}>
              <h2 className="text-2xl font-bold text-teal-300 mb-4">📤 Import Character from File</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2 text-teal-300">Select JSON File</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="w-full text-sm bg-slate-700 border border-teal-500 rounded px-3 py-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-teal-600 file:text-white hover:file:bg-teal-700"
                />
              </div>
              
              <div className="mb-4 flex-1 overflow-hidden flex flex-col">
                <label className="block text-sm font-bold mb-2 text-teal-300">Or Paste JSON Data</label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste your character JSON data here..."
                  className="w-full flex-1 bg-slate-700 border border-teal-500 rounded px-3 py-2 text-white placeholder-slate-400 font-mono text-xs"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={importCharacter}
                  disabled={!importText.trim()}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-600 text-white font-bold py-2 rounded"
                >
                  Import Character
                </button>
                <button
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportText('');
                  }}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Character Name and Image */}
        <div className="mb-6 flex gap-4 items-start">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-slate-700 rounded-lg border-2 border-purple-500 overflow-hidden flex items-center justify-center">
              {characterImage && !imageError ? (
                <img 
                  src={characterImage} 
                  alt="Character" 
                  className="w-full h-full object-cover"
                  onLoad={() => setImageError(false)}
                  onError={(e) => {
                    console.error('Image failed to load:', characterImage);
                    setImageError(true);
                  }}
                />
              ) : imageError ? (
                <div className="text-red-400 text-center p-2 text-xs">
                  Upload failed
                </div>
              ) : (
                <div className="text-slate-500 text-center p-2 text-xs">
                  No Image
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setCharacterImage(event.target.result);
                    setImageError(false);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="w-32 mt-2 text-xs bg-slate-700 border border-purple-500 rounded px-2 py-1 text-white file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-purple-600 file:text-white hover:file:bg-purple-700"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Character Name"
              className="w-full text-3xl font-bold bg-slate-700 border-2 border-purple-500 rounded px-4 py-2 text-white placeholder-slate-400 mb-3"
            />
            <div className="bg-slate-700 rounded-lg border-2 border-purple-500 p-3">
              <label className="block text-sm font-bold mb-2 text-purple-300">Appearance</label>
              <textarea
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                placeholder="Describe your character's appearance..."
                className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white placeholder-slate-400"
                rows="2"
              />
            </div>
          </div>
        </div>

        {/* Dice Roller */}
        <div className="mb-6 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg p-6 border-2 border-purple-500">
          <h2 className="text-2xl font-bold mb-4 text-purple-300 flex items-center gap-2">
            <Dices size={28} /> Dice Roller
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-purple-300">Stat</label>
              <select
                value={selectedStat}
                onChange={(e) => {
                  setSelectedStat(e.target.value);
                  setSelectedSkill(null); // Reset skill when stat changes
                }}
                className="w-full bg-slate-700 border border-purple-500 rounded px-3 py-2 text-white"
              >
                {Object.keys(stats).map(stat => (
                  <option key={stat} value={stat}>{stat} ({stats[stat]})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2 text-purple-300">Skill (Optional)</label>
              <select
                value={selectedSkill !== null ? selectedSkill : ''}
                onChange={(e) => setSelectedSkill(e.target.value === '' ? null : parseInt(e.target.value))}
                className="w-full bg-slate-700 border border-purple-500 rounded px-3 py-2 text-white"
              >
                <option value="">No Skill</option>
                {skills
                  .map((skill, index) => ({ skill, index }))
                  .filter(({ skill }) => skill.stat === selectedStat)
                  .map(({ skill, index }) => (
                    <option key={index} value={index}>
                      {skill.name} (+{skill.level})
                    </option>
                  ))
                }
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold mb-2 text-purple-300">Extra Modifier</label>
              <input
                type="number"
                value={modifier}
                onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-700 border border-purple-500 rounded px-3 py-2 text-white text-center"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-purple-300">Current Wounds</label>
              <div className="bg-slate-700 border border-red-500 rounded px-3 py-2 text-center text-red-400 font-bold">
                -{wounds}
              </div>
            </div>
          </div>

          {/* Active Consequences for Current Stat */}
          {consequences.filter(c => c.affectedStats && c.affectedStats.includes(selectedStat)).length > 0 && (
            <div className="mb-4 bg-slate-700 rounded-lg p-3 border border-orange-500">
              <div className="text-sm font-bold text-orange-300 mb-2">Consequences Affecting {selectedStat}</div>
              <div className="space-y-2">
                {consequences.map((consequence, index) => {
                  if (!consequence.affectedStats || !consequence.affectedStats.includes(selectedStat)) return null;
                  return (
                    <label key={index} className="flex items-center gap-3 cursor-pointer hover:bg-slate-600 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={activeConsequences.includes(index)}
                        onChange={() => {
                          if (activeConsequences.includes(index)) {
                            setActiveConsequences(activeConsequences.filter(i => i !== index));
                          } else {
                            setActiveConsequences([...activeConsequences, index]);
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">
                          {consequence.name || 'Unnamed Consequence'} 
                          <span className="ml-2 text-orange-400">{consequence.penalty >= 0 ? '+' : ''}{consequence.penalty}</span>
                        </div>
                        {consequence.description && (
                          <div className="text-xs text-slate-400 italic mt-1">{consequence.description}</div>
                        )}
                        <div className="text-xs text-slate-300 mt-1">
                          {consequence.durationType === 'Rolls' && `${consequence.durationValue} roll${consequence.durationValue !== 1 ? 's' : ''} remaining`}
                          {consequence.durationType === 'Rest' && 'Until rest/heal'}
                          {consequence.durationType === 'Permanent' && 'Permanent'}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={performRoll}
            disabled={showPushOption}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg text-xl transition-colors flex items-center justify-center gap-2"
          >
            <Dices size={24} /> Roll {stats[selectedStat]}
          </button>

          {/* Current Roll Display */}
          {currentRoll && (
            <div className="mt-4 bg-slate-700 rounded-lg p-4 border-2 border-yellow-500">
              <div className="text-center mb-3">
                <div className="text-sm text-purple-300 mb-1">
                  {currentRoll.stat} Roll
                  {currentRoll.skill && <span className="text-yellow-400"> • {currentRoll.skill}</span>}
                </div>
                <div className="text-5xl font-bold text-yellow-400 mb-2">{currentRoll.finalTotal}</div>
                <div className="text-sm text-slate-300">
                  {currentRoll.rolls.join(' + ')}
                  {currentRoll.exploded && <span className="text-yellow-400 ml-2">💥 EXPLODED!</span>}
                  {currentRoll.skillBonus > 0 && ` +${currentRoll.skillBonus} (skill)`}
                  {currentRoll.modifier !== 0 && ` ${currentRoll.modifier >= 0 ? '+' : ''}${currentRoll.modifier}`}
                  {currentRoll.consequencePenalty !== 0 && ` ${currentRoll.consequencePenalty >= 0 ? '+' : ''}${currentRoll.consequencePenalty} (consequences)`}
                  {currentRoll.wounds > 0 && ` -${currentRoll.wounds} (wounds)`}
                  {' = '}{currentRoll.finalTotal}
                </div>
              </div>
              
              {showPushOption && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      acceptRoll();
                      decrementConsequences();
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded"
                  >
                    Accept Roll
                  </button>
                  <button
                    onClick={pushRoll}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded"
                  >
                    Push Roll (Add Consequence!)
                  </button>
                </div>
              )}
              
              {/* Consequence Usage Confirmation */}
              {showPushOption && currentRoll.affectedConsequences && currentRoll.affectedConsequences.length > 0 && (
                <div className="mt-3 bg-orange-900 bg-opacity-50 rounded p-3 border border-orange-500">
                  <div className="text-sm font-bold text-orange-300 mb-2">
                    This roll affects {currentRoll.affectedConsequences.length} consequence{currentRoll.affectedConsequences.length !== 1 ? 's' : ''}:
                  </div>
                  <div className="space-y-1 text-xs text-orange-200">
                    {currentRoll.affectedConsequences.map(i => {
                      const c = consequences[i];
                      return (
                        <div key={i}>
                          • <span className="font-bold">{c.name || 'Unnamed'}</span> - {c.durationValue} roll{c.durationValue !== 1 ? 's' : ''} remaining
                          {c.durationValue === 1 && <span className="text-red-400 ml-1">(will be removed)</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs text-orange-300 mt-2 italic">
                    Accepting this roll will use 1 roll from each consequence above.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Roll History */}
          {rollHistory.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-bold text-purple-300">Roll History</div>
                <button
                  onClick={() => setRollHistory([])}
                  className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  Clear History
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {rollHistory.map((roll, index) => (
                  <div key={index} className={`bg-slate-700 rounded p-3 text-sm ${roll.pushed ? 'border-l-4 border-red-500' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-purple-300">{roll.stat}</span>
                        {roll.skill && <span className="text-yellow-400 ml-2">• {roll.skill}</span>}
                        <span className="text-slate-400 ml-2">{roll.timestamp}</span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-400">{roll.finalTotal}</div>
                    </div>
                    <div className="text-slate-300 mt-1">
                      Main: {roll.rolls.join(' + ')} = {roll.mainRoll}
                      {roll.exploded && <span className="text-yellow-400 ml-1">💥</span>}
                      {roll.pushed && (
                        <>
                          <br />
                          <span className="text-red-400">Push: {roll.pushedRolls.join(' + ')} = {roll.pushedRoll}</span>
                          {roll.pushedExploded && <span className="text-yellow-400 ml-1">💥</span>}
                        </>
                      )}
                      <br />
                      <span className="text-xs">
                        ({roll.mainRoll}
                        {roll.pushed && ` + ${roll.pushedRoll}`}
                        {roll.skillBonus > 0 && ` +${roll.skillBonus}`}
                        {roll.modifier !== 0 && ` ${roll.modifier >= 0 ? '+' : ''}${roll.modifier}`}
                        {roll.consequencePenalty !== 0 && ` ${roll.consequencePenalty >= 0 ? '+' : ''}${roll.consequencePenalty}`}
                        {roll.wounds > 0 && ` -${roll.wounds}`})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-3 text-purple-300">Stats</h2>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(stats).map(([stat, dice]) => (
              <div key={stat} className="bg-slate-700 rounded p-3">
                <div className="font-bold text-purple-300 mb-1">{stat}</div>
                <select
                  value={dice}
                  onChange={(e) => setStats({...stats, [stat]: e.target.value})}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white"
                >
                  {diceOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Wounds */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-3 text-purple-300">Wounds</h2>
          <div className="bg-slate-700 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <button onClick={() => setWounds(Math.max(0, wounds - 1))} className="bg-red-600 hover:bg-red-700 p-2 rounded">
                  <Minus size={20} />
                </button>
                <div className="text-2xl font-bold">
                  {wounds} / <input type="number" value={maxWounds} onChange={(e) => setMaxWounds(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 bg-slate-600 border border-slate-500 rounded px-2 text-center" />
                </div>
                <button onClick={() => setWounds(Math.min(maxWounds, wounds + 1))} className="bg-red-600 hover:bg-red-700 p-2 rounded">
                  <Plus size={20} />
                </button>
              </div>
              <div className="text-lg">
                Roll Penalty: <span className="font-bold text-red-400">-{wounds}</span>
              </div>
            </div>
            <div className="flex gap-1">
              {[...Array(maxWounds)].map((_, i) => (
                <div key={i} className={`flex-1 h-6 rounded ${i < wounds ? 'bg-red-600' : 'bg-slate-600'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-bold text-purple-300">Skills</h2>
            <button onClick={addSkill} className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded flex items-center gap-1">
              <PlusCircle size={16} /> Add Skill
            </button>
          </div>
          <div className="space-y-2">
            {skills.map((skill, index) => (
              <div key={index} className="bg-slate-700 rounded p-3 flex items-center gap-3">
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => updateSkill(index, 'name', e.target.value)}
                  placeholder="Skill Name"
                  className="flex-1 bg-slate-600 border border-slate-500 rounded px-3 py-1 text-white placeholder-slate-400"
                />
                <select
                  value={skill.stat}
                  onChange={(e) => updateSkill(index, 'stat', e.target.value)}
                  className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white"
                >
                  {Object.keys(stats).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-purple-300">+</span>
                  <input
                    type="number"
                    value={skill.level}
                    onChange={(e) => updateSkill(index, 'level', parseInt(e.target.value) || 0)}
                    className="w-16 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-center text-white"
                  />
                </div>
                <button onClick={() => removeSkill(index)} className="text-red-400 hover:text-red-300">
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Abilities */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-bold text-purple-300">Abilities</h2>
            <button onClick={addAbility} className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded flex items-center gap-1">
              <PlusCircle size={16} /> Add Ability
            </button>
          </div>
          <div className="space-y-2">
            {abilities.map((ability, index) => (
              <div key={index}>
                {editingAbility === index ? (
                  // Edit Mode
                  <div className="bg-slate-700 rounded p-3 border-l-4 border-blue-500">
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="text"
                        value={ability.name}
                        onChange={(e) => updateAbility(index, 'name', e.target.value)}
                        placeholder="Ability Name"
                        className="flex-1 bg-slate-600 border border-slate-500 rounded px-3 py-1 text-white placeholder-slate-400 font-bold"
                        disabled={ability.sourceItem !== null && ability.sourceItem !== undefined}
                      />
                      <select
                        value={ability.type}
                        onChange={(e) => updateAbility(index, 'type', e.target.value)}
                        className="bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white"
                      >
                        <option>Active</option>
                        <option>Passive</option>
                      </select>
                    </div>
                    <textarea
                      value={ability.description}
                      onChange={(e) => updateAbility(index, 'description', e.target.value)}
                      placeholder="Description / Effect"
                      className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-1 text-white placeholder-slate-400 mb-2"
                      rows="2"
                    />
                    {ability.sourceItem !== null && ability.sourceItem !== undefined && (
                      <div className="text-xs text-blue-400 mb-2">
                        🔗 Linked to item: {inventory[ability.sourceItem]?.name || 'Unknown'}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingAbility(null)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-bold"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => removeAbility(index)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="bg-slate-700 rounded p-3 hover:bg-slate-600 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-bold text-white">
                          {ability.name || 'Unnamed Ability'}
                          <span className="ml-2 text-xs text-slate-400">({ability.type})</span>
                          {ability.sourceItem !== null && ability.sourceItem !== undefined && (
                            <span className="ml-2 text-xs text-blue-400">🔗 from {inventory[ability.sourceItem]?.name}</span>
                          )}
                        </div>
                        {ability.description && (
                          <div className="text-sm text-slate-300 mt-1">{ability.description}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingAbility(index)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeAbility(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-bold text-purple-300">Resources</h2>
            <button onClick={addResource} className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded flex items-center gap-1">
              <PlusCircle size={16} /> Add Resource
            </button>
          </div>
          <div className="space-y-2">
            {resources.map((resource, index) => (
              <div key={index} className="bg-slate-700 rounded p-3 flex items-center gap-3">
                <input
                  type="text"
                  value={resource.name}
                  onChange={(e) => updateResource(index, 'name', e.target.value)}
                  placeholder="Resource Name"
                  className="flex-1 bg-slate-600 border border-slate-500 rounded px-3 py-1 text-white placeholder-slate-400"
                />
                <div className="flex items-center gap-2">
                  <button onClick={() => adjustResourceTokens(index, -1)} className="bg-slate-600 hover:bg-slate-500 p-1 rounded">
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    value={resource.tokens}
                    onChange={(e) => updateResource(index, 'tokens', Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-center text-white font-bold"
                  />
                  <span className="text-slate-400">tokens</span>
                  <button onClick={() => adjustResourceTokens(index, 1)} className="bg-slate-600 hover:bg-slate-500 p-1 rounded">
                    <Plus size={16} />
                  </button>
                </div>
                <button onClick={() => removeResource(index)} className="text-red-400 hover:text-red-300">
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-3 text-purple-300">Equipment</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Ensure all slots are displayed */}
            {['head', 'topPrimary', 'topSecondary', 'bottomPrimary', 'bottomSecondary', 'underwear', 'gloves', 'socks', 'shoes', 'leftHand', 'rightHand', 'accessory1', 'accessory2', 'accessory3'].map(slot => (
              <div key={slot} className="bg-slate-700 rounded p-3">
                <div className="text-xs font-bold text-purple-300 mb-2">{getEquipmentSlotLabel(slot)}</div>
                {equipment[slot] !== null && inventory[equipment[slot]] ? (
                  <div className="bg-slate-600 rounded p-2">
                    <div className="font-bold text-white text-sm mb-1">{inventory[equipment[slot]].name}</div>
                    <div className="text-xs text-slate-300 mb-2">{inventory[equipment[slot]].durability}%</div>
                    {inventory[equipment[slot]].effects && (
                      <div className="text-xs text-green-400 italic mb-2 border-t border-slate-500 pt-2">
                        {inventory[equipment[slot]].effects}
                      </div>
                    )}
                    <button
                      onClick={() => unequipItem(equipment[slot])}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                    >
                      Unequip
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-600 rounded p-2 text-slate-400 text-xs italic text-center">
                    Empty
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Inventory */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-bold text-purple-300">Inventory</h2>
            <button onClick={addItem} className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded flex items-center gap-1">
              <PlusCircle size={16} /> Add Item
            </button>
          </div>
          <div className="space-y-2">
            {inventory.map((item, index) => (
              <div key={index}>
                {editingItem === index ? (
                  // Edit Mode
                  <div className="bg-slate-700 rounded p-4 border-l-4 border-purple-500">
                    <div className="mb-3">
                      <label className="block text-xs font-bold mb-1 text-purple-300">Item Name</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        placeholder="Item Name"
                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white placeholder-slate-400"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-bold mb-1 text-purple-300">Appearance</label>
                      <textarea
                        value={item.appearance || ''}
                        onChange={(e) => updateItem(index, 'appearance', e.target.value)}
                        placeholder="Describe what this item looks like..."
                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white placeholder-slate-400"
                        rows="2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-bold mb-1 text-purple-300">Durability</label>
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="number"
                            value={item.durability}
                            onChange={(e) => updateItem(index, 'durability', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                            className="w-20 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-center text-white"
                          />
                          <span className="text-slate-400">%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={item.durability}
                          onChange={(e) => updateItem(index, 'durability', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold mb-1 text-purple-300">Equippable</label>
                        <label className="flex items-center gap-2 cursor-pointer bg-slate-600 rounded px-3 py-1">
                          <input
                            type="checkbox"
                            checked={item.equippable || false}
                            onChange={(e) => updateItem(index, 'equippable', e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-white">{item.equippable ? 'Yes' : 'No'}</span>
                        </label>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-bold mb-1 text-purple-300">Condition / Notes</label>
                      <input
                        type="text"
                        value={item.condition}
                        onChange={(e) => updateItem(index, 'condition', e.target.value)}
                        placeholder="Condition / Notes"
                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-1 text-white placeholder-slate-400"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-bold mb-1 text-purple-300">Effects / Abilities</label>
                      <textarea
                        value={item.effects || ''}
                        onChange={(e) => updateItem(index, 'effects', e.target.value)}
                        placeholder="Describe any special effects, abilities, or bonuses this item provides..."
                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white placeholder-slate-400"
                        rows="3"
                      />
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-orange-300">Negative Consequence (Optional)</label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.consequence !== undefined && item.consequence !== null}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateItem(index, 'consequence', {
                                  name: '',
                                  description: '',
                                  severity: 'Permanent',
                                  durationType: 'Permanent',
                                  durationValue: 1,
                                  affectedStats: [],
                                  penalty: -1
                                });
                              } else {
                                updateItem(index, 'consequence', null);
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-xs text-white">Add consequence when equipped</span>
                        </label>
                      </div>
                      
                      {item.consequence && (
                        <div className="bg-slate-700 rounded p-3 border border-orange-500 space-y-2">
                          <input
                            type="text"
                            value={item.consequence.name || ''}
                            onChange={(e) => {
                              const newConsequence = {...item.consequence, name: e.target.value};
                              updateItem(index, 'consequence', newConsequence);
                            }}
                            placeholder="Consequence name (e.g., 'Heavy Armor Fatigue')"
                            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm placeholder-slate-400"
                          />
                          
                          <textarea
                            value={item.consequence.description || ''}
                            onChange={(e) => {
                              const newConsequence = {...item.consequence, description: e.target.value};
                              updateItem(index, 'consequence', newConsequence);
                            }}
                            placeholder="Description of the negative effect..."
                            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm placeholder-slate-400"
                            rows="2"
                          />
                          
                          <div className="bg-slate-600 rounded p-2">
                            <div className="text-xs text-orange-300 mb-1">
                              ⚠️ Item consequences are permanent while equipped and removed when unequipped
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs text-purple-300 mb-1">Penalty</label>
                            <input
                              type="number"
                              value={item.consequence.penalty}
                              onChange={(e) => {
                                const newConsequence = {...item.consequence, penalty: parseInt(e.target.value) || 0};
                                updateItem(index, 'consequence', newConsequence);
                              }}
                              className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-xs text-center"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-purple-300 mb-1">Affected Stats</label>
                            <div className="flex flex-wrap gap-1">
                              {Object.keys(stats).map(stat => (
                                <button
                                  key={stat}
                                  onClick={() => {
                                    const currentStats = item.consequence.affectedStats || [];
                                    const newStats = currentStats.includes(stat)
                                      ? currentStats.filter(s => s !== stat)
                                      : [...currentStats, stat];
                                    const newConsequence = {...item.consequence, affectedStats: newStats};
                                    updateItem(index, 'consequence', newConsequence);
                                  }}
                                  className={`px-2 py-0.5 rounded text-xs font-bold ${
                                    (item.consequence.affectedStats || []).includes(stat)
                                      ? 'bg-orange-600 text-white'
                                      : 'bg-slate-600 text-slate-300'
                                  }`}
                                >
                                  {stat}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {item.equippable && (
                      <div className="mb-3">
                        <label className="block text-xs font-bold mb-2 text-purple-300">Equipment Slots (Select all that apply)</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {['head', 'top', 'bottom', 'underwear', 'gloves', 'socks', 'shoes', 'leftHand', 'rightHand', 'accessory'].map(slot => (
                            <button
                              key={slot}
                              onClick={() => toggleItemSlot(index, slot)}
                              className={`px-2 py-1 rounded text-xs font-bold transition-colors ${
                                item.slots && item.slots.includes(slot)
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                              }`}
                            >
                              {slot === 'leftHand' ? 'Left Hand' : 
                               slot === 'rightHand' ? 'Right Hand' : 
                               slot === 'accessory' ? 'Accessory' :
                               slot.charAt(0).toUpperCase() + slot.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem(null)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-bold"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => removeItem(index)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="bg-slate-700 rounded p-3 hover:bg-slate-600 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-bold text-white">{item.name || 'Unnamed Item'}</div>
                        {item.appearance && (
                          <div className="text-xs text-slate-400 italic mt-1 mb-1">{item.appearance}</div>
                        )}
                        <div className="text-sm text-slate-300 flex items-center gap-2">
                          <span>Durability: {item.durability}%</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => updateItem(index, 'durability', Math.max(0, item.durability - 10))}
                              className="bg-red-600 hover:bg-red-700 text-white px-1 rounded text-xs"
                              title="Damage -10%"
                            >
                              -10
                            </button>
                            <button
                              onClick={() => updateItem(index, 'durability', Math.max(0, item.durability - 1))}
                              className="bg-red-700 hover:bg-red-800 text-white px-1 rounded text-xs"
                              title="Damage -1%"
                            >
                              -1
                            </button>
                            <button
                              onClick={() => updateItem(index, 'durability', Math.min(100, item.durability + 1))}
                              className="bg-green-700 hover:bg-green-800 text-white px-1 rounded text-xs"
                              title="Repair +1%"
                            >
                              +1
                            </button>
                            <button
                              onClick={() => updateItem(index, 'durability', Math.min(100, item.durability + 10))}
                              className="bg-green-600 hover:bg-green-700 text-white px-1 rounded text-xs"
                              title="Repair +10%"
                            >
                              +10
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-slate-300">
                          {item.condition && `${item.condition}`}
                          {item.equippable && item.slots && item.slots.length > 0 && (
                            <span className="text-purple-300"> • Slots: {item.slots.map(s => getEquipmentSlotLabel(s)).join(', ')}</span>
                          )}
                        </div>
                        {item.effects && (
                          <div className="text-sm text-green-400 italic mt-1 border-t border-slate-600 pt-1">
                            {item.effects}
                          </div>
                        )}
                        {item.consequence && item.consequence.name && (
                          <div className="text-sm text-orange-400 italic mt-1 border-t border-slate-600 pt-1">
                            ⚠️ {item.consequence.name}: {item.consequence.penalty >= 0 ? '+' : ''}{item.consequence.penalty}
                            {item.consequence.affectedStats && item.consequence.affectedStats.length > 0 && 
                              ` to ${item.consequence.affectedStats.join(', ')}`}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {item.equippable && item.slots && item.slots.length > 0 && (
                          <button
                            onClick={() => isItemEquipped(index) ? unequipItem(index) : equipItem(index)}
                            className={`px-3 py-1 rounded text-sm font-bold ${
                              isItemEquipped(index)
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {isItemEquipped(index) ? 'Unequip' : 'Equip'}
                          </button>
                        )}
                        <button
                          onClick={() => setEditingItem(index)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Consequences */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-bold text-purple-300">Consequences</h2>
            <button onClick={addConsequence} className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded flex items-center gap-1">
              <PlusCircle size={16} /> Add Consequence
            </button>
          </div>
          <div className="space-y-3">
            {consequences.map((consequence, index) => (
              <div key={index}>
                {editingConsequence === index ? (
                  // Edit Mode
                  <div className="bg-slate-700 rounded p-4 border-l-4 border-orange-500">
                    <div className="mb-3">
                      <label className="block text-xs font-bold mb-1 text-purple-300">Consequence Name</label>
                      <input
                        type="text"
                        value={consequence.name}
                        onChange={(e) => updateConsequence(index, 'name', e.target.value)}
                        placeholder="e.g., Nervous Strain, Broken Arm, Lucky Break"
                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white placeholder-slate-400"
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-xs font-bold mb-1 text-purple-300">Description</label>
                      <textarea
                        value={consequence.description}
                        onChange={(e) => updateConsequence(index, 'description', e.target.value)}
                        placeholder="Describe what happened and the ongoing effect..."
                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white placeholder-slate-400"
                        rows="2"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-bold mb-1 text-purple-300">Severity</label>
                        <select
                          value={consequence.severity}
                          onChange={(e) => updateConsequence(index, 'severity', e.target.value)}
                          className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm"
                        >
                          <option>Very Soft (1)</option>
                          <option>Soft (4)</option>
                          <option>Moderate (8)</option>
                          <option>Harsh (12)</option>
                          <option>Dangerous (16)</option>
                          <option>Extreme (20+)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold mb-1 text-purple-300">Duration Type</label>
                        <select
                          value={consequence.durationType}
                          onChange={(e) => updateConsequence(index, 'durationType', e.target.value)}
                          className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm"
                        >
                          <option>Rolls</option>
                          <option>Rest</option>
                          <option>Permanent</option>
                        </select>
                      </div>
                      
                      {consequence.durationType === 'Rolls' && (
                        <div>
                          <label className="block text-xs font-bold mb-1 text-purple-300">Number of Rolls</label>
                          <input
                            type="number"
                            value={consequence.durationValue}
                            onChange={(e) => updateConsequence(index, 'durationValue', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm text-center"
                          />
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-xs font-bold mb-1 text-purple-300">Penalty/Bonus</label>
                        <input
                          type="number"
                          value={consequence.penalty}
                          onChange={(e) => updateConsequence(index, 'penalty', parseInt(e.target.value) || 0)}
                          className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-white text-sm text-center"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="block text-xs font-bold mb-2 text-purple-300">Affected Stats</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(stats).map(stat => (
                          <button
                            key={stat}
                            onClick={() => toggleConsequenceStat(index, stat)}
                            className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                              consequence.affectedStats && consequence.affectedStats.includes(stat)
                                ? 'bg-orange-600 text-white'
                                : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                            }`}
                          >
                            {stat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingConsequence(null)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-bold"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => removeConsequence(index)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="bg-slate-700 rounded p-4 border-l-4 border-orange-500 hover:bg-slate-600 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-bold text-white text-lg mb-1">
                          {consequence.name || 'Unnamed Consequence'}
                        </div>
                        {consequence.description && (
                          <div className="text-sm text-slate-300 italic mb-2">
                            {consequence.description}
                          </div>
                        )}
                        <div className="text-sm text-slate-300 space-y-1">
                          <div>
                            <span className="text-purple-300 font-semibold">Severity:</span> {consequence.severity}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-purple-300 font-semibold">Duration:</span>
                            {consequence.durationType === 'Rolls' && (
                              <>
                                <button
                                  onClick={() => {
                                    const newConsequences = [...consequences];
                                    newConsequences[index].durationValue = Math.max(0, consequence.durationValue - 1);
                                    setConsequences(newConsequences);
                                  }}
                                  className="bg-red-600 hover:bg-red-700 text-white px-1 rounded text-xs"
                                >
                                  -1
                                </button>
                                <span>{consequence.durationValue} roll{consequence.durationValue !== 1 ? 's' : ''}</span>
                                <button
                                  onClick={() => {
                                    const newConsequences = [...consequences];
                                    newConsequences[index].durationValue = consequence.durationValue + 1;
                                    setConsequences(newConsequences);
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white px-1 rounded text-xs"
                                >
                                  +1
                                </button>
                                <button
                                  onClick={() => {
                                    const newConsequences = [...consequences];
                                    newConsequences[index].durationType = 'Rest';
                                    setConsequences(newConsequences);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-xs ml-2"
                                  title="Change to Rest"
                                >
                                  → Rest
                                </button>
                              </>
                            )}
                            {consequence.durationType === 'Rest' && (
                              <>
                                <span>Until rest/heal</span>
                                <button
                                  onClick={() => {
                                    const newConsequences = [...consequences];
                                    newConsequences[index].durationType = 'Permanent';
                                    setConsequences(newConsequences);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-xs ml-2"
                                  title="Change to Permanent"
                                >
                                  → Permanent
                                </button>
                              </>
                            )}
                            {consequence.durationType === 'Permanent' && (
                              <>
                                <span>Permanent</span>
                                <button
                                  onClick={() => {
                                    const newConsequences = [...consequences];
                                    newConsequences[index].durationType = 'Rolls';
                                    newConsequences[index].durationValue = 1;
                                    setConsequences(newConsequences);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-xs ml-2"
                                  title="Change to Rolls"
                                >
                                  → Rolls
                                </button>
                              </>
                            )}
                          </div>
                          <div>
                            <span className="text-purple-300 font-semibold">Effect:</span>{' '}
                            <span className={consequence.penalty < 0 ? 'text-red-400' : 'text-green-400'}>
                              {consequence.penalty >= 0 ? '+' : ''}{consequence.penalty}
                            </span>
                          </div>
                          {consequence.affectedStats && consequence.affectedStats.length > 0 && (
                            <div>
                              <span className="text-purple-300 font-semibold">Affects:</span>{' '}
                              {consequence.affectedStats.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingConsequence(index)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm font-bold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeConsequence(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Session Notes */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-bold text-purple-300">Session Notes</h2>
            <button onClick={addSession} className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded flex items-center gap-1">
              <PlusCircle size={16} /> Add Session
            </button>
          </div>
          <div className="space-y-3">
            {sessions.map((session, index) => (
              <div key={index}>
                {editingSession === index ? (
                  // Edit Mode
                  <div className="bg-slate-700 rounded p-4 border-l-4 border-blue-500">
                    <div className="mb-3">
                      <label className="block text-xs font-bold mb-1 text-purple-300">Session Name</label>
                      <input
                        type="text"
                        value={session.name}
                        onChange={(e) => updateSession(index, 'name', e.target.value)}
                        placeholder="e.g., Session 1: The Tavern Mystery"
                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white placeholder-slate-400"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-bold mb-1 text-purple-300">Date</label>
                      <input
                        type="date"
                        value={session.date ? new Date(session.date).toISOString().split('T')[0] : ''}
                        onChange={(e) => updateSession(index, 'date', new Date(e.target.value).toISOString())}
                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-bold mb-1 text-purple-300">Session Summary</label>
                      <textarea
                        value={session.summary}
                        onChange={(e) => updateSession(index, 'summary', e.target.value)}
                        placeholder="Write a summary of what happened in this session..."
                        className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2 text-white placeholder-slate-400"
                        rows="5"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingSession(null)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-bold"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => removeSession(index)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-bold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="bg-slate-700 rounded border-l-4 border-blue-500">
                    <div 
                      className="p-4 hover:bg-slate-600 transition-colors cursor-pointer flex items-center justify-between"
                      onClick={() => toggleSessionExpanded(index)}
                    >
                      <div className="flex-1">
                        <div className="font-bold text-white text-lg">
                          {session.name || 'Unnamed Session'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(session.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-sm">
                          {expandedSessions.includes(index) ? '▼' : '▶'}
                        </span>
                      </div>
                    </div>
                    
                    {expandedSessions.includes(index) && (
                      <div className="px-4 pb-4 border-t border-slate-600">
                        {session.summary && (
                          <div className="text-sm text-slate-300 mt-3 whitespace-pre-wrap">
                            {session.summary}
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSession(index);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSession(index);
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <h2 className="text-2xl font-bold mb-3 text-purple-300">Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Character background, session notes, lore, etc."
            className="w-full bg-slate-700 border border-slate-500 rounded px-4 py-3 text-white placeholder-slate-400"
            rows="6"
          />
        </div>
      </div>
    </div>
  );
}