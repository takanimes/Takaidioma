document.addEventListener('DOMContentLoaded', () => {
    // SENSEI: Todo o JavaScript de funcionalidade está aqui.
    
    const navLinks = document.querySelectorAll('.nav-link');
    const navLinksMobile = document.querySelectorAll('.nav-link-mobile');
    const tabContents = document.querySelectorAll('.tab-content');
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    let hiraganaSystem, katakanaSystem;
    let flashcardHiraganaInitialized = false;
    let flashcardKatakanaInitialized = false;
    let kanjiGridInitialized = false;
    let iPlus1Initialized = false; // SENSEI: Flag para a nova aba

    // --- Gerenciamento da Navegação ---
    menuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    function activateTab(tabId) {
        const allLinks = [...navLinks, ...navLinksMobile];
        allLinks.forEach(nav => {
            const navTab = nav.getAttribute('data-tab');
            nav.classList.toggle('active', navTab === tabId);
        });
        
        tabContents.forEach(content => {
            content.classList.toggle('hidden', content.id !== tabId);
        });

        // SENSEI: Inicialização "Lazy Load". Só carrega o conteúdo quando o usuário clica.
        // Isso torna o carregamento inicial do site muito mais rápido.
        if (tabId === 'flashcards' && !flashcardHiraganaInitialized) {
            hiraganaSystem.start();
            flashcardHiraganaInitialized = true;
        }
        if (tabId === 'flashcards-katakana' && !flashcardKatakanaInitialized) {
            katakanaSystem.start();
            flashcardKatakanaInitialized = true;
        }
        if(tabId === 'aulas' && !document.getElementById('hiragana-table').querySelector('tbody')) {
            renderKanaTables();
        }
        if(tabId === 'kanji' && !kanjiGridInitialized) {
            populateKanjiGrid();
            setupKanjiMnemonics();
            kanjiGridInitialized = true;
        }
        if(tabId === 'i-plus-1' && !iPlus1Initialized) {
            setupSentenceMiner();
            iPlus1Initialized = true;
        }
        
        mobileMenu.classList.add('hidden');
        window.scrollTo(0, 0);
    }
    
    document.querySelectorAll('.nav-link, .nav-link-mobile, .link-to-tab').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            activateTab(link.getAttribute('data-tab'));
        });
    });

    document.querySelectorAll('.btn-back').forEach(button => {
        button.addEventListener('click', () => activateTab('inicio'));
    });

    // --- Conexão com a API Gemini (Sensei IA) ---
    // SENSEI: A chave da API deve ser mantida em segredo em um projeto real.
    // Para este protótipo, está OK. Substitua pela sua chave.
    const API_KEY = "AIzaSyDV9v5ytbs3ZIO7wMxGrVXAsrQf5IDn0GA"; // SENSEI: Chave adicionada
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    async function callGeminiAPI(prompt, retries = 3) {
        if (!API_KEY) {
            console.error("API_KEY não definida no JavaScript.");
            return "Desculpe, Sensei. Parece que minha conexão com a IA não foi configurada. (API_KEY está faltando).";
        }
        try {
            const payload = { contents: [{ parts: [{ text: prompt }] }] };
            const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!response.ok) {
                if (response.status === 429 && retries > 0) { // Tratamento de "Rate Limiting" (excesso de requisições)
                   await new Promise(res => setTimeout(res, (4 - retries) * 1000));
                   return callGeminiAPI(prompt, retries - 1);
                }
                throw new Error(`API Error: ${response.statusText}`);
            }
            const result = await response.json();
            const candidate = result.candidates?.[0];
            return candidate?.content?.parts?.[0]?.text || "Resposta da API inválida.";
        } catch (error) {
            console.error("Erro ao chamar a API Gemini:", error);
            return "Desculpe, não consegui gerar uma resposta no momento. Pode ser um problema na chave da API ou na conexão.";
        }
    }

    // --- SENSEI: NOVA SEÇÃO - LÓGICA DO MÉTODO i+1 ---
    
    // Dados das Sentenças de Mineração
    const sentenceData = [
        {
            sentence: [
                { word: '私', reading: 'わたし', meaning: 'Eu', type: 'Kanji' },
                { word: 'は', reading: 'は (wa)', meaning: 'Partícula de tópico', type: 'Hiragana' },
                { word: 'うずまきナルト', reading: 'うずまきナルト', meaning: 'Uzumaki Naruto', type: 'Hiragana/Katakana' },
                { word: 'だ', reading: 'だ', meaning: 'É / Sou (informal)', type: 'Hiragana' },
                { word: 'ってばよ', reading: 'ってばよ', meaning: 'Bordão (ênfase)', type: 'Hiragana' }
            ],
                    translation: 'Eu sou Uzumaki Naruto, dattebayo!',
            source: 'Naruto (Ep. 1)'
        },
        {
            sentence: [
                { word: '海賊王', reading: 'かいぞくおう', meaning: 'Rei dos Piratas', type: 'Kanji' },
                { word: 'に', reading: 'に', meaning: 'Partícula (objetivo)', type: 'Hiragana' },
                { word: 'おれ', reading: 'おれ', meaning: 'Eu (masculino, informal)', type: 'Hiragana' },
                { word: 'は', reading: 'は (wa)', meaning: 'Partícula de tópico', type: 'Hiragana' },
                { word: 'なる', reading: 'なる', meaning: 'Vou me tornar', type: 'Hiragana' }
                    ],
            translation: 'Eu vou me tornar o Rei dos Piratas!',
            source: 'One Piece (Luffy)'
        },
        {
            sentence: [
                { word: 'これ', reading: 'これ', meaning: 'Isto', type: 'Hiragana' },
                { word: 'は', reading: 'は (wa)', meaning: 'Partícula de tópico', type: 'Hiragana' },
                { word: 'ペン', reading: 'ペン', meaning: 'Caneta (Pen)', type: 'Katakana' },
                { word: 'です', reading: 'です', meaning: 'É / Sou (formal)', type: 'Hiragana' }
                    ],
            translation: 'Isto é uma caneta.',
            source: 'Livro Didático (Básico)'
        },
        {
            sentence: [
                { word: '大丈夫', reading: 'だいじょうぶ', meaning: 'Tudo bem / Ok', type: 'Kanji/Hiragana' },
                { word: 'だ', reading: 'だ', meaning: 'É', type: 'Hiragana' },
                { word: '、', reading: '', meaning: 'Pausa (vírgula)', type: 'Símbolo' },
                { word: '私', reading: 'わたし', meaning: 'Eu', type: 'Kanji' },
                { word: 'が', reading: 'が', meaning: 'Partícula (sujeito)', type: 'Hiragana' },
                { word: '来た', reading: 'きた', meaning: 'Cheguei (passado de vir)', type: 'Kanji/Hiragana' }
                    ],
            translation: 'Está tudo bem, por que? Porque eu cheguei!',
            source: 'Boku no Hero Academia (All Might)'
        }
    ];

    let currentSentenceIndex = 0;
    
    function setupSentenceMiner() {
        const sentenceContainer = document.getElementById('sentence-container');
        const tooltip = document.getElementById('word-tooltip');
        const toggleTranslationBtn = document.getElementById('toggle-translation-btn');
        const translationContainer = document.getElementById('translation-container');
        const translationText = document.getElementById('sentence-translation');
        const nextSentenceBtn = document.getElementById('next-sentence-btn');
        const explainGrammarBtn = document.getElementById('explain-grammar-btn');
        const grammarExplanation = document.getElementById('grammar-explanation');
        const grammarContent = document.getElementById('grammar-content');
        // SENSEI: Seletor atualizado para o novo local da "Fonte"
        const sourceText = document.querySelector('#sentence-card .text-center p.text-sm.text-gray-400');
        
        // Função para carregar uma sentença
        function loadSentence(index) {
            // Limpa a sentença anterior
            sentenceContainer.innerHTML = '';
            translationContainer.classList.add('hidden');
            grammarExplanation.classList.add('hidden');
            toggleTranslationBtn.textContent = 'Revelar Tradução';
            
            const data = sentenceData[index];
            translationText.textContent = data.translation;
            sourceText.textContent = `Fonte: ${data.source}`;
            
            // Cria as palavras interativas
            data.sentence.forEach(word => {
                const wordSpan = document.createElement('span');
                wordSpan.className = 'sentence-word relative pb-2'; // pb-2 para espaço do sublinhado
                wordSpan.textContent = word.word;
                wordSpan.dataset.reading = word.reading;
                wordSpan.dataset.meaning = word.meaning;
                wordSpan.dataset.type = word.type;
                
                // Adiciona sublinhado hover
                wordSpan.classList.add('hover:after:w-full', 'after:content-[""]', 'after:absolute', 'after:bottom-0', 'after:left-0', 'after:w-0', 'after:h-0.5', 'after:bg-pink-400', 'after:transition-all', 'after:duration-300');

                sentenceContainer.appendChild(wordSpan);
            });
        }

        // Event Listener para as palavras (delegação)
        sentenceContainer.addEventListener('click', (e) => {
            const wordEl = e.target.closest('.sentence-word');
            if (!wordEl) {
                tooltip.classList.add('hidden');
                return;
            }
            
            // Popula o tooltip
            document.getElementById('tooltip-reading').textContent = wordEl.dataset.reading;
            document.getElementById('tooltip-meaning').textContent = wordEl.dataset.meaning;
            document.getElementById('tooltip-type').textContent = `Tipo: ${wordEl.dataset.type}`;
            
            // Posiciona o tooltip
            const rect = wordEl.getBoundingClientRect();
            const containerRect = sentenceContainer.getBoundingClientRect();
            
            tooltip.style.left = `${rect.left - containerRect.left + rect.width / 2}px`; // Centraliza
            tooltip.style.top = `${rect.top - containerRect.top - tooltip.offsetHeight - 10}px`; // Acima da palavra
            tooltip.style.transform = 'translateX(-50%)'; // Ajuste fino da centralização
            tooltip.classList.remove('hidden');
        });

        // Esconder tooltip ao clicar fora
        document.getElementById('i-plus-1').addEventListener('click', (e) => {
            if (!e.target.closest('.sentence-word') && !e.target.closest('#word-tooltip')) {
                tooltip.classList.add('hidden');
            }
        });

        // Botão de tradução
        toggleTranslationBtn.addEventListener('click', () => {
            translationContainer.classList.toggle('hidden');
            const isHidden = translationContainer.classList.contains('hidden');
            toggleTranslationBtn.textContent = isHidden ? 'Revelar Tradução' : 'Esconder Tradução';
        });

        // Botão de próxima sentença
        nextSentenceBtn.addEventListener('click', () => {
            currentSentenceIndex = (currentSentenceIndex + 1) % sentenceData.length; // Loop
            loadSentence(currentSentenceIndex);
        });
        
        // Botão de explicar gramática (IA)
        explainGrammarBtn.addEventListener('click', async () => {
            grammarExplanation.classList.remove('hidden');
            grammarContent.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
            
            const currentSentence = sentenceData[currentSentenceIndex].sentence.map(w => w.word).join('');
            const currentTranslation = sentenceData[currentSentenceIndex].translation;

            // SENSEI: Prompt específico para gramática
            const prompt = `${systemPrompt}\n\nUm aluno pediu uma explicação gramatical. A sentença é:\nJaponês: "${currentSentence}"\nTradução: "${currentTranslation}"\n\nPor favor, explique a gramática principal desta sentença de forma simples (nível iniciante). Foque em 1 ou 2 conceitos-chave (ex: a partícula 'は', a terminação 'です', ou o uso de 'に'). Não precisa analisar palavra por palavra, apenas a estrutura principal.`;
            
            const response = await callGeminiAPI(prompt);
            grammarContent.innerHTML = response.replace(/\*/g, '').replace(/\n/g, '<br>');
        });

        // Carrega a primeira sentença
        loadSentence(currentSentenceIndex);
    }
    
    // --- Funcionalidade do Chat (Sensei IA) ---
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    let chatHistory = [];
    // SENSEI: Este é o "prompt do sistema" que define a personalidade da IA.
    const systemPrompt = "Você é o Taka-Sensei, um professor de japonês amigável, paciente e divertido. Seu público são iniciantes que amam animes. Use uma linguagem simples, dê exemplos práticos (muitas vezes de animes, se apropriado) e sempre seja encorajador. Responda em português do Brasil. Ajude os alunos a seguir o Roteiro de 3 Fases (Fundação, Mineração, Imersão) e recomende animes/mangás para a Fase de Imersão.";
    
    async function handleChat() {
        const userMessage = chatInput.value.trim();
        if (!userMessage) return;
        
        appendMessage(userMessage, 'user');
        chatInput.value = '';
        chatInput.disabled = true;
        chatSendBtn.disabled = true;
        appendTypingIndicator(); // Mostra "digitando..."
        
        // SENSEI: Monta o prompt completo com histórico
        const fullPrompt = `${systemPrompt}\n\nHistórico da conversa:\n${chatHistory.map(m => `${m.role}: ${m.parts[0].text}`).join('\n')}\n\nNova pergunta do aluno: ${userMessage}`;
        
        const aiResponse = await callGeminiAPI(fullPrompt);
        
        removeTypingIndicator();
        appendMessage(aiResponse, 'ai');
        
        // SENSEI: Adiciona ao histórico para a IA ter contexto
        chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
        chatHistory.push({ role: "model", parts: [{ text: aiResponse }] });

        chatInput.disabled = false;
        chatSendBtn.disabled = false;
        chatInput.focus();
    }
    
    function appendMessage(text, sender) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
        const messageBubble = document.createElement('div');
        messageBubble.className = `chat-bubble ${sender}`;
        messageBubble.innerHTML = text.replace(/\*/g, '').replace(/\n/g, '<br>'); // Limpa formatação
        messageWrapper.appendChild(messageBubble);
        chatWindow.appendChild(messageWrapper);
        chatWindow.scrollTop = chatWindow.scrollHeight; // Rola para a última msg
    }

    function appendTypingIndicator() {
        const typingWrapper = document.createElement('div');
        typingWrapper.id = 'typing-indicator-wrapper';
        typingWrapper.className = 'flex justify-start';
        const typingBubble = document.createElement('div');
        typingBubble.className = 'chat-bubble ai';
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `<span></span><span></span><span></span>`;
        typingBubble.appendChild(indicator);
        typingWrapper.appendChild(typingBubble);
        chatWindow.appendChild(typingWrapper);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator-wrapper');
        if (indicator) indicator.remove();
    }
    
    chatSendBtn.addEventListener('click', handleChat);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleChat(); });

    // --- Sistema de Flashcards (Hiragana e Katakana) ---
    function setupFlashcardSystem(system, data) {
        const prefix = system === 'hiragana' ? '' : '-ktk';
        let shuffledCards = [], currentIndex = 0;
        
        const elements = {
            flipContainer: document.getElementById(`flashcard-flip${prefix}`),
            charEl: document.getElementById(`flashcard-char${prefix}`),
            imageEl: document.getElementById(`flashcard-image${prefix}`),
            phraseEl: document.getElementById(`flashcard-phrase${prefix}`),
            triviaEl: document.getElementById(`flashcard-trivia${prefix}`),
            inputEl: document.getElementById(`flashcard-input${prefix}`),
            checkBtn: document.getElementById(`flashcard-check${prefix}`),
            nextBtn: document.getElementById(`flashcard-next${prefix}`),
            feedbackEl: document.getElementById(`flashcard-feedback${prefix}`),
        };

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        function start() {
            shuffledCards = [...data];
            shuffleArray(shuffledCards);
            currentIndex = 0;
            loadCard(currentIndex);
        }

        function loadCard(index) {
            elements.flipContainer.classList.remove('is-flipped');
            elements.inputEl.classList.remove('correct', 'incorrect');
            elements.feedbackEl.textContent = '';
            elements.inputEl.value = '';
            elements.inputEl.disabled = false;
            elements.checkBtn.classList.remove('hidden');
            elements.nextBtn.classList.add('hidden');
            
            if (shuffledCards.length > 0) {
                const card = shuffledCards[index];
                elements.charEl.textContent = card.char;
                elements.imageEl.src = card.image;
                elements.phraseEl.textContent = card.phrase;
                elements.triviaEl.textContent = card.trivia;
            }
        }

        function checkAnswer() {
             const userAnswer = elements.inputEl.value.toLowerCase().trim();
            if (!userAnswer) return;
            
            const correctAnswer = shuffledCards[currentIndex].romaji;
            
            if (userAnswer === correctAnswer) {
                elements.inputEl.classList.add('correct');
                elements.flipContainer.classList.add('is-flipped'); // Vira o card
                elements.checkBtn.classList.add('hidden');
                elements.nextBtn.classList.remove('hidden');
                elements.inputEl.disabled = true;
            } else {
                elements.inputEl.classList.add('incorrect');
                elements.feedbackEl.textContent = 'Resposta errada!';
                // SENSEI: Feedback visual de erro, treme o input
                elements.inputEl.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    elements.feedbackEl.textContent = '';
                    elements.inputEl.classList.remove('incorrect');
                    elements.inputEl.value = '';
                    elements.inputEl.focus();
                    elements.inputEl.style.animation = '';
                }, 1500);
            }
        }
        
        function nextCard() {
            currentIndex++;
            if (currentIndex >= shuffledCards.length) {
                start(); // Reinicia o baralho
            } else {
                loadCard(currentIndex);
            }
        }

        elements.checkBtn.addEventListener('click', checkAnswer);
        elements.inputEl.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !elements.checkBtn.classList.contains('hidden')) checkAnswer(); });
        elements.nextBtn.addEventListener('click', nextCard);
        
        return { start }; // Expõe o método start
    }

    // SENSEI: Dados dos Flashcards. Facilmente expansível!
    const flashcardDataHiragana = [
        { char: 'あ', romaji: 'a', image: 'https://placehold.co/400x200/f9258a/FFFFFF?text=Arigatou!', phrase: 'ありがとう (Arigatou)', trivia: 'Significa "Obrigado". Uma das primeiras palavras que todo fã de anime aprende!' },
        { char: 'な', romaji: 'na', image: 'https://placehold.co/400x200/ff7e5f/FFFFFF?text=NANI?!', phrase: 'なに？！ (Nani?!)', trivia: 'A famosa expressão de surpresa de Naruto. Significa "O quê?!"' },
        { char: 'ち', romaji: 'chi', image: 'https://placehold.co/400x200/1dd3b0/1a1a2e?text=Chiisai!', phrase: '小さい (Chiisai)', trivia: 'Significa "pequeno". Pense no Chibi, a versão pequena e fofa dos personagens.' },
        { char: 'だ', romaji: 'da', image: 'https://placehold.co/400x200/fcca46/1a1a2e?text=Dattebayo!', phrase: 'だってばよ (Dattebayo!)', trivia: 'O bordão clássico do Naruto, usado para dar ênfase no final das frases.'},
        { char: 'い', romaji: 'i', image: 'https://placehold.co/400x200/a2d2ff/1a1a2e?text=Itai!', phrase: '痛い (Itai)', trivia: 'Significa "Ai!" ou "Dói!". Você ouve isso toda vez que um personagem se machuca.' }
    ];
    const flashcardDataKatakana = [
        { char: 'カ', romaji: 'ka', image: 'https://placehold.co/400x200/4a4e69/FFFFFF?text=Kamera!', phrase: 'カメラ (Kamera)', trivia: 'Significa "Câmera". Muitas palavras de tecnologia são escritas em Katakana.' },
        { char: 'ピ', romaji: 'pi', image: 'https://placehold.co/400x200/fca311/14213d?text=Pikachu!', phrase: 'ピカチュウ (Pikachu)', trivia: 'O nome do Pokémon mais famoso do mundo é escrito em Katakana!' },
        { char: 'ラ', romaji: 'ra', image: 'https://placehold.co/400x200/e5e5e5/000000?text=Ramen!', phrase: 'ラーメン (Ramen)', trivia: 'A comida favorita do Naruto! A palavra vem do chinês "lamian".' },
        { char: 'ゴ', romaji: 'go', image: 'https://placehold.co/400x200/ff6d00/FFFFFF?text=Goku!', phrase: 'ドラゴンボール (Doragon Booru)', trivia: 'O "Go" de Goku (悟空) é um kanji, mas o "Go" de "Gorila" (ゴリラ) é em Katakana.' },
        { char: 'サ', romaji: 'sa', image: 'https://placehold.co/400x200/f9c425/000000?text=Saiyajin!', phrase: 'サイヤ人 (Saiyajin)', trivia: 'A raça guerreira de Dragon Ball. "Saiya" é um anagrama de "Yasai" (vegetal).' }
    ];
    
    // Inicializa os sistemas de flashcard
    hiraganaSystem = setupFlashcardSystem('hiragana', flashcardDataHiragana);
    katakanaSystem = setupFlashcardSystem('katakana', flashcardDataKatakana);

    // --- Tabelas de Hiragana/Katakana (Seção Aulas) ---
    const hiraganaChart = { 'Vogais': ['あ a', 'い i', 'う u', 'え e', 'お o'], 'K': ['か ka', 'き ki', 'く ku', 'け ke', 'こ ko'], 'S': ['さ sa', 'し shi', 'す su', 'せ se', 'そ so'], 'T': ['た ta', 'ち chi', 'つ tsu', 'て te', 'と to'], 'N': ['な na', 'に ni', 'ぬ nu', 'ね ne', 'の no'], 'H': ['は ha', 'ひ hi', 'ふ fu', 'へ he', 'ほ ho'], 'M': ['ま ma', 'み mi', 'む mu', 'め me', 'も mo'], 'Y': ['や ya', '', 'ゆ yu', '', 'よ yo'], 'R': ['ら ra', 'り ri', 'る ru', 'れ re', 'ろ ro'], 'W': ['わ wa', '', '', '', 'を wo'], 'Nn': ['', '', 'ん n', '', ''] };
    const katakanaChart = { 'Vogais': ['ア a', 'イ i', 'ウ u', 'エ e', 'オ o'], 'K': ['カ ka', 'キ ki', 'ク ku', 'ケ ke', 'コ ko'], 'S': ['サ sa', 'シ shi', 'ス su', 'セ se', 'ソ so'], 'T': ['タ ta', 'チ chi', 'ツ tsu', 'テ te', 'ト to'], 'N': ['ナ na', 'ニ ni', 'ヌ nu', 'ネ ne', 'ノ no'], 'H': ['ハ ha', 'ヒ hi', 'フ fu', 'ヘ he', 'ホ ho'], 'M': ['マ ma', 'ミ mi', 'ム mu', 'メ me', 'モ mo'], 'YV': ['ヤ ya', '', 'ユ yu', '', 'ヨ yo'], 'R': ['ラ ra', 'リ ri', 'ル ru', 'レ re', 'ロ ro'], 'W': ['ワ wa', '', '', '', 'ヲ wo'], 'Nn': ['', '', 'ン n', '', ''] };
    const hiraganaTableEl = document.getElementById('hiragana-table');
    const katakanaTableEl = document.getElementById('katakana-table');

    function renderKanaTables() {
        if (hiraganaTableEl.querySelector('tbody')) return; // Já renderizado
        
        const renderTable = (tableEl, chart) => {
            const tbody = document.createElement('tbody');
            for (const row in chart) {
                const tr = document.createElement('tr');
                tr.innerHTML = `<th class="p-2 font-bold text-pink-400">${row === 'Nn' ? 'N' : row === 'Vogais' ? '' : row}</th>` + chart[row].map(kana => {
                    if (!kana) return `<td class="p-3 text-2xl"></td>`;
                    const [char, romaji] = kana.split(' ');
                    return `<td class="p-3 text-2xl" data-sound="${romaji}">${char}</td>`;
                }).join('');
                tbody.appendChild(tr);
            }
            tableEl.appendChild(tbody);
        };
        
        renderTable(hiraganaTableEl, hiraganaChart);
        renderTable(katakanaTableEl, katakanaChart);
    }

    // SENSEI: Adiciona a funcionalidade de "clicar para ouvir" nas tabelas
    document.querySelectorAll('.kana-table').forEach(table => {
        table.addEventListener('click', (e) => {
            if (e.target.tagName === 'TD' && e.target.dataset.sound) {
                const utterance = new SpeechSynthesisUtterance(e.target.dataset.sound);
                utterance.lang = 'ja-JP'; // Garante a pronúncia correta
                utterance.rate = 0.8;
                speechSynthesis.speak(utterance);
            }
        });
    });

    // --- Sistema de Quiz ---
    const quizQuestions = [
        { question: "Em 'Naruto', qual o significado do bordão 'Dattebayo!' (だってばよ)?", image: "https://placehold.co/400x200/fcca46/1a1a2e?text=Frase+de+Efeito", options: ["Pode crer!", "Uma forma de ênfase", "Estou com fome", "Adeus"], answer: "Uma forma de ênfase" },
        { question: "Em 'One Piece', o que Luffy grita antes de um grande ataque?", image: "https://placehold.co/400x200/d90429/FFFFFF?text=Piratas", options: ["Itai!", "Nani?!", "Gomu Gomu no...", "Arigatou"], answer: "Gomu Gomu no..." },
        { question: "Qual é a saudação comum ao entrar em uma loja no Japão?", image: "https://placehold.co/400x200/1dd3b0/1a1a2e?text=Bem-vindo!", options: ["Konnichiwa", "Sayonara", "Irasshaimase", "Sumimasen"], answer: "Irasshaimase" },
        { question: "Em 'Attack on Titan', o que significa 'Shinzou wo Sasageyo!' (心臓を捧げよ)?", image: "https://placehold.co/400x200/8d99ae/FFFFFF?text=Saudação+Militar", options: ["Atacar os Titãs", "Dediquem seus corações", "Corram pela suas vidas", "É uma ordem"], answer: "Dediquem seus corações" },
        { question: "O que significa 'Kawaii' (可愛い), uma palavra muito comum em animes?", image: "https://placehold.co/400x200/f9258a/FFFFFF?text=Expressão+Facial", options: ["Forte", "Triste", "Fofo / Adorável", "Engraçado"], answer: "Fofo / Adorável" },
        { question: "Qual o significado de 'Omae wa mou shindeiru' (お前はもう死んでいる), a famosa frase de Kenshiro em 'Hokuto no Ken'?", image: "https://placehold.co/400x200/4a4e69/FFFFFF?text=Cena+de+Luta", options: ["Eu te amo", "Você já está morto", "Vamos lutar!", "Qual é o seu nome?"], answer: "Você já está morto" },
        { question: "Quando um personagem quer tranquilizar outro, qual palavra ele frequentemente usa para dizer 'Está tudo bem'?", image: "https://placehold.co/400x200/1dd3b0/1a1a2e?text=Conversa+Amigável", options: ["Sayonara", "Gomen nasai", "Daijoubu", "Mendokusai"], answer: "Daijoubu" },
        // SENSEI: ERRO CORRIGIDO AQUI! (httpsA:// -> https://)
        { question: "Em 'Jujutsu Kaisen', o que significa 'Ryōiki Tenkai' (領域展開)?", image: "https://placehold.co/400x200/8d99ae/FFFFFF?text=Técnica+Suprema", options: ["Ataque total", "Obrigado pela comida", "Técnica amaldiçoada", "Expansão de Domínio"], answer: "Expansão de Domínio" },
        { question: "Qual dessas palavras é um insulto comum em animes, significando 'idiota' ou 'bobo'?", image: "https://placehold.co/400x200/d90429/FFFFFF?text=Discussão", options: ["Sugoi", "Baka", "Kawaii", "Senpai"], answer: "Baka" },
        // SENSEI: ERRO CORRIGIDO AQUI! (httpsA:// -> https://)
        { question: "O que significa a palavra 'Nakama' (仲間), tão importante em animes como 'One Piece'?", image: "https://placehold.co/400x200/f9258a/FFFFFF?text=Laços+de+Amizade", options: ["Família", "Professor", "Inimigo", "Companheiro / Tripulação"], answer: "Companheiro / Tripulação" }
    ];

    const quizStart = document.getElementById('quiz-start');
    const quizGame = document.getElementById('quiz-game');
    const quizEnd = document.getElementById('quiz-end');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const questionNumber = document.getElementById('question-number');
    const questionText = document.getElementById('question-text');
    const quizImage = document.getElementById('quiz-image');
    const optionsContainer = document.getElementById('options-container');
    const scoreDisplay = document.getElementById('score');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const finalScore = document.getElementById('final-score');
    const feedbackMessage = document.getElementById('feedback-message');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');
    
    let currentQuestionIndex = 0, score = 0;

    function startQuiz() {
        quizStart.classList.add('hidden');
        quizEnd.classList.add('hidden');
        quizGame.classList.remove('hidden');
        currentQuestionIndex = 0;
        score = 0;
        scoreDisplay.textContent = score;
        nextQuestionBtn.classList.add('hidden');
        // SENSEI: Embaralha as perguntas para o jogo ser diferente toda vez
        shuffleArray(quizQuestions);
        showQuestion();
    }

    function showQuestion() {
        resetState();
        let currentQuestion = quizQuestions[currentQuestionIndex];
        questionNumber.textContent = `${currentQuestionIndex + 1}/${quizQuestions.length}`;
        quizImage.src = currentQuestion.image;
        questionText.textContent = currentQuestion.question;
        
        // SENSEI: Embaralha as opções
        let shuffledOptions = [...currentQuestion.options];
        shuffleArray(shuffledOptions);

        shuffledOptions.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('quiz-option', 'p-4', 'rounded-lg', 'font-semibold', 'text-left');
            button.addEventListener('click', selectAnswer);
            optionsContainer.appendChild(button);
        });
    }

    function resetState(){
        nextQuestionBtn.classList.add('hidden');
        while(optionsContainer.firstChild){
            optionsContainer.removeChild(optionsContainer.firstChild);
        }
    }

    function selectAnswer(e) {
        const selectedBtn = e.target;
        const isCorrect = selectedBtn.textContent === quizQuestions[currentQuestionIndex].answer;
        
        if (isCorrect) {
            selectedBtn.classList.add('correct');
            score += 10;
            scoreDisplay.textContent = score;
        } else {
            selectedBtn.classList.add('incorrect');
        }
        
        // SENSEI: Mostra a resposta correta e desabilita as outras
        Array.from(optionsContainer.children).forEach(button => {
             if(button.textContent === quizQuestions[currentQuestionIndex].answer) button.classList.add('correct');
            button.classList.add('disabled');
        });
        
        nextQuestionBtn.classList.remove('hidden');
    }

    function handleNextButton(){
        currentQuestionIndex++;
        if(currentQuestionIndex < quizQuestions.length) showQuestion();
        else showScore();
    }

    function showScore(){
        quizGame.classList.add('hidden');
        quizEnd.classList.remove('hidden');
        finalScore.textContent = score;
        let message = "";
        if (score >= 80) message = "Excelente! Você é um verdadeiro Hokage do conhecimento otaku!";
        else if (score >= 50) message = "Muito bom! Você está no caminho para se tornar um mestre Pokémon.";
        else message = "Continue assistindo animes e estudando! Ganbatte!";
        feedbackMessage.textContent = message;
    }

    // SENSEI: Função utilitária para embaralhar arrays
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    startQuizBtn.addEventListener('click', startQuiz);
    nextQuestionBtn.addEventListener('click', handleNextButton);
    restartQuizBtn.addEventListener('click', startQuiz);
    
    // --- Populando o Guia de Kanji ---
    const kanjiGrid = document.getElementById('kanji-grid');
    const kanjiData = [
        { kanji: '日', meaning: 'Dia, Sol, Japão', on: 'NICHI, JITSU', kun: 'hi, -bi, -ka', ex: '日本 (Nihon) - Japão' }, { kanji: '一', meaning: 'Um', on: 'ICHI, ITSU', kun: 'hito(tsu)', ex: '一番 (ichiban) - O melhor' }, { kanji: '国', meaning: 'País', on: 'KOKU', kun: 'kuni', ex: '外国 (gaikoku) - País estrangeiro' }, { kanji: '人', meaning: 'Pessoa', on: 'JIN, NIN', kun: 'hito', ex: '三人 (sannin) - Três pessoas' }, { kanji: '年', meaning: 'Ano', on: 'NEN', kun: 'toshi', ex: '今年 (kotoshi) - Este ano' }, { kanji: '大', meaning: 'Grande', on: 'DAI, TAI', kun: 'oo(kii)', ex: '大学 (daigaku) - Universidade' }, { kanji: '十', meaning: 'Dez', on: 'JUU', kun: 'too, to', ex: '十日 (tooka) - Dia dez' }, { kanji: '二', meaning: 'Dois', on: 'NI', kun: 'futa(tsu)', ex: '二月 (nigatsu) - Fevereiro' }, { kanji: '本', meaning: 'Livro, Origem', on: 'HON', kun: 'moto', ex: '本 (hon) - Livro' }, { kanji: '中', meaning: 'Dentro, Meio', on: 'CHUU', kun: 'naka', ex: '中国 (chuugoku) - China' }, { kanji: '長', meaning: 'Longo, Chefe', on: 'CHOU', kun: 'naga(i)', ex: '社長 (shachou) - Presidente da empresa' }, { kanji: '出', meaning: 'Sair', on: 'SHUTSU', kun: 'de(ru), da(su)', ex: '出口 (deguchi) - Saída' }, { kanji: '三', meaning: 'Três', on: 'SAN', kun: 'mit(tsu)', ex: '三日 (mikka) - Dia três' }, { kanji: '時', meaning: 'Tempo, Hora', on: 'JI', kun: 'toki', ex: '時間 (jikan) - Tempo' }, { kanji: '行', meaning: 'Ir', on: 'KOU, GYOU', kun: 'i(ku), yu(ku)', ex: '銀行 (ginkou) - Banco' }, { kanji: '見', meaning: 'Ver', on: 'KEN', kun: 'mi(ru)', ex: '見る (miru) - Ver' }, { kanji: '月', meaning: 'Mês, Lua', on: 'GETSU, GATSU', kun: 'tsuki', ex: '月曜日 (getsuyoubi) - Segunda-feira' }, { kanji: '分', meaning: 'Minuto, Dividir', on: 'FUN, BUN', kun: 'wa(karu)', ex: '分かる (wakaru) - Entender' }, { kanji: '後', meaning: 'Depois, Atrás', on: 'GO, KOU', kun: 'ushiro, ato', ex: '午後 (gogo) - P.M. (tarde)' }, { kanji: '前', meaning: 'Antes, Frente', on: 'ZEN', kun: 'mae', ex: '名前 (namae) - Nome' }, { kanji: '生', meaning: 'Vida, Nascer', on: 'SEI, SHOU', kun: 'i(kiru), u(mareru)', ex: '先生 (sensei) - Professor' }, { kanji: '五', meaning: 'Cinco', on: 'GO', kun: 'itsu(tsu)', ex: '五日 (itsuka) - Dia cinco' }, { kanji: '間', meaning: 'Intervalo, Entre', on: 'KAN, KEN', kun: 'aida, ma', ex: '人間 (ningen) - Ser humano' }, { kanji: '上', meaning: 'Cima, Sobre', on: 'JOU', kun: 'ue, a(garu)', ex: '上手 (jouzu) - Habilidosso' }, { kanji: '東', meaning: 'Leste', on: 'TOU', kun: 'higashi', ex: '東京 (toukyou) - Tóquio' }, { kanji: '四', meaning: 'Quatro', on: 'SHI', kun: 'yon, yot(tsu)', ex: '四月 (shigatsu) - Abril' }, { kanji: '今', meaning: 'Agora', on: 'KON, KIN', kun: 'ima', ex: '今日 (kyou) - Hoje' }, { kanji: '金', meaning: 'Ouro, Dinheiro', on: 'KIN', kun: 'kane', ex: '金曜日 (kinyoubi) - Sexta-feira' }, { kanji: '九', meaning: 'Nove', on: 'KYUU, KU', kun: 'kokono(tsu)', ex: '九日 (kokonoka) - Dia nove' }, { kanji: '入', meaning: 'Entrar', on: 'NYUU', kun: 'i(ru), hai(ru)', ex: '入口 (iriguchi) - Entrada' }, { kanji: '学', meaning: 'Aprender', on: 'GAKU', kun: 'mana(bu)', ex: '学校 (gakkou) - Escola' }, { kanji: '高', meaning: 'Alto, Caro', on: 'KOU', kun: 'taka(i)', ex: '高校 (koukou) - Ensino médio' }, { kanji: '円', meaning: 'Círculo, Yen', on: 'EN', kun: 'maru(i)', ex: '百円 (hyaku en) - Cem ienes' }, 
        { kanji: '子', meaning: 'Criança', on: 'SHI, SU', kun: 'ko', ex: '子供 (kodomo) - Criança' }, 
        { kanji: '外', meaning: 'Fora', on: 'GAI, GE', kun: 'soto', ex: '外国 (gaikoku) - País estrangeiro' }, { kanji: '八', meaning: 'Oito', on: 'HACHI', kun: 'yat(tsu)', ex: '八日 (youka) - Dia oito' }, { kanji: '六', meaning: 'Seis', on: 'ROKU', kun: 'mut(tsu)', ex: '六日 (muika) - Dia seis' }, { kanji: '下', meaning: 'Baixo, Debaixo', on: 'KA, GE', kun: 'shita, o(riru)', ex: '下手 (heta) - Inábil' }, { kanji: '来', meaning: 'Vir', on: 'RAI', kun: 'ku(ru)', ex: '来週 (raishuu) - Próxima semana' }, { kanji: '気', meaning: 'Espírito, Gás', on: 'KI, KE', kun: 'iki', ex: '元気 (genki) - Saudável, animado' }, { kanji: '小', meaning: 'Pequeno', on: 'SHOU', kun: 'chii(sai), ko', ex: '小さい (chiisai) - Pequeno' }, { kanji: '七', meaning: 'Sete', on: 'SHICHI', kun: 'nana(tsu)', ex: '七日 (nanoka) - Dia sete' }, { kanji: '山', meaning: 'Montanha', on: 'SAN', kun: 'yama', ex: '富士山 (fujisan) - Monte Fuji' }, { kanji: '話', meaning: 'Falar', on: 'WA', kun: 'hana(su)', ex: '電話 (denwa) - Telefone' }, { kanji: '女', meaning: 'Mulher', on: 'JO, NYO', kun: 'onna', ex: '女の人 (onna no hito) - Mulher' }, { kanji: '北', meaning: 'Norte', on: 'HOKU', kun: 'kita', ex: '北海道 (hokkaidou) - Hokkaido' }, { kanji: '午', meaning: 'Meio-dia', on: 'GO', kun: 'uma', ex: '午前 (gozen) - A.M. (manhã)' }, { kanji: '百', meaning: 'Cem', on: 'HYAKU', kun: 'momo', ex: '三百 (sanbyaku) - Trezentos' }, { kanji: '書', meaning: 'Escrever', on: 'SHO', kun: 'ka(ku)', ex: '書く (kaku) - Escrever' }, { kanji: '先', meaning: 'Antes, Ponta', on: 'SEN', kun: 'saki', ex: '先生 (sensei) - Professor' }
    ];

    function populateKanjiGrid() {
        if (!kanjiGrid) return; // SENSEI: Verificação de segurança
        if (kanjiGrid.children.length > 0) return; // Já populado
        
        kanjiData.forEach((kanji, index) => {
            const card = document.createElement('div');
            card.className = 'card rounded-lg p-4 flex flex-col';
            // SENSEI: Adicionado o card-number aqui
            card.innerHTML = `
                        <span class="card-number">${index + 1}</span>
                        <p class="kanji-char text-6xl sm:text-7xl font-bold text-center mb-4">${kanji.kanji}</p>
                        <h4 class="kanji-meaning text-xl font-bold text-pink-400 text-center mb-4">${kanji.meaning}</h4>
                <div class="text-sm space-y-2 mb-4">
                    <p><span class="font-bold text-gray-300">On'yomi:</span> <span class="text-gray-400">${kanji.on}</span></p>
                    <p><span class="font-bold text-gray-300">Kun'yomi:</span> <span class="text-gray-400">${kanji.kun}</span></p>
                    <p><span class="font-bold text-gray-300">Exemplo:</span> <span class="text-gray-400">${kanji.ex}</span></p>
                </div>
                        <button class="btn-gemini font-bold py-2 px-4 rounded-lg mt-auto text-sm">✨ Criar Mnemônico (IA)</button>
                        <div class="mnemonic-container hidden mt-4 p-3 bg-gray-900 rounded-lg text-sm text-gray-300"></div>
                    `;
            kanjiGrid.appendChild(card);
        });
    }

    // --- Sistema de Mnemônicos de Kanji (IA) ---
    function setupKanjiMnemonics() {
        if (!kanjiGrid) return; // SENSEI: Verificação de segurança
        kanjiGrid.addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-gemini')) {
                const card = e.target.closest('.card');
                const kanjiChar = card.querySelector('.kanji-char').textContent;
                const kanjiMeaning = card.querySelector('.kanji-meaning').textContent;
                const mnemonicContainer = card.querySelector('.mnemonic-container');
                
                mnemonicContainer.classList.remove('hidden');
                mnemonicContainer.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;

                // SENSEI: Prompt de IA focado em mnemônicos
                const prompt = `${systemPrompt}\n\nUm aluno quer um mnemônico (uma história ou imagem mental) para aprender um Kanji. O Kanji é:\n- Kanji: ${kanjiChar}\n- Significado Principal: ${kanjiMeaning}\n\nPor favor, crie um mnemônico curto, divertido e fácil de lembrar para este kanji. Seja criativo!`;
                
                const response = await callGeminiAPI(prompt);
                mnemonicContainer.innerHTML = response.replace(/\*/g, '').replace(/\n/g, '<br>');
            }
        });
    }

    // --- Inicialização ---
    // SENSEI: Ativa a aba "Início" (Roteiro) assim que a página carrega.
    activateTab('inicio');
    
});