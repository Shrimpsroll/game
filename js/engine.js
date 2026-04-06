const UI_FPS = 50; 

function logGame(action) { 
    console.log(`[LOG] ${new Date().toLocaleTimeString()} - ${action}`); 
}

window.dev = {
    giveMatter: (eString) => { state.matter = state.matter.add(new Decimal(eString)); window.isCheater = true; updateUI(); },
    givePP: (amount) => { state.prestigePoints = state.prestigePoints.add(amount); window.isCheater = true; updateUI(); },
};

function getTickInterval() {
    let baseGalStrength = state.prestigeUpgrades.upg5 ? 0.03 : 0.02; 
    let extraTickBoost = state.prestigeUpgrades.upg8 ? 0.05 : 0; 
    let reductionPerLevel = 0.25 + extraTickBoost + (baseGalStrength * state.galaxies); 
    
    let rawInterval = 5.0 - (state.tickspeed.level * reductionPerLevel);
    // UPDATED: Max tickspeed is now 0.1s (100ms)
    return Math.max(0.1, rawInterval) * 1000; 
}

function getBonusTickspeedMultiplier() {
    let baseGalStrength = state.prestigeUpgrades.upg5 ? 0.03 : 0.02;
    let extraTickBoost = state.prestigeUpgrades.upg8 ? 0.05 : 0;
    let reductionPerLevel = 0.25 + extraTickBoost + (baseGalStrength * state.galaxies);
    
    // UPDATED: Bonus kicks in after hitting 0.1s
    let levelsToMaxOut = (5.0 - 0.1) / reductionPerLevel;
    
    if (state.tickspeed.level > levelsToMaxOut) {
        let excessLevels = state.tickspeed.level - levelsToMaxOut;
        return new Decimal(1.2).pow(excessLevels); 
    }
    return new Decimal(1);
}

function getGlobalDimMultiplier() {
    let boostPower = state.prestigeUpgrades.upg6 ? 2.5 : 2.0;
    let mult = new Decimal(boostPower).pow(state.dimBoosts);
    if (state.prestigeUpgrades.upg2) mult = mult.mul(2);
    
    if (state.prestigeUpgrades.upg7) {
        mult = mult.mul(Math.max(1, state.galaxies * 3));
    }
    
    let rebuy1Mult = new Decimal(2).pow(state.prestigeUpgrades.rebuy1.level);
    return mult.mul(rebuy1Mult);
}

function getVisualMultiplier(index) {
    let dim = state.dimensions[index];
    let globalMult = getGlobalDimMultiplier();
    let bonusTickMult = getBonusTickspeedMultiplier();
    let total = dim.mult.mul(globalMult).mul(bonusTickMult);
    
    if (index === 0) {
        if (state.prestigeUpgrades.upg1) total = total.mul(Math.max(1, state.prestigePoints.toNumber()));
        if (state.prestigeUpgrades.upg3) total = total.mul(3); 
        if (state.prestigeUpgrades.upg9) total = total.mul(Math.max(1, state.dimBoosts * 5)); 
        
        let rebuy3MatterMult = new Decimal(5).pow(state.prestigeUpgrades.rebuy3.level); 
        total = total.mul(rebuy3MatterMult);
    }
    
    return total;
}

function buyDimension(index) {
    let dim = state.dimensions[index];
    if (state.matter.gte(dim.cost)) {
        state.matter = state.matter.sub(dim.cost);
        dim.amount = dim.amount.add(1);
        dim.bought += 1;
        dim.cost = dim.cost.mul(dim.baseCostMult).floor();
        
        if (dim.bought % 10 === 0) {
            dim.mult = dim.mult.mul(2.5); 
            dim.cost = dim.cost.mul(100); 
            logGame(`Dimension ${dim.id} hit milestone ${dim.bought}! Power x2.5, Cost x100.`);
        } else {
            logGame(`Bought Dimension ${dim.id}`);
        }
        
        state.stats.totalDimsBought += 1; 
        if (typeof updateUI === 'function') updateUI();
    }
}

function buyTickspeed() {
    if (state.dimensions[1].bought === 0) return; 
    if (state.matter.gte(state.tickspeed.cost)) {
        state.matter = state.matter.sub(state.tickspeed.cost);
        state.tickspeed.level += 1;
        state.tickspeed.cost = state.tickspeed.cost.mul(10);
        state.stats.totalTicksBought += 1; 
        logGame(`Upgraded Tickspeed to Level ${state.tickspeed.level}`);
        if (typeof updateUI === 'function') updateUI();
    }
}

