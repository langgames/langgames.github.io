
const NUM_CATEGORIES = 4
const CATEGORY_SIZE = 4

function selectWordsForGame(level) {
    const categories = sentenceToJSON(compactSentences[level]);

    // Ensure we have at least 4 categories
    if (categories.length < NUM_CATEGORIES) {
        console.error('Not enough categories in this level');
        return [];
    }

    // Randomly select 4 categories
    const selectedCategories = shuffle([...categories]).slice(0, NUM_CATEGORIES);

    let selectedWords = [];
    selectedCategories.forEach(category => {
        // Ensure each category has at least 4 words
        if (category.words.length < CATEGORY_SIZE) {
            console.error('Not enough words in category:', category.category);
            return;
        }

        // Randomly select 4 words from each category
        const categoryWords = shuffle([...category.words]).slice(0, CATEGORY_SIZE);
        selectedWords = selectedWords.concat(categoryWords);
    });

    return {
        words: shuffle(selectedWords),
        categories: selectedCategories
    };
}

const compactSentences = {
    "LEVEL-1": [
        ["Occupations",
            "医者", "いしゃ", "doctor",
            "教師", "きょうし", "teacher",
            "警察官", "けいさつかん", "police officer",
            "歌手", "かしゅ", "singer",
            "エンジニア", "えんじにあ", "engineer",
            "シェフ", "しぇふ", "chef"
        ],
        ["School Subjects",
            "数学", "すうがく", "mathematics",
            "歴史", "れきし", "history",
            "科学", "かがく", "science",
            "文学", "ぶんがく", "literature",
            "美術", "びじゅつ", "art",
            "体育", "たいいく", "physical education"
        ],
        ["Electronics",
            "スマートフォン", "すまーとふぉん", "smartphone",
            "パソコン", "ぱそこん", "computer",
            "テレビ", "てれび", "television",
            "冷蔵庫", "れいぞうこ", "refrigerator",
            "洗濯機", "せんたくき", "washing machine",
            "エアコン", "えあこん", "air conditioner"
        ],
        ["Countries",
            "日本", "にほん", "Japan",
            "アメリカ", "あめりか", "America",
            "中国", "ちゅうごく", "China",
            "フランス", "ふらんす", "France",
            "イギリス", "いぎりす", "England",
            "韓国", "かんこく", "South Korea"
        ],
        ["Sports",
            "サッカー", "さっかー", "soccer",
            "野球", "やきゅう", "baseball",
            "テニス", "てにす", "tennis",
            "バスケットボール", "ばすけっとぼーる", "basketball",
            "水泳", "すいえい", "swimming",
            "卓球", "たっきゅう", "table tennis"
        ],
        ["Emotions",
            "喜び", "よろこび", "joy",
            "悲しみ", "かなしみ", "sadness",
            "怒り", "いかり", "anger",
            "恐れ", "おそれ", "fear",
            "驚き", "おどろき", "surprise",
            "不安", "ふあん", "anxiety"
        ],
        ["Food Types",
            "和食", "わしょく", "Japanese food",
            "洋食", "ようしょく", "Western food",
            "中華料理", "ちゅうかりょうり", "Chinese cuisine",
            "イタリア料理", "いたりありょうり", "Italian cuisine",
            "ベジタリアン料理", "べじたりあんりょうり", "vegetarian cuisine",
            "デザート", "でざーと", "dessert"
        ],
        ["Natural Phenomena",
            "地震", "じしん", "earthquake",
            "台風", "たいふう", "typhoon",
            "洪水", "こうずい", "flood",
            "干ばつ", "かんばつ", "drought",
            "火山噴火", "かざんふんか", "volcanic eruption",
            "津波", "つなみ", "tsunami"
        ],
        ["Transportation Methods",
            "地下鉄", "ちかてつ", "subway",
            "バス", "ばす", "bus",
            "タクシー", "たくしー", "taxi",
            "新幹線", "しんかんせん", "bullet train",
            "フェリー", "ふぇりー", "ferry",
            "自転車", "じてんしゃ", "bicycle"
        ],
        ["Household Items",
            "家具", "かぐ", "furniture",
            "食器", "しょっき", "tableware",
            "寝具", "しんぐ", "bedding",
            "掃除機", "そうじき", "vacuum cleaner",
            "カーテン", "かーてん", "curtains",
            "照明", "しょうめい", "lighting"
        ]
    ],
    "LEVEL-2": [
        ["Time-related Words",
            "今週", "こんしゅう", "this week",
            "先月", "せんげつ", "last month",
            "午後", "ごご", "afternoon",
            "毎年", "まいとし", "every year",
            "週末", "しゅうまつ", "weekend",
            "いつも", "", "always"
        ],
        ["Weather",
            "曇り", "くもり", "cloudy",
            "霧", "きり", "fog",
            "湿度", "しつど", "humidity",
            "暑い", "あつい", "hot",
            "涼しい", "すずしい", "cool",
            "蒸し暑い", "むしあつい", "humid"
        ],
        ["Daily Activities",
            "買い物", "かいもの", "shopping",
            "掃除", "そうじ", "cleaning",
            "料理", "りょうり", "cooking",
            "洗濯", "せんたく", "laundry",
            "散歩", "さんぽ", "walk",
            "シャワーを浴びる", "しゃわーをあびる", "take a shower"
        ],
        ["Adjectives",
            "便利", "べんり", "convenient",
            "親切", "しんせつ", "kind",
            "重要", "じゅうよう", "important",
            "簡単", "かんたん", "easy",
            "うるさい", "", "noisy",
            "きれい", "", "beautiful/clean"
        ],
        ["Body Parts",
            "頭", "あたま", "head",
            "腕", "うで", "arm",
            "指", "ゆび", "finger",
            "背中", "せなか", "back",
            "肩", "かた", "shoulder",
            "おなか", "", "stomach"
        ],
        ["Family Members",
            "兄弟", "きょうだい", "siblings",
            "両親", "りょうしん", "parents",
            "叔父", "おじ", "uncle",
            "姪", "めい", "niece",
            "従兄弟", "いとこ", "cousin",
            "義理の母", "ぎりのはは", "mother-in-law"
        ],
        ["Technology",
            "充電器", "じゅうでんき", "charger",
            "プリンター", "ぷりんたー", "printer",
            "ソフトウェア", "そふとうぇあ", "software",
            "ウェブサイト", "うぇぶさいと", "website",
            "パスワード", "ぱすわーど", "password",
            "データ", "でーた", "data"
        ],
        ["Hobbies",
            "ガーデニング", "がーでにんぐ", "gardening",
            "写真撮影", "しゃしんさつえい", "photography",
            "編み物", "あみもの", "knitting",
            "ジョギング", "じょぎんぐ", "jogging",
            "釣り", "つり", "fishing",
            "ボードゲーム", "ぼーどげーむ", "board games"
        ],
        ["Locations",
            "図書館", "としょかん", "library",
            "美術館", "びじゅつかん", "art museum",
            "公園", "こうえん", "park",
            "駐車場", "ちゅうしゃじょう", "parking lot",
            "交差点", "こうさてん", "intersection",
            "病院", "びょういん", "hospital"
        ],
        ["Travel",
            "予約", "よやく", "reservation",
            "観光", "かんこう", "sightseeing",
            "ガイド", "がいど", "guide",
            "お土産", "おみやげ", "souvenir",
            "パスポート", "ぱすぽーと", "passport",
            "チェックイン", "ちぇっくいん", "check-in"
        ]
    ]
};


function sentenceToJSON(arr) {
    return arr.map(category => {
        let words = [];
        for (let i = 1; i < category.length; i += 3) {
            words.push({
                word: category[i],
                reading: category[i + 1],
                definition: category[i + 2]
            });
        }
        return { category: category[0], words: words };
    });
}