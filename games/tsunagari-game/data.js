
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
    ],
    "LEVEL-N3": [
        [
            "Light and Illumination",
            "明かり", "あかり", "light",
            "明ける", "あける", "to dawn",
            "電球", "でんきゅう", "light bulb",
            "明らか", "あきらか", "clear, evident"
        ],
        [
            "Emptiness and Space",
            "空き", "あき", "emptiness",
            "空き家", "あきや", "vacant house",
            "余る", "あまる", "to be left over",
            "穴", "あな", "hole"
        ],
        [
            "Planning and Ideas",
            "案", "あん", "idea",
            "計る", "はかる", "to measure",
            "分類", "ぶんるい", "categorization",
            "分析", "ぶんせき", "analysis"
        ],
        [
            "Weather and Natural Phenomena",
            "汗", "あせ", "sweat",
            "嵐", "あらし", "storm",
            "雰囲気", "ふんいき", "atmosphere",
            "現象", "げんしょう", "phenomenon"
        ],
        [
            "Appearance and Manifestation",
            "現れる", "あらわれる", "to appear",
            "表す", "あらわす", "to represent",
            "描く", "えがく", "to draw",
            "笑顔", "えがお", "smiling face"
        ],
        [
            "Mistakes and Errors",
            "誤り", "あやまり", "error",
            "馬鹿", "ばか", "fool",
            "誤解", "ごかい", "misunderstanding",
            "不正", "ふせい", "injustice"
        ],
        [
            "Legal and Governance",
            "弁護士", "べんごし", "lawyer",
            "罰する", "ばっする", "to punish",
            "大臣", "だいじん", "cabinet minister",
            "議長", "ぎちょう", "chairman",
            "議員",
            "ぎいん",
            "member of the Diet"
        ],
        [
            "Parts and Components",
            "部分", "ぶぶん", "portion",
            "部品", "ぶひん", "parts",
            "段", "だん", "steps, rank",
            "柄", "え", "handle"
        ],
        [
            "Writing and Language",
            "文", "ぶん", "sentence",
            "文章", "ぶんしょう", "essay",
            "著者", "ちょしゃ", "author",
            "筆", "ふで", "writing brush",
            "語",
            "ご",
            "language"
        ],
        [
            "Business and Commerce",
            "営業", "えいぎょう", "business",
            "代金", "だいきん", "payment",
            "値", "あたい", "price",
            "物価", "ぶっか", "prices of commodities"
        ],
        [
            "Technology and Science",
            "電子", "でんし", "electron",
            "電子レンジ", "でんしれんじ", "microwave oven",
            "衛星", "えいせい", "satellite",
            "物理", "ぶつり", "physics"
        ],
        [
            "Transportation and Movement",
            "道路", "どうろ", "road",
            "遠足", "えんそく", "excursion",
            "外出", "がいしゅつ", "going out",
            "駐車", "ちゅうしゃ", "parking"
        ],
        [
            "Communication and Expression",
            "伝言", "でんごん", "verbal message",
            "演説", "えんぜつ", "speech",
            "演技", "えんぎ", "acting",
            "演奏", "えんそう", "musical performance"
        ],
        [
            "Art and Culture",
            "芸術", "げいじゅつ", "art",
            "劇", "げき", "drama",
            "劇場", "げきじょう", "theater",
            "画家", "がか", "painter"
        ],
        [
            "Social Structures",
            "団体", "だんたい", "organization",
            "地位", "ちい", "social position",
            "代表", "だいひょう", "representative",
            "同僚", "どうりょう", "colleague"
        ],
        [
            "Geography and Location",
            "地方", "ちほう", "region",
            "地域", "ちいき", "area",
            "地下", "ちか", "basement",
            "地球", "ちきゅう", "the earth"
        ],
        [
            "Military and Defense",
            "軍", "ぐん", "army",
            "軍隊", "ぐんたい", "armed forces",
            "武器", "ぶき", "weapon",
            "防ぐ", "ふせぐ", "to defend"
        ],
        [
            "Clothing and Appearance",
            "服装", "ふくそう", "attire",
            "袋", "ふくろ", "bag",
            "派手", "はで", "showy",
            "裸", "はだか", "naked"
        ],
        [
            "Household Items",
            "電池", "でんち", "battery",
            "瓶", "びん", "bottle",
            "棒", "ぼう", "pole",
            "灰", "はい", "ashes"
        ],
        [
            "Human Traits and Abilities",
            "知恵", "ちえ", "wisdom",
            "知能", "ちのう", "intelligence",
            "知識", "ちしき", "knowledge",
            "努力", "どりょく", "great effort"
        ],
        [
            "Time of Day",
            "夜", "よる", "night",
            "日中", "にっちゅう", "daytime, during the day",
            "夜間", "やかん", "night, nighttime",
            "朝", "あさ", "morning"
        ],
        [
            "Physical Sensations and Actions",
            "当たる", "あたる", "to be hit, to strike",
            "触れる", "ふれる", "to touch, to feel",
            "震える", "ふるえる", "to shiver, to shake",
            "冷える", "ひえる", "to grow cold",
            "掘る",
            "ほる",
            "to dig, to excavate"
        ],
        [
            "Descriptive Adjectives",
            "粗い", "あらい", "coarse, rough",
            "新た", "あらた", "new, fresh",
            "莫大", "ばくだい", "enormous, vast",
            "微妙", "びみょう", "delicate, subtle",
            "豊富",
            "ほうふ",
            "abundance, wealth"
        ],
        [
            "Actions and Activities",
            "諦める", "あきらめる", "to give up",
            "飽きる", "あきる", "to get tired of",
            "編む", "あむ", "to knit, to braid",
            "慌てる", "あわてる", "to panic",
            "黙る", "だまる", "to be silent",
            "加える", "くわえる", "to add, to sum up",
            "混ぜる", "まぜる", "to mix, to stir",
            "転ぶ", "ころぶ", "to fall down",
            "越える", "こえる", "to cross over",
            "動作", "どうさ", "movement, action",
            "印刷", "いんさつ", "printing",
            "引退", "いんたい", "retire",
            "祝う", "いわう", "to congratulate, to celebrate",
            "実行", "じっこう", "execution, practice",
            "自殺", "じさつ", "suicide",
            "受験", "じゅけん", "taking an examination",
            "投票", "とうひょう", "voting, poll",
            "やり直す", "やりなおす", "to do over again, to redo",
            "悪戯", "いたずら", "mischief, prank",
            "上京", "じょうきょう", "proceeding to the capital (Tokyo)",
            "実施", "じっし", "enforcement, implementation",
            "上達", "じょうたつ", "improvement, advance",
            "迎え", "むかえ", "meeting, greeting",
            "消費", "しょうひ", "consumption, expenditure",
            "宿泊", "しゅくはく", "lodging",
            "滞在", "たいざい", "staying, sojourn"
        ],
        [
            "Human Relationships",
            "握手", "あくしゅ", "handshake",
            "出会い", "であい", "meeting, encounter",
            "出会う", "であう", "to meet (by chance)",
            "夫人", "ふじん", "wife, madam",
            "同級生", "どうきゅうせい", "classmate",
            "委員", "いいん", "committee member",
            "人物", "じんぶつ", "person, character, figure",
            "助手", "じょしゅ", "helper, assistant",
            "親友", "しんゆう", "close friend",
            "知り合い", "しりあい", "acquaintance",
            "友", "とも", "friend, companion",
            "連れ", "つれ", "companion, company",
            "友人", "ゆうじん", "friend"
        ],
        [
            "Learning and Knowledge",
            "暗記", "あんき", "memorization",
            "学", "がく", "learning, scholarship",
            "学部", "がくぶ", "department of a university",
            "学問", "がくもん", "learning, study",
            "語学", "ごがく", "language study"
        ],
        [
            "Travel and Movement",
            "近道", "ちかみち", "short way, shortcut",
            "遅刻", "ちこく", "lateness",
            "発車", "はっしゃ", "departure of a vehicle",
            "飛行", "ひこう", "aviation, flight",
            "歩行者", "ほこうしゃ", "pedestrian",
            "旅", "たび", "travel, trip, journey",
            "通過", "つうか", "passage through",
            "通勤", "つうきん", "commuting to work",
            "通学", "つうがく", "commuting to school"
        ],
        [
            "Daily Life",
            "歯磨き", "はみがき", "brushing one's teeth",
            "一人暮らし", "ひとりぐらし", "living alone",
            "昼寝", "ひるね", "nap",
            "本屋", "ほんや", "bookstore",
            "衣服", "いふく", "clothes",
            "日常", "にちじょう", "ordinary, everyday",
            "毎日", "まいにち", "every day",
            "日課", "にっか", "daily routine",
            "生活", "せいかつ", "daily life, living"
        ],
        [
            "Events and Occurrences",
            "爆発", "ばくはつ", "explosion",
            "出来事", "できごと", "incident",
            "発生", "はっせい", "outbreak",
            "発達", "はったつ", "development",
            "変化", "へんか", "change",
            "事件", "じけん", "event, affair, accident",
            "停電", "ていでん", "power outage, blackout",
            "到着", "とうちゃく", "arrival",
            "絶滅", "ぜつめつ", "destruction, extinction"
        ],
        [
            "Social Issues",
            "害", "がい", "injury, harm",
            "被害", "ひがい", "damage",
            "犯罪", "はんざい", "crime",
            "批判", "ひはん", "criticism",
            "非常", "ひじょう", "emergency"
        ],
        [
            "Household Items and Appliances",
            "掃除機", "そうじき", "vacuum cleaner",
            "容器", "ようき", "container, vessel",
            "床", "ゆか", "floor",
            "屋根", "やね", "roof"
        ],
        [
            "Sounds and Noises",
            "騒音", "そうおん", "noise",
            "唸る", "うなる", "to groan, to moan",
            "笑い", "わらい", "laugh, laughter",
            "悪口", "わるくち", "bad mouth, insult"
        ],
        [
            "Actions and Operations",
            "操作", "そうさ", "operation, management",
            "解く", "とく", "to untie, to solve",
            "取上げる", "とりあげる", "to take up, to pick up",
            "動かす", "うごかす", "to move, to shift"
        ],
        [
            "Time-related Concepts",
            "早退", "そうたい", "leaving early",
            "度々", "たびたび", "often, again and again",
            "常に", "つねに", "always, constantly",
            "夜明け", "よあけ", "dawn, daybreak"
        ],
        [
            "Quantities and Measurements",
            "相当", "そうとう", "considerable, suitable",
            "全て", "すべて", "everything, all",
            "束", "たば", "bundle, bunch",
            "僅か", "わずか", "only, merely",
            "少々", "しょうしょう", "just a minute",
            "稍", "やや", "a little, partially",
            "一種", "いっしゅ", "species, kind",
            "種類", "しゅるい", "variety, kind, type",
            "湿度", "しつど", "level of humidity",
            "精々", "せいぜい", "at the most, at best",
            "大抵", "たいてい", "mostly, usually",
            "そっくり", "そっくり", "all, together, just like"
        ],
        [
            "Family and Inheritance",
            "相続", "そうぞく", "succession, inheritance",
            "我が家", "わがや", "one's house, one's home",
            "嫁", "よめ", "wife, bride",
            "親", "おや", "parent"
        ],
        [
            "Mental Processes",
            "想像", "そうぞう", "imagination, guess",
            "疑う", "うたがう", "to doubt, to distrust",
            "予期", "よき", "expectation, forecast",
            "予想", "よそう", "expectation, prediction"
        ],
        [
            "Animals and Nature",
            "巣", "す", "nest, hive",
            "虎", "とら", "tiger",
            "馬", "うま", "horse",
            "兎", "うさぎ", "rabbit, hare",
            "牛", "うし", "cattle, cow"
        ],
        [
            "Body Parts and Physical Characteristics",
            "筋", "すじ", "muscle",
            "体重", "たいじゅう", "(body) weight",
            "体温", "たいおん", "body temperature",
            "翼", "つばさ", "wing"
        ],
        [
            "Time Passage",
            "過ごす", "すごす", "to pass (time)",
            "経つ", "たつ", "to pass, to lapse",
            "続き", "つづき", "sequel, continuation",
            "年月", "としつき", "months and years"
        ],
        [
            "Excellence and Superiority",
            "優れる", "すぐれる", "to surpass, to excel",
            "優勝", "ゆうしょう", "championship, overall victory",
            "優秀", "ゆうしゅう", "superiority, excellence",
            "有能", "ゆうのう", "capable, efficient"
        ],
        [
            "Standards and Levels",
            "水準", "すいじゅん", "level, standard",
            "程度", "ていど", "degree, amount",
            "適度", "てきど", "moderate",
            "予算", "よさん", "estimate, budget"
        ],
        [
            "Recommendations and Suggestions",
            "推薦", "すいせん", "recommendation, referral",
            "勧める", "すすめる", "to recommend",
            "提案", "ていあん", "proposal, suggestion",
            "助言", "じょげん", "advice, counsel"
        ],
        [
            "Rescue and Assistance",
            "救う", "すくう", "to rescue from",
            "助ける", "たすける", "to save, to rescue",
            "援助", "えんじょ", "assistance, aid",
            "手伝い", "てつだい", "assistant, help"
        ],
        [
            "Positions and Perspectives",
            "立場", "たちば", "standpoint, position",
            "態度", "たいど", "attitude, manner",
            "逆", "ぎゃく", "reverse, opposite",
            "裏側", "うらがわ", "the reverse, other side"
        ],
        [
            "Majority and Quantity",
            "大半", "たいはん", "majority, more than half",
            "大量", "たいりょう", "large quantity, mass",
            "余分", "よぶん", "extra, excess",
            "余裕", "よゆう", "surplus, margin"
        ],
        [
            "Physical Activities",
            "体育", "たいいく", "physical education",
            "体操", "たいそう", "gymnastics, physical exercises",
            "運動会", "うんどうかい", "athletic meet, sports day",
            "山登り", "やまのぼり", "mountain climbing"
        ],
        [
            "Geography and Land",
            "大陸", "たいりく", "continent",
            "土地", "とち", "plot of land, soil",
            "都市", "とし", "town, city",
            "湾", "わん", "bay, gulf"
        ],
        [
            "War and Conflict",
            "大戦", "たいせん", "great war, great battle",
            "戦い", "たたかい", "battle, fight",
            "戦う", "たたかう", "to fight, to struggle",
            "敵", "てき", "opponent, rival"
        ],
        [
            "Testing and Trials",
            "試し", "ためし", "trial, test",
            "試す", "ためす", "to try out, to test",
            "答案", "とうあん", "examination paper",
            "合格", "ごうかく", "passing (exam), success"
        ],
        [
            "Time and Birth",
            "誕生", "たんじょう", "birth, creation",
            "生まれ", "うまれ", "birth, birthplace",
            "生む", "うむ", "to give birth, to produce",
            "翌朝", "よくあさ", "next morning"
        ],
        [
            "Enjoyment and Entertainment",
            "楽しむ", "たのしむ", "to enjoy (oneself)",
            "遊園地", "ゆうえんち", "amusement park",
            "野球", "やきゅう", "baseball",
            "釣", "つり", "fishing, angling"
        ],
        [
            "Universe and Space",
            "宇宙", "うちゅう", "universe, cosmos",
            "太陽", "たいよう", "sun, solar",
            "天然", "てんねん", "nature, spontaneity",
            "星", "ほし", "star"
        ],
        [
            "Body Parts and Health",
            "腰", "こし", "lower back, waist",
            "骨折", "こっせつ", "bone fracture",
            "胸", "むね", "chest, breast",
            "虫歯", "むしば", "cavity, tooth decay",
            "心臓", "しんぞう", "heart, guts, nerve",
            "酔う", "よう", "to get drunk"
        ],
        [
            "Communication and Language",
            "断る", "ことわる", "to refuse, to reject",
            "諺", "ことわざ", "proverb, maxim",
            "講演", "こうえん", "lecture, address, speech",
            "文句", "もんく", "complaint, grumbling",
            "申し訳", "もうしわけ", "apology, excuse",
            "説", "せつ", "theory",
            "承知", "しょうち", "knowledge, awareness",
            "証明", "しょうめい", "proof, verification",
            "承認", "しょうにん", "recognition, acknowledgement",
            "伺う", "ukagau", "to ask, to inquire"
        ],
        [
            "Food and Eating",
            "好物", "こうぶつ", "favourite food",
            "豆", "まめ", "beans",
            "飯", "めし", "cooked rice, meal",
            "食う", "くう", "to eat"
        ],
        [
            "Actions and Behavior",
            "行動", "こうどう", "action, conduct, behavior",
            "攻撃", "こうげき", "attack, strike",
            "迷う", "まよう", "to lose one's way",
            "命じる", "めいじる", "to order, to command"
        ],
        [
            "Fairness and Justice",
            "公平", "こうへい", "fairness, justice",
            "公共", "こうきょう", "public, community",
            "正に", "まさに", "exactly, surely",
            "無視", "むし", "disregarding, ignoring"
        ],
        [
            "Positions and Directions",
            "候補", "こうほ", "candidate",
            "後方", "こうほう", "behind, in the rear",
            "位", "くらい", "rank, class, grade",
            "向かい", "むかい", "facing, opposite"
        ],
        [
            "Construction and Work",
            "工事", "こうじ", "construction work",
            "工夫", "くふう", "solving ingeniously",
            "組み立てる", "くみたてる", "to assemble, to set up",
            "勤め", "つとめ", "service, duty, business"
        ],
        [
            "Effects and Results",
            "効果", "こうか", "effect, effectiveness",
            "貢献", "こうけん", "contribution",
            "結ぶ", "むすぶ", "to tie, to bind",
            "納得", "なっとく", "consent, assent"
        ],
        [
            "Exchange and Interaction",
            "交換", "こうかん", "exchange, interchange",
            "交際", "こうさい", "association, friendship",
            "交流", "こうりゅう", "(cultural) exchange, networking",
            "配る", "くばる", "to distribute, to hand out"
        ],
        [
            "Scenery and Views",
            "光景", "こうけい", "scene, spectacle",
            "眺め", "ながめ", "view, scene, prospect",
            "眺める", "ながめる", "to view, to gaze at",
            "見事", "みごと", "splendid, magnificent"
        ],
        [
            "Advertising and Media",
            "広告", "こうこく", "advertisement",
            "宣伝", "せんでん", "advertising, publicity",
            "放送", "ほうそう", "broadcast, broadcasting",
            "報道", "ほうどう", "news report, journalism"
        ],
        [
            "Purchasing and Acquisition",
            "購入", "こうにゅう", "purchase, buy",
            "求める", "もとめる", "to want, to wish for",
            "申し込み", "もうしこみ", "application, entry",
            "申し込む", "もうしこむ", "to apply for"
        ],
        [
            "Speed and Pace",
            "高速", "こうそく", "high speed",
            "急に", "きゅうに", "swiftly, rapidly",
            "急激", "きゅうげき", "sudden, radical",
            "急速", "きゅうそく", "rapid (progress)"
        ],
        [
            "Life and Living",
            "暮らし", "くらし", "life, living",
            "暮らす", "くらす", "to live",
            "命", "いのち", "life",
            "生", "なま", "raw, uncooked"
        ],
        [
            "Smells and Sensations",
            "臭い", "くさい", "stinking, smelly",
            "匂い", "におい", "smell, scent",
            "香り", "かおり", "fragrance, aroma",
            "味", "あじ", "taste, flavor"
        ],
        [
            "Size and Scale",
            "巨大", "きょだい", "huge, gigantic",
            "大型", "おおがた", "large, large-sized",
            "小屋", "こや", "hut, cabin, shed",
            "軒", "のき", "eaves"
        ],
        [
            "Permission and Approval",
            "許可", "きょか", "permission, approval",
            "免許", "めんきょ", "license, permit",
            "認める", "みとめる", "to accept, to admit",
            "許す", "ゆるす", "to permit, to allow"
        ],
        [
            "Competition and Games",
            "競技", "きょうぎ", "game, match",
            "競合", "きょうごう", "competition, rivalry",
            "勝負", "しょうぶ", "match, contest",
            "負け", "まけ", "defeat, loss"
        ],
        [
            "Family and Generations",
            "孫", "まご", "grandchild",
            "幼い", "おさない", "very young, childish",
            "年齢", "ねんれい", "age, years",
            "老い", "おい", "old age, old person"
        ],
        [
            "Examples and Illustrations",
            "例", "れい", "example, case",
            "実例", "じつれい", "example, instance",
            "見本", "みほん", "sample, model",
            "典型", "てんけい", "pattern, model"
        ],
        [
            "Manners and Etiquette",
            "礼儀", "れいぎ", "manners, courtesy",
            "作法", "さほう", "manners, etiquette",
            "行儀", "ぎょうぎ", "manners, behavior",
            "マナー", "まなー", "manners"
        ],
        [
            "Calmness and Composure",
            "冷静", "れいせい", "calm, composure",
            "落ち着く", "おちつく", "to calm down, to compose oneself",
            "穏やか", "おだやか", "calm, gentle, quiet",
            "平静", "へいせい", "calmness, serenity"
        ],
        [
            "Contact Information",
            "連絡先", "れんらくさき", "contact address",
            "住所", "じゅうしょ", "address",
            "電話番号", "でんわばんごう", "phone number",
            "メールアドレス", "めーるあどれす", "email address"
        ],
        [
            "Continuity and Sequence",
            "連続", "れんぞく", "serial, consecutive",
            "続く", "つづく", "to continue, to follow",
            "継続", "けいぞく", "continuation",
            "一連", "いちれん", "series, sequence"
        ],
        [
            "Queues and Lines",
            "列", "れつ", "queue, line",
            "行列", "ぎょうれつ", "line, queue",
            "順番", "じゅんばん", "turn, order",
            "並ぶ", "ならぶ", "to line up"
        ],
        [
            "Profit and Benefit",
            "利益", "りえき", "profit, gains",
            "収益", "しゅうえき", "profit, revenue",
            "儲け", "もうけ", "profit, gain",
            "採算", "さいさん", "profit and loss"
        ],
        [
            "Marriage and Divorce",
            "離婚", "りこん", "divorce",
            "結婚", "けっこん", "marriage",
            "婚約", "こんやく", "engagement",
            "再婚", "さいこん", "remarriage"
        ],
        [
            "Intelligence and Cleverness",
            "利口", "りこう", "clever, intelligent",
            "賢い", "かしこい", "wise, intelligent",
            "頭が良い", "あたまがいい", "smart, intelligent",
            "才能", "さいのう", "talent, ability"
        ],
        [
            "Ideals and Aspirations",
            "理想", "りそう", "ideal",
            "夢", "ゆめ", "dream, aspiration",
            "志", "こころざし", "ambition, aspiration",
            "目標", "もくひょう", "objective, target"
        ],
        [
            "Rates and Ratios",
            "率", "りつ", "rate, ratio",
            "割合", "わりあい", "ratio, percentage",
            "比率", "ひりつ", "ratio, proportion",
            "パーセント", "ぱーせんと", "percent"
        ],
        [
            "Users and Consumers",
            "利用者", "りようしゃ", "user, consumer",
            "顧客", "こきゃく", "customer, client",
            "消費者", "しょうひしゃ", "consumer",
            "ユーザー", "ゆーざー", "user"
        ],
        [
            "Debates and Arguments",
            "論じる", "ろんじる", "to argue, to debate",
            "議論", "ぎろん", "argument, discussion",
            "討論", "とうろん", "debate, discussion",
            "主張", "しゅちょう", "claim, insistence"
        ],
        [
            "Controversies and Disputes",
            "論争", "ろんそう", "controversy, dispute",
            "対立", "たいりつ", "confrontation, opposition",
            "紛争", "ふんそう", "dispute, conflict",
            "意見の相違", "いけんのそうい", "difference of opinion"
        ],
        [
            "Elderly and Aging",
            "老人", "ろうじん", "the aged, old person",
            "高齢者", "こうれいしゃ", "elderly person",
            "年寄り", "としより", "old people, the aged",
            "シニア", "しにあ", "senior"
        ],
        [
            "Quantity and Amount",
            "量", "りょう", "quantity, amount",
            "数量", "すうりょう", "quantity, volume",
            "容量", "ようりょう", "capacity, volume",
            "分量", "ぶんりょう", "amount, quantity"
        ],
        [
            "Receipts and Documentation",
            "領収書", "りょうしゅうしょ", "hand-written receipt",
            "レシート", "れしーと", "receipt",
            "請求書", "せいきゅうしょ", "invoice, bill",
            "明細書", "めいさいしょ", "detailed statement"
        ],
        [
            "Studying Abroad",
            "留学", "りゅうがく", "studying abroad",
            "海外研修", "かいがいけんしゅう", "overseas training",
            "交換留学", "こうかんりゅうがく", "exchange program",
            "ホームステイ", "ほーむすてい", "homestay"
        ],
        [
            "Fashion and Trends",
            "流行", "りゅうこう", "fashion, vogue",
            "トレンド", "とれんど", "trend",
            "スタイル", "すたいる", "style",
            "ファッション", "ふぁっしょん", "fashion"
        ],
        [
            "Time and Periods",
            "期間", "きかん", "period, term",
            "期限", "きげん", "time limit, deadline",
            "今後", "こんご", "from now on",
            "今回", "こんかい", "now, this time",
            "過去", "かこ", "the past, bygone days",
            "未来", "みらい", "the future"
        ],
        [
            "Research and Study",
            "研究者", "けんきゅうしゃ", "researcher",
            "研究所", "けんきゅうじょ", "research institute, laboratory",
            "見学", "けんがく", "inspection, field trip",
            "基礎", "きそ", "foundation, basis"
        ],
        [
            "Legal and Rights",
            "憲法", "けんぽう", "constitution",
            "権利", "けんり", "right, privilege",
            "禁止", "きんし", "prohibition, ban",
            "命令", "めいれい", "order, command"
        ],
        [
            "Technology and Machinery",
            "機械", "きかい", "machine, mechanism",
            "機能", "きのう", "function",
            "金属", "きんぞく", "metal",
            "管", "かん", "pipe, tube"
        ],
        [
            "Personal Traits",
            "器用", "きよう", "dexterous, skillful",
            "性格", "せいかく", "personality, character",
            "癖", "くせ", "habit",
            "個人", "こじん", "individual, personal",
            "けち", "けち", "stinginess, cheapskate",
            "まじめ", "まじめ", "serious, earnest",
            "正直", "しょうじき", "honesty, integrity",
            "おとなしい", "おとなしい", "obedient, docile, quiet"
        ],
        [
            "Buildings and Construction",
            "建築", "けんちく", "construction, architecture",
            "建設", "けんせつ", "construction",
            "金庫", "きんこ", "safe, vault",
            "塀", "へい", "wall, fence"
        ],
        [
            "Finance and Money",
            "金", "きん", "gold",
            "金額", "きんがく", "amount of money",
            "金銭", "きんせん", "money, cash",
            "寄付", "きふ", "contribution, donation"
        ],
        [
            "Measurement and Calculation",
            "計算", "けいさん", "calculation, reckoning",
            "数", "かず", "number",
            "数える", "かぞえる", "to count",
            "間隔", "かんかく", "space, interval"
        ],
        [
            "Memory and Records",
            "記憶", "きおく", "memory, recollection",
            "記録", "きろく", "record, document",
            "記念", "きねん", "commemoration",
            "記入", "きにゅう", "entry, filling in forms"
        ],
        [
            "Security and Protection",
            "警告", "けいこく", "warning, advice",
            "管理", "かんり", "control, management",
            "守る", "まもる", "to protect, to guard",
            "検査", "けんさ", "inspection, examination"
        ],
        [
            "Emotions and Mental States",
            "気に入る", "きにいる", "to be pleased with",
            "気の毒", "きのどく", "pitiful, unfortunate",
            "気になる", "きになる", "to bother one, to worry about",
            "気にする", "きにする", "to mind, to care about"
        ],
        [
            "Natural Elements",
            "岸", "きし", "bank, coast, shore",
            "氷", "こおり", "ice",
            "凍る", "こおる", "to freeze",
            "燃える", "もえる", "to burn, to get fired up"
        ],
        [
            "Mistakes and Problems",
            "間違い", "まちがい", "mistake, error, blunder",
            "間違う", "まちがう", "to make a mistake",
            "欠陥", "けっかん", "defect, fault",
            "欠点", "けってん", "weak point, weakness"
        ],
        [
            "Travel and Tourism",
            "観光", "かんこう", "sightseeing",
            "観光客", "かんこうきゃく", "tourist",
            "土産", "みやげ", "present, souvenir",
            "都", "みやこ", "capital, metropolis"
        ],
        [
            "Decisions and Conclusions",
            "結果", "けっか", "result, consequence",
            "結局", "けっきょく", "after all, eventually",
            "決定", "けってい", "decision, determination",
            "結論", "けつろん", "conclusion"
        ],
        [
            "Geographical Features",
            "川沿い", "かわぞい", "along the river, riverside",
            "丘", "おか", "hill, height",
            "沖", "おき", "open sea",
            "砂漠", "さばく", "desert",
            "森林", "しんりん", "forest, woods"
        ],
        [
            "Perfection and Completeness",
            "完全", "かんぜん", "perfection, completeness",
            "満点", "まんてん", "perfect score, full marks",
            "満足", "まんぞく", "satisfaction, contentment",
            "最上", "さいじょう", "best",
            "最高", "さいこう", "highest, supreme"
        ],
        [
            "Decoration and Design",
            "飾り", "かざり", "decoration",
            "模様", "もよう", "pattern, design",
            "印", "しるし", "seal, stamp, mark",
            "装置", "そうち", "equipment, installation"
        ],
        [
            "Tendencies and Trends",
            "傾向", "けいこう", "tendency, trend",
            "風潮", "ふうちょう", "trend, current",
            "流れ", "ながれ", "stream, current, flow",
            "向く", "むく", "to face, to turn toward"
        ],
        [
            "Absence and Missing",
            "欠席", "けっせき", "absence",
            "失望", "しつぼう", "disappointment, despair",
            "失業", "しつぎょう", "unemployment",
            "抜ける", "ぬける", "to come out, to fall out"
        ],
        [
            "Determination and Resolution",
            "決心", "けっしん", "determination, resolution",
            "覚悟", "かくご", "resolution, readiness",
            "真剣", "しんけん", "seriousness, earnestness",
            "信念", "しんねん", "belief, faith, conviction"
        ],
        [
            "Cosmetics and Beauty",
            "化粧", "けしょう", "make-up, cosmetics",
            "美容", "びよう", "beauty",
            "髪の毛", "かみのけ", "hair (head)",
            "姿", "すがた", "figure, form, shape"
        ],
        [
            "Medical and Health",
            "血液型", "けつえきがた", "blood type",
            "症状", "しょうじょう", "symptoms, condition",
            "診察", "しんさつ", "medical examination",
            "手術", "しゅじゅつ", "surgical operation"
        ],
        [
            "Hopes and Wishes",
            "希望", "きぼう", "hope, wish",
            "願い", "ねがい", "desire, wish",
            "望み", "のぞみ", "hope, desire, wish",
            "期待", "きたい", "expectation, hope"
        ],
        [
            "Value and Importance",
            "貴重", "きちょう", "precious, valuable",
            "大切", "たいせつ", "important, valuable",
            "重要", "じゅうよう", "important, essential",
            "主要", "しゅよう", "chief, main, principle"
        ],
        [
            "Rules and Regulations",
            "決まり", "きまり", "rule, settlement",
            "規則", "きそく", "rule, regulation",
            "制度", "せいど", "system, institution",
            "法律", "ほうりつ", "law, act, statute"
        ],
        [
            "Modern and Contemporary",
            "近代", "きんだい", "present day",
            "現代", "げんだい", "modern times",
            "今日", "こんにち", "this day, these days, recently",
            "最新", "さいしん", "latest, newest"
        ],
        [
            "Strangeness and Oddity",
            "奇妙", "きみょう", "strange, queer",
            "妙", "みょう", "strange, unusual",
            "変", "へん", "strange, odd",
            "珍しい", "めずらしい", "rare, unusual"
        ],
        [
            "Cutting and Breaking",
            "切れ", "きれ", "piece, slide",
            "切れる", "きれる", "to break, to snap",
            "割れる", "われる", "to break, to crack",
            "破る", "やぶる", "to tear, to break"
        ],
        [
            "Edges and Borders",
            "際", "きわ", "edge, brink, verge",
            "縁", "ふち", "edge, rim",
            "境", "さかい", "border, boundery",
            "端", "はし", "edge, tip, margin"
        ],
        [
            "Overcoming and Conquering",
            "克服", "こくふく", "conquest, overcoming",
            "勝つ", "かつ", "to win, to gain victory",
            "打ち勝つ", "うちかつ", "to overcome, to conquer",
            "征服", "せいふく", "conquest, subjugation"
        ],
        [
            "Grains and Crops",
            "穀物", "こくもつ", "grain, cereal",
            "米", "こめ", "rice",
            "麦", "むぎ", "wheat, barley",
            "作物", "さくもつ", "produce, crops"
        ],
        [
            "Preferences and Tastes",
            "好み", "このみ", "liking, taste",
            "好む", "このむ", "to like, to prefer",
            "趣味", "しゅみ", "hobby, taste",
            "嗜好", "しこう", "taste, liking"
        ],
        [
            "Chaos and Confusion",
            "混乱", "こんらん", "disorder, chaos",
            "混雑", "こんざつ", "congestion, jam",
            "騒ぎ", "さわぎ", "uproar, disturbance",
            "乱れる", "みだれる", "to be disordered, to be confused"
        ],
        [
            "Luck and Fortune",
            "幸運", "こううん", "good luck, fortune",
            "運", "うん", "fortune, luck",
            "幸い", "さいわい", "happiness, luckily",
            "不運", "ふうん", "misfortune, bad luck"
        ],
        [
            "Evening and Sunset",
            "暮れ", "くれ", "sunset, sundown",
            "夕方", "ゆうがた", "evening",
            "日没", "にちぼつ", "sunset",
            "黄昏", "たそがれ", "twilight, dusk"
        ],
        [
            "Rotting and Decay",
            "腐る", "くさる", "to rot, to go bad",
            "朽ちる", "くちる", "to decay, to rot",
            "傷む", "いたむ", "to go bad, to spoil",
            "劣化", "れっか", "deterioration, degradation"
        ],
        [
            "Detailed and Thorough",
            "詳しい", "くわしい", "detailed",
            "綿密", "めんみつ", "minute, detailed",
            "精密", "せいみつ", "precise, accurate",
            "徹底的", "てっていてき", "thorough, complete"
        ],
        [
            "Emphasis and Stress",
            "強調", "きょうちょう", "emphasis, highlight",
            "重視", "じゅうし", "importance, stress",
            "力点", "りきてん", "emphasis, stress",
            "アクセント", "あくせんと", "accent, emphasis"
        ],
        [
            "Absorption and Intake",
            "吸収", "きゅうしゅう", "absorption",
            "摂取", "せっしゅ", "intake, absorption",
            "取り入れる", "とりいれる", "to adopt, to absorb",
            "吸い込む", "すいこむ", "to inhale, to absorb"
        ],
        [
            "Names and Identities",
            "名", "な", "name, given name",
            "人間", "にんげん", "human being, person",
            "他人", "たにん", "another person, others",
            "者", "もの", "person"
        ],
        [
            "Cooking Utensils",
            "鍋", "なべ", "saucepan, pot",
            "食器", "しょっき", "tableware",
            "食卓", "しょくたく", "dining table",
            "調べ物", "しらべもの", "matter to be checked or investigated"
        ],
        [
            "Water Flow",
            "流れる", "ながれる", "to stream, to flow",
            "流す", "ながす", "to drain, to shed",
            "注ぐ", "そそぐ", "to pour into, to fill",
            "溺れる", "おぼれる", "to drown"
        ],
        [
            "Contents and Interiors",
            "内容", "ないよう", "contents, matter",
            "中身", "なかみ", "contents, interior",
            "室内", "しつない", "indoor, inside the room",
            "店内", "てんない", "store interior"
        ],
        [
            "Relationships",
            "仲", "なか", "relation, relationship",
            "仲間", "なかま", "fellow, companion",
            "仲直り", "なかなおり", "reconciliation, make peace with",
            "付き合う", "つきあう", "to associate with, to go out with"
        ],
        [
            "Midpoints and Halves",
            "半ば", "なかば", "middle, half",
            "中間", "ちゅうかん", "middle, halfway",
            "途中", "とちゅう", "on the way, midway",
            "真ん中", "まんなか", "middle, center"
        ],
        [
            "Straightness and Directness",
            "直", "なお", "straight, ordinary, common",
            "真っ直ぐ", "まっすぐ", "straight, direct",
            "直接", "ちょくせつ", "direct, immediate",
            "率直", "そっちょく", "frank, candid"
        ],
        [
            "Mysteries and Puzzles",
            "謎", "なぞ", "riddle, puzzle, mystery",
            "不思議", "ふしぎ", "mystery, wonder",
            "推理", "すいり", "deduction, inference",
            "暗号", "あんごう", "code, cipher"
        ],
        [
            "Time Periods",
            "年代", "ねんだい", "age, era, period",
            "年間", "ねんかん", "years (period of)",
            "世紀", "せいき", "century, era",
            "時代", "じだい", "era, period, age",
            "週間", "しゅうかん", "week",
            "週末", "しゅうまつ", "weekend",
            "早朝", "そうちょう", "early morning",
            "夜中", "よなか", "midnight, dead of night"
        ],
        [
            "Climate Zones",
            "熱帯", "ねったい", "tropics",
            "温帯", "おんたい", "temperate zone",
            "寒帯", "かんたい", "frigid zone",
            "亜熱帯", "あねったい", "subtropics"
        ],
        [
            "Date and Time",
            "日時", "にちじ", "date and time",
            "日程", "にってい", "schedule, program",
            "予定", "よてい", "schedule, plan",
            "期日", "きじつ", "fixed date, due date"
        ],
        [
            "Popularity and Fame",
            "人気", "にんき", "popularity",
            "有名", "ゆうめい", "famous",
            "評判", "ひょうばん", "reputation",
            "知名度", "ちめいど", "degree of recognition"
        ],
        [
            "Counting People",
            "人数", "にんずう", "the number of people",
            "人口", "じんこう", "population",
            "定員", "ていいん", "fixed number of people",
            "乗客", "じょうきゃく", "passenger"
        ],
        [
            "Expressing and Stating",
            "述べる", "のべる", "to state, to express",
            "表現", "ひょうげん", "expression",
            "発言", "はつげん", "statement, remark",
            "語る", "かたる", "to narrate, to tell"
        ],
        [
            "Agriculture",
            "農業", "のうぎょう", "agriculture",
            "農家", "のうか", "farmer, farm family",
            "農民", "のうみん", "farmers, peasants",
            "農作物", "のうさくぶつ", "agricultural products"
        ],
        [
            "Exclusion and Removal",
            "除く", "のぞく", "to exclude, to except",
            "取り除く", "とりのぞく", "to remove, to eliminate",
            "排除", "はいじょ", "exclusion, removal",
            "削除", "さくじょ", "deletion, elimination"
        ],
        [
            "Extraction and Omission",
            "抜く", "ぬく", "to extract, to omit",
            "省く", "はぶく", "to omit, to leave out",
            "略す", "りゃくす", "to abbreviate",
            "簡略化", "かんりゃくか", "simplification"
        ],
        [
            "School Entrance",
            "入学", "にゅうがく", "matriculation",
            "入園", "にゅうえん", "entering kindergarten",
            "入校", "にゅうこう", "entering a school",
            "進学", "しんがく", "entering a higher-level school"
        ],
        [
            "Hospitalization",
            "入院", "にゅういん", "hospitalization",
            "退院", "たいいん", "leaving hospital",
            "通院", "つういん", "hospital visit",
            "入所", "にゅうしょ", "admission to an institution"
        ],
        [
            "Data Input",
            "入力", "にゅうりょく", "input, (data) entry",
            "出力", "しゅつりょく", "output",
            "データ", "でーた", "data",
            "情報", "じょうほう", "information"
        ],
        [
            "Joining a Company",
            "入社", "にゅうしゃ", "joining a company",
            "就職", "しゅうしょく", "finding employment",
            "採用", "さいよう", "hiring, employment",
            "転職", "てんしょく", "changing jobs"
        ],
        [
            "Finishing and Ending",
            "終える", "おえる", "to finish",
            "仕舞う", "しまう", "to finish, to stop",
            "終了", "しゅうりょう", "end, close, termination",
            "完了", "かんりょう", "completion, conclusion"
        ],
        [
            "Inner Parts and Depths",
            "奥", "おく", "inner part",
            "内部", "ないぶ", "interior, inside",
            "中核", "ちゅうかく", "core, nucleus",
            "深部", "しんぶ", "deep part, depths"
        ],
        [
            "Gratitude and Favors",
            "恩", "おん", "favor, debt of gratitude",
            "感謝", "かんしゃ", "gratitude, thanks",
            "謝意", "しゃい", "gratitude, appreciation",
            "恩返し", "おんがえし", "return of a favor"
        ],
        [
            "Hot Springs",
            "温泉", "おんせん", "hot spring",
            "銭湯", "せんとう", "public bath",
            "浴場", "よくじょう", "bathhouse",
            "湯", "ゆ", "hot water"
        ],
        [
            "Catching Up",
            "追い付く", "おいつく", "to catch up with",
            "追う", "おう", "to chase, to run after",
            "追跡", "ついせき", "pursuit, chase",
            "到達", "とうたつ", "reaching, attainment"
        ],
        [
            "Landlords and Property",
            "大家", "おおや", "landlord, landlady",
            "家主", "やぬし", "landlord",
            "不動産", "ふどうさん", "real estate",
            "家賃", "やちん", "rent"
        ],
        [
            "Pollution and Contamination",
            "汚染", "おせん", "pollution, contamination",
            "公害", "こうがい", "public pollution",
            "環境破壊", "かんきょうはかい", "environmental destruction",
            "浄化", "じょうか", "purification"
        ],
        [
            "Round Trips",
            "往復", "おうふく", "making a round trip",
            "行き帰り", "いきかえり", "round trip",
            "往来", "おうらい", "coming and going",
            "往復運転", "おうふくうんてん", "shuttle service"
        ],
        [
            "Royalty",
            "王/王様", "おう/おうさま", "king, ruler",
            "王子", "おうじ", "prince",
            "女王", "じょおう", "queen",
            "王国", "おうこく", "kingdom"
        ],
        [
            "Responding and Complying",
            "応じる", "おうじる", "to respond, to comply",
            "対応", "たいおう", "correspondence, coping with",
            "従う", "したがう", "to obey, to follow",
            "反応", "はんのう", "reaction, response"
        ],
        [
            "Practical Application",
            "応用", "おうよう", "putting to practical use",
            "実用", "じつよう", "practical use",
            "適用", "てきよう", "application, adoption",
            "活用", "かつよう", "practical use, application"
        ],
        [
            "Discrimination",
            "差別", "さべつ", "discrimination",
            "偏見", "へんけん", "prejudice, bias",
            "不平等", "ふびょうどう", "inequality",
            "人種差別", "じんしゅさべつ", "racial discrimination"
        ],
        [
            "Participants",
            "参加者", "さんかしゃ", "participant, entrant",
            "出席者", "しゅっせきしゃ", "attendee",
            "メンバー", "めんばー", "member",
            "関係者", "かんけいしゃ", "person concerned, related party"
        ],
        [
            "Lowest and Worst",
            "最低", "さいてい", "least, lowest, worst",
            "最悪", "さいあく", "worst",
            "底", "そこ", "bottom, lowest",
            "劣悪", "れつあく", "inferior, poor"
        ],
        [
            "Opposition and Resistance",
            "逆らう", "さからう", "to go against, to oppose",
            "反対", "はんたい", "opposition, resistance",
            "抵抗", "ていこう", "resistance, opposition",
            "反抗", "はんこう", "rebellion, defiance"
        ],
        [
            "Citizenship and Residence",
            "住民", "じゅうみん", "citizens, inhabitants",
            "住宅", "じゅうたく", "residence, housing",
            "居住", "きょじゅう", "residence, dwelling",
            "定住", "ていじゅう", "permanent residence"
        ],
        [
            "Recovery and Improvement",
            "回復", "かいふく", "recovery",
            "改善", "かいぜん", "improvement",
            "修理", "しゅうり", "repairing, mending",
            "修正", "しゅうせい", "amendment, correction"
        ],
        [
            "International and Foreign",
            "海外", "かいがい", "foreign, abroad",
            "国際", "こくさい", "international",
            "外国", "がいこく", "foreign country",
            "異文化", "いぶんか", "different culture"
        ],
        [
            "Accounting and Finance",
            "会計", "かいけい", "account, finance",
            "経理", "けいり", "accounting, financial affairs",
            "簿記", "ぼき", "bookkeeping",
            "決算", "けっさん", "settlement of accounts"
        ],
        [
            "Solutions and Resolutions",
            "解決", "かいけつ", "settlement, solution",
            "解釈", "かいしゃく", "explanation, interpretation",
            "解答", "かいとう", "answer, solution",
            "解明", "かいめい", "clarification, elucidation"
        ],
        [
            "Beginnings and Starts",
            "開始", "かいし", "start, beginning",
            "始発", "しはつ", "first train, first bus",
            "始まり", "はじまり", "beginning, start",
            "発足", "ほっそく", "start, inauguration"
        ],
        [
            "Collection and Retrieval",
            "回収", "かいしゅう", "collection, retrieval",
            "収穫", "しゅうかく", "harvest, crop",
            "収集", "しゅうしゅう", "collection, gathering",
            "取り立て", "とりたて", "collection, recovery"
        ],
        [
            "Household Chores",
            "家事", "かじ", "housework",
            "掃除", "そうじ", "cleaning",
            "洗濯", "せんたく", "laundry",
            "料理", "りょうり", "cooking"
        ],
        [
            "Lacking and Missing",
            "欠ける", "かける", "to be lacking",
            "不足", "ふそく", "shortage, deficiency",
            "足りない", "たりない", "insufficient, not enough",
            "欠如", "けつじょ", "lack, absence"
        ],
        [
            "Surrounding and Enclosing",
            "囲む", "かこむ", "to surround, to encircle",
            "取り囲む", "とりかこむ", "to surround, to enclose",
            "包囲", "ほうい", "siege, encirclement",
            "周囲", "しゅうい", "surroundings, environs"
        ],
        [
            "Expansion and Magnification",
            "拡大", "かくだい", "magnification",
            "拡張", "かくちょう", "expansion, enlargement",
            "増大", "ぞうだい", "increase, growth",
            "膨張", "ぼうちょう", "expansion, swelling"
        ],
        [
            "Certainty and Reliability",
            "確実", "かくじつ", "certainty, reliability",
            "確認", "かくにん", "confirmation, verification",
            "保証", "ほしょう", "guarantee, warranty",
            "信頼性", "しんらいせい", "reliability, credibility"
        ],
        [
            "Deities and Worship",
            "神", "かみ", "God, deity",
            "信仰", "しんこう", "faith, belief",
            "宗教", "しゅうきょう", "religion",
            "崇拝", "すうはい", "worship, adoration"
        ],
        [
            "School Subjects",
            "科目", "かもく", "school subject",
            "教科", "きょうか", "subject, curriculum",
            "専攻", "せんこう", "major subject",
            "学科", "がっか", "department, course of study"
        ],
        [
            "Welcome and Reception",
            "歓迎", "かんげい", "welcome, reception",
            "迎える", "むかえる", "to welcome, to receive",
            "招待", "しょうたい", "invitation",
            "接待", "せったい", "reception, entertainment"
        ],
        [
            "Audience and Spectators",
            "観客", "かんきゃく", "audience, spectator",
            "観衆", "かんしゅう", "spectators, onlookers",
            "聴衆", "ちょうしゅう", "audience, listeners",
            "観覧者", "かんらんしゃ", "spectator, viewer"
        ],
        [
            "Potential and Possibility",
            "可能", "かのう", "potential, possible",
            "可能性", "かのうせい", "possibility, potential",
            "潜在的", "せんざいてき", "potential, latent",
            "見込み", "みこみ", "prospect, chances"
        ],
        [
            "Observation and Monitoring",
            "観察", "かんさつ", "observation",
            "監視", "かんし", "monitoring, surveillance",
            "注視", "ちゅうし", "close observation",
            "観測", "かんそく", "observation, monitoring"
        ],
        [
            "Impressions and Thoughts",
            "感想", "かんそう", "impressions, thoughts",
            "印象", "いんしょう", "impression",
            "所感", "しょかん", "impression, view",
            "意見", "いけん", "opinion, view"
        ],
        [
            "Emptiness and Vacuums",
            "空", "から", "emptiness, vacuum, blank",
            "虚無", "きょむ", "emptiness, void",
            "真空", "しんくう", "vacuum",
            "空虚", "くうきょ", "emptiness, hollowness"
        ],
        [
            "Cutting and Mowing",
            "刈る", "かる", "to cut (hair), to mow (grass)",
            "切る", "きる", "to cut",
            "剪定", "せんてい", "pruning",
            "伐採", "ばっさい", "felling, logging"
        ],
        [
            "Piling and Stacking",
            "重ねる", "かさねる", "to pile up, to heap up",
            "積む", "つむ", "to pile up, to stack",
            "堆積", "たいせき", "accumulation, pile up",
            "蓄積", "ちくせき", "accumulation, build-up"
        ],
        [
            "Lending and Borrowing",
            "貸出", "かしだし", "lending, loaning",
            "貸し付け", "かしつけ", "lending, loan",
            "借りる", "かりる", "to borrow",
            "融資", "ゆうし", "financing, loan"
        ],
        [
            "Singers and Vocalists",
            "歌手", "かしゅ", "singer",
            "声楽家", "せいがくか", "vocalist",
            "アーティスト", "あーてぃすと", "artist",
            "ミュージシャン", "みゅーじしゃん", "musician"
        ],
        [
            "Sides and Halves",
            "片方", "かたほう", "one of a pair, one side",
            "半分", "はんぶん", "half",
            "一方", "いっぽう", "one side, one party",
            "片側", "かたがわ", "one side"
        ],
        [
            "Assumptions and Hypotheses",
            "仮定", "かてい", "assumption, hypothesis",
            "推測", "すいそく", "conjecture, speculation",
            "前提", "ぜんてい", "premise, assumption",
            "想定", "そうてい", "assumption, supposition"
        ],
        [
            "Convenience and Selfishness",
            "勝手", "かって", "one's own convenience, selfish",
            "我儘", "わがまま", "selfish, willful",
            "自分勝手", "じぶんかって", "selfish, arbitrary",
            "身勝手", "みがって", "selfish, self-centered"
        ],
        [
            "Keeping Pets",
            "飼う", "かう", "to keep (a pet)",
            "飼育", "しいく", "breeding, raising",
            "ペット", "ぺっと", "pet",
            "動物", "どうぶつ", "animal"
        ],
        [
            "Applicants and Candidates",
            "希望者", "きぼうしゃ", "applicant, candidate",
            "応募者", "おうぼしゃ", "applicant",
            "志願者", "しがんしゃ", "applicant, volunteer",
            "候補者", "こうほしゃ", "candidate, nominee"
        ],
        [
            "Latter and Former",
            "後者", "こうしゃ", "the latter",
            "前者", "ぜんしゃ", "the former",
            "後半", "こうはん", "latter half",
            "前半", "ぜんはん", "first half"
        ],
        [
            "Windows and Counters",
            "窓口", "まどぐち", "ticket window, counter",
            "受付", "うけつけ", "reception desk",
            "カウンター", "かうんたー", "counter",
            "案内所", "あんないじょ", "information desk"
        ],
        [
            "Entrusting and Leaving to",
            "任せる", "まかせる", "to entrust, to leave to",
            "委ねる", "ゆだねる", "to entrust to, to leave to",
            "託す", "たくす", "to entrust, to consign",
            "委託", "いたく", "consignment, entrusting"
        ],
        [
            "Imitation and Copying",
            "真似", "まね", "imitating, copying",
            "模倣", "もほう", "imitation, mimicry",
            "コピー", "こぴー", "copy",
            "複製", "ふくせい", "reproduction, duplication"
        ],
        [
            "Inviting and Calling",
            "招く", "まねく", "to invite, to call for",
            "誘う", "さそう", "to invite, to ask out",
            "呼ぶ", "よぶ", "to call, to invite",
            "勧誘", "かんゆう", "invitation, solicitation"
        ],
        [
            "By No Means and Never",
            "真逆", "まさか", "by no means, never",
            "決して", "けっして", "never, by no means",
            "到底", "とうてい", "by no means, far from",
            "絶対に", "ぜったいに", "absolutely not, never"
        ],
        [
            "Rotations and Turns",
            "回り", "まわり", "rotation",
            "回転", "かいてん", "rotation, revolution",
            "旋回", "せんかい", "rotation, turning",
            "巡回", "じゅんかい", "tour, going around"
        ],
        [
            "Turning and Rotating",
            "回す", "まわす", "to turn, to rotate",
            "回転させる", "かいてんさせる", "to rotate, to spin",
            "捻る", "ひねる", "to twist, to turn",
            "旋回する", "せんかいする", "to rotate, to circle"
        ],
        [
            "First and Foremost",
            "先ず", "まず", "first of all, to start with",
            "最初に", "さいしょに", "first, to begin with",
            "何よりも", "なによりも", "above all, first and foremost",
            "第一に", "だいいちに", "firstly, in the first place"
        ],
        [
            "Trouble and Annoyance",
            "迷惑", "めいわく", "trouble, bother, annoyance",
            "面倒", "めんどう", "trouble, care",
            "煩わしい", "わずらわしい", "troublesome, bothersome",
            "厄介", "やっかい", "trouble, nuisance"
        ],
        [
            "Interviews and Meetings",
            "面接", "めんせつ", "interview (e.g. for a job)",
            "インタビュー", "いんたびゅー", "interview",
            "会見", "かいけん", "interview, audience",
            "対談", "たいだん", "talk, dialogue"
        ],
        [
            "Alarm Clocks",
            "目覚まし時計", "めざましどけい", "alarm clock",
            "アラーム", "あらーむ", "alarm",
            "時計", "とけい", "clock, watch",
            "起床時間", "きしょうじかん", "wake-up time"
        ],
        [
            "Body and Self",
            "身", "み", "body, oneself",
            "自身", "じしん", "oneself, personally",
            "自分", "じぶん", "oneself, myself",
            "体", "からだ", "body"
        ],
        [
            "Visiting the Sick",
            "見舞い", "みまい", "visiting ill or distressed people",
            "病気見舞い", "びょうきみまい", "visiting a sick person",
            "慰問", "いもん", "visit of sympathy",
            "お見舞い", "おみまい", "visiting (a sick person)"
        ],
        [
            "Charm and Fascination",
            "魅力", "みりょく", "charm, fascination",
            "魅惑", "みわく", "fascination, charm",
            "魅了", "みりょう", "to fascinate, to charm",
            "引力", "いんりょく", "attraction, appeal"
        ],
        [
            "Oil and Substances",
            "油", "あぶら", "oil",
            "物質", "ぶっしつ", "material, substance",
            "石油", "せきゆ", "oil, petroleum",
            "材料", "ざいりょう", "ingredients, material"
        ],
        [
            "Unfortunate Situations",
            "生憎", "あいにく", "unfortunately; sorry, but…",
            "不幸", "ふこう", "unhappiness, sorrow",
            "悲劇", "ひげき", "tragedy",
            "無沙汰", "ぶさた", "not writing or contacting for a while"
        ],
        [
            "Comprehensiveness",
            "有らゆる", "あらゆる", "all, every",
            "全員", "ぜんいん", "all members, everyone",
            "全国", "ぜんこく", "countrywide, nationwide",
            "全体", "ぜんたい", "whole, entirety"
        ],
        [
            "Feet and Walking",
            "足元", "あしもと", "at one's feet, under foot",
            "歩道", "ほどう", "footpath, walkway",
            "徒歩", "とほ", "walking, going on foot",
            "歩く", "あるく", "to walk"
        ],
        [
            "Traces and Marks",
            "跡", "あと", "trace, tracks, mark",
            "痕跡", "こんせき", "trace, mark",
            "消す", "けす", "to erase, to delete",
            "残る", "のこる", "to remain, to be left"
        ],
        [
            "Handling and Treating",
            "扱う", "あつかう", "to deal with, to treat",
            "取り扱い", "とりあつかい", "handling, treatment",
            "対処", "たいしょ", "dealing with, coping",
            "処理", "しょり", "processing, dealing with"
        ],
        [
            "Safety and Peace",
            "無事", "ぶじ", "safety, peace",
            "平和", "へいわ", "peace, harmony",
            "安全", "あんぜん", "safety, security",
            "平穏", "へいおん", "tranquility, calm"
        ],
        [
            "Civilization and Culture",
            "文明", "ぶんめい", "civilization",
            "文化", "ぶんか", "culture",
            "発展", "はってん", "development, growth",
            "進歩", "しんぽ", "progress, advance"
        ],
        [
            "Collisions and Impacts",
            "打つかる", "ぶつかる", "to strike against, to collide with",
            "衝突", "しょうとつ", "collision, crash",
            "激突", "げきとつ", "clash, collision",
            "接触", "せっしょく", "contact, touch"
        ],
        [
            "Peaks and Summits",
            "頂上", "ちょうじょう", "top, summit, peak",
            "山頂", "さんちょう", "mountain top",
            "最高点", "さいこうてん", "highest point",
            "絶頂", "ぜっちょう", "climax, peak"
        ],
        [
            "Conditions and States",
            "調子", "ちょうし", "tone, condition, health",
            "状態", "じょうたい", "condition, situation",
            "様子", "ようす", "state, appearance",
            "具合", "ぐあい", "condition, state"
        ],
        [
            "Strengths and Virtues",
            "長所", "ちょうしょ", "strong point, merit, virtue",
            "利点", "りてん", "advantage, merit",
            "美点", "びてん", "good point, merit",
            "特技", "とくぎ", "special skill, forte"
        ],
        [
            "Used and Second-hand",
            "中古", "ちゅうこ", "used, second-hand",
            "古着", "ふるぎ", "old clothes",
            "再利用", "さいりよう", "reuse, recycling",
            "中古品", "ちゅうこひん", "used article"
        ],
        [
            "Centers and Cores",
            "中心", "ちゅうしん", "center, middle, core",
            "中央", "ちゅうおう", "centre, middle",
            "核心", "かくしん", "core, heart",
            "中枢", "ちゅうすう", "center, core"
        ],
        [
            "Gender and Sex",
            "男女", "だんじょ", "men and women, both genders",
            "性別", "せいべつ", "gender",
            "男子", "だんし", "youth, young man",
            "女子", "じょし", "woman, girl"
        ],
        [
            "Single and Unmarried",
            "独身", "どくしん", "single, unmarried",
            "未婚", "みこん", "unmarried",
            "独り者", "ひとりもの", "single person",
            "単身", "たんしん", "single, alone"
        ],
        [
            "Simultaneous Events",
            "同時", "どうじ", "simultaneous, concurrent",
            "同時に", "どうじに", "simultaneously",
            "一斉に", "いっせいに", "all at once",
            "並行", "へいこう", "parallel, concurrent"
        ],
        [
            "Morals and Ethics",
            "道徳", "どうとく", "morals",
            "倫理", "りんり", "ethics",
            "善悪", "ぜんあく", "good and evil",
            "規範", "きはん", "norm, standard"
        ],
        [
            "Obtaining and Acquiring",
            "得る", "える", "to get, to gain, to acquire",
            "獲得", "かくとく", "acquisition, obtaining",
            "入手", "にゅうしゅ", "obtaining, acquirement",
            "取得", "しゅとく", "acquisition, possession"
        ],
        [
            "Disadvantages",
            "不利", "ふり", "disadvantage, handicap",
            "不利益", "ふりえき", "disadvantage, loss",
            "デメリット", "でめりっと", "demerit, disadvantage",
            "マイナス", "まいなす", "minus, disadvantage"
        ],
        [
            "Waving and Shaking",
            "振る", "ふる", "to wave, to shake",
            "揺れる", "ゆれる", "to shake, to sway",
            "揺らす", "ゆらす", "to shake, to rock",
            "振動", "しんどう", "vibration, shaking"
        ],
        [
            "Joints and Connections",
            "節", "ふし", "joint, knuckle, tune",
            "関節", "かんせつ", "joint, articulation",
            "接合", "せつごう", "joint, junction",
            "継ぎ目", "つぎめ", "joint, seam"
        ],
        [
            "Unnecessary Things",
            "不要", "ふよう", "unnecessary, unneeded",
            "不必要", "ふひつよう", "needless, unnecessary",
            "余計", "よけい", "unnecessary, uncalled for",
            "無用", "むよう", "useless, unnecessary"
        ],
        [
            "Foreign Languages",
            "外国語", "がいこくご", "foreign language",
            "英語", "えいご", "English language",
            "フランス語", "ふらんすご", "French language",
            "第二言語", "だいにげんご", "second language"
        ],
        [
            "Foreign-made Products",
            "外国産", "がいこくさん", "of foreign manufacture",
            "輸入品", "ゆにゅうひん", "imported goods",
            "海外製", "かいがいせい", "made overseas",
            "国外産", "こくがいさん", "foreign-produced"
        ],
        [
            "Actual Locations",
            "現場", "げんば", "actual spot, scene",
            "現地", "げんち", "local, on-site",
            "実地", "じっち", "on-site, practical",
            "その場", "そのば", "on the spot, at the scene"
        ],
        [
            "Reality and Actuality",
            "現実", "げんじつ", "reality, actuality",
            "実際", "じっさい", "practical, reality",
            "事実", "じじつ", "fact, truth, reality",
            "本当", "ほんとう", "truth, reality"
        ],
        [
            "Questions and Doubts",
            "疑問", "ぎもん", "question, doubt",
            "質問", "しつもん", "question, inquiry",
            "問題", "もんだい", "problem, question",
            "不明点", "ふめいてん", "unclear point"
        ],
        [
            "Robbers and Thieves",
            "強盗", "ごうとう", "robber, mugger",
            "泥棒", "どろぼう", "thief, burglar",
            "窃盗", "せっとう", "theft, stealing",
            "盗人", "ぬすびと", "thief, robber"
        ],
        [
            "Growing and Sprouting",
            "生える", "はえる", "to grow, to spring up",
            "芽生える", "めばえる", "to sprout, to bud",
            "成長する", "せいちょうする", "to grow, to develop",
            "育つ", "そだつ", "to be raised, to grow up"
        ],
        [
            "Violent and Furious",
            "激しい", "はげしい", "violent, furious",
            "猛烈", "もうれつ", "violent, fierce",
            "荒々しい", "あらあらしい", "rough, violent",
            "強烈", "きょうれつ", "intense, violent"
        ],
        [
            "Sweeping and Brushing",
            "掃く", "はく", "to sweep, to brush",
            "掃除する", "そうじする", "to clean, to sweep",
            "ブラシをかける", "ぶらしをかける", "to brush",
            "清掃する", "せいそうする", "to clean"
        ],
        [
            "Graves and Tombs",
            "墓", "はか", "grave, tomb",
            "墓地", "ぼち", "graveyard, cemetery",
            "霊園", "れいえん", "cemetery",
            "埋葬地", "まいそうち", "burial ground"
        ],
        [
            "Discoveries and Findings",
            "発見", "はっけん", "discovery, finding",
            "発掘", "はっくつ", "excavation, discovery",
            "見つける", "みつける", "to find, to discover",
            "探索", "たんさく", "search, exploration"
        ],
        [
            "Museums",
            "博物館", "はくぶつかん", "museum",
            "美術館", "びじゅつかん", "art museum",
            "資料館", "しりょうかん", "archive, data center",
            "展示館", "てんじかん", "exhibition hall"
        ],
        [
            "Fireworks",
            "花火", "はなび", "fireworks",
            "打ち上げ花火", "うちあげはなび", "skyrocket",
            "線香花火", "せんこうはなび", "sparkler",
            "爆竹", "ばくちく", "firecracker"
        ],
        [
            "Releasing and Letting Go",
            "放す", "はなす", "to release, to let go",
            "解放", "かいほう", "release, liberation",
            "釈放", "しゃくほう", "release, discharge",
            "手放す", "てばなす", "to let go of, to release"
        ],
        [
            "Needles and Pins",
            "針", "はり", "needle, pin",
            "縫い針", "ぬいばり", "sewing needle",
            "注射針", "ちゅうしゃばり", "hypodermic needle",
            "ピン", "ぴん", "pin"
        ],
        [
            "Ahead of Time",
            "早めに", "はやめに", "ahead of time",
            "事前に", "じぜんに", "in advance",
            "前もって", "まえもって", "beforehand",
            "早期に", "そうきに", "early, at an early stage"
        ],
        [
            "Removing and Undoing",
            "外す", "はずす", "to undo, to remove",
            "取り外す", "とりはずす", "to detach, to remove",
            "解除", "かいじょ", "cancellation, removal",
            "撤去", "てっきょ", "removal, taking away"
        ],
        [
            "Square Meters",
            "平方メートル", "へいほうめーとる", "square meter",
            "面積", "めんせき", "area, surface",
            "坪", "つぼ", "tsubo (approx. 3.3 sq meters)",
            "畳", "じょう", "tatami mat (as a measure)"
        ],
        [
            "Weekdays",
            "平日", "へいじつ", "weekday, ordinary days",
            "ウィークデー", "うぃーくでー", "weekday",
            "営業日", "えいぎょうび", "business day",
            "月曜から金曜", "げつようからきんよう", "Monday to Friday"
        ],
        [
            "Returns and Repayments",
            "返却", "へんきゃく", "return of something, repayment",
            "返済", "へんさい", "repayment, reimbursement",
            "払い戻し", "はらいもどし", "refund, reimbursement",
            "返品", "へんぴん", "return of goods"
        ],
        [
            "Comparisons",
            "比較", "ひかく", "comparison",
            "対比", "たいひ", "contrast, comparison",
            "照合", "しょうごう", "collation, comparison",
            "類比", "るいひ", "analogy, comparison"
        ],
        [
            "Undertaking and Accepting",
            "引き受ける", "ひきうける", "to undertake, to accept",
            "受諾", "じゅだく", "acceptance, consent",
            "引き受け", "ひきうけ", "undertaking, accepting",
            "請負", "うけおい", "contract, undertaking"
        ],
        [
            "Desperate Situations",
            "必死", "ひっし", "frantic, desperate",
            "必死に", "ひっしに", "desperately",
            "懸命", "けんめい", "eagerly, desperately",
            "命がけ", "いのちがけ", "risking one's life"
        ],
        [
            "Crowds of People",
            "人込み", "ひとごみ", "crowd of people",
            "群衆", "ぐんしゅう", "crowd, multitude",
            "雑踏", "ざっとう", "crowd, throng",
            "密集", "みっしゅう", "crowding, congestion"
        ],
        [
            "Bones",
            "骨", "ほね", "bone",
            "骨格", "こっかく", "skeleton, framework",
            "骨髄", "こつずい", "bone marrow",
            "骨組み", "ほねぐみ", "framework, structure"
        ],
        [
            "Methods and Ways",
            "方法", "ほうほう", "method, way, manner",
            "手法", "しゅほう", "technique, method",
            "手段", "しゅだん", "means, way, measure",
            "やり方", "やりかた", "way of doing, method"
        ],
        [
            "Gems and Jewels",
            "宝石", "ほうせき", "gem, jewel",
            "貴石", "きせき", "precious stone",
            "ジュエリー", "じゅえりー", "jewelry",
            "宝物", "たからもの", "treasure, valuable"
        ],
        [
            "Positions and Places",
            "位置", "いち", "place, position",
            "場所", "ばしょ", "place, location",
            "所在", "しょざい", "whereabouts, location",
            "配置", "はいち", "arrangement, placement"
        ],
        [
            "First-class and Top Grade",
            "一流", "いちりゅう", "first-class, top grade",
            "最高級", "さいこうきゅう", "top grade, highest class",
            "トップクラス", "とっぷくらす", "top class",
            "超一流", "ちょういちりゅう", "super first-class"
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