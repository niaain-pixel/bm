// Data Suku Kata Fonik Bahasa Melayu
const SUKU_KATA_LEVEL_1 = ["ba", "bi", "bu"];
const SUKU_KATA_LEVEL_2 = ["ka", "ki", "ku"]; // Suku kata yang akan muncul di Level 2
const SUKU_KATA_LEVEL_3 = ["sa", "si", "su"]; // Suku kata yang akan muncul di Level 3

// Suku kata sasaran yang akan memberi markah dan bunyi 'menang' untuk setiap level
const TARGET_SUKU_KATA_LEVEL = {
    1: "ba", // Untuk Level 1, sasaran adalah "ba"
    2: "ku", // Untuk Level 2, sasaran adalah "ku"
    3: "si"  // Untuk Level 3, sasaran adalah "si"
};

// Skor Sasaran untuk Setiap Level
const LEVEL_TARGET_SCORE = {
    1: 10,  // Capai 10 skor untuk Level 1
    2: 20,  // Capai 20 skor untuk Level 2 (jumlah skor dari awal)
    3: 30   // Capai 30 skor untuk Level 3
};

// Dapatkan elemen-elemen dari HTML
const gameArea = document.getElementById('game-area');
const playerBasket = document.getElementById('player-basket');
const scoreDisplay = document.getElementById('score-display');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');
const levelDisplay = document.getElementById('level-display');
const levelUpMessage = document.getElementById('level-up-message');


// Tetapan Game
const PLAYER_SPEED = 5; // Kelajuan pergerakan bakul
const FRUIT_FALL_SPEED_MIN = 0.5; // Kelajuan jatuh minimum buah (disetkan perlahan)
const FRUIT_FALL_SPEED_MAX = 1.5; // Kelajuan jatuh maksimum buah (disetkan perlahan)
const FRUIT_SPAWN_INTERVAL = 1500; // Selang masa buah baru muncul (ms) (disetkan lebih lambat)
const GAME_OVER_THRESHOLD = 0; // Game over jika skor kurang dari ini

let score = 0;
let playerX = gameArea.offsetWidth / 2 - playerBasket.offsetWidth / 2;
let fruits = []; // Array untuk menyimpan semua buah yang sedang jatuh
let gameLoopInterval;
let spawnFruitInterval;
let isGameOver = false;
let currentLevel = 1; // Mula dari Level 1
let activeSukuKata = SUKU_KATA_LEVEL_1; // Suku kata aktif untuk level semasa

// Kunci yang ditekan
let keysPressed = {};

// Objek untuk menyimpan bunyi
const audioMap = {};

// Muatkan semua bunyi suku kata dari semua level
// Ini penting supaya semua bunyi tersedia dari awal
const ALL_SUKU_KATA = [...SUKU_KATA_LEVEL_1, ...SUKU_KATA_LEVEL_2, ...SUKU_KATA_LEVEL_3];

ALL_SUKU_KATA.forEach(suku => {
    const audioPathMp3 = `audio/${suku}.mp3`;
    const audioPathWav = `audio/${suku}.wav`;
    const audio = new Audio(audioPathMp3);
    audio.onerror = () => {
        const wavAudio = new Audio(audioPathWav);
        wavAudio.onerror = () => console.warn(`Amaran: Gagal memuatkan bunyi ${suku} (.mp3 atau .wav)`);
        audioMap[suku] = wavAudio;
    };
    audioMap[suku] = audio;
});

// Muatkan bunyi untuk tangkapan yang betul (betul.mp3)
const catchSound = new Audio('betul.mp3');
catchSound.onerror = () => {
    const catchSoundWav = new Audio('betul.wav');
    catchSoundWav.onerror = () => console.warn('Amaran: Gagal memuatkan bunyi betul (.mp3 atau .wav)');
    window.catchSound = catchSoundWav;
};
window.catchSound = catchSound;

// Muatkan bunyi untuk terlepas atau salah tangkap (salah.mp3)
const missSound = new Audio('salah.mp3');
missSound.onerror = () => {
    const missSoundWav = new Audio('salah.wav');
    missSoundWav.onerror = () => console.warn('Amaran: Gagal memuatkan bunyi salah (.mp3 atau .wav)');
    window.missSound = missSoundWav;
};
window.missSound = missSound;


// --- Fungsi Game ---

