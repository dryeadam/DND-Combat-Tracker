// Game state
let gameState = {
    chars: [],   // Array of chars
    currentTurn: 0,   // Who's turn it is rn
    round: 1,   // Current round
};

let editingCharId = null;

// Initialize - UNCOMMENTED AND SIMPLIFIED
function init() {
    updateDisplay();
    createPlayerLink();
    // syncToPlayers(); // Uncomment if you want to use localStorage sync
    // setInterval(updateConditions, 1000); // Uncomment if you want condition updates
}

// Sync data to player display
function syncToPlayers() {
    const syncData = {
        chars: gameState.chars,
        currentTurn: gameState.currentTurn,
        round: gameState.round,
        notes: gameState.notes,
        timestamp: Date.now()
    };
}

function addChar() { // Grab all of the info from the form-panel for our uses here
    const name = document.getElementById('charName').value.trim();
    const initiative = parseInt(document.getElementById('charInitiative').value);
    const stats = document.getElementById('statsURL').value.trim();
    const portrait = document.getElementById('portraitURL').value.trim();
    const hasLegendarySaves = document.getElementById('hasLegendarySaves').checked;

    // Error handling
    if (!name || isNaN(initiative)) {
        alert('Please enter a name and initiative value');
        return;
    }

    if (editingCharId) {
        // Update existing character
        const char = gameState.chars.find(c => c.id === editingCharId);
        if (char) {
            char.name = name;
            char.initiative = initiative;
            char.stats = stats || null;
            char.portrait = portrait || null;
            char.legendarySaves = hasLegendarySaves ? { max: 3, current: 3, used: [false, false, false] } : null;
        }
        editingCharId = null;
        document.querySelector('.form-panel .btn-secondary').textContent = 'Add Character';
    } else {
        // Add new character
        const char = {
            id: Date.now(),
            name,
            initiative,
            stats: stats || null,
            portrait: portrait || null,
            conditions: [],
            legendarySaves: hasLegendarySaves ? { max: 3, current: 3, used: [false, false, false] } : null
        };

        gameState.chars.push(char);
    }
    
    // Sort by initiative (highest first)
    gameState.chars.sort((a, b) => b.initiative - a.initiative);

    // Clear form for future use
    document.getElementById('charName').value = '';
    document.getElementById('charInitiative').value = '';
    document.getElementById('statsURL').value = '';
    document.getElementById('portraitURL').value = '';
    document.getElementById('hasLegendarySaves').checked = false;

    updateDisplay();
    syncToPlayers();
}

function removeChar(charId) {
    if (confirm('Are you sure you want to remove this character?')) {
        const charIndex = gameState.chars.findIndex(c => c.id === charId);
        if (charIndex !== -1) {
            gameState.chars.splice(charIndex, 1);
            
            // Adjust current turn if necessary
            if (gameState.currentTurn >= gameState.chars.length) {
                gameState.currentTurn = 0;
            }
            
            updateDisplay();
            syncToPlayers();
        }
    }
}

function nextTurn() {
    if (gameState.chars.length === 0) return;
    
    gameState.currentTurn++;
    if (gameState.currentTurn >= gameState.chars.length) {
        gameState.currentTurn = 0;
        gameState.round++;
    }
    
    updateDisplay();
    syncToPlayers();
}

function previousTurn() {
    if (gameState.chars.length === 0) return;
    
    gameState.currentTurn--;
    if (gameState.currentTurn < 0) {
        gameState.currentTurn = gameState.chars.length - 1;
        gameState.round = Math.max(1, gameState.round - 1);
    }
    
    updateDisplay();
    syncToPlayers();
}

function updateNotes() {
    gameState.notes = document.getElementById('combatNotes').value;
    syncToPlayers();
}

