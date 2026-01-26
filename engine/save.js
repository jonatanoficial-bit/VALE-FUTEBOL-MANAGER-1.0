/* =======================================================
   VALE FUTEBOL MANAGER 2026
   engine/save.js – Sistema de salvamento
   =======================================================*/

const SAVE_KEY = "vfm2026-save";

/* =======================================================
   Salvar jogo
   =======================================================*/
function salvarJogo() {
    try {
        const dados = JSON.stringify(Game);
        localStorage.setItem(SAVE_KEY, dados);
        console.log("%c[SAVE] Jogo salvo.", "color:#0EA5E9");
    } catch (e) {
        console.error("Erro ao salvar jogo:", e);
    }
}

/* =======================================================
   Carregar jogo
   =======================================================*/
function carregarJogo() {
    try {
        const dados = localStorage.getItem(SAVE_KEY);
        if (!dados) return false;

        const obj = JSON.parse(dados);
        Object.assign(Game, obj);

        console.log("%c[LOAD] Jogo carregado.", "color:#14b814");
        return true;
    } catch (e) {
        console.error("Erro ao carregar jogo:", e);
        return false;
    }
}

/* =======================================================
   Resetar e iniciar nova carreira
   =======================================================*/
function novaCarreira(timeId) {
    Game.teamId = timeId;
    Game.rodada = 1;
    Game.saldo = 50;
    Game.formacao = "4-3-3";
    Game.estilo = "equilibrado";

    Game.titulares = {};
    Game.reservas = [];
    Game.elenco = carregarElencoDoTime(timeId);

    salvarJogo();
}

/* =======================================================
   Apagar save
   =======================================================*/
function deletarCarreira() {
    localStorage.removeItem(SAVE_KEY);
    console.warn("%c[SAVE] Carreira apagada.", "color:#ff3333");
}