function startGame() {
    score = 0;
    currentLevel = 1; // Reset level ke 1
    activeSukuKata = SUKU_KATA_LEVEL_1; // Reset suku kata aktif
    scoreDisplay.textContent = `Skor: ${score}`;
    levelDisplay.textContent = `Level: ${currentLevel}`; // Paparkan level awal
    playerX = gameArea.offsetWidth / 2 - playerBasket.offsetWidth / 2;
    playerBasket.style.left = `${playerX}px`;
    fruits.forEach(fruit => fruit.element.remove());
    fruits = [];
    gameOverScreen.style.display = 'none';
    levelUpMessage.style.display = 'none'; // Sembunyikan mesej level up
    isGameOver = false;

    clearInterval(gameLoopInterval);
    clearInterval(spawnFruitInterval);

    gameLoopInterval = setInterval(updateGame, 1000 / 60);
    spawnFruitInterval = setInterval(spawnFruit, FRUIT_SPAWN_INTERVAL);
}

function spawnFruit() {
    if (isGameOver) return;

    // Gunakan activeSukuKata untuk menjana buah
    const randomSuku = activeSukuKata[Math.floor(Math.random() * activeSukuKata.length)];
    const fruit = {
        suku: randomSuku,
        x: Math.random() * (gameArea.offsetWidth - 65),
        y: -65,
        // Kelajuan mungkin boleh meningkat dengan level
        speed: Math.random() * (FRUIT_FALL_SPEED_MAX - FRUIT_FALL_SPEED_MIN) + FRUIT_FALL_SPEED_MIN + (currentLevel * 0.1), // Ubah pendarab level kepada 0.1 untuk peningkatan yang lebih perlahan
        element: document.createElement('div')
    };

    fruit.element.className = 'fruit-apple';
    fruit.element.textContent = randomSuku;
    fruit.element.style.left = `${fruit.x}px`;
    fruit.element.style.top = `${fruit.y}px`;
    gameArea.appendChild(fruit.element);
    fruits.push(fruit);
}

function updateGame() {
    if (isGameOver) return;

    // Kemas kini kedudukan bakul berdasarkan kekunci yang ditekan
    if (keysPressed['ArrowLeft'] || keysPressed['a']) {
        playerX -= PLAYER_SPEED;
    }
    if (keysPressed['ArrowRight'] || keysPressed['d']) {
        playerX += PLAYER_SPEED;
    }

    // Hadkan pergerakan pemain dalam game area
    if (playerX < 0) playerX = 0;
    if (playerX > gameArea.offsetWidth - playerBasket.offsetWidth) {
        playerX = gameArea.offsetWidth - playerBasket.offsetWidth;
    }
    playerBasket.style.left = `${playerX}px`;

    // Kemas kini kedudukan buah
    fruits.forEach((fruit, index) => {
        fruit.y += fruit.speed;
        fruit.element.style.top = `${fruit.y}px`;

        // Periksa jika buah terlepas
        if (fruit.y > gameArea.offsetHeight) {
            // TIADA PENOLAKAN MARKAH APABILA BUAH TERLEPAS
            scoreDisplay.textContent = `Skor: ${score}`; // Paparkan skor sedia ada
            fruit.element.remove(); // Buang buah dari DOM
            fruits.splice(index, 1); // Buang buah dari array
            // --- TIADA BUNYI DI SINI APABILA BUAH TERLEPAS ---
            // if (window.missSound) {
            //     window.missSound.currentTime = 0;
            //     window.missSound.play();
            // }
        }

        // Periksa pelanggaran dengan bakul pemain
        // Koordinat bakul dan buah (relatif kepada gameArea)
        const fruitTop = fruit.y;
        const fruitBottom = fruit.y + fruit.element.offsetHeight;
        const fruitLeft = fruit.x;
        const fruitRight = fruit.x + fruit.element.offsetWidth;

        const basketTop = playerBasket.offsetTop;
        const basketBottom = playerBasket.offsetTop + playerBasket.offsetHeight;
        const basketLeft = playerBasket.offsetLeft;
        const basketRight = playerBasket.offsetLeft + playerBasket.offsetWidth;

        // Check for collision
        if (
            fruitBottom >= basketTop &&
            fruitTop <= basketBottom &&
            fruitRight >= basketLeft &&
            fruitLeft <= basketRight
        ) {
            // Mainkan bunyi suku kata
            if (audioMap[fruit.suku]) {
                audioMap[fruit.suku].currentTime = 0;
                audioMap[fruit.suku].play();
            }

            // --- LOGIK UNTUK BUNYI BETUL/SALAH BERDASARKAN SUKU KATA TARGET ---
            if (fruit.suku === TARGET_SUKU_KATA_LEVEL[currentLevel]) { // Jika suku kata buah adalah suku kata sasaran level semasa
                score += 2; // Tambah skor
                if (window.catchSound) { // window.catchSound = betul.mp3
                    window.catchSound.currentTime = 0;
                    window.catchSound.play(); // Mainkan bunyi BETUL
                }
            } else { // Jika suku kata buah BUKAN suku kata sasaran level semasa (iaitu, salah tangkap)
                // --- BUNYI SALAH HANYA DI SINI BILA SALAH TANGKAP ---
                if (window.missSound) { // window.missSound = salah.mp3
                    window.missSound.currentTime = 0;
                    window.missSound.play(); // Mainkan bunyi SALAH
                }
            }
            // --- AKHIR LOGIK ---
            
            scoreDisplay.textContent = `Skor: ${score}`; // Kemas kini paparan skor selepas penyesuaian

            fruit.element.remove(); // Buang buah dari DOM
            fruits.splice(index, 1); // Buang buah dari array
        }
    });

    // Periksa kondisi game over
    if (score < GAME_OVER_THRESHOLD) { // GAME_OVER_THRESHOLD kini 0
        endGame();
        return;
    }

    // Periksa kondisi naik level
    if (score >= LEVEL_TARGET_SCORE[currentLevel] && currentLevel < 3) { // Hanya naikkan sampai level 3
        levelUp();
    } else if (score >= LEVEL_TARGET_SCORE[3] && currentLevel === 3) {
        // Pemain telah menamatkan semua level
        endGame(true); // Hantar flag 'true' untuk menunjukkan kemenangan
    }
}

