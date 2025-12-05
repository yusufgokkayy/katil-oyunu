const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Statik dosyalar
app.use(express.static(path.join(__dirname, 'public')));

// Veri dosyası
const DATA_FILE = path.join(__dirname, 'data.json');

// Verileri dosyadan yükle
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.log('Veri dosyası okunamadı, yeni başlatılıyor');
    }
    return {
        teams: [],
        gameState: {
            started: false,
            phase: 0,
            phaseName: 'Lobby',
            killer: null,
            solution: null,
            phaseTimer: 0,
            releasedClues: []
        }
    };
}

// Verileri dosyaya kaydet
function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify({ teams, gameState }, null, 2));
    } catch (err) {
        console.log('Veri kaydedilemedi:', err);
    }
}

// Oyun verileri
const data = loadData();
let teams = Array.isArray(data) ? data : (data.teams || []);
let gameState = data.gameState || {
    started: false,
    phase: 0,
    phaseName: 'Lobby',
    killer: null,
    solution: null,
    phaseTimer: 0,
    releasedClues: []
};

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '260678';

// Oyun senaryosu - Bir etkinlikte kullanılabilir profesyonel gizem
const GAME_SCENARIO = {
    title: "Konakta Cinayet",
    description: "Ünlü işadamı Mehmet Konak'ın villasında verilen yemekte bir cinayet işlendi. Kurban: İş ortağı Ayşe Demir. Takımınız bu cinayeti çözmeye çalışan dedektifler.",
    
    characters: [
        {
            id: 'mehmet',
            name: 'Mehmet Konak',
            role: 'Ev Sahibi',
            description: 'Villa sahibi, 55 yaşında işadamı',
            motive: 'Ayşe ile iş anlaşmazlığı vardı',
            alibi: 'Cinayet sırasında bahçedeydi'
        },
        {
            id: 'zeynep',
            name: 'Zeynep Yıldız',
            role: 'Avukat',
            description: 'Mehmet\'in avukatı, 40 yaşında',
            motive: 'Ayşe\'nin bazı sırlarını biliyordu',
            alibi: 'Üst katta telefonda görüşüyordu'
        },
        {
            id: 'can',
            name: 'Can Arslan',
            role: 'İş Ortağı',
            description: 'Yeni proje ortağı, 35 yaşında',
            motive: 'Ayşe\'nin projeden çıkmasını istiyordu',
            alibi: 'Salonda içki içiyordu'
        },
        {
            id: 'elif',
            name: 'Elif Kaya',
            role: 'Aşçı',
            description: 'Villada çalışan aşçı, 28 yaşında',
            motive: 'Ayşe kendisine kötü davranıyordu',
            alibi: 'Mutfaktaydı ama kimse görmedi'
        },
        {
            id: 'ali',
            name: 'Ali Şen',
            role: 'Güvenlik',
            description: 'Villa güvenlik görevlisi, 45 yaşında',
            motive: 'Ayşe onu işten attırmaya çalışıyordu',
            alibi: 'Kapıdaydı ama CCTV çalışmıyordu'
        }
    ],
    
    locations: [
        { id: 'yemek-salonu', name: 'Yemek Salonu', description: 'Cinayetin işlendiği yer' },
        { id: 'mutfak', name: 'Mutfak', description: 'Yemeklerin hazırlandığı yer' },
        { id: 'bahce', name: 'Bahçe', description: 'Geniş, ağaçlık alan' },
        { id: 'salon', name: 'Oturma Salonu', description: 'Misafirlerin toplandığı ana salon' },
        { id: 'ust-kat', name: 'Üst Kat', description: 'Yatak odaları ve çalışma odası' },
        { id: 'garaj', name: 'Garaj', description: 'Araçların park edildiği alan' }
    ],
    
    clues: [
        {
            id: 'clue1',
            phase: 1,
            type: 'Temel İpucu',
            text: 'Kurban: Ayşe Demir, cinayet saati: 21:30, ölüm nedeni: zehirlenme',
            points: 0
        },
        {
            id: 'clue2',
            phase: 1,
            type: 'Temel İpucu',
            text: 'Yemek sırasında 5 kişi vardı: Mehmet, Zeynep, Can, Ayşe ve Elif',
            points: 0
        },
        {
            id: 'clue3',
            phase: 2,
            type: 'Olay Yeri',
            text: 'Ayşe\'nin bardağında nadir bir bitki zehri bulundu',
            points: 10
        },
        {
            id: 'clue4',
            phase: 2,
            type: 'Tanık',
            text: 'Ali: "Saat 21:15\'te Elif\'in bahçeye gittiğini gördüm"',
            points: 10
        },
        {
            id: 'clue5',
            phase: 2,
            type: 'Fiziksel Kanıt',
            text: 'Bahçede nadir bitki örnekleri bulundu, bazıları yeni koparılmış',
            points: 15
        },
        {
            id: 'clue6',
            phase: 3,
            type: 'İlişki',
            text: 'Elif\'in botanik uzmanı bir arkadaşı var, zehirli bitkiler hakkında bilgi almış',
            points: 20
        },
        {
            id: 'clue7',
            phase: 3,
            type: 'Motiv',
            text: 'Ayşe, Elif\'in maaşını kesmek için Mehmet\'e baskı yapıyordu',
            points: 15
        },
        {
            id: 'clue8',
            phase: 3,
            type: 'Tanık',
            text: 'Can: "Elif\'in Ayşe ile şiddetli tartıştığını duydum"',
            points: 15
        },
        {
            id: 'clue9',
            phase: 4,
            type: 'Kritik Kanıt',
            text: 'Elif\'in odasında bitki kitapları ve zehirli bitki notları bulundu',
            points: 25
        },
        {
            id: 'clue10',
            phase: 4,
            type: 'Kritik Kanıt',
            text: 'Mutfak güvenlik kaydı: Elif yemeği servis etmeden önce Ayşe\'nin bardağına bir şey koydu',
            points: 30
        }
    ],
    
    solution: {
        killer: 'elif',
        weapon: 'Zehirli bitki (Aconitum)',
        location: 'Mutfakta bardağa konuldu, yemek salonunda etkisini gösterdi',
        motive: 'İşinden atılma korkusu ve Ayşe\'nin kötü muamelesi',
        method: 'Ayşe\'nin içkisine bahçeden topladığı zehirli bitkiyi karıştırdı'
    },
    
    phases: [
        { id: 0, name: 'Lobby', duration: 0, description: 'Oyun başlamadı' },
        { id: 1, name: 'Olay Yeri İncelemesi', duration: 300, description: 'İlk kanıtları toplayın' },
        { id: 2, name: 'Tanık İfadeleri', duration: 300, description: 'Şüphelileri sorgulayın' },
        { id: 3, name: 'Derinlemesine Araştırma', duration: 300, description: 'Gizli kanıtları bulun' },
        { id: 4, name: 'Final Dedüksiyonu', duration: 180, description: 'Katili bulun!' }
    ]
};

