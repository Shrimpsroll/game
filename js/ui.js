const elTickBar = document.getElementById('tick-bar');
const dimContainer = document.getElementById('dimensions-container');
const shopContainer = document.getElementById('upgrade-container');
const rebuyContainer = document.getElementById('rebuyable-container');
const abContainer = document.getElementById('autobuyer-container');

function renderDimensions() {
    dimContainer.innerHTML = ''; 

    state.dimensions.forEach((dim, index) => {
        let div = document.createElement('div');
        div.id = `dim-row-${index}`; 
        
        if (state.dimBoosts < dim.reqBoost) {
            div.className = 'dimension-row dim-locked';
            div.innerHTML = `Dimension ${dim.id} locked. Requires ${dim.reqBoost} Dimension Boosts.`;
        } else {
            div.className = 'dimension-row';
            div.innerHTML = `
                <div class="dim-info">
                    <p><strong>Dimension ${dim.id}</strong></p>
                    <p style="font-size:0.85em; color:#aaa;">Amount: <span id="dim${index}-amount">${format(dim.amount)}</span> <span style="color:#0ff">(Total Mult: x<span id="dim${index}-mult">1</span>)</span></p>
                    <div class="milestone-container">
                        <div id="dim${index}-milestone-bar" class="milestone-bar"></div>
                    </div>
                    <p style="font-size:0.75em; color:#888; margin-top: 3px;">Next x2.5 jump in: <span id="dim${index}-next-boost">10</span> buys</p>
                </div>
                <div class="dim-actions">
                    <button id="buy-dim${index}">Buy (Cost: <span id="dim${index}-cost">${format(dim.cost)}</span>)</button>
                </div>
            `;
        
        }
        dimContainer.appendChild(div);

        let btn = document.getElementById(`buy-dim${index}`);
        if (btn) btn.addEventListener('click', () => buyDimension(index));
    });
}

function renderShop() {
    // Normal Upgrades
    shopContainer.innerHTML = `
        <button class="upgrade-btn ${state.prestigeUpgrades.upg1 ? 'bought' : ''}" onclick="buyUpgrade('upg1', 1)">
            Dim 1 Multiplier based on unspent PP<br>
            <span style="color:#0ff">Current: x<span id="upg1-current-mult">${format(Math.max(1, state.prestigePoints.toNumber()))}</span></span><br>
            ${state.prestigeUpgrades.upg1 ? 'BOUGHT' : 'Cost: 1 PP'}
        </button>
        <button class="upgrade-btn ${state.prestigeUpgrades.upg2 ? 'bought' : ''}" onclick="buyUpgrade('upg2', 2)">
            All Dimensions are 2x stronger<br><br>${state.prestigeUpgrades.upg2 ? 'BOUGHT' : 'Cost: 2 PP'}
        </button>
        <button class="upgrade-btn ${state.prestigeUpgrades.upg3 ? 'bought' : ''}" onclick="buyUpgrade('upg3', 5)">
            Matter Generation x3<br><br>${state.prestigeUpgrades.upg3 ? 'BOUGHT' : 'Cost: 5 PP'}
        </button>
        <button class="upgrade-btn ${state.prestigeUpgrades.upg4 ? 'bought' : ''}" onclick="buyUpgrade('upg4', 10)">
            Bank Interest 2.0%<br><br>${state.prestigeUpgrades.upg4 ? 'BOUGHT' : 'Cost: 10 PP'}
        </button>
        <button class="upgrade-btn ${state.prestigeUpgrades.upg5 ? 'bought' : ''}" onclick="buyUpgrade('upg5', 50)">
            Galaxies are 50% stronger<br><br>${state.prestigeUpgrades.upg5 ? 'BOUGHT' : 'Cost: 50 PP'}
        </button>
        <button class="upgrade-btn ${state.prestigeUpgrades.upg6 ? 'bought' : ''}" onclick="buyUpgrade('upg6', 250)">
            Dimension Boosts are x2.5<br><br>${state.prestigeUpgrades.upg6 ? 'BOUGHT' : 'Cost: 250 PP'}
        </button>
    `;

    // Rebuyables
    rebuyContainer.innerHTML = `
        <button class="upgrade-btn" onclick="buyRebuyable('rebuy1')">
            All Dims x2 per level<br>
            <span style="color:#0ff">Level: ${state.prestigeUpgrades.rebuy1.level} (x${format(new Decimal(2).pow(state.prestigeUpgrades.rebuy1.level))})</span><br>
            Cost: ${format(state.prestigeUpgrades.rebuy1.cost)} PP
        </button>
        <button class="upgrade-btn" onclick="buyRebuyable('rebuy2')">
            Prestige Point Gain x2 per level<br>
            <span style="color:#0ff">Level: ${state.prestigeUpgrades.rebuy2.level} (x${format(new Decimal(2).pow(state.prestigeUpgrades.rebuy2.level))})</span><br>
            Cost: ${format(state.prestigeUpgrades.rebuy2.cost)} PP
        </button>
    `;

    // Autobuyers
    const abs = [
        { id: 'dim1', name: 'Dimension 1 Autobuyer', ref: state.autobuyers.dim1 },
        { id: 'dim2', name: 'Dimension 2 Autobuyer', ref: state.autobuyers.dim2 },
        { id: 'tick', name: 'Tickspeed Autobuyer', ref: state.autobuyers.tick }
    ];

    abContainer.innerHTML = '';
    abs.forEach(ab => {
        let html = `<div class="autobuyer-row"><span>${ab.name}</span>`;
        if (ab.ref.unlocked) {
            html += `<button style="background: ${ab.ref.active ? '#0a0' : '#a00'};" onclick="toggleAutobuyer('${ab.id}')">${ab.ref.active ? 'ON' : 'OFF'}</button></div>`;
        } else {
            html += `<button onclick="buyAutobuyer('${ab.id}')">Unlock (Cost: ${format(ab.ref.cost)} PP)</button></div>`;
        }
        abContainer.innerHTML += html;
    });
}

