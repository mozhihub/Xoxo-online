const firebaseConfig = {
    apiKey: "AIzaSyBLyf_dz6xPC9wdthZSVtpatkc8JgFhE4Q",
    authDomain: "chatbox-chats.firebaseapp.com",
    projectId: "chatbox-chats",
    databaseURL: "https://chatbox-chats-default-rtdb.firebaseio.com",
    appId: "1:10200860576:web:262315d86f6d1732ddc6c5"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let roomId, myRole, gameRef, soundOn = true;
let board = Array(9).fill("");
const winSound = new Audio('https://actions.google.com/sounds/v1/cartoon/clime_up_the_ladder.ogg');
const clickSound = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');

// Customization Data
const colors = ['#0f172a', '#4c1d95', '#064e3b', '#78350f', '#450a0a', '#1e1b4b', '#0f766e', '#be123c', '#111827', '#3f2b96'];
const coins = ['X/O', '🔥/❄️', '👑/💎', '🍎/🍊', '👻/💀', '⚽/🏀', '❤️/💙', '⭐/🌙', '⚡/🌊', '🐱/🐶', '🎮/🕹️', '🎸/🥁', '🚀/🛸', '🍕/🍔', '🍦/🍩', '🦊/🦁', '🐼/🐨', '🌻/🌹', '🌈/☁️', '🌞/🌛'];
let currentCoinSet = ["X", "O"];

// UI Elements
const showScreen = id => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};

function toggleSettings() {
    const s = document.getElementById('settings');
    s.style.display = s.style.display === 'block' ? 'none' : 'block';
}

function toggleSound() {
    soundOn = !soundOn;
    document.getElementById('sound-btn').innerText = soundOn ? "ON" : "OFF";
}

// Host & Join
async function hostGame() {
    roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    myRole = "X";
    gameRef = db.ref('rooms/' + roomId);
    await gameRef.set({ board, turn: "X", players: 1, config: { color: colors[0], coinIdx: 0 } });
    setupGame();
    document.getElementById('game-info-pop').style.display = 'flex';
}

async function joinGame() {
    roomId = document.getElementById('join-input').value.toUpperCase();
    gameRef = db.ref('rooms/' + roomId);
    const snap = await gameRef.get();
    if (snap.exists() && snap.val().players < 2) {
        myRole = "O";
        await gameRef.update({ players: 2 });
        setupGame();
    } else alert("Room Not Available");
}

function setupGame() {
    showScreen('game-screen');
    document.getElementById('display-room-id').innerText = roomId;
    
    gameRef.on('value', snap => {
        const data = snap.val();
        if (!data) return;
        
        board = data.board;
        currentCoinSet = coins[data.config.coinIdx].split('/');
        document.body.style.setProperty('--board-bg', data.config.color);
        
        if (data.players >= 2) {
            document.getElementById('share-btn').style.display = 'none';
            document.getElementById('dots').style.display = 'block';
        }

        // Win/Draw Check -> Auto Restart Match
        const win = checkWinner();
        if (win) {
            if (soundOn) winSound.play();
            document.getElementById('status').innerText = win === "Draw" ? "Match Draw!" : `Player ${win} Wins!`;
            setTimeout(() => {
                gameRef.update({ board: Array(9).fill(""), turn: "X" });
            }, 3000); // 3 seconds apram restart aagum
        } else {
            document.getElementById('status').innerText = data.players < 2 ? "Waiting..." : (data.turn === myRole ? "Your Turn" : "Opponent's Turn");
        }

        renderBoard();
    });
}

function renderBoard() {
    document.querySelectorAll('.cell').forEach((cell, i) => {
        const val = board[i];
        cell.innerText = val === "X" ? currentCoinSet[0] : (val === "O" ? currentCoinSet[1] : "");
        cell.className = `cell ${val.toLowerCase()}`;
    });
}

document.querySelectorAll('.cell').forEach(cell => {
    cell.onclick = () => {
        const i = cell.dataset.index;
        gameRef.once('value', snap => {
            const d = snap.val();
            if (d.players === 2 && d.turn === myRole && board[i] === "" && !checkWinner()) {
                if (soundOn) clickSound.play();
                board[i] = myRole;
                gameRef.update({ board, turn: myRole === "X" ? "O" : "X" });
            }
        });
    };
});

// Customization Setup
colors.forEach(c => {
    const d = document.createElement('div');
    d.className = 'color-dot';
    d.style.background = c;
    d.onclick = () => gameRef.update({ "config/color": c });
    document.getElementById('board-colors').appendChild(d);
});

coins.forEach((c, i) => {
    const d = document.createElement('div');
    d.className = 'coin-opt';
    d.innerText = c;
    d.onclick = () => gameRef.update({ "config/coinIdx": i });
    document.getElementById('coin-styles').appendChild(d);
});

function checkWinner() {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let [a,b,c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return board.includes("") ? null : "Draw";
}

function closePop() { document.getElementById('game-info-pop').style.display = 'none'; }
