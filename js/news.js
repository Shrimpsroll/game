window.globalNewsMessages = ["Waiting for a player to broadcast the first message..."];

function initNewsTicker() {
    const tickerEl = document.getElementById('news-ticker');
    const containerWidth = document.querySelector('.news-ticker-container').offsetWidth;
    
    let currentNewsIndex = 0;
    tickerEl.innerText = window.globalNewsMessages[currentNewsIndex];
    
    let pos = containerWidth;
    tickerEl.style.transform = `translateX(${pos}px)`;

    function animateTicker() {
        pos -= 1.5; 
        tickerEl.style.transform = `translateX(${pos}px)`;

        // When the text fully scrolls off the left side
        if (pos < -tickerEl.offsetWidth - 50) {
            // Move to next message, wrapping around
            currentNewsIndex = (currentNewsIndex + 1) % window.globalNewsMessages.length;
            tickerEl.innerText = window.globalNewsMessages[currentNewsIndex];
            
            // Reset position to the right side
            pos = window.innerWidth;
        }
        requestAnimationFrame(animateTicker);
    }
    
    requestAnimationFrame(animateTicker);
}