function updateDisplay() {
    // Update round number
    document.getElementById('roundNumber').textContent = gameState.round;
    
    // Update current turn display
    const currentTurnDisplay = document.getElementById('currentTurnDisplay');
    if (gameState.chars.length === 0) {
        currentTurnDisplay.textContent = 'No characters added yet';
    } else {
        const currentChar = gameState.chars[gameState.currentTurn];
        currentTurnDisplay.textContent = `Current Turn: ${currentChar.name}`;
    }
    
    // Update character list
    const characterList = document.getElementById('characterList');
    characterList.innerHTML = '';

    gameState.chars.forEach((char, index) => {
        const charDiv = document.createElement('div');
        charDiv.className = `character-item ${index === gameState.currentTurn ? 'active-turn' : ''}`;
        
        // Create character info container
        const charInfo = document.createElement('div');
        charInfo.className = 'character-info';
        
        // Portrait container
        const portraitContainer = document.createElement('div');
        portraitContainer.className = 'character-portrait';
        
        if (char.portrait) {
            const portraitImg = document.createElement('img');
            portraitImg.src = char.portrait;
            portraitImg.alt = `${char.name} portrait`;
            
            // If there's no image, fallback to first initial
            portraitImg.onerror = function() {
                this.style.display = 'none';
                const fallback = document.createElement('div');
                fallback.className = 'portrait-fallback';
                fallback.textContent = char.name.charAt(0).toUpperCase();
                portraitContainer.appendChild(fallback);
            };
            
            portraitContainer.appendChild(portraitImg);
        } else {
            // Create fallback even when no portrait URL is provided
            const fallback = document.createElement('div');
            fallback.className = 'portrait-fallback';
            fallback.textContent = char.name.charAt(0).toUpperCase();
            portraitContainer.appendChild(fallback);
        }
        
        // Character details container
        const charDetailsContainer = document.createElement('div');
        charDetailsContainer.className = 'character-details-container';
        
        const charName = document.createElement('div');
        charName.className = 'character-name';
        charName.textContent = char.name;
        charDetailsContainer.appendChild(charName);
        
        const charDetails = document.createElement('div');
        charDetails.className = 'character-details';
        charDetails.textContent = `Initiative: ${char.initiative}${char.legendarySaves ? ` | Legendary Resistances: ${char.legendarySaves.current}/${char.legendarySaves.max}` : ''}`;
        charDetailsContainer.appendChild(charDetails);
        
        if (char.stats) {
            const statsLink = document.createElement('div');
            statsLink.className = 'character-details';
            const link = document.createElement('a');
            link.href = char.stats;
            link.target = '_blank';
            link.style.color = '#f33a21';
            link.textContent = 'View Stats';
            statsLink.appendChild(link);
            charDetailsContainer.appendChild(statsLink);
        }
        
        // Add legendary resistance checkboxes
        if (char.legendarySaves) {
            if (!char.legendarySaves.used) {
                char.legendarySaves.used = [false, false, false];
            }
            
            const resistanceContainer = document.createElement('div');
            resistanceContainer.className = 'character-details legendary-resistance-container';
            
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'legendary-resistance-boxes';
            
            for (let i = 0; i < 3; i++) {
                const checkbox = document.createElement('div');
                checkbox.className = `resistance-checkbox ${char.legendarySaves.used[i] ? 'used' : ''}`;
                checkbox.onclick = () => useLegendaryResistance(char.id, i);
                checkboxContainer.appendChild(checkbox);
            }
            
            resistanceContainer.appendChild(checkboxContainer);
            charDetailsContainer.appendChild(resistanceContainer);
        }
        
        // Assemble the layout: portrait on left, details on right
        charInfo.appendChild(portraitContainer);
        charInfo.appendChild(charDetailsContainer);
        
        // Character actions (still on the far right)
        const charActions = document.createElement('div');
        charActions.className = 'character-actions';
        
        const editBtn = document.createElement('div');
        editBtn.className = 'btn-secondary btn-small';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editChar(char.id);
        charActions.appendChild(editBtn);
        
        if (char.legendarySaves) {
            const resetBtn = document.createElement('div');
            resetBtn.className = 'btn btn-small';
            resetBtn.textContent = 'Reset Resistances';
            resetBtn.onclick = () => resetLegendarySaves(char.id);
            charActions.appendChild(resetBtn);
        }
        
        const removeBtn = document.createElement('div');
        removeBtn.className = 'btn btn-small';
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => removeChar(char.id);
        charActions.appendChild(removeBtn);
        
        charDiv.appendChild(charInfo);
        charDiv.appendChild(charActions);
        characterList.appendChild(charDiv);
    });
}

function editChar(charId) {
    const char = gameState.chars.find(c => c.id === charId);
    if (char) {
        // Populate form with character data
        document.getElementById('charName').value = char.name;
        document.getElementById('charInitiative').value = char.initiative;
        document.getElementById('statsURL').value = char.stats || '';
        document.getElementById('portraitURL').value = char.portrait || '';
        document.getElementById('hasLegendarySaves').checked = !!char.legendarySaves;
        
        // Set editing mode
        editingCharId = charId;
        document.querySelector('.form-panel .btn-secondary').textContent = 'Update Character';
    }
}

function resetLegendarySaves(charId) {
    const char = gameState.chars.find(c => c.id === charId);
    if (char && char.legendarySaves) {
        char.legendarySaves.current = char.legendarySaves.max;
        char.legendarySaves.used = [false, false, false];
        updateDisplay();
        syncToPlayers();
    }
}

function updateConditions() {
    // Placeholder for condition tracking
    // This would handle timed conditions, concentration checks, etc.
}

function useLegendaryResistance(charId, resistanceIndex) {
    const char = gameState.chars.find(c => c.id === charId);
    if (char && char.legendarySaves) {
        if (!char.legendarySaves.used) {
            char.legendarySaves.used = [false, false, false];
        }
        char.legendarySaves.used[resistanceIndex] = !char.legendarySaves.used[resistanceIndex];
        char.legendarySaves.current = char.legendarySaves.used.filter(used => !used).length;
        
        updateDisplay();
        syncToPlayers();
    }
}

function createPlayerLink() {
    const combatID = Math.random().toString(36).substring(2, 8); // Better random ID
    const playerLink = "dndcombattracker.com/" + combatID;
    const playerLinkButton = document.getElementById('playerLinkButton');
    if (playerLinkButton) {
        playerLinkButton.textContent = `Player Display Link: ${playerLink}`;
    }
}


function copyLink() {
    const playerLinkButton = document.getElementById('playerLinkButton');
    if (playerLinkButton) {
        const linkText = playerLinkButton.textContent.replace('Player Display Link: ', '');
        
        // Try to copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(linkText).then(() => {
                // Temporarily change button text to show it was copied
                const originalText = playerLinkButton.textContent;
                playerLinkButton.textContent = 'Copied!';
                setTimeout(() => {
                    playerLinkButton.textContent = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                alert('Link: ' + linkText);
            });
        } else {
            // Fallback for older browsers
            alert('Link: ' + linkText);
        }
    }
}

// Initialize on page load
window.onload = init;