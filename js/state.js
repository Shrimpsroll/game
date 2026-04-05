function getDefaultState() {
    return {
        matter: new Decimal(10),
        dimensions: [
            { id: 1, amount: new Decimal(0), bought: 0, cost: new Decimal(10), mult: new Decimal(1), baseCostMult: 1.5, reqBoost: 0 },
            { id: 2, amount: new Decimal(0), bought: 0, cost: new Decimal(100), mult: new Decimal(1), baseCostMult: 2, reqBoost: 0 },
            { id: 3, amount: new Decimal(0), bought: 0, cost: new Decimal(1e4), mult: new Decimal(1), baseCostMult: 4, reqBoost: 0 },
            { id: 4, amount: new Decimal(0), bought: 0, cost: new Decimal(1e6), mult: new Decimal(1), baseCostMult: 8, reqBoost: 0 },
            { id: 5, amount: new Decimal(0), bought: 0, cost: new Decimal(1e9), mult: new Decimal(1), baseCostMult: 16, reqBoost: 1 },
            { id: 6, amount: new Decimal(0), bought: 0, cost: new Decimal(1e13), mult: new Decimal(1), baseCostMult: 32, reqBoost: 2 },
            { id: 7, amount: new Decimal(0), bought: 0, cost: new Decimal(1e18), mult: new Decimal(1), baseCostMult: 64, reqBoost: 3 },
            { id: 8, amount: new Decimal(0), bought: 0, cost: new Decimal(1e24), mult: new Decimal(1), baseCostMult: 128, reqBoost: 4 },
        ],
        tickspeed: { level: 0, cost: new Decimal(1000) },
        dimBoosts: 0,
        galaxies: 0,
        
        prestigePoints: new Decimal(0),
        prestigeUpgrades: {
            upg1: false, // Dim 1 stronger based on unspent PP
            upg2: false, // All Dims x2
            upg3: false, // Matter Gen x3
            upg4: false, // Bank Interest 2.0%
            upg5: false, // Galaxies are 50% stronger
            upg6: false, // Dim Boosts are 2.5x instead of 2.0x
            
            // Rebuyables
            rebuy1: { level: 0, cost: new Decimal(10), costMult: 3 }, // All Dims x(2^level)
            rebuy2: { level: 0, cost: new Decimal(50), costMult: 4 }  // PP Gain x(2^level)
        },
        autobuyers: {
            dim1: { unlocked: false, active: false, cost: 10000 },
            dim2: { unlocked: false, active: false, cost: 50000 },
            tick: { unlocked: false, active: false, cost: 250000 }
        },
        
        bank: { deposited: new Decimal(0) },
        stats: { startTime: Date.now(), totalPlaytimeMs: 0, prestiges: 0 },
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

        state.autobuyers = { ...defaults.autobuyers, ...(parsed.autobuyers || {}) };
        
        state.tickspeed.level = parsed.tickspeed?.level || 0;
        state.tickspeed.cost = new Decimal(parsed.tickspeed?.cost || 1000);
        state.bank.deposited = new Decimal(parsed.bank?.deposited || 0);
        state.stats = parsed.stats || defaults.stats;

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