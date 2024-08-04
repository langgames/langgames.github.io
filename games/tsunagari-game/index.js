'use strict';

let levelSize;
let currentState;
let titleMenu, howToPlayMenu, resultMenu;
let grid;
let currentLevel = '';
// used as a filter to only show curr words (categories can have more than four words)
let allWords = [];
let words = [];
let completedCategories = [];
let submitButton;
let categories = []

const GameState = {
    TITLE: 0,
    HOW_TO_PLAY: 1,
    GAME: 2,
    RESULT: 3
};


const sound_start = new Sound([1.7, , 454, .01, .08, .13, 1, 3.7, , , 255, .08, , , , , , .83, .02, , 496]);
const sound_success = new Sound([2.4, , 95, .03, .07, .33, 2, 3.9, , , , , , .3, , 1, .07, .4, .26, .3]);
const sound_fail = new Sound([, , 493, , .02, .03, 1, 1.5, , , 41, , , , , , , .63, .01, .36, -1030]);

////////////////////////////////////////////////////////////////
const PALETTE = {
    white: new Color(0.9, 0.9, 0.9),
    gray: new Color(0.5, 0.5, 0.5),
    darkGray: new Color(0.2, 0.2, 0.2),
    lightGray: new Color(0.8, 0.8, 0.8),
};

const ColorMenu = (pos, size, title) => new Menu(pos, size, title, {
    titleColor: PALETTE.lightGray,
    titleOutlineColor: PALETTE.darkGray,
    defaultTextColor: PALETTE.lightGray,
    buttonNormalColor: PALETTE.darkGray,
    buttonHoverColor: PALETTE.darkGray,
    buttonPressedColor: PALETTE.gray,
    buttonTextColor: PALETTE.darkGray,
    buttonBorderColor: PALETTE.lightGray
});

////////////////////////////////////////////////////////////////

function startGame(level) {
    removeTitleMenu();
    mobileGamepad?.show()
    currentState = GameState.GAME;
    currentLevel = level;

    const gameData = selectWordsForGame(level);
    allWords = gameData.words
    words = gameData.words;
    categories = gameData.categories;

    completedCategories = [];
    initializeGrid();
    initializeSubmitButton();
    sound_start.play();
}

function animateCorrectGroup(category) {
    const startPos = cameraPos.add(vec2(0,));
    new FadeInCategory(category, startPos);
}

function checkSelectedWords() {
    const markedWords = grid.words.filter((_, index) => grid.marked[index]);
    const category = categories.find(cat =>
        markedWords.every(word => cat.words.some(w => w.word === word.word))
    );

    if (category) {
        sound_success.play();
        completedCategories.push(category);
        removeCompletedCategory(category);
        updateGrid();
    } else {
        sound_fail.play();
        shakeIncorrectWords();
    }

    grid.unmark();
    submitButton.enabled = false;

    if (categories.length <= 1) {
        const lastCat = categories.find(cat =>
            words.every(word => cat.words.some(w => w.word === word.word))
        );
        completedCategories.push(lastCat);
        removeCompletedCategory(lastCat);
        updateGrid();

        submitButton.text = "Continue"
        submitButton.onClick = showResult
        submitButton.enabled = true
    }
}

function removeCompletedCategory(category) {
    categories = categories.filter(cat => cat !== category);
    words = words.filter(word => !category.words.some(w => w.word === word.word));
}

function updateGrid() {
    const rows = Math.floor(words.length / 4);
    grid?.destroy();
    grid = new StaticGrid(rows, 4, words, 0.5, onGridMouseDown, onGridMouseUp, {
        textColor: PALETTE.grey,
        selectedCellColor: PALETTE.lightGray,
    });
    grid.pos = grid.pos.subtract(vec2(0, (grid.cellSize.y / 2) * (4 - grid.rows)))
}

function onGridMouseDown(index) {
    grid.selectedIndex = index;
    grid.setShowReading(index, true)
}

function onGridMouseUp(index) {
    grid.setShowReading(index, false)
}

function initializeGrid() {
    updateGrid()
}

function initializeSubmitButton() {
    submitButton = new Button(
        cameraPos.add(vec2(0, -10)),
        vec2(6, 1.5),
        'Submit',
        checkSelectedWords,
        undefined,
        {
            normalColor: PALETTE.darkGray,
            hoverColor: PALETTE.gray,
            pressedColor: PALETTE.darkGray,
            textColor: PALETTE.darkGray,
            borderColor: PALETTE.lightGray
        }
    );
    submitButton.disabledMessagePos = cameraPos.add(vec2(0, 10))
    submitButton.disabledOnClickMessage = "Choose four words (Z and Arrow Keys)"
    submitButton.enabled = false
}


function shakeIncorrectWords() {
    // TODO: Implement shaking animation for incorrect words
}

function showResult() {
    currentState = GameState.RESULT;
    grid?.destroy()
    submitButton?.destroy();
    initializeResultMenu();
}

