'use strict';

let levelSize;

const GameState = {
    TITLE: 0,
    MEMORIZE: 1,
    RECALL: 2,
    RESULT: 3,
};
const game = 'tango-flip'
let currentState = GameState.TITLE;
let titleMenu;
let grid;
let currentLevel = '';
let currentCategory = '';
let words = [];
let selectedIndex = 0;
let recallIndex = 0;
let recallCompleted = []
let categories = [];
let categoryIndex = 0;
let completed = []

const isMobile = checkIsMobile()
let mobileRecallButton = null

// Color palette
const PALETTE = {
    white: new Color(0.9, 0.9, 0.9),
    lightGray: new Color(0.8, 0.8, 0.8),
    gray: new Color(0.5, 0.5, 0.5),
    darkGray: new Color(0.2, 0.2, 0.2),
    green: new Color(0.4, 0.5, 0.9),
};

const sound_start = new Sound([1.7, , 454, .01, .08, .13, 1, 3.7, , , 255, .08, , , , , , .83, .02, , 496]);
const sound_success = new Sound([2.4, , 95, .03, .07, .33, 2, 3.9, , , , , , .3, , 1, .07, .4, .26, .3]);
const sound_fail = new Sound([, , 493, , .02, .03, 1, 1.5, , , 41, , , , , , , .63, .01, .36, -1030]);

const ColorMenu = (pos, size, title) => new Menu(pos, size, title, {
    titleColor: PALETTE.green,
    titleOutlineColor: PALETTE.darkGray,
    defaultTextColor: PALETTE.green,
    buttonNormalColor: PALETTE.darkGray,
    buttonHoverColor: PALETTE.darkGray,
    buttonPressedColor: PALETTE.darkGray,
    buttonTextColor: PALETTE.darkGray,
    buttonBorderColor: PALETTE.green
});

function startGame() {
    mobileGamepad.show()

    currentState = GameState.MEMORIZE;
    categoryIndex = nextValidIndex(categories, completed);
    if (categoryIndex === -1) {
        showResult();
    }
    initializeGrid();
    selectedIndex = 0;
    recallIndex = 0;
    sound_start.play();
    hideTitleMenu();
}

function initializeGrid() {
    const category = categories[categoryIndex];
    currentCategory = category.category;
    words = category.words;
    if (grid)
        grid.destroy()
    grid = new StaticGrid(3, 3, words, 0.5);

    mobileRecallButton?.destroy()
    if (isMobile) {
        mobileRecallButton = new Button(
            cameraPos.add(vec2(0, -10)),
            vec2(6, 1.5),
            'RECALL',
            showRecall,
            undefined,
            {
                normalColor: PALETTE.darkGray,
                hoverColor: PALETTE.darkGray,
                pressedColor: PALETTE.darkGray,
                textColor: PALETTE.darkGray,
                borderColor: PALETTE.green
            })
    }
}

function nextCategory() {
    categoryIndex = nextValidIndex(categories, completed);
    initializeGrid();
    recallIndex = nextValidIndex(words, []);
}

function showRecall() {
    currentState = GameState.RECALL;
    grid.mask();

    mobileRecallButton?.destroy()
    if (isMobile) {
        mobileRecallButton = new Button(
            cameraPos.add(vec2(0, -10)),
            vec2(6, 1.5),
            'SKIP',
            () => checkAnswer(-1),
            undefined,
            {
                normalColor: PALETTE.darkGray,
                hoverColor: PALETTE.darkGray,
                pressedColor: PALETTE.darkGray,
                textColor: PALETTE.darkGray,
                borderColor: PALETTE.green
            })
    }
}

function checkAnswer(index) {
    clearInput()
    if (index === recallIndex) {
        grid.unmask(index);
        recallCompleted.push(recallIndex)
        recallIndex = nextValidIndex(words, recallCompleted);
        if (recallIndex === -1) {
            completed.push(categoryIndex)
            save(game, currentLevel, completed)
            startGame()
        }
        sound_success.play();
    } else {
        sound_fail.play();
        currentState = GameState.MEMORIZE
        nextCategory();
    }
}

function showResult() {
    currentState = GameState.RESULT;
}

function showTitleMenu() {
    mobileGamepad.hide()
    initTitleMenu();
    currentState = GameState.TITLE;
}