function resetForBoostOrGalaxy() {
    state.matter = new Decimal(10);
    state.dimensions.forEach((dim, i) => {
        dim.amount = new Decimal(0);
        dim.bought = 0;
        dim.cost = getDefaultState().dimensions[i].cost;
        dim.mult = new Decimal(1);
    });
    state.tickspeed.level = 0;
    state.tickspeed.cost = new Decimal(1000);
}

function getBoostReq() {
    let reqDim = Math.min(3 + state.dimBoosts, 7); 
    let reqAmt = state.dimBoosts >= 4 ? 20 + (15 * (state.dimBoosts - 4)) : 20;
    return { dimIndex: reqDim, amount: reqAmt };
}

function buyDimBoost() {
    let req = getBoostReq();
    if (state.dimensions[req.dimIndex].amount.gte(req.amount)) {
        state.dimBoosts += 1;
        state.stats.totalDimBoosts += 1; 
        logGame(`DIMENSION BOOST acquired! Total: ${state.dimBoosts}`);
        resetForBoostOrGalaxy();
        renderDimensions();
    }
}

function buyGalaxy() {
    let reqAmt = 80 + (state.galaxies * 60);
    if (state.dimensions[7].amount.gte(reqAmt)) {
        state.galaxies += 1;
        state.dimBoosts = 0; 
        state.stats.totalGalaxies += 1; 
        logGame(`ANTIMATTER GALAXY acquired! Total: ${state.galaxies}`);
        resetForBoostOrGalaxy();
        renderDimensions();
    }
}

function getCrunchRequirement() {
    return new Decimal(1e30).mul(new Decimal(1e5).pow(state.stats.prestiges));
}

function getCrunchGain() {
    let req = getCrunchRequirement();
    if (state.matter.lt(req)) return new Decimal(0);
    
    let exponent = state.prestigeUpgrades.upg10 ? 0.55 : 0.5;
    let gain = state.matter.div(req).pow(exponent).floor();
    
    if (state.prestigeUpgrades.upg3) gain = gain.mul(2); 
    let rebuy2Mult = new Decimal(2).pow(state.prestigeUpgrades.rebuy2.level);
    return gain.mul(rebuy2Mult);
}

function prestige() {
    let gain = getCrunchGain();
    if (gain.gt(0)) {
        state.prestigePoints = state.prestigePoints.add(gain);
        state.stats.prestiges += 1;
        state.stats.totalPPEarned = state.stats.totalPPEarned.add(gain); 
        state.stats.timeInCurrentUniverseMs = 0; 
        state.galaxies = 0;
        state.dimBoosts = 0;
        logGame(`BIG CRUNCH! Gained ${format(gain)} Prestige Points.`);
        resetForBoostOrGalaxy();
        renderDimensions();
    }
}

function buyUpgrade(id, cost) {
    if (!state.prestigeUpgrades[id] && state.prestigePoints.gte(cost)) {
        state.prestigePoints = state.prestigePoints.sub(cost);
        state.prestigeUpgrades[id] = true;
        logGame(`Bought Prestige Upgrade: ${id}`);
        renderShop();
    }
}

function buyRebuyable(id) {
    let upg = state.prestigeUpgrades[id];
    if (state.prestigePoints.gte(upg.cost)) {
        state.prestigePoints = state.prestigePoints.sub(upg.cost);
        upg.level += 1;
        upg.cost = upg.cost.mul(upg.costMult);
        logGame(`Bought Rebuyable Upgrade: ${id} (Level ${upg.level})`);
        renderShop();
    }
}

function buyAutobuyer(id) {
    let ab = state.autobuyers[id];
    if (!ab.unlocked && state.prestigePoints.gte(ab.cost)) {
        state.prestigePoints = state.prestigePoints.sub(ab.cost);
        ab.unlocked = true;
        ab.active = true;
        logGame(`Unlocked Autobuyer: ${id}`);
        renderShop();
    }
}

function toggleAutobuyer(id) {
    if (state.autobuyers[id].unlocked) {
        state.autobuyers[id].active = !state.autobuyers[id].active;
        logGame(`Toggled Autobuyer ${id} to ${state.autobuyers[id].active ? 'ON' : 'OFF'}`);
        renderShop();
    }
}

function processAutobuyers() {
    if (state.autobuyers.dim1.active) while (state.matter.gte(state.dimensions[0].cost)) buyDimension(0);
    if (state.autobuyers.dim2.active) while (state.matter.gte(state.dimensions[1].cost)) buyDimension(1);
    if (state.autobuyers.tick.active) while (state.matter.gte(state.tickspeed.cost)) buyTickspeed();
}

