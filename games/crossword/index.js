
// Global variables
let crossword;
let gameState = 'playing'; // 'playing' or 'completed'
let levelSize;

const samplePuzzleData = {
    "answers": {
        "across": [
            "ございます",
        ],
        "down": [
            "あさごはん",
        ]
    },
    "clues": {
        "across": [
            "2. To exist politely",
        ],
        "down": [
            "1. Morning meal"
        ]
    },
    "grid": [
        "あ", ".", ".", ".", ".",
        "さ", ".", ".", ".", ".",
        "ご", "ざ", "い", "ま", "す",
        "は", ".", ".", ".", ".",
        "ん", ".", ".", ".", "."
    ],
    "gridnums": [
        1, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        2, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
    ],
    "size": {
        "cols": 5,
        "rows": 5
    }
}

function gameInit() {
    inputWASDEmulateDirection = false

    // Set up the canvas
    canvasFixedSize = vec2(1280, 720);
    levelSize = vec2(20, 38);
    cameraPos = levelSize.scale(0.5);

    // Create the crossword puzzle
    const puzzleSize = vec2(15); // Adjust as needed
    crossword = new KanaCrossword(samplePuzzleData, cameraPos, puzzleSize);
}

function gameUpdate() {
    // Check if the puzzle is completed
    if (crossword.isPuzzleCompleted()) {
        gameState = 'completed';
    }
}

function gameUpdatePost() {
    // This function is called after physics and objects are updated
}

function gameRender() {
    // Clear the canvas
    drawRect(cameraPos, levelSize, new Color(0.9, 0.9, 0.9));

    // Render game state and instructions
    if (gameState === 'playing') {
        drawText("Use mouse to select cells and keyboard to enter letters",
            cameraPos.add(vec2(0, -12)), 0.5, new Color(0, 0, 0));
    } else if (gameState === 'completed') {
        drawText("Puzzle Completed! Press 'R' to restart",
            cameraPos.add(vec2(0, -12)), 0.7, new Color(0, 0.5, 0));
    }
}

function gameRenderPost() {
    // This function is called after all objects are rendered
}

function restartGame() {
    // Reset the crossword and game state
    crossword.userInput = Array(crossword.cols * crossword.rows).fill('');
    crossword.selectedCell = vec2();
    gameState = 'playing';
}

// Start the LittleJS engine
engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);