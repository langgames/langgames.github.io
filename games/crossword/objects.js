class Crossword extends EngineObject {
    constructor(puzzleData, pos, size) {
        super(pos, size);
        this.puzzleData = puzzleData;
        this.grid = puzzleData.grid;
        this.gridnums = puzzleData.gridnums;
        this.clues = {
            across: puzzleData.clues.across,
            down: puzzleData.clues.down
        };
        this.answers = {
            across: puzzleData.answers.across,
            down: puzzleData.answers.down
        };
        this.cols = puzzleData.size.cols;
        this.rows = puzzleData.size.rows;
        this.cellSize = vec2(this.size.x / this.cols, this.size.y / this.rows);
        this.userInput = Array(this.cols * this.rows).fill('');
        this.selectedCell = vec2();
        this.currentClueNumber = this.findFirstClueNumber();
        this.direction = 'across';

        if (!this.getActiveClue()) {
            this.swapDirection()
        }
    }

    swapDirection() {
        this.direction = this.direction === 'across' ? 'down' : 'across'
    }

    findFirstClueNumber() {
        for (let i = 0; i < this.gridnums.length; i++) {
            if (this.gridnums[i] !== 0) {
                return this.gridnums[i];
            }
        }
        return 1; // Default to 1 if no clue number found
    }

    getWordBoundaries() {
        const { x, y } = this.selectedCell;
        let start = this.direction === 'across' ? x : y;
        let end = start;

        if (this.direction === 'across') {
            while (start > 0 && this.grid[y * this.cols + (start - 1)] !== '.') start--;
            while (end < this.cols - 1 && this.grid[y * this.cols + (end + 1)] !== '.') end++;
        } else {
            while (start > 0 && this.grid[(start - 1) * this.cols + x] !== '.') start--;
            while (end < this.rows - 1 && this.grid[(end + 1) * this.cols + x] !== '.') end++;
        }

        return { start, end };
    }

    moveWithinWord(forward = true) {
        const { start, end } = this.getWordBoundaries();
        const key = this.direction === 'across' ? 'x' : 'y'
        const v = this.selectedCell[key]

        let newPos = v;
        if (!forward) {
            // if deletion always move back one without wrapping
            newPos = v + (v === start ? 0 : -1)
            this.selectedCell[key] = newPos;
            return
        }

        const cell = this.selectedCell.copy()
        let index = cell.y * this.cols + cell.x;
        const currEmpty = !this.userInput[index]
        let hit = false;

        if (currEmpty || v === end) {
            // find the next empty cell
            let i = v === end ? start : v + 1
            for (; i !== v; i = (i == end ? start : i + 1)) {
                cell[key] = i
                index = cell.y * this.cols + cell.x;
                if (!this.userInput[index]) {
                    newPos = i;
                    hit = true
                    break;
                }
            }
        }

        if (!hit && v !== end)
            newPos = v + 1

        this.selectedCell[key] = newPos;
    }

    update() {
        if (mouseWasPressed(0)) {
            const clickPos = mousePos.subtract(this.pos).add(this.size.scale(0.5));
            const cellX = Math.floor(clickPos.x / this.cellSize.x);
            const cellY = this.rows - 1 - Math.floor(clickPos.y / this.cellSize.y);
            if (cellX >= 0 && cellX < this.cols && cellY >= 0 && cellY < this.rows) {
                this.selectedCell = vec2(cellX, cellY);
                this.updateCurrentClueNumber();
                if (!this.getActiveClue()) {
                    this.swapDirection()
                    this.updateCurrentClueNumber();
                }
            }
        }

        for (let key = 65; key <= 90; key++) {
            if (keyWasPressed(key)) {
                const letter = String.fromCharCode(key);
                const index = this.selectedCell.y * this.cols + this.selectedCell.x;
                this.moveWithinWord(true);
                this.userInput[index] = letter;
            }
        }

        if (keyWasPressed(8)) { // Backspace
            this.handleDeletePressed()
        }

        this.handleArrowKeyPress()
    }

    handleDeletePressed() {
        let index = this.selectedCell.y * this.cols + this.selectedCell.x;

        if (!this.userInput[index])
            this.moveWithinWord(false)

        index = this.selectedCell.y * this.cols + this.selectedCell.x;
        this.userInput[index] = '';
    }

    handleArrowKeyPress() {
        // Arrow key navigation with direction update, only update the selection if the direction doesn't change
        if (keyWasPressed(37)) { !this.changeDirection('across') && this.moveSelection(-1, 0); } // Left
        if (keyWasPressed(39)) { !this.changeDirection('across') && this.moveSelection(1, 0); }  // Right
        if (keyWasPressed(38)) { !this.changeDirection('down') && this.moveSelection(0, -1); }   // Up
        if (keyWasPressed(40)) { !this.changeDirection('down') && this.moveSelection(0, 1); }    // Down
    }

    changeDirection(newDirection) {
        if (this.direction !== newDirection) {
            const clueNumber = this.getClueNumber(newDirection)
            if (this.getClue(newDirection, clueNumber)) {
                this.direction = newDirection;
                this.updateCurrentClueNumber();
                return true
            }
        }
        return false
    }

    moveSelection(dx, dy = 0) {
        let newX = this.selectedCell.x + dx;
        let newY = this.selectedCell.y + dy;

        // Wrap around if out of bounds
        newX = (newX + this.cols) % this.cols;
        newY = (newY + this.rows) % this.rows;

        // Find next non-black cell
        while (this.grid[newY * this.cols + newX] === '.') {
            newX += dx;
            newY += dy;
            newX = (newX + this.cols) % this.cols;
            newY = (newY + this.rows) % this.rows;
        }

        this.selectedCell = vec2(newX, newY);
        this.updateCurrentClueNumber();
    }

    getClueNumber(direction) {
        const { x, y } = this.selectedCell;
        let startX = x, startY = y;

        if (direction === 'across') {
            while (startX > 0 && this.grid[y * this.cols + (startX - 1)] !== '.') startX--;
        } else {
            while (startY > 0 && this.grid[(startY - 1) * this.cols + x] !== '.') startY--;
        }

        return this.gridnums[startY * this.cols + startX];
    }

    updateCurrentClueNumber() {
        this.currentClueNumber = this.getClueNumber(this.direction);
    }

    getClue(direction, clueNumber) {
        const clueIndex = this.clues[direction].findIndex(clue => clue.startsWith(clueNumber + '.'));
        return clueIndex !== -1 ? this.clues[direction][clueIndex] : '';
    }

    getActiveClue() {
        return this.getClue(this.direction, this.currentClueNumber)
    }

    render() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cellPos = this.pos.add(vec2(
                    x * this.cellSize.x - this.size.x / 2 + this.cellSize.x / 2,
                    (this.rows - 1 - y) * this.cellSize.y - this.size.y / 2 + this.cellSize.y / 2
                ));

                const index = y * this.cols + x;
                const isBlack = this.grid[index] === '.';
                const isSelected = this.selectedCell.x === x && this.selectedCell.y === y;
                const isPartOfCurrentWord = this.isPartOfCurrentWord(x, y);

                let color = isBlack ? new Color(0, 0, 0) : new Color(1, 1, 1);
                if (isPartOfCurrentWord) color = new Color(0.9, 0.9, 1);
                if (isSelected) color = new Color(0.8, 0.8, 1);

                drawRect(cellPos, this.cellSize.subtract(vec2(0.1)), color);

                const numberSize = Math.min(this.cellSize.x, this.cellSize.y) * 0.1
                const letterSize = Math.min(this.cellSize.x, this.cellSize.y) * 0.5
                if (!isBlack) {
                    const num = this.gridnums[index];
                    if (num !== 0) {
                        drawText(num.toString(), cellPos.add(vec2(-this.cellSize.x / 2 + 0.2, this.cellSize.y / 2 - 0.2)),
                            numberSize, new Color(0.2, 0.2, 0.2));
                    }

                    const letter = this.userInput[index];
                    if (letter) {
                        drawText(letter, cellPos, letterSize, new Color(0, 0, 0));
                    }
                }
            }
        }

        // Draw active clue
        const activeClue = this.getActiveClue();
        drawText(activeClue, this.pos.add(vec2(0, this.size.y / 2 + 1)), 0.6, new Color(0, 0, 0));
    }

    isPartOfCurrentWord(x, y) {
        if (this.direction === 'across') {
            let startX = this.selectedCell.x;
            let endX = this.selectedCell.x;
            while (startX > 0 && this.grid[y * this.cols + (startX - 1)] !== '.') startX--;
            while (endX < this.cols - 1 && this.grid[y * this.cols + (endX + 1)] !== '.') endX++;
            return y === this.selectedCell.y && x >= startX && x <= endX;
        } else {
            let startY = this.selectedCell.y;
            let endY = this.selectedCell.y;
            while (startY > 0 && this.grid[(startY - 1) * this.cols + x] !== '.') startY--;
            while (endY < this.rows - 1 && this.grid[(endY + 1) * this.cols + x] !== '.') endY++;
            return x === this.selectedCell.x && y >= startY && y <= endY;
        }
    }

    isPuzzleCompleted() {
        // Check if all cells are filled correctly
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const index = y * this.cols + x;
                if (this.grid[index] !== '.' &&
                    this.userInput[index] !== this.grid[index]) {
                    return false;
                }
            }
        }
        return true;
    }
}

