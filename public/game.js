(function() {
    const socket = io();
    let teams = [];
    let gameState = { started: false, phase: 0, phaseName: 'Lobby', phaseTimer: 0 };
    let gameScenario = null;
    let currentTeamId = localStorage.getItem('currentTeamId');
    let selectedJoinId = null;
    let isProcessing = false;
    let currentTeam = null;

    // Toast notification
    function toast(msg, err) {
        const t = document.getElementById('toast');
        t.textContent = msg;
        t.className = err ? 'show err' : 'show';
        setTimeout(() => { t.className = ''; }, 3000);
    }

    // Show page
    function showPage(id) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(id).classList.add('active');
    }

    // Format time
    function formatTime(seconds) {
        if (!seconds || seconds < 0) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Update game status displays
    function updateGameStatus() {
        // Lobby status
        const lobbyStatus = document.getElementById('lobbyGameStatus');
        if (gameState.started) {
            lobbyStatus.className = 'game-status';
            lobbyStatus.innerHTML = `
                <div class="phase-indicator">${gameState.phaseName}</div>
                <div class="timer">${formatTime(gameState.phaseTimer)}</div>
            `;
        } else {
            lobbyStatus.className = 'game-status inactive';
            lobbyStatus.innerHTML = `
                <div class="phase-indicator">Oyun Bekleniyor</div>
                <div style="font-size: 14px; color: #888;">Takımlar oluşturuluyor...</div>
            `;
        }

        // Team status
        const teamStatus = document.getElementById('teamGameStatus');
        const teamPhase = document.getElementById('teamPhase');
        const teamTimer = document.getElementById('teamTimer');
        
        if (gameState.started) {
            teamStatus.className = 'game-status';
            teamPhase.textContent = gameState.phaseName;
            teamTimer.textContent = formatTime(gameState.phaseTimer);
            teamTimer.className = gameState.phaseTimer <= 60 ? 'timer warning' : 'timer';
        } else {
            teamStatus.className = 'game-status inactive';
            teamPhase.textContent = 'Oyun Başlamadı';
            teamTimer.textContent = '--:--';
            teamTimer.className = 'timer';
        }

        // Admin status
        if (document.getElementById('statPhase')) {
            document.getElementById('statPhase').textContent = gameState.phase;
            document.getElementById('statTimer').textContent = formatTime(gameState.phaseTimer);
        }
    }

    // Render join list
    function renderJoinList() {
        const c = document.getElementById('joinList');
        if (teams.length === 0) {
            c.innerHTML = '<div class="empty">Henüz takım oluşturulmamış</div>';
            return;
        }
        
        let html = '';
        teams.forEach(t => {
            html += `<div class="team-opt" data-id="${t.id}" onclick="GAME.selectJoin(this)">
                ${t.name} - ${t.score} puan
            </div>`;
        });
        c.innerHTML = html;
    }

    // Render clue grid
    function renderClueGrid() {
        if (!gameScenario || !currentTeam) return;
        
        const grid = document.getElementById('clueGrid');
        let html = '';
        
        gameScenario.clues.forEach(clue => {
            const discovered = currentTeam.discoveries.some(d => d.clueId === clue.id);
            const locked = clue.phase > gameState.phase;
            
            let cardClass = 'clue-card';
            if (discovered) cardClass += ' discovered';
            if (locked) cardClass += ' locked';
            
            html += `<div class="${cardClass}" onclick="GAME.discoverClue('${clue.id}')">
                <div class="clue-phase">Faz ${clue.phase}</div>
                <div class="clue-type">${clue.type}</div>
                <div class="clue-points">+${clue.points} puan</div>
                ${discovered ? '<div style="margin-top:10px;font-size:13px;color:#2d5a27;">✓ Keşfedildi</div>' : ''}
                ${locked ? '<div style="margin-top:10px;font-size:13px;color:#888;">🔒 Kilitli</div>' : ''}
            </div>`;
        });
        
        grid.innerHTML = html;
    }

    // Render discoveries
    function renderDiscoveries() {
        if (!currentTeam) return;
        
        const list = document.getElementById('discoveryList');
        const count = document.getElementById('discoveryCount');
        
        count.textContent = `(${currentTeam.discoveries.length})`;
        
        if (currentTeam.discoveries.length === 0) {
            list.innerHTML = '<div class="empty">Henüz ipucu keşfetmediniz</div>';
            return;
        }
        
        let html = '';
        currentTeam.discoveries.slice().reverse().forEach(d => {
            html += `<div class="discovery-item">
                <div class="discovery-header">
                    <span class="discovery-type">${d.type}</span>
                    <span class="discovery-time">${d.time}</span>
                </div>
                <div class="discovery-text">${d.text}</div>
                <div class="clue-points">+${d.points} puan</div>
            </div>`;
        });
        
        list.innerHTML = html;
    }

    // Render team page
    function renderTeamPage(team) {
        currentTeam = team;
        document.getElementById('dispTeamName').textContent = team.name;
        document.getElementById('teamScore').textContent = team.score;
        
        // Populate killer select
        if (gameScenario && !team.accusation) {
            const selKiller = document.getElementById('selKiller');
            let options = '<option value="">Katili seçin...</option>';
            gameScenario.characters.forEach(c => {
                options += `<option value="${c.id}">${c.name} (${c.role})</option>`;
            });
            selKiller.innerHTML = options;
        }
        
        // Show accusation status if made
        if (team.accusation) {
            const area = document.getElementById('accusationArea');
            const killer = gameScenario.characters.find(c => c.id === team.accusation.killer);
            const statusClass = team.accusation.correct ? 'correct' : 'wrong';
            
            area.innerHTML = `<div class="accusation-status ${statusClass}">
                <h3>${team.accusation.correct ? '✅ DOĞRU SUÇLAMA!' : '❌ YANLIŞ SUÇLAMA'}</h3>
                <p style="margin-top:15px;">
                    <strong>Suçlanan:</strong> ${killer ? killer.name : 'Bilinmiyor'}<br>
                    <strong>Silah/Yöntem:</strong> ${team.accusation.weapon}<br>
                    <strong>Motiv:</strong> ${team.accusation.motive}
                </p>
                <p style="margin-top:15px;color:#888;font-size:13px;">
                    Suçlama saati: ${team.accusation.time}
                </p>
            </div>`;
        }
        
        renderClueGrid();
        renderDiscoveries();
        updateGameStatus();
    }

    // Render scenario page
    function renderScenario() {
        if (!gameScenario) return;
        
        document.getElementById('scenarioTitle').textContent = gameScenario.title;
        document.getElementById('scenarioDesc').textContent = gameScenario.description;
        
        // Characters
        const charGrid = document.getElementById('characterGrid');
        let charHtml = '';
        gameScenario.characters.forEach(c => {
            charHtml += `<div class="character-card">
                <div class="character-name">${c.name}</div>
                <div class="character-role">${c.role}</div>
                <div class="character-desc">${c.description}</div>
            </div>`;
        });
        charGrid.innerHTML = charHtml;
        
        // Locations
        const locList = document.getElementById('locationList');
        let locHtml = '';
        gameScenario.locations.forEach(l => {
            locHtml += `<div class="discovery-item">
                <div class="character-name">📍 ${l.name}</div>
                <div class="character-desc">${l.description}</div>
            </div>`;
        });
        locList.innerHTML = locHtml;
    }

    // Render scoreboard
    function renderScoreboard() {
        const container = document.getElementById('scoreboardList');
        if (teams.length === 0) {
            container.innerHTML = '<div class="empty">Henüz takım yok</div>';
            return;
        }

        const sorted = teams.slice().sort((a, b) => b.score - a.score);
        let html = '';
        
        sorted.forEach((t, i) => {
            let rc = '';
            if (i === 0 && t.score > 0) rc = 'g';
            else if (i === 1 && t.score > 0) rc = 's';
            else if (i === 2 && t.score > 0) rc = 'b';

            html += `<div class="admin-card">
                <div class="admin-top">
                    <div class="rank ${rc}">${i + 1}</div>
                    <div class="admin-info">
                        <div class="admin-name">${t.name}</div>
                        <div class="admin-detail">
                            ${t.discoveries.length} ipucu | 
                            ${t.accusation ? (t.accusation.correct ? '✅ Doğru suçlama' : '❌ Yanlış suçlama') : 'Suçlama yok'}
                        </div>
                    </div>
                    <div class="admin-score">${t.score}</div>
                </div>
            </div>`;
        });
        
        container.innerHTML = html;
    }

    // Render admin list
    function renderAdminList() {
        document.getElementById('statTeams').textContent = teams.length;
        
        const container = document.getElementById('adminList');
        if (teams.length === 0) {
            container.innerHTML = '<div class="empty">Henüz takım yok</div>';
            return;
        }

        const sorted = teams.slice().sort((a, b) => b.score - a.score);
        let html = '';
        
        sorted.forEach((t, i) => {
            let rc = '';
            if (i === 0 && t.score > 0) rc = 'g';
            else if (i === 1 && t.score > 0) rc = 's';
            else if (i === 2 && t.score > 0) rc = 'b';

            const safeName = t.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');

            html += `<div class="admin-card">
                <div class="admin-top">
                    <div class="rank ${rc}">${i + 1}</div>
                    <div class="admin-info">
                        <div class="admin-name">${t.name}</div>
                        <div class="admin-detail">
                            ${t.discoveries.length} ipucu keşfetti | 
                            ${t.accusation ? (t.accusation.correct ? '✅ Doğru' : '❌ Yanlış') : 'Suçlama yok'}
                        </div>
                    </div>
                    <div class="admin-score">${t.score}</div>
                </div>
                <div class="admin-btns">
                    <button class="bp10" onclick="adminScore('${t.id}', 10)">+10</button>
                    <button class="bp5" onclick="adminScore('${t.id}', 5)">+5</button>
                    <button class="bm5" onclick="adminScore('${t.id}', -5)">-5</button>
                    <button class="bm10" onclick="adminScore('${t.id}', -10)">-10</button>
                    <button class="bdel" onclick="adminDel('${t.id}', '${safeName}')">✕ Sil</button>
                </div>
            </div>`;
        });
        
        container.innerHTML = html;
    }

    // Global admin functions
    window.adminScore = function(teamId, amount) {
        if (isProcessing) return;
        isProcessing = true;
        
        socket.emit('change-score', { teamId, amount }, (res) => {
            isProcessing = false;
            if (res.success) {
                toast(`${res.team.name} ${amount > 0 ? '+' : ''}${amount} puan`);
            } else {
                toast(res.error, true);
            }
        });
    };

    window.adminDel = function(teamId, teamName) {
        if (isProcessing) return;
        
        if (confirm(`${teamName} takımını silmek istediğinizden emin misiniz?`)) {
            isProcessing = true;
            socket.emit('delete-team', teamId, (res) => {
                isProcessing = false;
                if (res.success) {
                    toast(`${teamName} silindi!`);
                } else {
                    toast(res.error, true);
                }
            });
        }
    };

    // Game object
    window.GAME = {
        showCreateForm() {
            document.getElementById('createForm').classList.add('show');
            document.getElementById('joinForm').classList.remove('show');
            document.getElementById('inpNewTeam').focus();
        },
        
        hideCreateForm() {
            document.getElementById('createForm').classList.remove('show');
            document.getElementById('inpNewTeam').value = '';
        },
        
        showJoinForm() {
            document.getElementById('joinForm').classList.add('show');
            document.getElementById('createForm').classList.remove('show');
            selectedJoinId = null;
            renderJoinList();
        },
        
        hideJoinForm() {
            document.getElementById('joinForm').classList.remove('show');
        },
        
        createTeam() {
            const name = document.getElementById('inpNewTeam').value.trim();
            if (!name) {
                toast('Takım adı girin!', true);
                return;
            }
            
            socket.emit('create-team', name, (res) => {
                if (res.success) {
                    currentTeamId = res.team.id;
                    localStorage.setItem('currentTeamId', currentTeamId);
                    this.hideCreateForm();
                    toast(`${name} oluşturuldu!`);
                    showPage('pgTeam');
                    renderTeamPage(res.team);
                } else {
                    toast(res.error, true);
                }
            });
        },
        
        selectJoin(el) {
            selectedJoinId = el.getAttribute('data-id');
            document.querySelectorAll('.team-opt').forEach(opt => opt.classList.remove('sel'));
            el.classList.add('sel');
        },
        
        joinTeam() {
            if (!selectedJoinId) {
                toast('Takım seçin!', true);
                return;
            }
            
            socket.emit('join-team', selectedJoinId, (res) => {
                if (res.success) {
                    currentTeamId = selectedJoinId;
                    localStorage.setItem('currentTeamId', currentTeamId);
                    this.hideJoinForm();
                    toast(`${res.team.name} takımına katıldınız!`);
                    showPage('pgTeam');
                    renderTeamPage(res.team);
                } else {
                    toast(res.error, true);
                }
            });
        },
        
        discoverClue(clueId) {
            if (!currentTeamId || !gameState.started) {
                toast('Oyun başlamadan ipucu keşfedemezsiniz!', true);
                return;
            }
            
            socket.emit('discover-clue', { teamId: currentTeamId, clueId }, (res) => {
                if (res.success) {
                    toast(`İpucu keşfedildi! +${res.points} puan`, false);
                } else {
                    toast(res.error, true);
                }
            });
        },
        
        makeAccusation() {
            if (!currentTeamId || !gameState.started) {
                toast('Oyun başlamadan suçlama yapamazsınız!', true);
                return;
            }
            
            const killer = document.getElementById('selKiller').value;
            const weapon = document.getElementById('inpWeapon').value.trim();
            const motive = document.getElementById('inpMotive').value.trim();
            
            if (!killer || !weapon || !motive) {
                toast('Tüm alanları doldurun!', true);
                return;
            }
            
            if (!confirm('Suçlama yapmak istediğinizden emin misiniz? Sadece bir kez suçlama yapabilirsiniz!')) {
                return;
            }
            
            socket.emit('make-accusation', { teamId: currentTeamId, killer, weapon, motive }, (res) => {
                if (res.success) {
                    if (res.correct) {
                        toast(`🎉 DOĞRU! +${res.points} puan!`, false);
                    } else {
                        toast(`❌ Yanlış suçlama. ${res.points} puan`, true);
                    }
                } else {
                    toast(res.error, true);
                }
            });
        },
        
        exitTeam() {
            currentTeamId = null;
            currentTeam = null;
            localStorage.removeItem('currentTeamId');
            showPage('pgLobby');
        },
        
        showScenario() {
            showPage('pgScenario');
            renderScenario();
        },
        
        showScoreboard() {
            showPage('pgScoreboard');
            renderScoreboard();
        },
        
        showPassModal() {
            document.getElementById('passModal').classList.add('show');
            document.getElementById('inpPass').value = '';
            document.getElementById('inpPass').focus();
        },
        
        hidePassModal() {
            document.getElementById('passModal').classList.remove('show');
        },
        
        checkPass() {
            const pass = document.getElementById('inpPass').value;
            socket.emit('admin-login', pass, (res) => {
                if (res.success) {
                    this.hidePassModal();
                    showPage('pgAdmin');
                    renderAdminList();
                    updateGameStatus();
                } else {
                    toast('Yanlış şifre!', true);
                }
            });
        },
        
        goLobby() {
            showPage('pgLobby');
        },
        
        startGame() {
            if (confirm('Oyunu başlatmak istediğinizden emin misiniz?')) {
                socket.emit('start-game', (res) => {
                    if (res.success) {
                        toast('Oyun başlatıldı!');
                    } else {
                        toast(res.error, true);
                    }
                });
            }
        },
        
        changePhase(phase) {
            if (confirm(`Faz ${phase}'e geçmek istediğinizden emin misiniz?`)) {
                socket.emit('change-phase', phase, (res) => {
                    if (res.success) {
                        toast(`Faz ${phase}'e geçildi!`);
                    } else {
                        toast(res.error, true);
                    }
                });
            }
        },
        
        endGame() {
            if (confirm('Oyunu bitirmek ve çözümü göstermek istiyor musunuz?')) {
                socket.emit('end-game', (res) => {
                    if (res.success) {
                        const sol = res.solution;
                        const killer = gameScenario.characters.find(c => c.id === sol.killer);
                        alert(`🎭 ÇÖZÜM\n\nKatil: ${killer.name}\nSilah: ${sol.weapon}\nLokasyon: ${sol.location}\nMotiv: ${sol.motive}\nYöntem: ${sol.method}`);
                        toast('Oyun bitti!');
                    } else {
                        toast(res.error, true);
                    }
                });
            }
        },
        
        resetGame() {
            if (teams.length === 0) {
                toast('Sıfırlanacak bir şey yok!', true);
                return;
            }
            
            if (confirm(`${teams.length} takım ve tüm oyun verisi silinecek. Emin misiniz?`)) {
                socket.emit('reset-game', (res) => {
                    if (res.success) {
                        toast('Oyun sıfırlandı!');
                    }
                });
            }
        }
    };

    // Socket events
    socket.on('teams-update', (newTeams) => {
        teams = newTeams;
        
        if (document.getElementById('joinForm').classList.contains('show')) {
            renderJoinList();
        }
        
        if (document.getElementById('pgAdmin').classList.contains('active')) {
            renderAdminList();
        }
        
        if (document.getElementById('pgScoreboard').classList.contains('active')) {
            renderScoreboard();
        }
        
        if (currentTeamId) {
            const team = teams.find(t => t.id === currentTeamId);
            if (team && document.getElementById('pgTeam').classList.contains('active')) {
                renderTeamPage(team);
            }
        }
    });

    socket.on('game-state-update', (newState) => {
        gameState = newState;
        updateGameStatus();
    });

    socket.on('game-scenario', (scenario) => {
        gameScenario = {
            title: scenario.title,
            description: scenario.description,
            characters: scenario.characters,
            locations: scenario.locations,
            phases: scenario.phases,
            clues: scenario.clues
        };
    });

    socket.on('timer-update', (timeLeft) => {
        gameState.phaseTimer = timeLeft;
        updateGameStatus();
    });

    socket.on('game-started', () => {
        toast('🎮 Oyun başladı!', false);
        updateGameStatus();
    });

    socket.on('phase-changed', (data) => {
        toast(`📋 Faz değişti: ${data.name}`, false);
        updateGameStatus();
        
        if (currentTeam) {
            renderClueGrid();
        }
    });

    socket.on('phase-time-up', () => {
        toast('⏰ Süre doldu!', false);
    });

    socket.on('game-ended', () => {
        toast('🏁 Oyun bitti!', false);
        updateGameStatus();
    });

    socket.on('team-update', (team) => {
        if (currentTeamId === team.id) {
            renderTeamPage(team);
        }
    });

    socket.on('team-deleted', (teamId) => {
        if (currentTeamId === teamId) {
            currentTeamId = null;
            currentTeam = null;
            localStorage.removeItem('currentTeamId');
            showPage('pgLobby');
            toast('Takımınız silindi!', true);
        }
    });

    socket.on('game-reset', () => {
        currentTeamId = null;
        currentTeam = null;
        localStorage.removeItem('currentTeamId');
        showPage('pgLobby');
        updateGameStatus();
    });

    // Page load
    window.onload = function() {
        if (currentTeamId) {
            socket.emit('get-team', currentTeamId, (team) => {
                if (team) {
                    showPage('pgTeam');
                    renderTeamPage(team);
                } else {
                    currentTeamId = null;
                    currentTeam = null;
                    localStorage.removeItem('currentTeamId');
                }
            });
        }
        
        updateGameStatus();
    };
})();