function updateUI() {
    document.getElementById('matter-display').innerText = format(state.matter);
    
    if (state.stats.prestiges > 0) {
        document.getElementById('pp-header').classList.remove('hidden');
        document.getElementById('pp-display').innerText = format(state.prestigePoints);
    }
    
    // Live update Upg1 text if they are on the shop tab
    let upg1El = document.getElementById('upg1-current-mult');
    if (upg1El) upg1El.innerText = format(Math.max(1, state.prestigePoints.toNumber()));

    // Tickspeed Logic
    let isTickUnlocked = state.dimensions[1].bought > 0;
    if (isTickUnlocked) {
        document.getElementById('buy-tickspeed').style.display = 'inline-block';
        document.getElementById('tickspeed-locked-msg').style.display = 'none';
        document.getElementById('buy-tickspeed').disabled = state.matter.lt(state.tickspeed.cost);
    } else {
        document.getElementById('buy-tickspeed').style.display = 'none';
        document.getElementById('tickspeed-locked-msg').style.display = 'block';
    }

    document.getElementById('tickspeed-display').innerText = (getTickInterval() / 1000).toFixed(2);
    document.getElementById('tickspeed-cost').innerText = format(state.tickspeed.cost);
    
    let bonusMult = getBonusTickspeedMultiplier();
    document.getElementById('tickspeed-bonus-text').innerText = bonusMult.gt(1) ? `(+${format(bonusMult)}x Prod)` : '';

    let currentInterval = getTickInterval();
    elTickBar.style.width = `${(state.tickProgressMs / currentInterval) * 100}%`;

    // PROGRESSIVE UNLOCKS & MULTIPLIERS
    state.dimensions.forEach((dim, index) => {
        let rowEl = document.getElementById(`dim-row-${index}`);
        if (rowEl) {
            let isVisible = index === 0 || state.dimensions[index - 1].bought > 0;
            rowEl.style.display = isVisible ? 'flex' : 'none';
        }

        if (state.dimBoosts >= dim.reqBoost) {
            let elAmt = document.getElementById(`dim${index}-amount`);
            let elCost = document.getElementById(`dim${index}-cost`);
            let elMult = document.getElementById(`dim${index}-mult`);
            let elBtn = document.getElementById(`buy-dim${index}`);
            let elBar = document.getElementById(`dim${index}-milestone-bar`);
            let elNext = document.getElementById(`dim${index}-next-boost`);
            
            if (elAmt) elAmt.innerText = format(dim.amount);
            if (elCost) elCost.innerText = format(dim.cost);
            // VISUAL MULTIPLIER (Shows exact buff)
            if (elMult) elMult.innerText = format(getVisualMultiplier(index));
            if (elBtn) elBtn.disabled = state.matter.lt(dim.cost);
            if (elBar) elBar.style.width = `${(dim.bought % 10) * 10}%`;
            if (elNext) elNext.innerText = 10 - (dim.bought % 10);
        }
    });

    // PROGRESSIVE UNLOCKS: Boosts & Galaxies
    let btnBoost = document.getElementById('btn-dim-boost');
    let btnGalaxy = document.getElementById('btn-galaxy');
    let divider = document.getElementById('resets-divider');

    btnBoost.style.display = state.dimensions[3].bought > 0 ? 'inline-block' : 'none';
    btnGalaxy.style.display = state.dimensions[7].bought > 0 ? 'inline-block' : 'none';
    divider.style.display = (state.dimensions[3].bought > 0 || state.dimensions[7].bought > 0) ? 'block' : 'none';

    // Boost UI Updates (Now scales amounts properly)
    let bReq = getBoostReq();
    let boostPower = state.prestigeUpgrades.upg6 ? 2.5 : 2.0;
    let boostMultValue = new Decimal(boostPower).pow(state.dimBoosts);
    let unlockText = state.dimBoosts < 4 ? ` (Unlocks Dim ${bReq.dimIndex + 2})` : ''; 
    
    document.getElementById('boost-count').innerText = state.dimBoosts;
    document.getElementById('boost-mult').innerText = format(boostMultValue);
    document.getElementById('boost-req').innerText = `Requires ${bReq.amount} Dim ${bReq.dimIndex + 1}${unlockText}`;
    btnBoost.disabled = state.dimensions[bReq.dimIndex].amount.lt(bReq.amount);

    // Galaxy UI Updates
    let reqAmtForGalaxy = 80 + (state.galaxies * 60);
    let galPower = state.prestigeUpgrades.upg5 ? 3 : 2; 
    let galaxyExtraReduction = state.galaxies * galPower; 
    
    document.getElementById('galaxy-count').innerText = state.galaxies;
    document.getElementById('galaxy-effect').innerText = galaxyExtraReduction;
    document.getElementById('galaxy-req').innerText = `Requires ${reqAmtForGalaxy} Dim 8`;
    btnGalaxy.disabled = state.dimensions[7].amount.lt(reqAmtForGalaxy);

    // Scaling Crunch UI
    let crunchReq = getCrunchRequirement();
    let crunchGain = getCrunchGain();
    let btnCrunch = document.getElementById('prestige-btn');
    document.getElementById('crunch-req-display').innerText = format(crunchReq);
    document.getElementById('crunch-gain').innerText = format(crunchGain);
    btnCrunch.disabled = state.matter.lt(crunchReq);

    // Bank (Dynamic Text)
    document.getElementById('bank-interest-rate').innerText = state.prestigeUpgrades.upg4 ? "2.0" : "1.0";
    document.getElementById('bank-amount').innerText = format(state.bank.deposited);
}

// Tab Listeners
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn, .tab-content').forEach(e => e.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
        if (btn.dataset.tab === 'prestige-shop') renderShop(); // Refresh shop dynamically
    });
});

function showOfflineModal(totalMs, simMs, ticks, gained) {
    const modal = document.getElementById('offline-modal');
    let totalSec = Math.floor(totalMs / 1000);
    let m = Math.floor(totalSec / 60);
    let s = totalSec % 60;
    
    let timeStr = m > 0 ? `${m}m ${s}s` : `${s}s`;
    if (totalMs > simMs) timeStr += ` (Capped at 30m)`;

    document.getElementById('offline-time-text').innerText = timeStr;
    document.getElementById('offline-ticks').innerText = ticks.toLocaleString();
    document.getElementById('offline-matter').innerText = format(gained);
    modal.classList.remove('hidden');
}

const btnCloseModal = document.getElementById('btn-close-modal');
if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => { document.getElementById('offline-modal').classList.add('hidden'); });
}