function levelUp() {
    currentLevel++;
    levelDisplay.textContent = `Level: ${currentLevel}`;

    // Pilih suku kata yang betul untuk level baru
    switch (currentLevel) {
        case 2:
            activeSukuKata = SUKU_KATA_LEVEL_2;
            break;
        case 3:
            activeSukuKata = SUKU_KATA_LEVEL_3;
            break;
        default:
            // Ini seharusnya tidak berlaku jika kita hanya ada 3 level
            break;
    }

    // Berhenti menjana buah seketika untuk mesej level up
    clearInterval(spawnFruitInterval);
    fruits.forEach(fruit => fruit.element.remove()); // Buang semua buah sedia ada
    fruits = [];

    // Paparkan mesej level up
    levelUpMessage.textContent = `Tahniah! Level ${currentLevel} bermula!`;
    levelUpMessage.style.display = 'block';

    // Beri masa untuk pemain melihat mesej, kemudian sambung game
    setTimeout(() => {
        levelUpMessage.style.display = 'none';
        spawnFruitInterval = setInterval(spawnFruit, FRUIT_SPAWN_INTERVAL); // Sambung menjana buah
    }, 2000); // Mesej dipaparkan selama 2 saat
}


function endGame(won = false) { // Tambah parameter won
    isGameOver = true;
    clearInterval(gameLoopInterval);
    clearInterval(spawnFruitInterval);
    fruits.forEach(fruit => fruit.element.remove()); // Buang sisa buah
    fruits = [];

    if (won) {
        finalScoreDisplay.textContent = `TAHNIAH! Anda berjaya menamatkan semua level dengan Skor: ${score}`;
        gameOverScreen.querySelector('h2').textContent = 'GAME TAMAT!'; // Ubah tajuk jika menang
    } else {
        finalScoreDisplay.textContent = `Skor Akhir: ${score}`;
        gameOverScreen.querySelector('h2').textContent = 'GAME OVER!';
    }
    
    gameOverScreen.style.display = 'flex';
}

// --- Kawalan Pemain (Keyboard Event Listeners) ---
document.addEventListener('keydown', (e) => {
    // Pastikan game sedang berjalan (tidak game over)
    if (!isGameOver) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            keysPressed['ArrowLeft'] = true;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            keysPressed['ArrowRight'] = true;
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysPressed['ArrowLeft'] = false;
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysPressed['ArrowRight'] = false;
    }
});


// Butang Mula Semula
restartButton.addEventListener('click', startGame);

// Mulakan game apabila halaman dimuat sepenuhnya
window.onload = startGame;