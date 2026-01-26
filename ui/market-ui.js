/* =======================================================
   UI MERCADO – Vale Futebol Manager 2026
   Arquivo de ponte para o módulo MarketUI definido em engine/market.js.
   Adiciona a função renderMercado() esperada pelo ui/ui.js, que inicializa
   a tela do mercado e recarrega a lista de jogadores.
   =======================================================*/

(function () {
  console.log("%c[MARKET-UI] market-ui.js carregado", "color:#ec4899");

  /**
   * Inicializa ou atualiza o mercado de transferências. Se o objeto
   * MarketUI (definido em engine/market.js) estiver disponível, chama
   * seu método init() para configurar os filtros e a lista. Essa função
   * é chamada ao abrir a tela de mercado.
   */
  function renderMercado() {
    if (window.MarketUI) {
      try {
        if (typeof MarketUI.init === "function") {
          MarketUI.init();
        } else if (typeof MarketUI.atualizarLista === "function") {
          // fallback para apenas recarregar a lista
          MarketUI.atualizarLista();
        }
      } catch (e) {
        console.warn("[MARKET-UI] Erro ao inicializar mercado:", e);
      }
    }
  }

  // Mescla o novo método ao objeto MarketUI já existente
  window.MarketUI = Object.assign(window.MarketUI || {}, {
    renderMercado,
    // Compatibilidade: se alguém chamar MarketUI.render(), delega ao renderMercado
    render:
      typeof window.MarketUI === "object" && typeof window.MarketUI.render === "function"
        ? window.MarketUI.render
        : renderMercado,
  });
})();