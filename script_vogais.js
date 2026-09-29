// Configurações dos modos de jogo
const MODES = {
    vogais: {
        cols: 3,
        rows: 3,
        winningState: ['A', 'E', 'I', 'O', 'U', '🎨', '🎈', '⭐', ''],
        title: '✏️ Modo Vogais'
    },
    alfabeto: {
        cols: 4, // 4 colunas por linha
        rows: 7, // 7 linhas
        winningState: [
            'A', 'B', 'C', 'D',
            'E', 'F', 'G', 'H',
            'I', 'J', 'K', 'L',
            'M', 'N', 'O', 'P',
            'Q', 'R', 'S', 'T',
            'U', 'V', 'W', 'X',
            'Y', 'Z', '🏆', ''
        ],
        title: '🔤 Modo Alfabeto Completo'
    }
};

let currentMode = 'vogais';
let currentState = [];
let moves = 0;

// Elementos do DOM
let menuScreen, gameScreen, boardElement, movesElement, winMessageElement, gameTitleElement, targetSequenceElement;

document.addEventListener('DOMContentLoaded', () => {
    menuScreen = document.getElementById('menu-screen');
    gameScreen = document.getElementById('game-screen');
    boardElement = document.getElementById('board');
    movesElement = document.getElementById('moves-count');
    winMessageElement = document.getElementById('win-message');
    gameTitleElement = document.getElementById('game-title');
    targetSequenceElement = document.getElementById('target-sequence');
});

// Inicia um modo específico vindo do Menu
function startGame(modeKey) {
    currentMode = modeKey;
    menuScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    gameTitleElement.textContent = MODES[currentMode].title;
    
    initGame();
}

// Volta para o Menu Principal
function showMenu() {
    gameScreen.classList.add('hidden');
    menuScreen.classList.remove('hidden');
}

// Inicializa ou reinicia o jogo ativo
function initGame() {
    moves = 0;
    movesElement.textContent = moves;
    winMessageElement.classList.add('hidden');
    
    const config = MODES[currentMode];

    // Exibe a sequência-alvo como dica visual
    renderTargetHint(config.winningState);

    // Gera um estado SEMPRE solvível partindo do estado final resolvido
    currentState = shuffleByValidMoves([...config.winningState], config.cols, 80);

    renderBoard();
}

/**
 * Embaralha o tabuleiro realizando apenas movimentos válidos a partir da posição inicial.
 * Isso garante matematicamente 100% de probabilidade de vitória!
 */
function shuffleByValidMoves(stateArray, cols, movesCount) {
    let emptyIdx = stateArray.indexOf('');

    for (let i = 0; i < movesCount; i++) {
        const neighbors = getValidNeighbors(emptyIdx, cols, stateArray.length);
        const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];

        // Troca o espaço vazio com um vizinho válido
        [stateArray[emptyIdx], stateArray[randomNeighbor]] = [stateArray[randomNeighbor], stateArray[emptyIdx]];
        emptyIdx = randomNeighbor;
    }

    // Se por acaso terminar resolvido após o embaralhamento, faz mais alguns movimentos
    if (isSolved(stateArray)) {
        return shuffleByValidMoves(stateArray, cols, movesCount + 10);
    }

    return stateArray;
}

// Retorna os índices vizinhos válidos para mover no grid
function getValidNeighbors(emptyIndex, cols, totalItems) {
    const neighbors = [];
    const row = Math.floor(emptyIndex / cols);
    const col = emptyIndex % cols;

    // Cima
    if (row > 0) neighbors.push(emptyIndex - cols);
    // Baixo
    if (emptyIndex + cols < totalItems) neighbors.push(emptyIndex + cols);
    // Esquerda
    if (col > 0) neighbors.push(emptyIndex - 1);
    // Direita
    if (col < cols - 1) neighbors.push(emptyIndex + 1);

    return neighbors;
}

// Renderiza a dica do objetivo (Gabarito)
function renderTargetHint(winningState) {
    targetSequenceElement.innerHTML = '';
    
    winningState.forEach(item => {
        if (item !== '') {
            const span = document.createElement('span');
            span.className = 'bg-white border border-amber-300 px-2 py-0.5 rounded-lg shadow-sm';
            span.textContent = item;
            targetSequenceElement.appendChild(span);
        }
    });
}

// Renderiza as peças no tabuleiro
// Renderiza as peças no tabuleiro
function renderBoard() {
    boardElement.innerHTML = '';

    if (currentMode === 'alfabeto') {
        boardElement.className = `grid grid-cols-4 gap-1.5 bg-amber-200 p-2.5 rounded-2xl shadow-inner mb-3 max-w-sm mx-auto`;
    } else {
        boardElement.className = `grid grid-cols-3 gap-2 bg-amber-200 p-3 rounded-2xl shadow-inner aspect-square mb-3 max-w-xs mx-auto`;
    }

    currentState.forEach((value, index) => {
        const tile = document.createElement('button');

        if (value === '') {
            tile.className = 'bg-amber-200/50 rounded-xl cursor-default aspect-square';
        } else {
            const isLetter = value.match(/[A-Z]/i);
            const bgColor = isLetter ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : 'bg-pink-400 hover:bg-pink-500 text-white';

            // Tamanho de fonte ajustado para caber bem no celular no modo alfabeto
            const fontSize = currentMode === 'alfabeto' ? 'text-xl sm:text-2xl' : 'text-3xl sm:text-4xl';

            tile.className = `${bgColor} font-black ${fontSize} rounded-xl shadow-md flex items-center justify-center transition-all duration-150 transform active:scale-95 aspect-square`;
            tile.textContent = value;
            tile.addEventListener('click', () => moveTile(index));
        }

        boardElement.appendChild(tile);
    });
}

// Lógica de movimentação da peça
function moveTile(index) {
    const config = MODES[currentMode];
    const emptyIndex = currentState.indexOf('');
    
    const isAdjacent = checkAdjacency(index, emptyIndex, config.cols);

    if (isAdjacent) {
        [currentState[index], currentState[emptyIndex]] = [currentState[emptyIndex], currentState[index]];
        
        moves++;
        movesElement.textContent = moves;
        
        renderBoard();
        
        if (isSolved(currentState)) {
            winMessageElement.classList.remove('hidden');
            playWinSound();
        }
    }
}

// Verifica adjacência na grade
function checkAdjacency(idx1, idx2, cols) {
    const row1 = Math.floor(idx1 / cols);
    const col1 = idx1 % cols;
    const row2 = Math.floor(idx2 / cols);
    const col2 = idx2 % cols;

    return (Math.abs(row1 - row2) + Math.abs(col1 - col2)) === 1;
}

// Embaralhador
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Verifica vitória
function isSolved(state) {
    const win = MODES[currentMode].winningState;
    return state.every((val, idx) => val === win[idx]);
}

// Música/Sons de Vitória
function playWinSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        const notes = [261.63, 329.63, 392.00, 523.25];
        let time = ctx.currentTime;

        notes.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time + index * 0.12);

            gain.gain.setValueAtTime(0.3, time + index * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, time + index * 0.12 + 0.3);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(time + index * 0.12);
            osc.stop(time + index * 0.12 + 0.3);
        });
    } catch (e) {
        console.log('Áudio não suportado ou bloqueado.');
    }
}