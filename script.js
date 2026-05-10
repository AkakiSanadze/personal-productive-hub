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

// Weather - removed (not in HTML)

// Timer
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.querySelector('.timer-controls .btn:last-child');
const modeBtns = document.querySelectorAll('.mode-btn');
const timerRingContainer = document.getElementById('timerRingContainer');
const timerRingProgress = document.getElementById('timerRingProgress');

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
let timerInterval = null;
let timerSeconds = 25 * 60;
let currentMode = 'pomodoro';
let isRunning = false;

// Timer modes
const modes = {
    pomodoro: 25 * 60,
    break: 5 * 60,
    deepwork: 50 * 60
};

// Timer ring circumference
const CIRCUMFERENCE = 2 * Math.PI * 100; // r=100

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
    // Add slide-out animation before removing
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

// Event listeners for todo
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
    
    // Validate and prepend protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    
    links.push({ name, url });
    saveLinks();
    renderLinks();
    linkName.value = '';
    linkUrl.value = '';
}

// Event listeners for links
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

// ===== Timer Functions =====
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
    // Remove all mode classes
    timerRingContainer.classList.remove('break', 'deepwork');
    
    // Add appropriate class
    if (currentMode === 'break') {
        timerRingContainer.classList.add('break');
    } else if (currentMode === 'deepwork') {
        timerRingContainer.classList.add('deepwork');
    }
}

function startTimer() {
    if (isRunning) {
        // Pause
        clearInterval(timerInterval);
        isRunning = false;
        startBtn.textContent = '▶️ დაწყება';
    } else {
        // Start
        isRunning = true;
        startBtn.textContent = '⏸️ შეჩერება';
        timerInterval = setInterval(() => {
            timerSeconds--;
            updateTimerDisplay();
            
            if (timerSeconds <= 0) {
                clearInterval(timerInterval);
                isRunning = false;
                startBtn.textContent = '▶️ დაწყება';
                // Notification
                if (Notification.permission === 'granted') {
                    new Notification('⏰ ტაიმერი დასრულდა!');
                }
                // Reset to current mode duration
                timerSeconds = modes[currentMode];
                updateTimerDisplay();
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.textContent = '▶️ დაწყება';
    timerSeconds = modes[currentMode];
    updateTimerDisplay();
}

function selectMode(mode) {
    modeBtns.forEach(btn => btn.classList.remove('active'));
    const modeNames = { pomodoro: 0, break: 1, deepwork: 2 };
    modeBtns[modeNames[mode]].classList.add('active');
    currentMode = mode;
    updateTimerMode();
    resetTimer();
}

// Event listeners for timer
startBtn.addEventListener('click', startTimer);
resetBtn.addEventListener('click', resetTimer);
modeBtns.forEach(btn => {
    const modeMap = { 0: 'pomodoro', 1: 'break', 2: 'deepwork' };
    const idx = Array.from(modeBtns).indexOf(btn);
    btn.addEventListener('click', () => selectMode(modeMap[idx]));
});

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

// Notes event listeners
notesTextarea.addEventListener('input', () => {
    updateCharCounter();
    debouncedSave();
});

copyNotesBtn.addEventListener('click', copyNotes);
clearNotesBtn.addEventListener('click', clearNotes);

// ===== Crypto Functions =====
// CoinGecko API IDs
const CRYPTO_IDS = {
    sui: 'sui',
    atom: 'cosmos',
    vvv: 'vivi-protocol',
    diem: 'diem'
};

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
const CRYPTO_COOLDOWN = 60000; // 1 minute between requests

async function fetchCryptoPrices() {
    const now = Date.now();
    
    // Rate limit protection
    if (now - cryptoLastRequestTime < CRYPTO_COOLDOWN) {
        const remaining = Math.ceil((CRYPTO_COOLDOWN - (now - cryptoLastRequestTime)) / 1000);
        return; // Skip request, too soon
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
    // Refresh every 60 seconds
    cryptoRefreshInterval = setInterval(fetchCryptoPrices, 60000);
}

refreshCryptoBtn.addEventListener('click', fetchCryptoPrices);

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
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

init();
