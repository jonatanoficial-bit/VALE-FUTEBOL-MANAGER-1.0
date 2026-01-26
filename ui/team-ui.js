/* =======================================================
   TEAM UI – Vale Futebol Manager 2026
   Fornece uma interface mínima para renderizar o elenco do time atual.
   O main.js espera que exista um objeto TeamUI com um método renderSquad().
   Aqui delegamos para UI.abrirElenco(), que já cuida de exibir o elenco
   através do módulo ui/ui.js.
   =======================================================*/

// =======================================================
// TEAM-UI
//
// Este módulo fornece uma implementação autônoma para exibir o
// elenco do time atual. A versão original fazia uma chamada
// recursiva para UI.abrirElenco(), o que criava um loop infinito
// quando main.js redefiniu UI.abrirElenco() para chamar
// TeamUI.renderSquad(). Para evitar essa recursão, a função
// renderSquad() aqui apenas monta a lista de jogadores e não
// reencaminha de volta para UI.abrirElenco(). A tela já é
// alternada no próprio UI (em main.js) depois que renderSquad
// é chamado.
// =======================================================

(function () {
  console.log("%c[TEAM-UI] team-ui.js carregado", "color:#a855f7");

  /**
   * Obtém o elenco para o time atualmente controlado. Usa o Game.teamId
   * ou gameState.selectedTeamId. Se Database.carregarElencoDoTime estiver
   * disponível, usa-o como fonte primária.
   * @returns {Array<Object>} Lista de jogadores do time
   */
  function obterElencoAtual() {
    const teamId =
      (window.gameState && gameState.selectedTeamId) ||
      (window.Game && Game.teamId) ||
      null;
    if (!teamId) return [];
    if (
      window.Database &&
      typeof Database.carregarElencoDoTime === "function"
    ) {
      const elenco = Database.carregarElencoDoTime(teamId);
      if (Array.isArray(elenco)) return elenco;
    }
    // Fallback: filtra pela propriedade teamId em Database.players
    if (window.Database && Array.isArray(Database.players)) {
      return Database.players.filter((p) => p.teamId === teamId);
    }
    return [];
  }

  /**
   * Determina o caminho para a imagem de face de um jogador. Alguns
   * jogadores possuem a propriedade `face` definida (caminho completo),
   * outros não. Se não houver face, usa-se um placeholder ou
   * oculta-se a imagem via onerror (no HTML).
   * @param {Object} p Jogador
   * @returns {string} Caminho da imagem de face
   */
  function getFacePath(p) {
    if (p && p.face) return p.face;
    // se houver id, tenta usar a pasta assets/face (singular) para
    // compatibilidade com o banco de dados fornecido
    if (p && p.id) return `assets/face/${p.id}.png`;
    return "";
  }

  /**
   * Renderiza o elenco do time atual na div #elenco-lista. Se nenhum
   * jogador for encontrado, mostra uma mensagem de aviso. Não muda
   * a tela; isso é feito pelo UI externo.
   */
  function renderSquad() {
    const container = document.getElementById("elenco-lista");
    if (!container) {
      console.warn("[TEAM-UI] #elenco-lista não encontrado.");
      return;
    }
    const elenco = obterElencoAtual();
    console.log(
      `[TEAM-UI] renderSquad() – ${elenco.length} jogadores carregados.`
    );
    container.innerHTML = "";
    if (!elenco || !elenco.length) {
      container.innerHTML =
        "<p style='padding:10px;'>Nenhum jogador encontrado para este time.</p>";
      return;
    }
    elenco.forEach((p) => {
      const nome = p.name || p.nome || "Jogador";
      const pos = p.position || p.posicao || p.pos || p.role || "POS";
      const ovr = p.overall ?? p.ovr ?? p.rating ?? 70;
      const imgSrc = getFacePath(p);
      const card = document.createElement("div");
      card.className = "card-jogador";
      card.innerHTML = `
        <img src="${imgSrc}" alt="${nome}" onerror="this.style.display='none'">
        <h3>${nome}</h3>
        <p>${pos}</p>
        <p class="ovr">${ovr}</p>
      `;
      container.appendChild(card);
    });
  }

  // expõe o módulo globalmente
  window.TeamUI = {
    renderSquad,
  };
})();