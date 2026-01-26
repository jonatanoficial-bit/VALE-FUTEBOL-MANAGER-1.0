/* ============================================================
   TACTICS UI – Vale Futebol Manager 2026
   Controle da tela de TÁTICAS, campo e banco de reservas
   ============================================================ */

let reservaSelecionadaId = null;

/* ============================================================
   INICIALIZAÇÃO DA TELA
   ============================================================ */
window.TacticsUI = {
    init() {
        const btnVoltar = document.getElementById("btn-voltar-lobby");
        if (btnVoltar) {
            btnVoltar.onclick = () => mostrarTela("tela-lobby");
        }

        const btnSalvar = document.getElementById("btn-salvar-tatica");
        if (btnSalvar) {
            btnSalvar.onclick = () => {
                if (typeof Tactics.salvarTatica === "function") {
                    Tactics.salvarTatica();
                    alert("Tática salva!");
                }
            };
        }

        this.renderPainel();
    },

    /* ========================================================
       Atualiza o campo e reservas
       ======================================================== */
    renderPainel() {
        if (!window.Tactics || typeof Tactics.getEscalacaoCompleta !== "function") {
            console.error("Engine Tactics não encontrada.");
            return;
        }

        const dados = Tactics.getEscalacaoCompleta();
        renderCampoTatico(dados.titulares);
        renderReservas(dados.reservas);
    }
    ,
    /**
     * Método genérico de renderização chamado pela UI principal.
     * Apenas aciona o init(), que configura os botões e redesenha
     * o painel tático se necessário.
     */
    render() {
        this.init();
    }
};

/* ============================================================
   DESENHA O CAMPO E OS 11 TITULARES
   ============================================================ */
function renderCampoTatico(titulares) {
    const campoEl = document.getElementById("campo-tatico");
    if (!campoEl) return;

    campoEl.innerHTML = "";

    titulares.forEach(slot => {
        const slotEl = document.createElement("div");
        slotEl.className = "slot-jogador";
        slotEl.style.left = slot.x + "%";
        slotEl.style.top = slot.y + "%";

        const card = document.createElement("div");
        card.className = "slot-card";
        card.dataset.posicao = slot.posicao;
        card.dataset.playerId = slot.id;

        // Foto
        const img = document.createElement("img");
        img.src = `assets/face/${slot.foto}`;
        img.alt = slot.nome;
        img.onerror = () => img.style.display = "none";
        card.appendChild(img);

        // Nome
        const nomeDiv = document.createElement("div");
        nomeDiv.className = "slot-nome";
        nomeDiv.textContent = slot.nome;
        card.appendChild(nomeDiv);

        // Posição e OVR
        const infoDiv = document.createElement("div");
        infoDiv.className = "slot-info";
        infoDiv.textContent = `${slot.pos} · OVR ${slot.ovr}`;
        card.appendChild(infoDiv);

        // CLICAR NO TITULAR → troca com reserva
        card.addEventListener("click", () => {
            if (!reservaSelecionadaId) return;

            Tactics.trocar(reservaSelecionadaId, slot.posicao);
            reservaSelecionadaId = null;

            TacticsUI.renderPainel();
        });

        slotEl.appendChild(card);
        campoEl.appendChild(slotEl);
    });
}

/* ============================================================
   RENDERIZA O BANCO DE RESERVAS
   ============================================================ */
function renderReservas(reservas) {
    const lista = document.getElementById("banco-reservas");
    if (!lista) return;

    lista.innerHTML = "";

    reservas.forEach(jog => {
        const card = document.createElement("div");
        card.className = "reserva-card";
        card.dataset.playerId = jog.id;

        // Foto
        const img = document.createElement("img");
        img.src = `assets/face/${jog.foto}`;
        img.alt = jog.nome;
        img.onerror = () => img.style.display = "none";
        card.appendChild(img);

        // Nome
        const nome = document.createElement("div");
        nome.className = "reserva-nome";
        nome.textContent = jog.nome;
        card.appendChild(nome);

        // Info
        const info = document.createElement("div");
        info.className = "reserva-info";
        info.textContent = `${jog.pos} · OVR ${jog.ovr}`;
        card.appendChild(info);

        // Selecionar reserva
        card.addEventListener("click", () => {
            reservaSelecionadaId = jog.id;

            document.querySelectorAll(".reserva-card")
                .forEach(el => el.classList.remove("reserva-selecionada"));

            card.classList.add("reserva-selecionada");
        });

        lista.appendChild(card);
    });
}
