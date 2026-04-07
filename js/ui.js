const elTickBar = document.getElementById('tick-bar');
const dimContainer = document.getElementById('dimensions-container');
const shopContainer = document.getElementById('upgrade-container');
const rebuyContainer = document.getElementById('rebuyable-container');
const abContainer = document.getElementById('autobuyer-container');

// Formats milliseconds into hours, minutes, seconds for the Stats page
function formatTime(ms) {
    if (isNaN(ms) || ms < 0) ms = 0;
    let totalSec = Math.floor(ms / 1000);
    let h = Math.floor(totalSec / 3600);
    let m = Math.floor((totalSec % 3600) / 60);
    let s = totalSec % 60;
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

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
        <button class="upgrade-btn ${state.prestigeUpgrades.upg4 ? 'bought' : ''}" onclick="buyUpgrade('upg4', 500)">
            The Banker's Advantage (3% Interest, 5% Tax)<br><br>${state.prestigeUpgrades.upg4 ? 'BOUGHT' : 'Cost: 500 PP'}
        </button>
        <button class="upgrade-btn ${state.prestigeUpgrades.upg5 ? 'bought' : ''}" onclick="buyUpgrade('upg5', 50)">
            Galaxies are 50% stronger<br><br>${state.prestigeUpgrades.upg5 ? 'BOUGHT' : 'Cost: 50 PP'}
        </button>
        <button class="upgrade-btn ${state.prestigeUpgrades.upg6 ? 'bought' : ''}" onclick="buyUpgrade('upg6', 250)">
            Dimension Boosts are x2.5<br><br>${state.prestigeUpgrades.upg6 ? 'BOUGHT' : 'Cost: 250 PP'}
        </button>
        <button class="upgrade-btn ${state.prestigeUpgrades.upg7 ? 'bought' : ''}" onclick="buyUpgrade('upg7', 1000)">
            Galactic Synergy (Galaxies buff all Dims)<br><br>${state.prestigeUpgrades.upg7 ? 'BOUGHT' : 'Cost: 1,000 PP'}
        </button>
        <button class="upgrade-btn ${state.prestigeUpgrades.upg8 ? 'bought' : ''}" onclick="buyUpgrade('upg8', 5000)">
            Tick Accelerator (Tick Upgrades give extra -0.05s)<br><br>${state.prestigeUpgrades.upg8 ? 'BOUGHT' : 'Cost: 5,000 PP'}
        </button>
        <button class="upgrade-btn ${state.prestigeUpgrades.upg9 ? 'bought' : ''}" onclick="buyUpgrade('upg9', 25000)">
            Cosmic Expansion (Boosts buff Matter Gen)<br><br>${state.prestigeUpgrades.upg9 ? 'BOUGHT' : 'Cost: 25,000 PP'}
        </button>
        <button class="upgrade-btn ${state.prestigeUpgrades.upg10 ? 'bought' : ''}" onclick="buyUpgrade('upg10', 100000)">
            Ultimate Crunch (Improves Prestige PP Formula)<br><br>${state.prestigeUpgrades.upg10 ? 'BOUGHT' : 'Cost: 100,000 PP'}
        </button>
    `;

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
        <button class="upgrade-btn" onclick="buyRebuyable('rebuy3')">
            Raw Matter Generation x5 per level<br>
            <span style="color:#0ff">Level: ${state.prestigeUpgrades.rebuy3.level} (x${format(new Decimal(5).pow(state.prestigeUpgrades.rebuy3.level))})</span><br>
            Cost: ${format(state.prestigeUpgrades.rebuy3.cost)} PP
        </button>
    `;

    const abs = [
        { id: 'dim1', name: 'Dimension 1 Autobuyer', ref: state.autobuyers.dim1 },
        { id: 'dim2', name: 'Dimension 2 Autobuyer', ref: state.autobuyers.dim2 },
        { id: 'dim3', name: 'Dimension 3 Autobuyer', ref: state.autobuyers.dim3 },
        { id: 'tick', name: 'Tickspeed Autobuyer', ref: state.autobuyers.tick },
        { id: 'dim4', name: 'Dimension 4 Autobuyer', ref: state.autobuyers.dim4 },
        { id: 'dim5', name: 'Dimension 5 Autobuyer', ref: state.autobuyers.dim5 },
        { id: 'dim6', name: 'Dimension 6 Autobuyer', ref: state.autobuyers.dim6 },
        { id: 'dim7', name: 'Dimension 7 Autobuyer', ref: state.autobuyers.dim7 },
        { id: 'dim8', name: 'Dimension 8 Autobuyer', ref: state.autobuyers.dim8 },
        { id: 'boost', name: 'Dimension Boost Autobuyer', ref: state.autobuyers.boost },
        { id: 'galaxy', name: 'Antimatter Galaxy Autobuyer', ref: state.autobuyers.galaxy }
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
        
        if (state.cosmicShards.gt(0)) {
            let csEl = document.getElementById('cosmic-shards-display');
            if (!csEl) {
                let ppHeader = document.getElementById('pp-header');
                if (ppHeader) {
                    ppHeader.insertAdjacentHTML('afterend', `<h3 id="cs-header" style="color:#b341e0; margin-top: 10px;">Cosmic Shards: <span id="cosmic-shards-display"></span></h3>`);
                    csEl = document.getElementById('cosmic-shards-display');
                }
            }
            if (csEl) csEl.innerText = format(state.cosmicShards);
        }
    }
    
    if (state.stats.supernovas > 0 || state.cosmicShards.gt(0)) {
        initSupernovaUI();
        let snBtn = document.getElementById('supernova-tab-btn');
        if (snBtn) {
            snBtn.classList.remove('hidden');
            snBtn.style.display = 'inline-block';
        }
        let csTabDisp = document.getElementById('cs-tab-display');
        if (csTabDisp) csTabDisp.innerText = format(state.cosmicShards);
    }
    
    let upg1El = document.getElementById('upg1-current-mult');
    if (upg1El) upg1El.innerText = format(Math.max(1, state.prestigePoints.toNumber()));

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
            if (elMult) elMult.innerText = format(getVisualMultiplier(index));
            if (elBtn) elBtn.disabled = state.matter.lt(dim.cost);
            if (elBar) elBar.style.width = `${(dim.bought % 10) * 10}%`;
            if (elNext) elNext.innerText = 10 - (dim.bought % 10);
        }
    });

    let btnBoost = document.getElementById('btn-dim-boost');
    let btnGalaxy = document.getElementById('btn-galaxy');
    let divider = document.getElementById('resets-divider');

    btnBoost.style.display = state.dimensions[3].bought > 0 ? 'inline-block' : 'none';
    btnGalaxy.style.display = state.dimensions[7].bought > 0 ? 'inline-block' : 'none';
    divider.style.display = (state.dimensions[3].bought > 0 || state.dimensions[7].bought > 0) ? 'block' : 'none';

    let bReq = getBoostReq();
    let boostPower = state.prestigeUpgrades.upg6 ? 2.5 : 2.0;
    let boostMultValue = new Decimal(boostPower).pow(state.dimBoosts);
    let unlockText = state.dimBoosts < 4 ? ` (Unlocks Dim ${bReq.dimIndex + 2})` : ''; 
    
    document.getElementById('boost-count').innerText = state.dimBoosts;
    document.getElementById('boost-mult').innerText = format(boostMultValue);
    document.getElementById('boost-req').innerText = `Requires ${bReq.amount} Dim ${bReq.dimIndex + 1}${unlockText}`;
    btnBoost.disabled = state.dimensions[bReq.dimIndex].amount.lt(bReq.amount);

    let reqAmtForGalaxy = 80 + (state.galaxies * 60);
    let galPower = state.prestigeUpgrades.upg5 ? 3 : 2; 
    let galaxyExtraReduction = state.galaxies * galPower; 
    
    document.getElementById('galaxy-count').innerText = state.galaxies;
    document.getElementById('galaxy-effect').innerText = galaxyExtraReduction;
    document.getElementById('galaxy-req').innerText = `Requires ${reqAmtForGalaxy} Dim 8`;
    btnGalaxy.disabled = state.dimensions[7].amount.lt(reqAmtForGalaxy);

    let crunchReq = getCrunchRequirement();
    let crunchGain = getCrunchGain();
    let btnCrunch = document.getElementById('prestige-btn');
    document.getElementById('crunch-req-display').innerText = format(crunchReq);
    document.getElementById('crunch-gain').innerText = format(crunchGain);
    btnCrunch.disabled = state.matter.lt(crunchReq);

    document.getElementById('bank-interest-rate').innerText = state.prestigeUpgrades.upg4 ? "3.0" : "1.0";
    document.getElementById('bank-tax-rate').innerText = state.prestigeUpgrades.upg4 ? "5" : "15";
    document.getElementById('bank-amount').innerText = format(state.bank.deposited);

    // DYNAMIC STATS UPDATES
    let sTime = document.getElementById('stat-playtime');
    if (sTime) {
        sTime.innerText = formatTime(state.stats.totalPlaytimeMs);
        document.getElementById('stat-current-time').innerText = formatTime(state.stats.timeInCurrentUniverseMs);
        document.getElementById('stat-total-matter').innerText = format(state.stats.totalMatterProduced);
        document.getElementById('stat-peak-matter').innerText = format(state.stats.peakMatter);
        document.getElementById('stat-total-pp').innerText = format(state.stats.totalPPEarned);
        document.getElementById('stat-prestiges').innerText = state.stats.prestiges;
        document.getElementById('stat-total-boosts').innerText = state.stats.totalDimBoosts;
        document.getElementById('stat-total-galaxies').innerText = state.stats.totalGalaxies;
        document.getElementById('stat-dims-bought').innerText = state.stats.totalDimsBought;
        document.getElementById('stat-ticks-bought').innerText = state.stats.totalTicksBought;
        document.getElementById('stat-tax-paid').innerText = format(state.stats.totalBankTaxPaid);
        document.getElementById('stat-offline-time').innerText = formatTime(state.stats.totalOfflineMs);
    }
}

