// UNGA DATABASE URL-AH INGA UPDATE PANNUNGA
const firebaseConfig = {
    apiKey: "AIzaSyBLyf_dz6xPC9wdthZSVtpatkc8JgFhE4Q",
    authDomain: "chatbox-chats.firebaseapp.com",
    projectId: "chatbox-chats",
    databaseURL: "https://chatbox-chats-default-rtdb.firebaseio.com", // Idhu correct-ah irukkanu paarunga
    storageBucket: "chatbox-chats.appspot.com",
    messagingSenderId: "10200860576",
    appId: "1:10200860576:web:262315d86f6d1732ddc6c5"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let roomId, myRole, gameRef, soundOn = true;
let board = Array(9).fill("");

// UI Navigation Functions
window.hostGame = async function() {
    console.log("Hosting game...");
    roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    myRole = "X";
    gameRef = db.ref('rooms/' + roomId);
    
    await gameRef.set({
        board: board,
        turn: "X",
        players: 1,
        config: { color: '#0f172a', coinIdx: 0 }
    });
    
    setupGame();
    document.getElementById('game-info-pop').style.display = 'flex';
};

window.showJoin = function() {
    document.getElementById('menu-screen').classList.remove('active');
    document.getElementById('join-screen').classList.add('active');
};

window.joinGame = async function() {
    const input = document.getElementById('join-input').value.toUpperCase();
    if (input.length !== 6) return alert("Enter 6 digit code");
    
    roomId = input;
    gameRef = db.ref('rooms/' + roomId);
    const snap = await gameRef.once('value');
    
    if (snap.exists() && snap.val().players < 2) {
        myRole = "O";
        await gameRef.update({ players: 2 });
        setupGame();
    } else {
        alert("Room Full or Invalid Code!");
    }
};

function setupGame() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('display-room-id').innerText = roomId;

    gameRef.on('value', snap => {
        const data = snap.val();
        if (!data) return;
        
        board = data.board;
        // Turn and UI updates...
        renderBoard();
        
        const win = checkWinner();
        if (win) {
            document.getElementById('status').innerText = win === "Draw" ? "Match Draw!" : `Winner: ${win}`;
            setTimeout(() => gameRef.update({ board: Array(9).fill(""), turn: "X" }), 3000);
        } else {
            document.getElementById('status').innerText = data.players < 2 ? "Waiting for Player O..." : (data.turn === myRole ? "Your Turn" : "Opponent's Turn");
        }
    });
}

function renderBoard() {
    document.querySelectorAll('.cell').forEach((cell, i) => {
        cell.innerText = board[i];
    });
}

// Cell click handler
document.querySelectorAll('.cell').forEach(cell => {
    cell.onclick = () => {
        const i = cell.dataset.index;
        if (board[i] === "" && myRole) {
            gameRef.once('value', snap => {
                const d = snap.val();
                if (d.turn === myRole && d.players === 2) {
                    board[i] = myRole;
                    gameRef.update({ board: board, turn: myRole === "X" ? "O" : "X" });
                }
            });
        }
    };
});

function checkWinner() {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let [a,b,c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return board.includes("") ? null : "Draw";
}
