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
    grey: new Color(.58, .55, .53),
    darkGray: new Color(0.2, 0.2, 0.2),
};

const sound_start = new Sound([1.7, , 454, .01, .08, .13, 1, 3.7, , , 255, .08, , , , , , .83, .02, , 496]);
const sound_success = new Sound([, , 686, , .1, .11, 1, .7, , , 351, .06, , , , , , .61, .03]);;
const sound_fail = new Sound([, , 70, .01, .29, .4, 3, 1.2, , , , , , .1, 68, .8, , .45, .07]);

const ColorMenu = (pos, size, title) => new Menu(pos, size, title, {
    titleColor: PALETTE.grey,
    titleOutlineColor: PALETTE.darkGray,
    defaultTextColor: PALETTE.grey,
    buttonNormalColor: PALETTE.darkGray,
    buttonHoverColor: PALETTE.darkGray,
    buttonPressedColor: PALETTE.darkGray,
    buttonTextColor: PALETTE.darkGray,
    buttonBorderColor: PALETTE.grey
});

const onGridMouseDown = (index) => {
    grid.selectedIndex = index
    if (currentState === GameState.MEMORIZE) {
        grid.showReading[index] = true
    }
}

const onGridMouseUp = (index) => {
    if (currentState === GameState.MEMORIZE) {
        grid.showReading[index] = false
    } else if (currentState === GameState.RECALL) {
        checkAnswer(grid.selectedIndex)
    }
}

const ColorStaticGrid = (rows, cols, words, margin) => new StaticGrid(rows, cols, words, margin, onGridMouseDown, onGridMouseUp, {
    textColor: PALETTE.grey,
    selectedCellColor: PALETTE.grey
})

function startGame() {
    mobileGamepad.show()
    currentState = GameState.MEMORIZE;
    categoryIndex = nextValidIndex(categories, completed);
    if (categoryIndex === -1) {
        showResult();
        return
    }

    initializeGrid();
    grid.selectedIndex = 0;
    recallIndex = nextValidIndex(words, []);
    recallCompleted = [];
    hideTitleMenu();
}

function initializeGrid() {
    const category = categories[categoryIndex];
    currentCategory = category.category;
    words = category.words;
    if (grid)
        grid.destroy()
    grid = ColorStaticGrid(3, 3, words, 0.5);

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
                borderColor: PALETTE.grey
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
                borderColor: PALETTE.grey
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
        particleSplat(cameraPos, vec2(15), isMobile ? 25 : 50, PALETTE.grey)
        currentState = GameState.MEMORIZE
        nextCategory();
    }
}

function showResult() {
    hideTitleMenu()
    currentState = GameState.RESULT;

    const menu = ColorMenu(cameraPos.add(vec2(0, -7)), vec2(16, 12));
    menu.columns = 1;
    menu.addButton('Restart level', () => {
        menu.hide()
        menu.destroy()
        clearSave(game, currentLevel)
        startGame()
    });

    menu.addButton('Main menu', () => {
        menu.hide()
        menu.destroy()
        showTitleMenu()
    });
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
    drawText(currentCategory, cameraPos.add(vec2(0, 8)), 2, PALETTE.grey, 0.2, PALETTE.darkGray);
    if (keyIsDown(88) || grid.pressed) { // X Key
        const word = words[grid.selectedIndex];
        drawText(word.definition, cameraPos.add(vec2(0, -8)), 1, PALETTE.grey, 0.1, PALETTE.darkGray);
    }
    if (!isMobile)
        drawText('Press SPACE to recall', cameraPos.add(vec2(0, -10)), 1, PALETTE.grey, 0.1, PALETTE.darkGray);
}

function drawRecallScreen() {
    drawText(currentCategory, cameraPos.add(vec2(0, 8)), 2, PALETTE.grey, 0.2, PALETTE.darkGray);
    const word = words[recallIndex];
    drawText(word.reading, cameraPos.add(vec2(0, -8)), 0.8, PALETTE.grey, 0.1, PALETTE.darkGray);
    drawText(word.definition, cameraPos.add(vec2(0, -9.5)), 1.2, PALETTE.grey, 0.1, PALETTE.darkGray);
}

function drawResultScreen() {
    drawText(`上手くできたぞ！`, cameraPos.add(vec2(0, 3)), 3, PALETTE.grey, 0.2, PALETTE.darkGray);
}

engineInit(
    () => {
        canvasFixedSize = vec2(1280, 720);
        levelSize = vec2(20, 38);
        cameraPos = levelSize.scale(0.5);
        initTitleMenu();
        mobileGamepad.registerDefaultButtons();
        mobileGamepad.setButtonColor('#6482AD')
        drawShader();
    },
    () => {
        switch (currentState) {
            case GameState.TITLE:
                break;
            case GameState.MEMORIZE:
                if (!grid.pressed) {
                    if (keyIsDown(88)) {
                        grid.setShowReading(grid.selectedIndex, true)
                        return
                    }
                    grid.setShowReading(grid.selectedIndex, false)
                }

                if (keyWasPressed(32)) showRecall(); // Space
                break;
            case GameState.RECALL:
                handleInputUpdate();
                if (keyWasPressed(88)) checkAnswer(grid.selectedIndex); // X
                if (keyWasPressed(32)) startGame(currentLevel); // Space
                break;
            case GameState.RESULT:
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