function showTitleMenu() {
    currentState = GameState.TITLE;
    initializeTitleMenu();
}

function removeTitleMenu() {
    titleMenu?.hide()
    titleMenu?.destroy()
}

function initializeTitleMenu() {
    if (titleMenu) titleMenu.destroy();
    mobileGamepad?.hide()
    titleMenu = ColorMenu(cameraPos, vec2(20, 14), 'つながりGAME');
    titleMenu.addButton('How to Play', () => {
        removeTitleMenu()
        showHowToPlay()
    });

    for (const level in compactSentences) {
        titleMenu.addButton(level.toUpperCase(), () => startGame(level));
    }
}

function showHowToPlay() {
    currentState = GameState.HOW_TO_PLAY;
    initializeHowToPlayMenu();
}

function initializeHowToPlayMenu() {
    const instructions = [
        "1. Find groups of four related words.",
        "2. Select words by clicking or pressing 'Z'.",
        "3. Press 'X' to view word info.",
        "4. Click 'Submit' when you've selected four words.",
        "5. Correct groups move to the top.",
        "6. Complete all four groups to win!",
    ].join('\n');

    howToPlayMenu = ColorMenu(cameraPos, vec2(20, 14), 'How to Play');
    howToPlayMenu.columns = 1;
    howToPlayMenu.addTextBlock(instructions, 1.2);
    howToPlayMenu.addButton('Back', () => {
        howToPlayMenu?.hide()
        howToPlayMenu?.destroy()
        showTitleMenu()
    });
}

function initializeResultMenu() {
    resultMenu = ColorMenu(cameraPos, vec2(20, 14), 'Level Complete!');
    resultMenu.columns = 1;
    resultMenu.addButton('Play Again', () => {
        resultMenu?.hide();
        resultMenu?.destroy();
        startGame(currentLevel)
    });
    resultMenu.addButton('Main Menu', () => {
        resultMenu?.hide();
        resultMenu?.destroy();
        showTitleMenu()
    });
}

function drawWord() {
    if (keyIsDown(88) || grid.pressed) { // X Key
        const word = words[grid.selectedIndex];
        drawText(word.definition, cameraPos.add(vec2(0, -8)), 1, PALETTE.grey, 0.1, PALETTE.darkGray);
    }
}

function drawCompleted() {
    for (const [index, cat] of completedCategories.entries()) {
        const fontSize = grid.fontSize;
        const rectCenter = grid.pos.add(vec2(0, (grid.cellSize.y + grid.margin) * ((1 + grid.rows) / 2 + index)));
        const catPos = rectCenter.add(vec2(0, grid.cellSize.y / 4 - (fontSize * 1.2) / 2 + 0.25));
        const wordPos = rectCenter.subtract(vec2(0, grid.cellSize.y / 4 - fontSize / 2 + 0.25));

        drawRect(rectCenter, vec2(grid.totalSize.x, grid.cellSize.y), grid.cellColor)

        drawText(cat.category, catPos, fontSize * 1.2);

        const allWs = allWords.map(w => w.word)
        const text = cat.words.filter(w => allWs.includes(w.word)).map(w => w.word).join('・')
        const wrappedText = wrapText(text, grid.totalSize.x, 3, '・')
        const lines = wrappedText.split('\n').length
        drawText(wrappedText, wordPos.add(vec2(0, (lines - 1) * fontSize / 2)), fontSize - (lines - 1) * 0.1);
    }
}

engineInit(
    () => {
        // Initialize game
        canvasFixedSize = vec2(1280, 720);
        levelSize = vec2(20);
        cameraPos = levelSize.scale(0.5);
        showTitleMenu();
        mobileGamepad.registerDefaultButtons();
        mobileGamepad.setButtonColor(PALETTE.darkGray.toString())
        drawShader();
    },
    () => {
        // Game update logic
        switch (currentState) {
            case GameState.TITLE:
                break;
            case GameState.HOW_TO_PLAY:
                break;
            case GameState.GAME:
                if (!grid.pressed) {
                    if (keyIsDown(88)) {
                        grid.setShowReading(grid.selectedIndex, true)
                        return
                    }
                    grid.setShowReading(grid.selectedIndex, false)
                }
                if (keyWasPressed(90)) { // Z key
                    const full = grid.numMarked >= CATEGORY_SIZE
                    grid.marked[grid.selectedIndex] = !full && !grid.marked[grid.selectedIndex]
                    submitButton.enabled = (grid.numMarked + 1) >= CATEGORY_SIZE;
                }
                break;
            case GameState.RESULT:
                break;
        }
    },
    () => {
        // Post update
    },
    () => {
        // Post render
    },
    () => {
        // Render
        switch (currentState) {
            case GameState.TITLE:
                break;
            case GameState.HOW_TO_PLAY:
                break;
            case GameState.GAME:
                drawWord();
                drawCompleted();
                break;
            case GameState.RESULT:
                break;
        }
    },
);