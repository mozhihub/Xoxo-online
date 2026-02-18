const firebaseConfig = {
    apiKey: "AIzaSyBLyf_dz6xPC9wdthZSVtpatkc8JgFhE4Q",
    authDomain: "chatbox-chats.firebaseapp.com",
    projectId: "chatbox-chats",
    databaseURL: "https://chatbox-chats-default-rtdb.firebaseio.com", // Database URL mukkiyam
    storageBucket: "chatbox-chats.appspot.com",
    messagingSenderId: "10200860576",
    appId: "1:10200860576:web:262315d86f6d1732ddc6c5"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let roomId, myRole, gameRef;
let board = Array(9).fill("");

// Navigation
const showScreen = (id) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
};
const showJoinScreen = () => showScreen('join-screen');
const showMenu = () => showScreen('menu-screen');

// Host Game
async function hostGame() {
    roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    myRole = "X";
    gameRef = db.ref('rooms/' + roomId);
    
    await gameRef.set({
        board: board,
        turn: "X",
        playerCount: 1
    });

    initGame();
}

// Join Game
async function joinGame() {
    const input = document.getElementById('join-input').value.toUpperCase();
    if (input.length !== 6) return alert("Enter 6 digit code");
    
    roomId = input;
    gameRef = db.ref('rooms/' + roomId);
    const snap = await gameRef.get();
    
    if (snap.exists() && snap.val().playerCount < 2) {
        myRole = "O";
        await gameRef.update({ playerCount: 2 });
        initGame();
    } else {
        alert("Room Full or Not Found!");
    }
}

// Share Link
document.getElementById('share-btn').onclick = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    if (navigator.share) {
        navigator.share({ title: 'Join my XOX Game', url: url });
    } else {
        navigator.clipboard.writeText(url);
        alert("Link copied!");
    }
};

// Game Logic
function initGame() {
    document.getElementById('display-room-id').innerText = roomId;
    showScreen('game-screen');
    
    gameRef.on('value', (snap) => {
        const data = snap.val();
        if (!data) return;
        
        board = data.board;
        const turn = data.turn;
        
        // Update Board UI
        document.querySelectorAll('.cell').forEach((cell, i) => {
            cell.innerText = board[i];
            cell.className = `cell ${board[i].toLowerCase()}`;
        });

        // Update Status
        if (data.playerCount < 2) {
            document.getElementById('status').innerText = "Waiting for Player O...";
        } else {
            const win = checkWinner();
            if (win) {
                document.getElementById('status').innerText = win === "Draw" ? "It's a Draw!" : `Winner: ${win} 🎉`;
            } else {
                document.getElementById('status').innerText = (turn === myRole) ? "Your Turn!" : "Opponent's Turn...";
            }
        }
    });
}

// Click Cell
document.querySelectorAll('.cell').forEach(cell => {
    cell.onclick = () => {
        const i = cell.dataset.index;
        gameRef.once('value', snap => {
            const data = snap.val();
            if (data.playerCount === 2 && data.turn === myRole && board[i] === "" && !checkWinner()) {
                board[i] = myRole;
                gameRef.update({
                    board: board,
                    turn: myRole === "X" ? "O" : "X"
                });
            }
        });
    };
});

function checkWinner() {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let [a,b,c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return board.includes("") ? null : "Draw";
}

// Auto-join from URL
window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('room')) {
        document.getElementById('join-input').value = params.get('room');
        showJoinScreen();
    }
};

