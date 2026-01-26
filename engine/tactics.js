/* ============================================================
   ENGINE – TÁTICAS
   Controla titulares, reservas, posições e substituições
   ============================================================ */

window.Tactics = {

    /* ========================================================
       Retorna todos titulares + reservas em formato padronizado
       ======================================================== */
    getEscalacaoCompleta() {
        return {
            titulares: this.formatTitulares(),
            reservas: gameState.elenco.filter(j => !gameState.titulares.includes(j.id))
        };
    },

    /* ========================================================
       Retorna titulares formatados com posição e coordenadas
       ======================================================== */
    formatTitulares() {
        return gameState.titulares.map(slot => {
            const jog = gameState.elenco.find(j => j.id === slot.id);

            return {
                id: jog.id,
                nome: jog.nome,
                pos: jog.posicao,
                ovr: jog.ovr,
                foto: jog.foto,
                posicao: slot.posicao,
                x: slot.x,
                y: slot.y
            };
        });
    },

    /* ========================================================
       Troca titular <-> reserva
       ======================================================== */
    trocar(reservaId, posicaoTitular) {
        const reserva = gameState.elenco.find(j => j.id === reservaId);
        const titularSlot = gameState.titulares.find(t => t.posicao === posicaoTitular);

        if (!reserva || !titularSlot) return;

        const titularAnterior = titularSlot.id;

        // faz a troca
        titularSlot.id = reservaId;

        // reserva antiga entra no banco
        // (fazendo nada aqui, pq reservas são calculadas naturalmente pela ausência)
    },

    /* ========================================================
       Salvar tática (opcional)
       ======================================================== */
    salvarTatica() {
        saveGameStateToStorage();
    }
};
