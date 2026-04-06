console.log("%cWARNING: Do not paste code here unless you know exactly what you are doing. Doing so will permanently mark your account as a cheater on the global leaderboard.", "color: red; font-size: 16px; font-weight: bold; background: #222; padding: 10px; border: 2px solid red;");

// Background Tab Pausing & Resuming
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        window.hiddenTime = Date.now();
    } else {
        if (window.hiddenTime) {
            let timeAwayMs = Date.now() - window.hiddenTime;
            simulateOfflineProgress(timeAwayMs);
            window.justResumed = true; 
            state.lastRenderTime = Date.now(); 
            state.tickProgressMs = 0; 
            window.hiddenTime = null;
        }
    }
});

window.addEventListener('beforeunload', () => {
    if (typeof localSave === "function") localSave();
});

cloudLoad().then((timeAwayMs) => {
    if (timeAwayMs > 0) simulateOfflineProgress(timeAwayMs);

    initNewsTicker(); 
    renderDimensions();
    renderShop();
    updateUI();
    gameLoop();
    
    setInterval(localSave, 1000); 
    setInterval(cloudSave, 60000); 
});

// --- SAFE EVENT LISTENERS ---
// Utility function to attach listeners safely
function safeListen(id, event, callback) {
    let el = document.getElementById(id);
    if (el) el.addEventListener(event, callback);
    else console.warn(`Element #${id} not found. Skipping listener.`);
}

safeListen('buy-tickspeed', 'click', buyTickspeed);
safeListen('btn-dim-boost', 'click', buyDimBoost);
safeListen('btn-galaxy', 'click', buyGalaxy);
safeListen('prestige-btn', 'click', prestige);

// Bank
safeListen('btn-dep-half', 'click', () => executeDeposit(state.matter.div(2)));
safeListen('btn-dep-all', 'click', () => executeDeposit(state.matter));
safeListen('btn-with-half', 'click', () => executeWithdrawal(state.bank.deposited.div(2)));
safeListen('btn-with-all', 'click', () => executeWithdrawal(state.bank.deposited));

// News
safeListen('btn-submit-news', 'click', () => {
    if (typeof submitNewsBroadcast === 'function') submitNewsBroadcast();
});

// Options
safeListen('btn-save', 'click', () => { cloudSave(); alert("Saved to Cloud!"); });
safeListen('btn-load', 'click', () => { 
    cloudLoad().then(() => { renderDimensions(); renderShop(); updateUI(); alert("Loaded from Cloud!"); });
});
safeListen('btn-load-code', 'click', () => {
    if (typeof loadSharedCode === 'function') {
        loadSharedCode().then(() => { renderDimensions(); renderShop(); updateUI(); });
    }
});
safeListen('btn-hard-reset', 'click', () => {
    if (confirm("Are you ABSOLUTELY sure? Wipe all local and cloud data?")) {
        state = getDefaultState();
        
        // Wipe all local storage keys associated with the game
        localStorage.removeItem('incremental_user_id');
        localStorage.removeItem('incremental_share_code');
        localStorage.removeItem('incremental_nickname');
        
        cloudSave(); 
        location.reload();
    }
});

// Leaderboard Listeners
safeListen('btn-submit-leaderboard', 'click', () => {
    if (typeof submitToLeaderboard === 'function') submitToLeaderboard();
});
safeListen('btn-refresh-leaderboard', 'click', () => {
    if (typeof updateLeaderboardUI === 'function') updateLeaderboardUI();
});

// Load saved nickname if it exists
let savedNick = localStorage.getItem('incremental_nickname');
if (savedNick) {
    let nickEl = document.getElementById('player-nickname');
    if (nickEl) nickEl.value = savedNick;
}