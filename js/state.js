function getDefaultState() {
    return {
        matter: new Decimal(10),
        dimensions: [
            { id: 1, amount: new Decimal(0), bought: 0, cost: new Decimal(10), mult: new Decimal(1), baseCostMult: 1.5, reqBoost: 0 },
            { id: 2, amount: new Decimal(0), bought: 0, cost: new Decimal(100), mult: new Decimal(1), baseCostMult: 2, reqBoost: 0 },
            { id: 3, amount: new Decimal(0), bought: 0, cost: new Decimal(1e3), mult: new Decimal(1), baseCostMult: 4, reqBoost: 0 },
            { id: 4, amount: new Decimal(0), bought: 0, cost: new Decimal(1e5), mult: new Decimal(1), baseCostMult: 8, reqBoost: 0 },
            { id: 5, amount: new Decimal(0), bought: 0, cost: new Decimal(1e7), mult: new Decimal(1), baseCostMult: 16, reqBoost: 1 },
            { id: 6, amount: new Decimal(0), bought: 0, cost: new Decimal(1e13), mult: new Decimal(1), baseCostMult: 32, reqBoost: 2 },
            { id: 7, amount: new Decimal(0), bought: 0, cost: new Decimal(1e18), mult: new Decimal(1), baseCostMult: 64, reqBoost: 3 },
            { id: 8, amount: new Decimal(0), bought: 0, cost: new Decimal(1e24), mult: new Decimal(1), baseCostMult: 128, reqBoost: 4 },
        ],
        tickspeed: { level: 0, cost: new Decimal(1000) },
        dimBoosts: 0,
        galaxies: 0,
        
        prestigePoints: new Decimal(0),
        prestigeUpgrades: {
            upg1: false, upg2: false, upg3: false, upg4: false, upg5: false,
            upg6: false, upg7: false, upg8: false, upg9: false, upg10: false,
            rebuy1: { level: 0, cost: new Decimal(10), costMult: 3 }, 
            rebuy2: { level: 0, cost: new Decimal(50), costMult: 4 }, 
            rebuy3: { level: 0, cost: new Decimal(500), costMult: 10 } 
        },
        autobuyers: {
            dim1: { unlocked: false, active: false, cost: 10000 },
            dim2: { unlocked: false, active: false, cost: 50000 },
            tick: { unlocked: false, active: false, cost: 250000 }
        },
        
        bank: { deposited: new Decimal(0) },
        
        // ALL 12 STATS
        stats: { 
            startTime: Date.now(), 
            totalPlaytimeMs: 0, 
            timeInCurrentUniverseMs: 0,
            prestiges: 0,
            totalMatterProduced: new Decimal(10),
            peakMatter: new Decimal(10),
            totalPPEarned: new Decimal(0),
            totalDimBoosts: 0,
            totalGalaxies: 0,
            totalDimsBought: 0,
            totalTicksBought: 0,
            totalBankTaxPaid: new Decimal(0),
            totalOfflineMs: 0
        },
        
        lastRenderTime: Date.now(),
        tickProgressMs: 0 
    };
}

let state = getDefaultState();

function serializeState() { return JSON.stringify(state); }

function deserializeState(jsonString) {
    try {
        let parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
        let defaults = getDefaultState();
        
        state.matter = new Decimal(parsed.matter || 10);
        state.dimBoosts = parsed.dimBoosts || 0;
        state.galaxies = parsed.galaxies || 0;
        state.prestigePoints = new Decimal(parsed.prestigePoints || 0);
        
        state.prestigeUpgrades = { ...defaults.prestigeUpgrades, ...(parsed.prestigeUpgrades || {}) };
        if (state.prestigeUpgrades.rebuy1.cost) state.prestigeUpgrades.rebuy1.cost = new Decimal(state.prestigeUpgrades.rebuy1.cost);
        if (state.prestigeUpgrades.rebuy2.cost) state.prestigeUpgrades.rebuy2.cost = new Decimal(state.prestigeUpgrades.rebuy2.cost);
        if (state.prestigeUpgrades.rebuy3.cost) state.prestigeUpgrades.rebuy3.cost = new Decimal(state.prestigeUpgrades.rebuy3.cost);

        state.autobuyers = { ...defaults.autobuyers, ...(parsed.autobuyers || {}) };
        state.tickspeed.level = parsed.tickspeed?.level || 0;
        state.tickspeed.cost = new Decimal(parsed.tickspeed?.cost || 1000);
        state.bank.deposited = new Decimal(parsed.bank?.deposited || 0);
        
        // BULLETPROOF STATS LOADER (Prevents old saves from causing NaN errors)
        state.stats.startTime = parsed.stats?.startTime || defaults.stats.startTime;
        state.stats.totalPlaytimeMs = parsed.stats?.totalPlaytimeMs || 0;
        state.stats.timeInCurrentUniverseMs = parsed.stats?.timeInCurrentUniverseMs || 0;
        state.stats.prestiges = parsed.stats?.prestiges || 0;
        state.stats.totalDimBoosts = parsed.stats?.totalDimBoosts || 0;
        state.stats.totalGalaxies = parsed.stats?.totalGalaxies || 0;
        state.stats.totalDimsBought = parsed.stats?.totalDimsBought || 0;
        state.stats.totalTicksBought = parsed.stats?.totalTicksBought || 0;
        state.stats.totalOfflineMs = parsed.stats?.totalOfflineMs || 0;

        state.stats.totalMatterProduced = new Decimal(parsed.stats?.totalMatterProduced || 10);
        state.stats.peakMatter = new Decimal(parsed.stats?.peakMatter || 10);
        state.stats.totalPPEarned = new Decimal(parsed.stats?.totalPPEarned || 0);
        state.stats.totalBankTaxPaid = new Decimal(parsed.stats?.totalBankTaxPaid || 0);

        let savedTime = parsed.lastRenderTime || Date.now();
        let timeAwayMs = Date.now() - savedTime;
        state.lastRenderTime = Date.now(); 
        state.tickProgressMs = parsed.tickProgressMs || 0;

        if (parsed.dimensions) {
            state.dimensions = parsed.dimensions.map((dim, i) => {
                let dDef = defaults.dimensions[i];
                return {
                    id: dDef.id,
                    amount: new Decimal(dim.amount || 0),
                    bought: dim.bought || 0,
                    cost: new Decimal(dim.cost || dDef.cost),
                    mult: new Decimal(dim.mult || 1),
                    baseCostMult: dDef.baseCostMult,
                    reqBoost: dDef.reqBoost
                };
            });
        }
        return timeAwayMs;
    } catch (e) {
        console.error("Failed to parse save", e);
        return 0;
    }
}