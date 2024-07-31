// ASCII to kana mapping (hiragana, including dakuten, handakuten, and compounds)
const asciiToKana = {
    'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
    'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
    'sa': 'さ', 'si': 'し', 'shi': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
    'ta': 'た', 'ti': 'ち', 'tu': 'つ', 'te': 'て', 'to': 'と',
    'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
    'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'hu': 'ふ', 'he': 'へ', 'ho': 'ほ',
    'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
    'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
    'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
    'wa': 'わ', 'wo': 'を', 'nn': 'ん',
    'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
    'za': 'ざ', 'ji': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
    'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
    'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
    'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
    'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
    'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
    'sya': 'しゃ', 'syu': 'しゅ', 'syo': 'しょ',
    'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
    'cya': 'ちゃ', 'cyu': 'ちゅ', 'cyo': 'ちょ',
    'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
    'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
    'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
    'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
    'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
    'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
    'jya': 'じゃ', 'jyu': 'じゅ', 'jyo': 'じょ',
    'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
    'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
    'ltu': 'っ',
    'chi': 'ち', 'tsu': 'つ',
    'ua': 'うぁ', 'ui': 'うぃ', 'ue': 'うぇ', 'uo': 'うぉ',
    'va': 'ゔぁ', 'vi': 'ゔぃ', 've': 'ゔぇ', 'vo': 'ゔぉ',
    'fa': 'ふぁ', 'fi': 'ふぃ', 'fe': 'ふぇ', 'fo': 'ふぉ',
    'la': 'ぁ', 'li': 'ぃ', 'lu': 'ぅ', 'le': 'ぇ', 'lo': 'ぉ',
    '-': 'ー',
};
const twoKanaStarts = ['ky', 'sh', 'sy', 'ch', 'cy', 'ny', 'hy', 'my', 'ry', 'gy', 'jy', 'by', 'py', 'lt', 'ts']
const consonantStarts = 'ksthmywgzdbp'

let currentInput = ''

function convertToKana() {
    let result = '';
    let buffer = '';
    for (let i = 0; i < currentInput.length; i++) {
        buffer += currentInput[i];

        // Check for small tsu (っ)
        if (buffer.length === 2 &&
            buffer[0] === buffer[1] &&
            consonantStarts.includes(buffer[0])) {
            result += 'っ';
            buffer = buffer[1];
        }

        if (asciiToKana[buffer]) {
            result += asciiToKana[buffer];
            buffer = '';
        } else if (buffer.length === 3) {
            if (asciiToKana[buffer.slice(0, 2)]) {
                result += asciiToKana[buffer.slice(0, 2)];
                buffer = buffer[2];
            } else {
                result += buffer[0];
                buffer = buffer.slice(1);
            }
        } else if (buffer.length === 2 && !twoKanaStarts.includes(buffer)) {
            result += buffer[0];
            buffer = buffer[1];
        }
    }

    if (asciiToKana[buffer]) {
        result += asciiToKana[buffer];
    } else {
        result += buffer;
    }

    currentInput = result;
}

function gameInputUpdate() {
    for (let i = 65; i <= 90; i++) { // A-Z keys
        if (keyWasPressed(i)) {
            const char = String.fromCharCode(i).toLowerCase();
            currentInput += char;
            convertToKana();
        }
    }

    if (keyWasPressed(189)) { // -
        const char = '-';
        currentInput += char;
        convertToKana();
    }

    if (keyWasPressed(8)) { // Backspace
        currentInput = currentInput.slice(0, -1);
    }
}

function drawcurrentInput(pos, size, color, lineWidth, lineColor) {
    drawText(currentInput, pos, size, color, lineWidth, lineColor);
}