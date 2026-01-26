/* =======================================================
   VALE FUTEBOL MANAGER 2026
   ui/calendar-ui.js – Renderização do calendário
   =======================================================*/

console.log("%c[CALENDAR-UI] calendar-ui.js carregado", "color:#60a5fa;");

/**
 * Formata "YYYY-MM-DD" para "DD/MM/YYYY"
 */
function formatarDataBR(iso) {
    if (!iso) return "";
    const parts = iso.split("-");
    if (parts.length !== 3) return iso;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Renderiza o calendário baseado no time atual do usuário
 */
function renderCalendario() {
    if (!window.gameState) {
        console.warn("[CALENDAR-UI] gameState não encontrado.");
        return;
    }

    // Suporta tanto id="calendario-lista" quanto id="lista-calendario" (correção de HTML)
    let container = document.getElementById("calendario-lista");
    if (!container) {
        container = document.getElementById("lista-calendario");
    }
    if (!container) {
        console.warn("[CALENDAR-UI] Elemento do calendário não encontrado no HTML.");
        return;
    }

    const tituloEl = document.getElementById("titulo-calendario");
    // info-calendario pode não existir em alguns layouts
    const infoEl   = document.getElementById("info-calendario");

    const teamId = gameState.currentTeamId;
    const team   = window.getTeamById ? getTeamById(teamId) : null;
    const division = team?.division || "A";

    // Garante que existe calendário para a divisão
    let calendario = Calendar.getCalendarioPorDivisao(division);
    if (!calendario || calendario.length === 0) {
        // se por algum motivo não foi gerado, gera agora
        const novo = Calendar.gerarCalendarioTemporada(division);
        if (division === "A") gameState.calendarA = novo;
        if (division === "B") gameState.calendarB = novo;
        if (typeof salvarJogo === "function") salvarJogo();
        calendario = Calendar.getCalendarioPorDivisao(division);
    }

    container.innerHTML = "";

    if (tituloEl) {
        const nomeTime = team?.name || "Seu Time";
        tituloEl.textContent = `CALENDÁRIO ${gameState.seasonYear} – Série ${division} (${nomeTime})`;
    }

    if (infoEl) {
        infoEl.textContent = "Jogos em destaque são os do seu time. Formato ida e volta, rodadas semanais.";
    }

    if (!calendario || calendario.length === 0) {
        const aviso = document.createElement("p");
        aviso.textContent = "Nenhum calendário disponível.";
        container.appendChild(aviso);
        return;
    }

    calendario.forEach(rodada => {
        const boxRodada = document.createElement("div");
        boxRodada.className = "calendario-rodada";

        const tituloRodada = document.createElement("h2");
        tituloRodada.className = "calendario-rodada-titulo";

        const dataBR = formatarDataBR(rodada.date);
        tituloRodada.textContent = `Rodada ${rodada.round} – ${dataBR || "data a definir"}`;
        boxRodada.appendChild(tituloRodada);

        rodada.matches.forEach(match => {
            const linha = document.createElement("div");
            linha.className = "calendario-jogo";

            const ehMeuTime = (match.homeId === teamId || match.awayId === teamId);
            if (ehMeuTime) linha.classList.add("meu-jogo");

            const timeHome = window.getTeamById ? getTeamById(match.homeId) : null;
            const timeAway = window.getTeamById ? getTeamById(match.awayId) : null;

            const nomeHome = timeHome?.shortName || match.homeId;
            const nomeAway = timeAway?.shortName || match.awayId;

            let placarTexto = "vs";
            if (typeof match.golsHome === "number" && typeof match.golsAway === "number") {
                placarTexto = `${match.golsHome} x ${match.golsAway}`;
            }

            const span = document.createElement("span");
            span.textContent = `${nomeHome} ${placarTexto} ${nomeAway}`;

            if (match.homeId === teamId) {
                span.textContent += "  (Casa)";
            } else if (match.awayId === teamId) {
                span.textContent += "  (Fora)";
            }

            linha.appendChild(span);
            boxRodada.appendChild(linha);
        });

        container.appendChild(boxRodada);
    });
}

/* =======================================================
   EXPORE GLOBAL
   =======================================================*/
window.CalendarUI = {
    renderCalendario
};

// Permite compatibilidade com chamadas a renderSeason(),
// definindo renderSeason como alias de renderCalendario se não existir.
if (!window.CalendarUI.renderSeason) {
    window.CalendarUI.renderSeason = window.CalendarUI.renderCalendario;
}