function processGameTick() {
    processAutobuyers();

    let globalMult = getGlobalDimMultiplier();
    let bonusTickMult = getBonusTickspeedMultiplier();
    
    let dim1UpgBonus = state.prestigeUpgrades.upg1 ? Math.max(1, state.prestigePoints.toNumber()) : 1;
    let upg3MatterMult = state.prestigeUpgrades.upg3 ? 3 : 1;
    let upg9MatterMult = state.prestigeUpgrades.upg9 ? Math.max(1, state.dimBoosts * 5) : 1;
    let rebuy3MatterMult = new Decimal(5).pow(state.prestigeUpgrades.rebuy3.level);

    for (let i = state.dimensions.length - 1; i >= 0; i--) {
        let dim = state.dimensions[i];
        let production = dim.amount.mul(dim.mult).mul(globalMult).mul(bonusTickMult);
        
        if (i === 0) {
            production = production.mul(dim1UpgBonus).mul(upg3MatterMult).mul(upg9MatterMult).mul(rebuy3MatterMult);
            state.matter = state.matter.add(production);
            state.stats.totalMatterProduced = state.stats.totalMatterProduced.add(production); 
        } else {
            state.dimensions[i - 1].amount = state.dimensions[i - 1].amount.add(production);
        }
    }

    if (state.matter.gt(state.stats.peakMatter)) {
        state.stats.peakMatter = new Decimal(state.matter); 
    }

    if (state.bank.deposited.gt(0)) {
        let interestRate = state.prestigeUpgrades.upg4 ? 0.03 : 0.01;
        state.bank.deposited = state.bank.deposited.add(state.bank.deposited.mul(interestRate));
    }
}

function simulateOfflineProgress(timeAwayMs) {
    const MAX_OFFLINE_MS = 30 * 60 * 1000;
    let actualSimMs = Math.min(timeAwayMs, MAX_OFFLINE_MS);
    let currentInterval = getTickInterval();
    let ticksToSimulate = Math.floor(actualSimMs / currentInterval);

    if (ticksToSimulate <= 0) return;
    
    let startMatter = new Decimal(state.matter);

    console.log(`%c--- BACKGROUND SIMULATION START ---`, `color: #0f0; font-weight: bold;`);
    console.log(`Time Away: ${Math.floor(timeAwayMs / 1000)}s | Simulating: ${Math.floor(actualSimMs / 1000)}s`);
    
    for (let i = 0; i < ticksToSimulate; i++) processGameTick();

    state.tickProgressMs += (actualSimMs % currentInterval);
    
    state.stats.totalOfflineMs += actualSimMs; 
    state.stats.totalPlaytimeMs += actualSimMs;
    state.stats.timeInCurrentUniverseMs += actualSimMs;

    let gainedMatter = state.matter.sub(startMatter);
    console.log(`Ending Matter: ${format(state.matter)} (+${format(gainedMatter)})`);

    if (timeAwayMs > 60000 && typeof showOfflineModal === 'function') {
        showOfflineModal(timeAwayMs, actualSimMs, ticksToSimulate, gainedMatter);
    }
}

function gameLoop() {
    if (document.hidden) {
        setTimeout(gameLoop, UI_FPS); 
        return; 
    }

    let now = Date.now();
    let delta = now - state.lastRenderTime;

    if (delta > 50000 && !window.justResumed) { 
        window.isCheater = true; 
        console.warn("Time anomaly detected! Flagged as cheater.");
        delta = UI_FPS; 
    } else if (delta > 1000) {
        delta = UI_FPS; 
    }
    window.justResumed = false;
    
    state.tickProgressMs += delta;
    state.stats.totalPlaytimeMs += delta; 
    state.stats.timeInCurrentUniverseMs += delta; 
    
    let currentInterval = getTickInterval();

    while (state.tickProgressMs >= currentInterval) {
        processGameTick();
        state.tickProgressMs -= currentInterval;
    }

    state.lastRenderTime = now;
    if (typeof updateUI === 'function') updateUI();
    setTimeout(gameLoop, UI_FPS);
}

function executeDeposit(amt) {
    if (amt.lte(0)) return;
    state.bank.deposited = state.bank.deposited.add(amt);
    state.matter = state.matter.sub(amt);
    logGame(`Deposited ${format(amt)} into Bank`);
    updateUI();
}

function executeWithdrawal(amt) {
    if (amt.lte(0)) return;
    let taxRate = state.prestigeUpgrades.upg4 ? 0.05 : 0.15; 
    let taxAmount = amt.mul(taxRate);
    let matterToGive = amt.sub(taxAmount);
    
    state.stats.totalBankTaxPaid = state.stats.totalBankTaxPaid.add(taxAmount); 
    
    state.bank.deposited = state.bank.deposited.sub(amt);
    state.matter = state.matter.add(matterToGive); 
    logGame(`Withdrew ${format(amt)} from Bank (${taxRate * 100}% Tax Applied)`);
    updateUI();
}