// Tab Listeners
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn, .tab-content').forEach(e => e.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
        
        if (btn.dataset.tab === 'prestige-shop') renderShop(); 
        if (btn.dataset.tab === 'leaderboard' && typeof updateLeaderboardUI === 'function') updateLeaderboardUI(); 
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

// --- LEADERBOARD UI ---
async function updateLeaderboardUI() {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" style="color: #888;">Connecting to Supabase...</td></tr>';
    
    const data = await fetchLeaderboardData(); 
    tbody.innerHTML = ''; 
    
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No public scores yet. Be the first!</td></tr>';
        return;
    }

    data.forEach((player, index) => {
        let tr = document.createElement('tr');
        let rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
        let displayName = player.nickname || 'Unknown Player';
        let exponentDisplay = `1e${Math.floor(player.matter_exponent)}`;
        
        let pp = new Decimal(0);
        let cs = new Decimal(0);
        if (player.save_data) {
            let parsed = typeof player.save_data === 'string' ? JSON.parse(player.save_data) : player.save_data;
            pp = new Decimal(parsed.prestigePoints || 0);
            cs = new Decimal(parsed.cosmicShards || 0);
        }

        tr.innerHTML = `
            <td class="${rankClass}">#${index + 1}</td>
            <td style="font-weight: bold;">${displayName}</td>
            <td class="${rankClass}">${exponentDisplay}</td>
            <td class="${rankClass}">${format(pp)}</td>
            <td class="${rankClass}">${format(cs)}</td>
        `;
        tbody.appendChild(tr);
    });
}

