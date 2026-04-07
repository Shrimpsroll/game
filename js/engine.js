const UI_FPS = 50; 

function logGame(action) { 
    console.log(`[LOG] ${new Date().toLocaleTimeString()} - ${action}`); 
}

let _devToolsWarned = false;
Object.defineProperty(window, 'dev', {
    get: function() {
        window.isCheater = true;
        if (!_devToolsWarned) {
            console.warn("Dev tools accessed! Flagged as cheater.");
            _devToolsWarned = true;
        }
        return {
            giveMatter: (eString) => { state.matter = state.matter.add(new Decimal(eString)); updateUI(); },
            givePP: (amount) => { state.prestigePoints = state.prestigePoints.add(amount); updateUI(); }
        };
    }
});

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
            dim.mult = dim.mult.mul(3.0); 
            dim.cost = dim.cost.mul(100); 
            logGame(`Dimension ${dim.id} hit milestone ${dim.bought}! Power x3.0, Cost x100.`);
        } else {
            logGame(`Bought Dimension ${dim.id}`);
        }
        
        state.stats.totalDimsBought += 1; 
        if (typeof updateUI === 'function') updateUI();
    }
}

function buyMaxDimension(index) {
    let dim = state.dimensions[index];
    if (state.matter.lt(dim.cost)) return;

    let bulkBuyCount = 0;
    let cost = dim.cost;
    let matter = state.matter;

    while (matter.gte(cost)) {
        matter = matter.sub(cost);
        cost = cost.mul(dim.baseCostMult).floor();
        bulkBuyCount++;
        if ((dim.bought + bulkBuyCount) % 10 === 0) {
            cost = cost.mul(100);
        }
    }

    if (bulkBuyCount > 0) {
        state.matter = matter;
        dim.amount = dim.amount.add(bulkBuyCount);
        
        let oldBought = dim.bought;
        dim.bought += bulkBuyCount;
        dim.cost = cost;
        
        let newMults = Math.floor(dim.bought / 10) - Math.floor(oldBought / 10);
        if (newMults > 0) {
            dim.mult = dim.mult.mul(new Decimal(3.0).pow(newMults));
        }
        
        state.stats.totalDimsBought += bulkBuyCount;
    }
}

