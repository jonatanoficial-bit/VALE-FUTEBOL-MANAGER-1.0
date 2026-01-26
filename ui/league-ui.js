/* =======================================================
   UI DE LIGA – Vale Futebol Manager 2026
   Este módulo implementa a renderização da tabela de classificação
   e a tela de resultados da rodada, preenchendo o HTML com base
   nas informações fornecidas pelo engine/league.js.
   =======================================================*/

(function () {
  console.log("%c[LEAGUE-UI] league-ui.js carregado", "color:#f59e0b");

  /**
   * Renderiza a tabela de classificação para a divisão atual do usuário.
   * Utiliza League.getStandingsForCurrentDivision se disponível; caso
   * contrário, monta uma lista vazia com todos os times da divisão.
   */
  function renderStandings() {
    try {
      const allTeams = (window.Database?.teams || window.teams) || [];
      // obtém time atual
      const userId = (window.Game && Game.teamId) || (window.gameState && gameState.currentTeamId);
      const userTeam = allTeams.find((t) => t.id === userId);
      const div = userTeam?.division || "A";

      let standings = [];
      if (window.League && typeof League.getStandingsForCurrentDivision === "function") {
        try {
          standings = League.getStandingsForCurrentDivision(div) || [];
        } catch (e) {
          console.warn("[LEAGUE-UI] Erro ao obter classificação:", e);
        }
      }
      if (!standings || !standings.length) {
        // fallback: lista todos os times com pontuação zero
        const listaTimes = allTeams.filter((t) => (t.division || "A") === div);
        standings = listaTimes.map((t, idx) => ({
          teamId: t.id,
          name: t.name,
          pts: 0,
          j: 0,
          v: 0,
          e: 0,
          d: 0,
          gp: 0,
          gc: 0,
          position: idx + 1,
        }));
      }

      const tabela = document.getElementById("tabela-classificacao");
      if (!tabela) {
        console.warn("[LEAGUE-UI] Elemento #tabela-classificacao não encontrado.");
        return;
      }
      tabela.innerHTML = "";
      // cabeçalho
      const header = document.createElement("tr");
      header.innerHTML = `
        <th>#</th>
        <th>Time (${div === "B" ? "Série B" : "Série A"})</th>
        <th>Pts</th>
        <th>J</th>
        <th>V</th>
        <th>E</th>
        <th>D</th>
        <th>G+</th>
        <th>G-</th>
      `;
      tabela.appendChild(header);

      standings.forEach((row, idx) => {
        const tinfo = allTeams.find((t) => t.id === row.teamId) || {};
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${idx + 1}</td>
          <td class="time-coluna">
            <img class="logo-tabela" src="assets/logos/${tinfo.id || row.teamId}.png" alt="${tinfo.name || row.name || row.teamId}" onerror="this.style.display='none'">
            <span>${tinfo.name || row.name || row.teamId}</span>
          </td>
          <td>${row.pts ?? 0}</td>
          <td>${row.j ?? 0}</td>
          <td>${row.v ?? 0}</td>
          <td>${row.e ?? 0}</td>
          <td>${row.d ?? 0}</td>
          <td>${row.gp ?? 0}</td>
          <td>${row.gc ?? 0}</td>
        `;
        tabela.appendChild(tr);
      });
    } catch (err) {
      console.warn("[LEAGUE-UI] Falha ao renderizar standings:", err);
    }
  }

  /**
   * Renderiza a tela de resultados da rodada. Recebe um array de partidas
   * (como retornado por League.processarRodadaComJogoDoUsuario) e preenche
   * #lista-resultados-rodada com o placar de cada jogo, incluindo os escudos.
   */
  function mostrarResultadosRodada(rodada) {
    try {
      const container = document.getElementById("lista-resultados-rodada");
      const titulo = document.getElementById("titulo-rodada");
      if (!container) return;
      container.innerHTML = "";
      if (titulo) titulo.textContent = "RESULTADOS DA RODADA";
      if (!rodada || !rodada.length) {
        const vazio = document.createElement("p");
        vazio.style.padding = "12px";
        vazio.textContent = "Nenhum resultado disponível.";
        container.appendChild(vazio);
      } else {
        // para cada jogo
        rodada.forEach((m) => {
          // obtém times pelo id
          const allTeams = (window.Database?.teams || window.teams) || [];
          const home = allTeams.find((t) => t.id === m.homeId) || { id: m.homeId, name: m.homeId };
          const away = allTeams.find((t) => t.id === m.awayId) || { id: m.awayId, name: m.awayId };
          const gH = m.goalsHome ?? m.golsHome ?? "-";
          const gA = m.goalsAway ?? m.golsAway ?? "-";
          const divLinha = document.createElement("div");
          // usa classe esperada pelo CSS para formato de linha
          divLinha.className = "linha-resultado";
          divLinha.innerHTML = `
            <div class="resultado-time">
              <img src="assets/logos/${home.id}.png" alt="${home.name}" onerror="this.style.display='none'">
              <span>${home.name}</span>
            </div>
            <div class="resultado-placar">${gH} x ${gA}</div>
            <div class="resultado-time">
              <span>${away.name}</span>
              <img src="assets/logos/${away.id}.png" alt="${away.name}" onerror="this.style.display='none'">
            </div>
          `;
          container.appendChild(divLinha);
        });
      }
      // exibe a tela de resultados
      if (typeof window.mostrarTela === "function") {
        mostrarTela("tela-resultados-rodada");
      }
    } catch (err) {
      console.warn("[LEAGUE-UI] Falha ao mostrar resultados da rodada:", err);
    }
  }

  // expõe globalmente
  window.LeagueUI = {
    renderStandings,
    mostrarResultadosRodada,
  };

  // também injeta no objeto UI se existir a função mostrarResultadosRodada
  if (window.UI) {
    UI.mostrarResultadosRodada = mostrarResultadosRodada;
  }
})();