function initTitleMenu() {
    mobileRecallButton?.destroy()
    titleMenu?.destroy();
    titleMenu = ColorMenu(cameraPos, vec2(20, 14), '単語FLIP');
    titleMenu.addButton('How to Play', showHowTo);

    for (const level in compactSentences) {
        const nextIndex = nextValidIndex(compactSentences[level], load(game, level))
        titleMenu.addButton(level.toUpperCase(), () => {
            currentLevel = level;
            completed = load(game, level)
            categories = sentenceToJSON(compactSentences[level]);
            startGame(level)
        }, nextIndex === -1 ? '🏆' : undefined);
    }
}

function hideTitleMenu() {
    titleMenu?.hide();
    titleMenu?.destroy();
}

function showHowTo() {
    hideTitleMenu();
    const instructions = [
        "1. Memorize the words shown in the 3x3 grid.",
        "2. Each word is related to the subject shown above the grid.",
        "3. Use arrow keys to select different words.",
        "4. Press X to view a word's reading and definition.",
        "5. When ready, press SPACE to start the recall phase.",
        "6. In the recall phase, select the correct grid box for each word shown.",
        "7. Try to recall all words correctly!",
    ].join('\n');

    const howToMenu = ColorMenu(cameraPos, vec2(20, 14), 'How to Play');
    howToMenu.columns = 1;
    howToMenu.addTextBlock(instructions, 1.2);
    howToMenu.addButton('Back', () => {
        howToMenu.hide();
        howToMenu.destroy();
        showTitleMenu();
    });
}

function drawMemorizeScreen() {
    drawText(currentCategory, cameraPos.add(vec2(0, 8)), 2, PALETTE.white, 0.2, PALETTE.darkGray);
    grid.draw();
    if (keyIsDown(88)) { // X Key
        const word = words[selectedIndex];
        drawText(word.definition, cameraPos.add(vec2(0, -8)), 1, PALETTE.white, 0.1, PALETTE.darkGray);
    }
    if (!isMobile)
        drawText('Press SPACE to recall', cameraPos.add(vec2(0, -10)), 1, PALETTE.lightGray, 0.1, PALETTE.darkGray);
}

function drawRecallScreen() {
    drawText(currentCategory, cameraPos.add(vec2(0, 8)), 2, PALETTE.white, 0.2, PALETTE.darkGray);
    grid.draw();
    const word = words[recallIndex];
    drawText(word.definition, cameraPos.add(vec2(0, -8)), 1, PALETTE.white, 0.1, PALETTE.darkGray);
}

function drawResultScreen() {
    drawText(`上手くできたぞ！`, cameraPos.add(vec2(0, 3)), 3, PALETTE.white, 0.2, PALETTE.darkGray);
    drawText(`Press SPACE to return to menu`, cameraPos.add(vec2(0, -6)), 1, PALETTE.lightGray, 0.1, PALETTE.darkGray);
}

function handleInputUpdate() {
    if (keyWasPressed(37)) selectedIndex = (selectedIndex - 1 + 9) % 9; // Left
    if (keyWasPressed(39)) selectedIndex = (selectedIndex + 1) % 9; // Right
    if (keyWasPressed(38)) selectedIndex = (selectedIndex - 3 + 9) % 9; // Up 
    if (keyWasPressed(40)) selectedIndex = (selectedIndex + 3) % 9; // Down
}

engineInit(
    () => {
        canvasFixedSize = vec2(1280, 720);
        levelSize = vec2(20, 38);
        cameraPos = levelSize.scale(0.5);
        initTitleMenu();
        mobileGamepad.registerDefaultButtons();
        drawShader();
    },
    () => {
        switch (currentState) {
            case GameState.TITLE:
                break;
            case GameState.MEMORIZE:
                if (keyIsDown(88)) {
                    grid.setShowReading(selectedIndex, true)
                    return
                }
                grid.setShowReading(selectedIndex, false)

                handleInputUpdate();
                if (keyWasPressed(32)) showRecall(); // Space
                break;
            case GameState.RECALL:
                handleInputUpdate();
                if (keyWasPressed(88)) checkAnswer(selectedIndex); // X
                if (keyWasPressed(32)) startGame(currentLevel); // Space
                break;
            case GameState.RESULT:
                if (keyWasPressed(32)) showTitleMenu(); // Space
                break;
        }
    },
    () => { },
    () => {
        switch (currentState) {
            case GameState.TITLE:
                titleMenu?.render();
                break;
            case GameState.MEMORIZE:
                drawMemorizeScreen();
                break;
            case GameState.RECALL:
                drawRecallScreen();
                break;
            case GameState.RESULT:
                drawResultScreen();
                break;
        }
    },
    () => { },
);