function buyMaxTickspeed() {
    if (state.dimensions[1].bought === 0) return;
    let cost = state.tickspeed.cost;
    if (state.matter.lt(cost)) return;
    
    let bulkBuyCount = 0;
    let matter = state.matter;
    
    while (matter.gte(cost)) {
        matter = matter.sub(cost);
        cost = cost.mul(10);
        bulkBuyCount++;
    }
    
    if (bulkBuyCount > 0) {
        state.matter = matter;
        state.tickspeed.level += bulkBuyCount;
        state.tickspeed.cost = cost;
        state.stats.totalTicksBought += bulkBuyCount;
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

function prestige(forced = false) {
    let isForced = forced === true; // Prevents UI click events from registering as true
    let gain = getCrunchGain();
    if (gain.gt(0) || isForced) {
        if (gain.lte(0) && isForced) gain = new Decimal(1); // Give a pity point if forced prematurely
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
    if (state.autobuyers.dim1.active) buyMaxDimension(0);
    if (state.autobuyers.dim2.active) buyMaxDimension(1);
    if (state.autobuyers.dim3?.active) buyMaxDimension(2);
    if (state.autobuyers.dim4?.active) buyMaxDimension(3);
    if (state.autobuyers.dim5?.active) buyMaxDimension(4);
    if (state.autobuyers.dim6?.active) buyMaxDimension(5);
    if (state.autobuyers.dim7?.active) buyMaxDimension(6);
    if (state.autobuyers.dim8?.active) buyMaxDimension(7);
    if (state.autobuyers.tick.active) buyMaxTickspeed();
    if (state.autobuyers.boost?.active) {
        let req = getBoostReq();
        if (state.dimensions[req.dimIndex].amount.gte(req.amount)) buyDimBoost();
    }
    if (state.autobuyers.galaxy?.active) {
        let reqAmt = 80 + (state.galaxies * 60);
        if (state.dimensions[7].amount.gte(reqAmt)) buyGalaxy();
    }
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
}

function simulateOfflineProgress(timeAwayMs) {
    const MAX_OFFLINE_MS = 30 * 60 * 1000;
    let actualSimMs = Math.min(timeAwayMs, MAX_OFFLINE_MS);
    let currentInterval = getTickInterval();
    let ticksToSimulate = Math.floor(actualSimMs / currentInterval);

    state.bank.timeSinceInterest += actualSimMs;
    while (state.bank.timeSinceInterest >= 60000) {
        if (state.bank.deposited.gt(0)) {
            let interestRate = state.prestigeUpgrades.upg4 ? 0.05 : 0.02;
            let interest = state.bank.deposited.mul(interestRate);
            state.bank.deposited = state.bank.deposited.add(interest);
            state.stats.totalMatterProduced = state.stats.totalMatterProduced.add(interest);
        }
        state.bank.timeSinceInterest -= 60000;
    }

    if (ticksToSimulate <= 0) return;
    
    let startMatter = new Decimal(state.matter);

    console.log(`%c--- BACKGROUND SIMULATION START ---`, `color: #0f0; font-weight: bold;`);
    console.log(`Time Away: ${Math.floor(timeAwayMs / 1000)}s | Simulating: ${Math.floor(actualSimMs / 1000)}s`);
    
    for (let i = 0; i < ticksToSimulate; i++) processGameTick();

    state.tickProgressMs += (actualSimMs % currentInterval);
    
    state.stats.totalOfflineMs += actualSimMs; 
    state.stats.totalPlaytimeMs += actualSimMs;
    state.stats.timeInCurrentUniverseMs += actualSimMs;

    checkLimits();

    let gainedMatter = state.matter.sub(startMatter);
    console.log(`Ending Matter: ${format(state.matter)} (+${format(gainedMatter)})`);

    if (timeAwayMs > 60000 && typeof showOfflineModal === 'function') {
        showOfflineModal(timeAwayMs, actualSimMs, ticksToSimulate, gainedMatter);
    }
}

function supernova() {
    state.cosmicShards = state.cosmicShards.add(1);
    state.stats.supernovas += 1;
    logGame(`SUPERNOVA! Gained 1 Cosmic Shard.`);
    
    let defaults = getDefaultState();
    state.matter = new Decimal(10);
    state.prestigePoints = new Decimal(0);
    state.dimensions = defaults.dimensions;
    state.stats.prestiges = 0;
    state.tickspeed = defaults.tickspeed;
    state.stats.totalMatterProduced = new Decimal(10);
    state.stats.totalPPEarned = new Decimal(0);
    state.prestigeUpgrades = defaults.prestigeUpgrades;
    state.autobuyers = defaults.autobuyers;
    state.bank.deposited = new Decimal(0);
    state.bank.timeSinceInterest = 0;
    state.galaxies = 0;
    state.dimBoosts = 0;
    resetForBoostOrGalaxy();
    
    if (typeof renderShop === 'function') renderShop();
    if (typeof renderDimensions === 'function') renderDimensions();
    if (typeof showSupernovaModal === 'function') showSupernovaModal();
    if (typeof updateUI === 'function') updateUI();
}

function checkLimits() {
    const INFINITY = new Decimal("1.7976931348623157e308");
    if (state.matter.gte(INFINITY)) {
        logGame(`Matter reached infinity. Forcing Big Crunch.`);
        prestige(true);
    }
    if (state.prestigePoints.gte(INFINITY)) {
        logGame(`Prestige Points reached infinity. Forcing Supernova.`);
        supernova();
    }
}

function runAntiCheat() {
    if (state.matter.gt(state.stats.totalMatterProduced.add(10))) window.isCheater = true;
    if (state.prestigePoints.gt(state.stats.totalPPEarned)) window.isCheater = true;
    if (state.cosmicShards.gt(state.stats.supernovas)) window.isCheater = true;
    
    if (isNaN(state.matter.e) || isNaN(state.prestigePoints.e) || isNaN(state.cosmicShards.e)) window.isCheater = true;
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

    state.bank.timeSinceInterest += delta;
    while (state.bank.timeSinceInterest >= 60000) {
        if (state.bank.deposited.gt(0)) {
            let interestRate = state.prestigeUpgrades.upg4 ? 0.05 : 0.02;
            let interest = state.bank.deposited.mul(interestRate);
            state.bank.deposited = state.bank.deposited.add(interest);
            state.stats.totalMatterProduced = state.stats.totalMatterProduced.add(interest);
        }
        state.bank.timeSinceInterest -= 60000;
    }

    checkLimits();
    runAntiCheat();

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