let supernovaUIInitialized = false;

function initSupernovaUI() {
    if (supernovaUIInitialized) return;
    supernovaUIInitialized = true;

    // 1. Inject Tab Button dynamically next to existing tabs
    let firstTab = document.querySelector('.tab-btn');
    if (firstTab && firstTab.parentNode) {
        let snBtn = document.createElement('button');
        snBtn.className = 'tab-btn hidden';
        snBtn.dataset.tab = 'supernova-tab';
        snBtn.id = 'supernova-tab-btn';
        snBtn.innerText = 'Supernova';
        snBtn.style.color = '#b341e0';
        snBtn.style.fontWeight = 'bold';
        snBtn.style.display = 'none'; 
        
        snBtn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn, .tab-content').forEach(e => e.classList.remove('active'));
            snBtn.classList.add('active');
            let content = document.getElementById('supernova-tab');
            if (content) content.classList.add('active');
        });
        firstTab.parentNode.appendChild(snBtn);
    }

    // 2. Inject Tab Content dynamically into the tab container
    let firstContent = document.querySelector('.tab-content');
    if (firstContent && firstContent.parentNode) {
        let snContent = document.createElement('div');
        snContent.id = 'supernova-tab';
        snContent.className = 'tab-content';
        snContent.innerHTML = `
            <h2 style="color: #b341e0;">Supernova</h2>
            <p>You have <strong id="cs-tab-display" style="color:#b341e0; font-size:1.2em;">0</strong> Cosmic Shards.</p>
            <div style="margin-top: 20px; padding: 20px; background: #222; border: 1px solid #b341e0; border-radius: 5px;">
                <p style="color: #aaa; text-align: center;">The fabric of reality has torn. Cosmic upgrades will be available in a future update.</p>
            </div>
        `;
        firstContent.parentNode.appendChild(snContent);
    }

    // 3. Inject Modal dynamically into the body
    let modalHtml = `
        <div id="supernova-modal" class="hidden" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 1000; display: none; justify-content: center; align-items: center; text-align: center;">
            <div style="background: #111; border: 2px solid #b341e0; padding: 40px; border-radius: 10px; box-shadow: 0 0 30px #b341e0;">
                <h1 style="color: #b341e0; font-size: 3em; margin-bottom: 10px;">SUPERNOVA!</h1>
                <p style="font-size: 1.2em; color: #ddd;">Prestige Points reached infinity.</p>
                <p style="font-size: 1.2em; color: #ddd; margin-bottom: 30px;">Your universe has collapsed, but you gained:</p>
                <h2 style="color: #fff; margin-bottom: 30px;">1x <span style="color: #b341e0;">Cosmic Shard</span></h2>
                <button id="btn-close-supernova" style="background: #b341e0; color: white; border: none; padding: 10px 20px; font-size: 1.2em; cursor: pointer; border-radius: 5px;">Acknowledge</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('btn-close-supernova').addEventListener('click', () => {
        let modal = document.getElementById('supernova-modal');
        modal.classList.add('hidden');
        modal.style.display = 'none';
    });
}

function showSupernovaModal() {
    initSupernovaUI();
    let modal = document.getElementById('supernova-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}