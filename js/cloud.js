const SUPABASE_URL = 'https://qswfcbbmqaxerzzkrbxs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8lTxSPZcRYCN7zz1s1weyg_uPoHqcBB';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let userId = localStorage.getItem('incremental_user_id');
if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('incremental_user_id', userId);
}

let myShareCode = localStorage.getItem('incremental_share_code');
if (!myShareCode) {
    myShareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('incremental_share_code', myShareCode);
}
let elShareCode = document.getElementById('my-share-code');
if (elShareCode) elShareCode.innerText = myShareCode;

function localSave() {
    state.lastRenderTime = Date.now();
    localStorage.setItem('incremental_local_save', serializeState());
}

async function cloudLoad() {
    let cloudData = null;
    let localData = localStorage.getItem('incremental_local_save');
    
    fetchGlobalNews(); // Kick off news fetch while save loads

    const { data, error } = await supabaseClient
        .from('user_saves')
        .select('save_data')
        .eq('user_id', userId)
        .maybeSingle(); // FIX: Tells Supabase not to throw a 406 error if the user is brand new

    if (!error && data && data.save_data) cloudData = data.save_data;

    let finalSaveToLoad = null;
    let cloudTime = cloudData ? (cloudData.lastRenderTime || 0) : 0;
    let localParsed = localData ? JSON.parse(localData) : null;
    let localTime = localParsed ? (localParsed.lastRenderTime || 0) : 0;

    if (localTime > cloudTime) finalSaveToLoad = localParsed;
    else if (cloudData) finalSaveToLoad = cloudData;

    if (finalSaveToLoad) return deserializeState(finalSaveToLoad);
    return 0; 
}

async function cloudSave() {
    const { error } = await supabaseClient
        .from('user_saves')
        .upsert({ 
            user_id: userId, 
            matter_exponent: state.matter.e, 
            save_data: JSON.parse(serializeState()),
            share_code: myShareCode,
            is_cheater: window.isCheater || false
        }, { onConflict: 'user_id' }); 
        
    // SELF-HEALING: If share code collided (e.g. from a partial reset), generate a new one and retry
    if (error && error.code === '23505' && error.message.includes('share_code')) {
        console.warn("Share code collision detected. Generating new code and retrying save...");
        myShareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        localStorage.setItem('incremental_share_code', myShareCode);
        
        let elShareCode = document.getElementById('my-share-code');
        if (elShareCode) elShareCode.innerText = myShareCode;
        
        return cloudSave(); // Recursively retry the save with the new code
    }
}

// --- LEADERBOARD LOGIC ---
async function submitToLeaderboard() {
    let nickInput = document.getElementById('player-nickname').value.trim();
    let finalNick = nickInput !== "" ? nickInput : 'Anonymous';
    localStorage.setItem('incremental_nickname', finalNick);

    const { error } = await supabaseClient
        .from('user_saves')
        .upsert({ 
            user_id: userId, 
            matter_exponent: state.matter.e, 
            save_data: JSON.parse(serializeState()),
            share_code: myShareCode,
            is_cheater: window.isCheater || false,
            nickname: finalNick,
            is_public: true 
        }, { onConflict: 'user_id' }); 

    // SELF-HEALING for Leaderboard submissions
    if (error && error.code === '23505' && error.message.includes('share_code')) {
        console.warn("Share code collision detected. Generating new code and retrying submission...");
        myShareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        localStorage.setItem('incremental_share_code', myShareCode);
        
        let elShareCode = document.getElementById('my-share-code');
        if (elShareCode) elShareCode.innerText = myShareCode;
        
        return submitToLeaderboard(); // Recursively retry
    }

    if (error) {
        console.error("Submission error:", error);
        alert("Failed to submit score to the leaderboard.");
    } else {
        alert("Score successfully submitted to the Leaderboard!");
        if (typeof updateLeaderboardUI === "function") updateLeaderboardUI();
    }
}

async function fetchLeaderboardData() {
    const { data, error } = await supabaseClient
        .from('user_saves')
        .select('nickname, matter_exponent, save_data')
        .eq('is_cheater', false)
        .eq('is_public', true)
        .limit(1000);

    if (error) {
        console.error("Leaderboard fetch error:", error);
        return [];
    }
    
    // Sort primarily by Cosmic Shards, then Prestige Points, then Matter Exponent
    data.sort((a, b) => {
        let parseData = (save) => typeof save === 'string' ? JSON.parse(save) : save;
        let aSave = a.save_data ? parseData(a.save_data) : {};
        let bSave = b.save_data ? parseData(b.save_data) : {};

        let aCS = new Decimal(aSave.cosmicShards || 0);
        let bCS = new Decimal(bSave.cosmicShards || 0);
        if (!aCS.eq(bCS)) return bCS.cmp(aCS); 

        let aPP = new Decimal(aSave.prestigePoints || 0);
        let bPP = new Decimal(bSave.prestigePoints || 0);
        if (!aPP.eq(bPP)) return bPP.cmp(aPP); 

        let aMatter = a.matter_exponent || 0;
        let bMatter = b.matter_exponent || 0;
        return bMatter - aMatter;
    });
    
    return data.slice(0, 10);
}

async function loadSharedCode() {
    let codeToLoad = document.getElementById('share-code-input').value.toUpperCase().trim();
    if (!codeToLoad) return;

    const { data, error } = await supabaseClient
        .from('user_saves')
        .select('save_data')
        .eq('share_code', codeToLoad)
        .maybeSingle(); // FIX: Prevents 406 error if they type an invalid share code

    if (data && data.save_data) {
        deserializeState(data.save_data);
        alert("Shared save loaded successfully!");
        localSave(); 
    } else {
        alert("Invalid share code or save not found!");
    }
}

// --- NEWS TICKER LOGIC ---
async function fetchGlobalNews() {
    const { data, error } = await supabaseClient
        .from('news_ticker')
        .select('content')
        .order('created_at', { ascending: false })
        .limit(30);

    // If the database has messages, overwrite the default array
    if (!error && data && data.length > 0) {
        window.globalNewsMessages = data.map(item => item.content);
    }
}

async function submitNewsBroadcast() {
    let inputEl = document.getElementById('news-input');
    let msg = inputEl.value.trim();
    let cooldownMsg = document.getElementById('news-cooldown-msg');
    
    if (!msg) return;

    // Check 1-minute local cooldown
    let lastSubmit = localStorage.getItem('incremental_last_news');
    if (lastSubmit && (Date.now() - parseInt(lastSubmit)) < 60000) {
        cooldownMsg.innerText = "Please wait 1 minute between broadcasts.";
        cooldownMsg.style.color = "#ff4444";
        return;
    }

    const { error } = await supabaseClient
        .from('news_ticker')
        .insert([{ content: msg, user_id: userId }]);

    if (error) {
        cooldownMsg.innerText = "Failed to broadcast. Ensure you ran the SQL script.";
        cooldownMsg.style.color = "#ff4444";
    } else {
        cooldownMsg.innerText = "Broadcast successful!";
        cooldownMsg.style.color = "#00ff00";
        inputEl.value = "";
        localStorage.setItem('incremental_last_news', Date.now());
        fetchGlobalNews(); // Grab the new message immediately
    }
}
