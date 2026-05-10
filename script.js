// ===== DOM Elements =====
const clockEl = document.getElementById('clock');
const greetingEl = document.getElementById('greeting')?.querySelector('span');

// Todo
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const addTodoBtn = document.querySelector('.glass-card:first-of-type .btn-primary');

// Links
const linkName = document.getElementById('linkName');
const linkUrl = document.getElementById('linkUrl');
const linksGrid = document.getElementById('linksGrid');
const addLinkBtn = document.querySelector('.add-link-form .btn-primary');

// Notes
const notesTextarea = document.getElementById('notesTextarea');
const charCount = document.getElementById('charCount');
const saveIndicator = document.getElementById('saveIndicator');
const copyNotesBtn = document.getElementById('copyNotesBtn');
const clearNotesBtn = document.getElementById('clearNotesBtn');

// Crypto
const cryptoList = document.getElementById('cryptoList');
const cryptoLastUpdate = document.getElementById('cryptoLastUpdate');
const refreshCryptoBtn = document.getElementById('refreshCryptoBtn');

// ===== State =====
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let links = JSON.parse(localStorage.getItem('links')) || [];

// Pomodoro Timer
let timerInterval = null;
let timerSeconds = 25 * 60;
let currentMode = 'pomodoro';
let isRunning = false;

// Countdown Timers
let countdowns = [];
let countdownIntervals = {};
let audioContext = null;
let activeAlarmInterval = null;
let ringingCountdowns = new Set();

// Timer ring circumference
const CIRCUMFERENCE = 2 * Math.PI * 100;

// Timer modes
const modes = {
    pomodoro: 25 * 60,
    break: 5 * 60,
    deepwork: 50 * 60
};

