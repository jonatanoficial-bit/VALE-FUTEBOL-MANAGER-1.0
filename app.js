
/* Vale Futebol Manager 2026 - v1.11.2 FINAL */
/* Correção: evitar dupla declaração de constantes globais */

if (!window.__VFM_BOOTED__) {
  window.__VFM_BOOTED__ = true;

  const UEFA_IDS = {
    CHAMPIONS: "UCL",
    EUROPA: "UEL",
    CONFERENCE: "UECL"
  };

  window.VFM = {
    version: "1.11.2",
    UEFA_IDS
  };

  console.log("VFM carregado com sucesso", window.VFM);
}