////////////////////////////////////////////////////////////////
class KanaCrossword extends Crossword {
    constructor(puzzleData, pos, size) {
        super(puzzleData, pos, size);
        this.kanaInput = ''; // Buffer for kana input
    }

    update() {
        if (mouseWasPressed(0)) {
            const clickPos = mousePos.subtract(this.pos).add(this.size.scale(0.5));
            const cellX = Math.floor(clickPos.x / this.cellSize.x);
            const cellY = this.rows - 1 - Math.floor(clickPos.y / this.cellSize.y);
            if (cellX >= 0 && cellX < this.cols && cellY >= 0 && cellY < this.rows) {
                this.selectedCell = vec2(cellX, cellY);
                this.kanaInput = ''; // Clear kana input buffer on cell change
                this.updateCurrentClueNumber();
                if (!this.getActiveClue()) {
                    this.swapDirection()
                    this.updateCurrentClueNumber();
                }
            }
        }

        // Handle kana input
        for (let key = 65; key <= 90; key++) {
            if (keyWasPressed(key)) {
                const letter = String.fromCharCode(key).toLowerCase();
                this.kanaInput += letter;
                this.processKanaInput();
            }
        }

        if (keyWasPressed(8)) { // Backspace
            if (this.kanaInput.length > 0) {
                this.kanaInput = this.kanaInput.slice(0, -1);
            } else {
                this.handleDeletePressed()
            }
        }

        this.handleArrowKeyPress()
    }

    processKanaInput() {
        const kana = convertToKana(this.kanaInput);
        if (kana !== this.kanaInput) {
            // Valid kana conversion
            const index = this.selectedCell.y * this.cols + this.selectedCell.x;
            if (validateKana(kana)) {
                this.moveWithinWord(true);
                this.userInput[index] = kana;
            }
            this.kanaInput = ''; // Clear the buffer
        }
    }

    render() {
        super.render(); // Call the parent class render method

        // Render kana input buffer
        if (this.kanaInput.length > 0) {
            const bufferPos = this.pos.add(vec2(0, this.size.y / 2 + 2));
            drawText(this.kanaInput, bufferPos, 0.6, new Color(0, 0, 0));
        }
    }

    moveWithinWord(forward = true) {
        super.moveWithinWord(forward)
        this.kanaInput = ''; // Clear kana input buffer when moving to a new cell
    }
}