// ===== Clock =====
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${hours}:${minutes}:${seconds}`;
    
    // Greeting
    const hour = now.getHours();
    let greeting = '';
    if (hour >= 5 && hour < 12) greeting = 'დილა მშვიდობისა';
    else if (hour >= 12 && hour < 17) greeting = 'შუადღე მშვიდობისა';
    else if (hour >= 17 && hour < 21) greeting = 'საღამო მშვიდობისა';
    else greeting = 'ღამე მშვიდობისა';
    if (greetingEl) greetingEl.textContent = greeting;
}

setInterval(updateClock, 1000);
updateClock();

// ===== Todo Functions =====
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function renderTodos() {
    todoList.innerHTML = '';
    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = `todo-item${todo.completed ? ' completed' : ''}`;
        li.innerHTML = `
            <div class="todo-checkbox${todo.completed ? ' checked' : ''}" data-index="${index}"></div>
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <button class="todo-delete" data-index="${index}">×</button>
        `;
        todoList.appendChild(li);
    });
}

function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;
    
    todos.push({ text, completed: false });
    saveTodos();
    renderTodos();
    todoInput.value = '';
}

function toggleTodo(index) {
    todos[index].completed = !todos[index].completed;
    saveTodos();
    renderTodos();
}

function deleteTodo(index) {
    const items = todoList.querySelectorAll('.todo-item');
    const item = items[index];
    if (item) {
        item.classList.add('slide-out');
        setTimeout(() => {
            todos.splice(index, 1);
            saveTodos();
            renderTodos();
        }, 300);
    }
}

addTodoBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});
todoList.addEventListener('click', (e) => {
    if (e.target.classList.contains('todo-checkbox')) {
        toggleTodo(parseInt(e.target.dataset.index));
    }
    if (e.target.classList.contains('todo-delete')) {
        deleteTodo(parseInt(e.target.dataset.index));
    }
});

// ===== Links Functions =====
function saveLinks() {
    localStorage.setItem('links', JSON.stringify(links));
}

function getRandomGradient() {
    const gradients = [
        'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
        'linear-gradient(135deg, #00b894 0%, #55efc4 100%)',
        'linear-gradient(135deg, #fdcb6e 0%, #ffeaa7 100%)',
        'linear-gradient(135deg, #e17055 0%, #fab1a0 100%)',
        'linear-gradient(135deg, #0984e3 0%, #74b9ff 100%)',
        'linear-gradient(135deg, #d63384 0%, #ff6bcb 100%)',
        'linear-gradient(135deg, #20c997 0%, #63e6be 100%)',
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
}

function renderLinks() {
    linksGrid.innerHTML = '';
    links.forEach((link, index) => {
        const div = document.createElement('div');
        div.className = 'link-item';
        div.innerHTML = `
            <div class="link-delete" data-index="${index}">×</div>
            <div class="link-icon" style="background: ${getRandomGradient()}">🔗</div>
            <span class="link-name">${escapeHtml(link.name)}</span>
        `;
        div.addEventListener('click', (e) => {
            if (!e.target.classList.contains('link-delete')) {
                window.open(link.url, '_blank');
            }
        });
        linksGrid.appendChild(div);
    });
}

function addLink() {
    const name = linkName.value.trim();
    let url = linkUrl.value.trim();
    
    if (!name || !url) return;
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    links.push({ name, url });
    saveLinks();
    renderLinks();
    linkName.value = '';
    linkUrl.value = '';
}

addLinkBtn.addEventListener('click', addLink);
linkUrl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addLink();
});
linksGrid.addEventListener('click', (e) => {
    if (e.target.classList.contains('link-delete')) {
        const index = parseInt(e.target.dataset.index);
        links.splice(index, 1);
        saveLinks();
        renderLinks();
    }
});

renderLinks();

// ===== Pomodoro Timer Functions =====
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateTimerDisplay() {
    timerDisplay.textContent = formatTime(timerSeconds);
    updateTimerRing();
}

function updateTimerRing() {
    const totalSeconds = modes[currentMode];
    const progress = timerSeconds / totalSeconds;
    const offset = CIRCUMFERENCE * (1 - progress);
    timerRingProgress.style.strokeDasharray = CIRCUMFERENCE;
    timerRingProgress.style.strokeDashoffset = offset;
}

function updateTimerMode() {
    timerRingContainer.classList.remove('break', 'deepwork');
    if (currentMode === 'break') {
        timerRingContainer.classList.add('break');
    } else if (currentMode === 'deepwork') {
        timerRingContainer.classList.add('deepwork');
    }
}

function togglePomodoro() {
    if (isRunning) {
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.textContent = '▶️ დაწყება';
    } else {
        isRunning = true;
        startBtn.textContent = '⏸️ შეჩერება';
        timerInterval = setInterval(() => {
            timerSeconds--;
            updateTimerDisplay();
            
            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                isRunning = false;
                startBtn.textContent = '▶️ დაწყება';
                if (Notification.permission === 'granted') {
                    new Notification('⏰ პომოდოროს ტაიმერი დასრულდა!');
                }
                playAlarmSound();
                timerSeconds = modes[currentMode];
                updateTimerDisplay();
            }
        }, 1000);
    }
}

function resetPomodoro() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.textContent = '▶️ დაწყება';
    timerSeconds = modes[currentMode];
    updateTimerDisplay();
}

function setPomodoroMode(mode) {
    const btns = document.querySelectorAll('#pomodoroSection .mode-btn');
    btns.forEach(btn => btn.classList.remove('active'));
    const modeNames = { pomodoro: 0, break: 1, deepwork: 2 };
    btns[modeNames[mode]]?.classList.add('active');
    currentMode = mode;
    updateTimerMode();
    resetPomodoro();
}

startBtn.addEventListener('click', togglePomodoro);
resetBtn.addEventListener('click', resetPomodoro);
modeBtns.forEach(btn => {
    const modeMap = { 0: 'pomodoro', 1: 'break', 2: 'deepwork' };
    const idx = Array.from(modeBtns).indexOf(btn);
    btn.addEventListener('click', () => selectMode(modeMap[idx]));
});
// Use the new setPomodoroMode for the inner buttons
document.querySelectorAll('#pomodoroSection .mode-btn').forEach(btn => {
    // Already handled in setPomodoroMode onclick
});

function selectMode(mode) {
    modeBtns.forEach(btn => btn.classList.remove('active'));
    const modeNames = { pomodoro: 0, break: 1, deepwork: 2 };
    modeBtns[modeNames[mode]]?.classList.add('active');
    currentMode = mode;
    updateTimerMode();
    resetPomodoro();
}

// Initialize pomodoro
updateTimerDisplay();
updateTimerMode();

// ===== Countdown Timer Functions =====
function switchTimerMode(mode) {
    const pomodoroSection = document.getElementById('pomodoroSection');
    const countdownSection = document.getElementById('countdownSection');
    const tabs = document.querySelectorAll('.widget-title + .timer-modes .mode-btn');
    
    tabs.forEach(tab => {
        if (tab.dataset.timerMode === mode) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    if (mode === 'pomodoro') {
        pomodoroSection.style.display = 'block';
        countdownSection.style.display = 'none';
    } else {
        pomodoroSection.style.display = 'none';
        countdownSection.style.display = 'block';
    }
}

function startCountdown() {
    const hours = parseInt(document.getElementById('countdownHours').value) || 0;
    const minutes = parseInt(document.getElementById('countdownMinutes').value) || 0;
    const seconds = parseInt(document.getElementById('countdownSeconds').value) || 0;
    
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    if (totalSeconds <= 0) return;
    
    const id = Date.now();
    const label = `⏱️ ტაიმერი ${countdowns.length + 1}`;
    
    countdowns.push({
        id,
        label,
        totalSeconds,
        remaining: totalSeconds,
        isRunning: true
    });
    
    document.getElementById('countdownHours').value = '';
    document.getElementById('countdownMinutes').value = '';
    document.getElementById('countdownSeconds').value = '';
    
    renderCountdowns();
    startCountdownInterval(id);
}

function startCountdownInterval(id) {
    const cd = countdowns.find(c => c.id === id);
    if (!cd) return;
    
    countdownIntervals[id] = setInterval(() => {
        const countdown = countdowns.find(c => c.id === id);
        if (!countdown || !countdown.isRunning) return;
        
        countdown.remaining--;
        updateCountdownDisplay(id);
        
        if (countdown.remaining <= 0) {
            clearInterval(countdownIntervals[id]);
            countdown.isRunning = false;
            countdown.remaining = 0;
            triggerAlarm(id);
        }
    }, 1000);
}

function updateCountdownDisplay(id) {
    const el = document.querySelector(`[data-countdown-id="${id}"] .countdown-item-time`);
    const cd = countdowns.find(c => c.id === id);
    if (el && cd) {
        const h = Math.floor(cd.remaining / 3600);
        const m = Math.floor((cd.remaining % 3600) / 60);
        const s = cd.remaining % 60;
        el.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        
        // Update ring
        const progress = cd.remaining / cd.totalSeconds;
        const ring = document.querySelector(`[data-countdown-id="${id}"] .countdown-ring-progress`);
        if (ring) {
            ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
        }
    }
}

function toggleCountdown(id) {
    const cd = countdowns.find(c => c.id === id);
    if (!cd) return;
    
    cd.isRunning = !cd.isRunning;
    
    if (cd.isRunning) {
        startCountdownInterval(id);
    } else {
        clearInterval(countdownIntervals[id]);
    }
    
    renderCountdowns();
}

function resetCountdownItem(id) {
    clearInterval(countdownIntervals[id]);
    const cd = countdowns.find(c => c.id === id);
    if (cd) {
        cd.remaining = cd.totalSeconds;
        cd.isRunning = false;
        stopAlarm(id);
        renderCountdowns();
    }
}

function deleteCountdown(id) {
    clearInterval(countdownIntervals[id]);
    stopAlarm(id);
    countdowns = countdowns.filter(c => c.id !== id);
    renderCountdowns();
}

function clearAllCountdowns() {
    countdowns.forEach(cd => {
        clearInterval(countdownIntervals[cd.id]);
        stopAlarm(cd.id);
    });
    countdowns = [];
    renderCountdowns();
}

function triggerAlarm(id) {
    ringingCountdowns.add(id);
    renderCountdowns();
    playAlarmSoundLoop();
}

function stopAlarm(id) {
    ringingCountdowns.delete(id);
    if (ringingCountdowns.size === 0) {
        stopAlarmSoundLoop();
    }
}

function playAlarmSoundLoop() {
    if (activeAlarmInterval) return;
    
    playAlarmSound();
    activeAlarmInterval = setInterval(() => {
        playAlarmSound();
    }, 3000);
}

function stopAlarmSoundLoop() {
    if (activeAlarmInterval) {
        clearInterval(activeAlarmInterval);
        activeAlarmInterval = null;
    }
}

function playAlarmSound() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Create a loud alarm sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 880;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
        // Second beep
        setTimeout(() => {
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.frequency.value = 1100;
            osc2.type = 'square';
            gain2.gain.setValueAtTime(0.5, audioContext.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            osc2.start(audioContext.currentTime);
            osc2.stop(audioContext.currentTime + 0.5);
        }, 200);
        
    } catch (e) {
        console.log('Audio not supported');
    }
}

function renderCountdowns() {
    const list = document.getElementById('countdownsList');
    list.innerHTML = '';
    
    countdowns.forEach(cd => {
        const h = Math.floor(cd.remaining / 3600);
        const m = Math.floor((cd.remaining % 3600) / 60);
        const s = cd.remaining % 60;
        const isRinging = ringingCountdowns.has(cd.id);
        const progress = cd.remaining / cd.totalSeconds;
        
        const item = document.createElement('div');
        item.className = `countdown-item${isRinging ? ' ringing' : ''}`;
        item.dataset.countdownId = cd.id;
        
        item.innerHTML = `
            <div class="countdown-item-icon">⏱️</div>
            <div class="countdown-item-info">
                <div class="countdown-item-label">${escapeHtml(cd.label)}</div>
                <div class="countdown-item-time">${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}</div>
            </div>
            <svg class="countdown-ring" viewBox="0 0 50 50" style="width:40px;height:40px;transform:rotate(-90deg);">
                <circle class="countdown-ring-bg" cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"/>
                <circle class="countdown-ring-progress" cx="25" cy="25" r="20" fill="none" stroke="${isRinging ? 'var(--danger)' : 'var(--accent)'}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${2 * Math.PI * 20}" stroke-dashoffset="${2 * Math.PI * 20 * (1 - progress)}"/>
            </svg>
            <div class="countdown-item-actions">
                ${isRinging 
                    ? `<button onclick="stopAlarm(${cd.id}); renderCountdowns();">🔇 გაჩუმება</button>`
                    : `<button onclick="toggleCountdown(${cd.id})">${cd.isRunning ? '⏸' : '▶️'}</button>`
                }
                <button onclick="resetCountdownItem(${cd.id})">↺</button>
                <button class="delete" onclick="deleteCountdown(${cd.id})">×</button>
            </div>
        `;
        
        list.appendChild(item);
    });
}

// Expose functions to global scope for onclick handlers
window.switchTimerMode = switchTimerMode;
window.setPomodoroMode = setPomodoroMode;
window.togglePomodoro = togglePomodoro;
window.resetPomodoro = resetPomodoro;
window.startCountdown = startCountdown;
window.toggleCountdown = toggleCountdown;
window.resetCountdownItem = resetCountdownItem;
window.deleteCountdown = deleteCountdown;
window.clearAllCountdowns = clearAllCountdowns;
window.stopAlarm = stopAlarm;

// ===== Notes Functions =====
let saveTimeout = null;

function loadNotes() {
    const savedNotes = localStorage.getItem('quickNotes');
    if (savedNotes) {
        notesTextarea.value = savedNotes;
        updateCharCounter();
    }
}

function saveNotes() {
    const text = notesTextarea.value;
    localStorage.setItem('quickNotes', text);
    showSaveIndicator();
}

function showSaveIndicator() {
    saveIndicator.classList.add('visible', 'saving');
    saveIndicator.querySelector('.save-text').textContent = 'ინახება...';
    
    setTimeout(() => {
        saveIndicator.classList.remove('saving');
        saveIndicator.querySelector('.save-text').textContent = 'შენახულია';
        
        setTimeout(() => {
            saveIndicator.classList.remove('visible');
        }, 2000);
    }, 300);
}

function updateCharCounter() {
    const count = notesTextarea.value.length;
    const max = 2000;
    charCount.textContent = count;
    
    const counter = charCount.parentElement;
    counter.classList.remove('warning', 'danger');
    
    if (count > max * 0.9) {
        counter.classList.add('danger');
    } else if (count > max * 0.75) {
        counter.classList.add('warning');
    }
}

function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveNotes, 500);
}

function copyNotes() {
    const text = notesTextarea.value;
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
        copyNotesBtn.textContent = '✓ დაკოპირდა!';
        setTimeout(() => {
            copyNotesBtn.textContent = '📋 კოპირება';
        }, 1500);
    });
}

function clearNotes() {
    if (notesTextarea.value && !confirm('ნამდვილად გსურთ ყველა ჩანაწერის წაშლა?')) {
        return;
    }
    
    notesTextarea.value = '';
    localStorage.removeItem('quickNotes');
    updateCharCounter();
    showSaveIndicator();
}

notesTextarea.addEventListener('input', () => {
    updateCharCounter();
    debouncedSave();
});

copyNotesBtn.addEventListener('click', copyNotes);
clearNotesBtn.addEventListener('click', clearNotes);

loadNotes();

// ===== Crypto Functions =====
const cryptoConfig = {
    btc: { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', gradient: 'linear-gradient(135deg, #f7931a 0%, #ffb74d 100%)' },
    eth: { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', gradient: 'linear-gradient(135deg, #627eea 0%, #90a4ff 100%)' },
    sol: { id: 'solana', symbol: 'SOL', name: 'Solana', gradient: 'linear-gradient(135deg, #9945ff 0%, #14f195 100%)' },
    ada: { id: 'cardano', symbol: 'ADA', name: 'Cardano', gradient: 'linear-gradient(135deg, #0033ad 0%, #1a73e8 100%)' },
    sui: { id: 'sui', symbol: 'SUI', name: 'Sui', gradient: 'linear-gradient(135deg, #4da2ff 0%, #7b61ff 100%)' },
    atom: { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos', gradient: 'linear-gradient(135deg, #2e3148 0%, #6f7590 100%)' },
    vvv: { id: 'venice-token', symbol: 'VVV', name: 'VIVI', gradient: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' },
    diem: { id: 'diem', symbol: 'DIEM', name: 'Diem', gradient: 'linear-gradient(135deg, #00d4aa 0%, #5a9fd4 100%)' }
};

let cryptoRefreshInterval = null;
let cryptoLastRequestTime = 0;
const CRYPTO_COOLDOWN = 60000;

async function fetchCryptoPrices() {
    const now = Date.now();
    
    if (now - cryptoLastRequestTime < CRYPTO_COOLDOWN) {
        return;
    }
    cryptoLastRequestTime = now;
    
    const ids = Object.values(cryptoConfig).map(c => c.id).join(',');
    
    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        );
        
        if (!response.ok) {
            throw new Error('API Error: ' + response.status);
        }
        
        const data = await response.json();
        renderCryptoList(data);
        updateCryptoLastUpdate();
        
    } catch (error) {
        cryptoList.innerHTML = `
            <div class="crypto-error">
                <span>❌ მონაცემები ვერ მოიძებნა</span>
                <span style="font-size: 0.75rem; color: var(--text-secondary);">${error.message}</span>
                <button class="btn btn-primary" onclick="fetchCryptoPrices()" style="margin-top: 8px;">🔄 ხელახლა</button>
            </div>
        `;
    }
}

function renderCryptoList(data) {
    cryptoList.innerHTML = '';
    
    Object.entries(cryptoConfig).forEach(([key, config]) => {
        const coinData = data[config.id];
        
        const item = document.createElement('div');
        item.className = 'crypto-item';
        
        if (coinData) {
            const price = coinData.usd;
            const change = coinData.usd_24h_change || 0;
            const changeClass = change >= 0 ? 'positive' : 'negative';
            const changeIcon = change >= 0 ? '↑' : '↓';
            
            item.innerHTML = `
                <div class="crypto-icon" style="background: ${config.gradient}">${config.symbol.charAt(0)}</div>
                <div class="crypto-info">
                    <div class="crypto-symbol">${config.symbol}</div>
                    <div class="crypto-name">${config.name}</div>
                </div>
                <div class="crypto-price-block">
                    <div class="crypto-price">$${formatPrice(price)}</div>
                    <div class="crypto-change ${changeClass}">${changeIcon} ${Math.abs(change).toFixed(2)}%</div>
                </div>
            `;
        } else {
            item.innerHTML = `
                <div class="crypto-icon" style="background: ${config.gradient}">${config.symbol.charAt(0)}</div>
                <div class="crypto-info">
                    <div class="crypto-symbol">${config.symbol}</div>
                    <div class="crypto-name">${config.name}</div>
                </div>
                <div class="crypto-price-block">
                    <div class="crypto-price" style="color: var(--text-secondary)">--</div>
                    <div class="crypto-change" style="color: var(--text-secondary)">არ მოიძებნა</div>
                </div>
            `;
        }
        
        cryptoList.appendChild(item);
    });
}

function formatPrice(price) {
    if (price >= 1000) {
        return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    } else if (price >= 1) {
        return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (price >= 0.01) {
        return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    } else {
        return price.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 });
    }
}

function updateCryptoLastUpdate() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    cryptoLastUpdate.textContent = `ბოლო: ${hours}:${minutes}`;
}

function startCryptoRefresh() {
    cryptoRefreshInterval = setInterval(fetchCryptoPrices, 60000);
}

refreshCryptoBtn.addEventListener('click', fetchCryptoPrices);

fetchCryptoPrices();
startCryptoRefresh();

// ===== Utility Functions =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Initialize =====
function init() {
    renderTodos();
    renderLinks();
    updateTimerDisplay();
    updateTimerMode();
    loadNotes();
    fetchCryptoPrices();
    startCryptoRefresh();
    switchTimerMode('pomodoro');
    
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

init();