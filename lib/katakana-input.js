// ASCII to kana mapping (katakana, including dakuten, handakuten, and compounds)
const asciiToKana = {
    'a': 'ア', 'i': 'イ', 'u': 'ウ', 'e': 'エ', 'o': 'オ',
    'ka': 'カ', 'ki': 'キ', 'ku': 'ク', 'ke': 'ケ', 'ko': 'コ',
    'sa': 'サ', 'si': 'シ', 'shi': 'シ', 'su': 'ス', 'se': 'セ', 'so': 'ソ',
    'ta': 'タ', 'ti': 'チ', 'tu': 'ツ', 'te': 'テ', 'to': 'ト', 'ci': 'ち',
    'na': 'ナ', 'ni': 'ニ', 'nu': 'ヌ', 'ne': 'ネ', 'no': 'ノ',
    'ha': 'ハ', 'hi': 'ヒ', 'fu': 'フ', 'hu': 'フ', 'he': 'ヘ', 'ho': 'ホ',
    'ma': 'マ', 'mi': 'ミ', 'mu': 'ム', 'me': 'メ', 'mo': 'モ',
    'ya': 'ヤ', 'yu': 'ユ', 'yo': 'ヨ',
    'ra': 'ラ', 'ri': 'リ', 'ru': 'ル', 're': 'レ', 'ro': 'ロ',
    'wa': 'ワ', 'wo': 'ヲ', 'nn': 'ン',
    'ga': 'ガ', 'gi': 'ギ', 'gu': 'グ', 'ge': 'ゲ', 'go': 'ゴ',
    'za': 'ザ', 'ji': 'ジ', 'zu': 'ズ', 'ze': 'ゼ', 'zo': 'ゾ',
    'da': 'ダ', 'di': 'ヂ', 'du': 'ヅ', 'de': 'デ', 'do': 'ド',
    'ba': 'バ', 'bi': 'ビ', 'bu': 'ブ', 'be': 'ベ', 'bo': 'ボ',
    'pa': 'パ', 'pi': 'ピ', 'pu': 'プ', 'pe': 'ペ', 'po': 'ポ',
    'kya': 'キャ', 'kyu': 'キュ', 'kyo': 'キョ',
    'sha': 'シャ', 'shu': 'シュ', 'sho': 'ショ',
    'sya': 'シャ', 'syu': 'シュ', 'syo': 'ショ',
    'cha': 'チャ', 'chu': 'チュ', 'cho': 'チョ',
    'cya': 'チャ', 'cyu': 'チュ', 'cyo': 'チョ',
    'nya': 'ニャ', 'nyu': 'ニュ', 'nyo': 'ニョ',
    'hya': 'ヒャ', 'hyu': 'ヒュ', 'hyo': 'ヒョ',
    'mya': 'ミャ', 'myu': 'ミュ', 'myo': 'ミョ',
    'rya': 'リャ', 'ryu': 'リュ', 'ryo': 'リョ',
    'gya': 'ギャ', 'gyu': 'ギュ', 'gyo': 'ギョ',
    'ja': 'ジャ', 'ju': 'ジュ', 'jo': 'ジョ',
    'jya': 'ジャ', 'jyu': 'ジュ', 'jyo': 'ジョ',
    'bya': 'ビャ', 'byu': 'ビュ', 'byo': 'ビョ',
    'pya': 'ピャ', 'pyu': 'ピュ', 'pyo': 'ピョ',
    'ltu': 'ッ',
    'chi': 'チ', 'tsu': 'ツ',
    'ua': 'ウァ', 'ui': 'ウィ', 'ue': 'ウェ', 'uo': 'ウォ',
    'va': 'ヴァ', 'vi': 'ヴィ', 've': 'ヴェ', 'vo': 'ヴォ',
    'fa': 'ファ', 'fi': 'フィ', 'fe': 'フェ', 'fo': 'フォ',
    'la': 'ァ', 'li': 'ィ', 'lu': 'ゥ', 'le': 'ェ', 'lo': 'ォ',
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
        // Check for small tsu (ッ)
        if (buffer.length === 2 &&
            buffer[0] === buffer[1] &&
            consonantStarts.includes(buffer[0])) {
            result += 'ッ';
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

function validateKana(kana) {
    return Object.values(asciiToKana).includes(kana)
}