// Zamanlayıcı
let phaseTimer = null;

function startPhaseTimer(durationSeconds) {
    if (phaseTimer) clearInterval(phaseTimer);
    
    gameState.phaseTimer = durationSeconds;
    
    phaseTimer = setInterval(() => {
        gameState.phaseTimer--;
        
        // Her 10 saniyede bir veya son 60 saniyede her saniye güncelleme gönder
        if (gameState.phaseTimer <= 60 || gameState.phaseTimer % 10 === 0) {
            io.emit('timer-update', gameState.phaseTimer);
        }
        
        if (gameState.phaseTimer <= 0) {
            clearInterval(phaseTimer);
            phaseTimer = null;
            // Zaman doldu bildirimi
            io.emit('phase-time-up');
        }
    }, 1000);
}

// Socket.io bağlantıları
io.on('connection', (socket) => {
    console.log('Kullanıcı bağlandı:', socket.id);

    // İlk bağlantıda oyun durumunu gönder
    socket.emit('teams-update', teams);
    socket.emit('game-state-update', gameState);
    socket.emit('game-scenario', {
        title: GAME_SCENARIO.title,
        description: GAME_SCENARIO.description,
        characters: GAME_SCENARIO.characters,
        locations: GAME_SCENARIO.locations,
        phases: GAME_SCENARIO.phases,
        clues: GAME_SCENARIO.clues
    });

    // Yeni takım oluştur
    socket.on('create-team', (name, callback) => {
        const exists = teams.some(t => t.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            callback({ success: false, error: 'Bu isimde takım var!' });
            return;
        }

        const team = {
            id: 'team_' + Date.now(),
            name: name,
            score: 0,
            discoveries: [],
            investigations: [],
            accusation: null
        };

        teams.push(team);
        saveData();
        callback({ success: true, team: team });

        io.emit('teams-update', teams);
        console.log('Takım oluşturuldu:', name);
    });

    // Takıma giriş yap
    socket.on('join-team', (teamId, callback) => {
        const team = teams.find(t => t.id === teamId);
        if (team) {
            socket.join(teamId);
            callback({ success: true, team: team });
        } else {
            callback({ success: false, error: 'Takım bulunamadı!' });
        }
    });

    // Takım bilgisi al
    socket.on('get-team', (teamId, callback) => {
        const team = teams.find(t => t.id === teamId);
        callback(team || null);
    });

    // İpucu keşfet
    socket.on('discover-clue', (data, callback) => {
        const team = teams.find(t => t.id === data.teamId);
        const clue = GAME_SCENARIO.clues.find(c => c.id === data.clueId);
        
        if (!team) {
            callback({ success: false, error: 'Takım bulunamadı!' });
            return;
        }
        
        if (!clue) {
            callback({ success: false, error: 'İpucu bulunamadı!' });
            return;
        }
        
        // Oyun başlamış mı kontrol et
        if (!gameState.started) {
            callback({ success: false, error: 'Oyun henüz başlamadı!' });
            return;
        }
        
        // İpucu bu fazda mevcut mu kontrol et
        if (clue.phase > gameState.phase) {
            callback({ success: false, error: 'Bu ipucu henüz açılmadı!' });
            return;
        }
        
        // Daha önce keşfedilmiş mi kontrol et
        if (team.discoveries.some(d => d.clueId === clue.id)) {
            callback({ success: false, error: 'Bu ipucunu zaten keşfettiniz!' });
            return;
        }
        
        // İpucunu kaydet
        team.discoveries.push({
            clueId: clue.id,
            text: clue.text,
            type: clue.type,
            points: clue.points,
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        });
        
        team.score += clue.points;
        saveData();
        
        callback({ success: true, clue: clue, points: clue.points });
        
        io.emit('teams-update', teams);
        io.to(data.teamId).emit('team-update', team);
        
        console.log(`${team.name} ipucu keşfetti: ${clue.type} (+${clue.points} puan)`);
    });

    // Soruşturma notu ekle
    socket.on('add-investigation', (data, callback) => {
        const team = teams.find(t => t.id === data.teamId);
        if (team) {
            team.investigations.push({
                text: data.text,
                time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            });
            saveData();
            callback({ success: true });

            io.to(data.teamId).emit('team-update', team);
        } else {
            callback({ success: false, error: 'Takım bulunamadı!' });
        }
    });


    // Suçlama yap
    socket.on('make-accusation', (data, callback) => {
        const team = teams.find(t => t.id === data.teamId);
        
        if (!team) {
            callback({ success: false, error: 'Takım bulunamadı!' });
            return;
        }
        
        if (!gameState.started) {
            callback({ success: false, error: 'Oyun henüz başlamadı!' });
            return;
        }
        
        if (team.accusation) {
            callback({ success: false, error: 'Zaten bir suçlama yaptınız!' });
            return;
        }
        
        // Suçlamayı kaydet
        team.accusation = {
            killer: data.killer,
            weapon: data.weapon,
            motive: data.motive,
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            correct: false
        };
        
        // Doğru mu kontrol et
        if (data.killer === GAME_SCENARIO.solution.killer) {
            team.accusation.correct = true;
            team.score += 100; // Doğru suçlama bonusu
            
            // İlk doğru suçlama ekstra bonus
            const firstCorrect = !teams.some(t => 
                t.id !== team.id && 
                t.accusation && 
                t.accusation.correct
            );
            
            if (firstCorrect) {
                team.score += 50;
            }
        } else {
            team.score -= 20; // Yanlış suçlama cezası
        }
        
        saveData();
        callback({ 
            success: true, 
            correct: team.accusation.correct,
            points: team.accusation.correct ? (firstCorrect ? 150 : 100) : -20
        });
        
        io.emit('teams-update', teams);
        io.to(data.teamId).emit('team-update', team);
        
        console.log(`${team.name} suçlama yaptı: ${data.killer} - ${team.accusation.correct ? 'DOĞRU' : 'YANLIŞ'}`);
    });

    // Admin şifre kontrolü
    socket.on('admin-login', (password, callback) => {
        if (password === ADMIN_PASSWORD) {
            callback({ success: true });
        } else {
            callback({ success: false, error: 'Yanlış şifre!' });
        }
    });

    // Oyunu başlat (admin)
    socket.on('start-game', (callback) => {
        if (gameState.started) {
            callback({ success: false, error: 'Oyun zaten başladı!' });
            return;
        }
        
        if (teams.length === 0) {
            callback({ success: false, error: 'En az bir takım olmalı!' });
            return;
        }
        
        gameState.started = true;
        gameState.phase = 1;
        gameState.phaseName = GAME_SCENARIO.phases[1].name;
        gameState.killer = GAME_SCENARIO.solution.killer;
        gameState.solution = GAME_SCENARIO.solution;
        
        const phaseDuration = GAME_SCENARIO.phases[1].duration;
        startPhaseTimer(phaseDuration);
        
        saveData();
        callback({ success: true });
        
        io.emit('game-state-update', gameState);
        io.emit('game-started');
        
        console.log('Oyun başlatıldı! Faz 1: ' + gameState.phaseName);
    });

    // Faz değiştir (admin)
    socket.on('change-phase', (newPhase, callback) => {
        if (!gameState.started) {
            callback({ success: false, error: 'Oyun henüz başlamadı!' });
            return;
        }
        
        if (newPhase < 1 || newPhase > 4) {
            callback({ success: false, error: 'Geçersiz faz!' });
            return;
        }
        
        gameState.phase = newPhase;
        gameState.phaseName = GAME_SCENARIO.phases[newPhase].name;
        
        const phaseDuration = GAME_SCENARIO.phases[newPhase].duration;
        if (phaseDuration > 0) {
            startPhaseTimer(phaseDuration);
        }
        
        saveData();
        callback({ success: true });
        
        io.emit('game-state-update', gameState);
        io.emit('phase-changed', { phase: newPhase, name: gameState.phaseName });
        
        console.log('Faz değiştirildi: ' + gameState.phaseName);
    });

    // Oyunu bitir (admin)
    socket.on('end-game', (callback) => {
        if (!gameState.started) {
            callback({ success: false, error: 'Oyun zaten bitmemiş!' });
            return;
        }
        
        if (phaseTimer) {
            clearInterval(phaseTimer);
            phaseTimer = null;
        }
        
        gameState.started = false;
        gameState.phase = 0;
        gameState.phaseName = 'Bitti';
        gameState.phaseTimer = 0;
        
        saveData();
        callback({ success: true, solution: GAME_SCENARIO.solution });
        
        io.emit('game-state-update', gameState);
        io.emit('game-ended', { solution: GAME_SCENARIO.solution });
        
        console.log('Oyun sonlandırıldı!');
    });

    // Puan değiştir (admin)
    socket.on('change-score', (data, callback) => {
        const team = teams.find(t => t.id === data.teamId);
        if (team) {
            const newScore = team.score + data.amount;
            if (newScore < 0) {
                callback({ success: false, error: 'Puan 0 altına düşemez!' });
                return;
            }
            team.score = newScore;
            saveData();
            callback({ success: true, team: team });

            io.emit('teams-update', teams);
            io.to(data.teamId).emit('team-update', team);
            console.log(`${team.name}: ${data.amount > 0 ? '+' : ''}${data.amount} puan`);
        } else {
            callback({ success: false, error: 'Takım bulunamadı!' });
        }
    });

    // Takım sil (admin)
    socket.on('delete-team', (teamId, callback) => {
        const teamIndex = teams.findIndex(t => t.id === teamId);
        if (teamIndex !== -1) {
            const teamName = teams[teamIndex].name;
            teams.splice(teamIndex, 1);
            saveData();
            callback({ success: true });

            io.emit('teams-update', teams);
            io.emit('team-deleted', teamId);
            console.log('Takım silindi:', teamName);
        } else {
            callback({ success: false, error: 'Takım bulunamadı!' });
        }
    });

    // Oyunu sıfırla (admin)
    socket.on('reset-game', (callback) => {
        const count = teams.length;
        teams = [];
        
        if (phaseTimer) {
            clearInterval(phaseTimer);
            phaseTimer = null;
        }
        
        gameState = {
            started: false,
            phase: 0,
            phaseName: 'Lobby',
            killer: null,
            solution: null,
            phaseTimer: 0,
            releasedClues: []
        };
        
        saveData();
        callback({ success: true, count: count });

        io.emit('teams-update', teams);
        io.emit('game-state-update', gameState);
        io.emit('game-reset');
        console.log('Oyun sıfırlandı! ' + count + ' takım silindi.');
    });

    // Bağlantı koptu
    socket.on('disconnect', () => {
        console.log('Kullanıcı ayrıldı:', socket.id);
    });
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║         KATİL KİM? OYUNU               ║
║────────────────────────────────────────║
║  Sunucu çalışıyor!                     ║
║  http://localhost:${PORT}                  ║
║                                        ║
║  Admin Şifresi: ${ADMIN_PASSWORD}                 ║
╚════════════════════════════════════════╝
    `);
});