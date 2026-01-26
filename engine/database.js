/* =======================================================
   VALE FUTEBOL MANAGER 2026
   engine/database.js – Times, jogadores e competições
   =======================================================*/

// -------------------------------------------------------
// TIMES – Série A e Série B
// -------------------------------------------------------

const teams = [
  // Série A
  { id: "FLA", name: "Flamengo",        shortName: "Flamengo",   division: "A" },
  { id: "PAL", name: "Palmeiras",       shortName: "Palmeiras",  division: "A" },
  { id: "BOT", name: "Botafogo",        shortName: "Botafogo",   division: "A" },
  { id: "INT", name: "Internacional",   shortName: "Inter",      division: "A" },
  { id: "AMG", name: "Atlético-MG",     shortName: "Atl-MG",     division: "A" },
  { id: "COR", name: "Corinthians",     shortName: "Corinthians",division: "A" },
  { id: "SAO", name: "São Paulo",       shortName: "São Paulo",  division: "A" },
  { id: "FLU", name: "Fluminense",      shortName: "Fluminense", division: "A" },
  { id: "GRE", name: "Grêmio",          shortName: "Grêmio",     division: "A" },
  { id: "SAN", name: "Santos",          shortName: "Santos",     division: "A" },
  { id: "CRU", name: "Cruzeiro",        shortName: "Cruzeiro",   division: "A" },
  { id: "VAS", name: "Vasco",           shortName: "Vasco",      division: "A" },
  { id: "BAH", name: "Bahia",           shortName: "Bahia",      division: "A" },
  { id: "FOR", name: "Fortaleza",       shortName: "Fortaleza",  division: "A" },
  { id: "RBB", name: "RB Bragantino",   shortName: "Bragantino", division: "A" },
  { id: "CEA", name: "Ceará",           shortName: "Ceará",      division: "A" },
  { id: "SPT", name: "Sport",           shortName: "Sport",      division: "A" },
  { id: "JUV", name: "Juventude",       shortName: "Juventude",  division: "A" },
  { id: "VIT", name: "Vitória",         shortName: "Vitória",    division: "A" },
  { id: "MIR", name: "Mirassol",        shortName: "Mirassol",   division: "A" },

  // Série B
  { id: "CFC", name: "Coritiba",        shortName: "Coritiba",   division: "B" },
  { id: "CAP", name: "Athletico-PR",    shortName: "Athletico-PR", division: "B" },
  { id: "CHA", name: "Chapecoense",     shortName: "Chapecoense",division: "B" },
  { id: "REM", name: "Remo",            shortName: "Remo",       division: "B" },
  { id: "CRI", name: "Criciúma",        shortName: "Criciúma",   division: "B" },
  { id: "GOI", name: "Goiás",           shortName: "Goiás",      division: "B" },
  { id: "NOV", name: "Novorizontino",   shortName: "Novorizontino", division: "B" },
  { id: "CRB", name: "CRB",             shortName: "CRB",        division: "B" },
  { id: "AVA", name: "Avaí",            shortName: "Avaí",       division: "B" },
  { id: "CUI", name: "Cuiabá",          shortName: "Cuiabá",     division: "B" },
  { id: "ACG", name: "Atlético-GO",     shortName: "Atlético-GO",division: "B" },
  { id: "OPE", name: "Operário-PR",     shortName: "Operário-PR",division: "B" },
  { id: "VNO", name: "Vila Nova",       shortName: "Vila Nova",  division: "B" },
  { id: "AME", name: "América-MG",      shortName: "América-MG",division: "B" },
  { id: "ATC", name: "Athletic",        shortName: "Athletic",   division: "B" },
  { id: "BFS", name: "Botafogo-SP",     shortName: "Botafogo-SP",division: "B" },
  { id: "FER", name: "Ferroviária",     shortName: "Ferroviária",division: "B" },
  { id: "AMZ", name: "Amazonas",        shortName: "Amazonas",   division: "B" },
  { id: "VRD", name: "Volta Redonda",   shortName: "Volta Redonda", division: "B" },
  { id: "PAY", name: "Paysandu",        shortName: "Paysandu",   division: "B" }
];

// -------------------------------------------------------
// Função auxiliar para criar jogadores
// -------------------------------------------------------
function makePlayer(
  id,
  teamId,
  name,
  position,
  overall,
  value,
  age = 27,
  morale = 75,
  face = null
) {
  return {
    id,
    teamId,
    name,
    position,   // "GOL", "ZAG", "LD", "LE", "VOL", "MEI", "ATA"
    overall,    // 0–99
    age,
    morale,
    value,      // em "milhões"
    face        // ex: "assets/faces/FLA_PEDRO.png"
  };
}

// -------------------------------------------------------
// JOGADORES (AQUI FICA O SEU DATABASE GIGANTE)
// -------------------------------------------------------

function makePlayer(
  id,
  teamId,
  name,
  position,
  overall,
  value,
  age = 27,
  morale = 75,
  face = null
) {
  return {
    id,
    teamId,
    name,
    position,   // "GOL", "ZAG", "LD", "LE", "VOL", "MEI", "ATA"
    overall,    // 0–99
    age,
    morale,
    value,      // em "milhões"
    face        // ex: "assets/faces/FLA_PEDRO.png"
  };
}

// -------------------------------------------------------
// JOGADORES – aqui vamos colar todos os makePlayer(...)
// -------------------------------------------------------

const players = [
   // =====================
// FLAMENGO – SÉRIE A 2025
// =====================
makePlayer("FLA_ROSSI","FLA","Agustín Rossi","GOL",83,22),
makePlayer("FLA_MATHEUS_CUNHA","FLA","Matheus Cunha","GOL",76,5),

makePlayer("FLA_VARELA","FLA","Guillermo Varela","LD",79,6),
makePlayer("FLA_WESLEY","FLA","Wesley","LD",75,4),
makePlayer("FLA_LEO_PEREIRA","FLA","Léo Pereira","ZAG",82,15),
makePlayer("FLA_FABRICIO_BRUNO","FLA","Fabrício Bruno","ZAG",84,22),
makePlayer("FLA_DAVID_LUIZ","FLA","David Luiz","ZAG",76,1.5),
makePlayer("FLA_Ayrton","FLA","Ayrton Lucas","LE",82,18),

makePlayer("FLA_THIAGO_MAIA","FLA","Thiago Maia","VOL",78,7),
makePlayer("FLA_PULGAR","FLA","Erick Pulgar","VOL",80,10),
makePlayer("FLA_GERSON","FLA","Gerson","MEI",85,32),
makePlayer("FLA_ARRASCA","FLA","Giorgian de Arrascaeta","MEI",87,38),
makePlayer("FLA_EV_CEB","FLA","Everton Cebolinha","ATA",83,24),
makePlayer("FLA_MATHEUS_FRANCA","FLA","Matheus França","MEI",76,10),

makePlayer("FLA_GABIGOL","FLA","Gabigol","ATA",84,30),
makePlayer("FLA_PEDRO","FLA","Pedro","ATA",86,45),
makePlayer("FLA_BRUNO_HEN","FLA","Bruno Henrique","ATA",82,10),
makePlayer("FLA_CARLINHOS","FLA","Carlinhos","ATA",74,2),
makePlayer("FLA_LORRAN","FLA","Lorran","MEI",74,6),
makePlayer("FLA_IGOR_JESUS","FLA","Igor Jesus","VOL",74,3),
makePlayer("FLA_ALLAN","FLA","Allan","VOL",80,12),

// =====================
// INTERNACIONAL – SÉRIE A 2025
// =====================
makePlayer("INT_ROCHET","INT","Sergio Rochet","GOL",82,18),
makePlayer("INT_KEILLER","INT","Keiller","GOL",75,4),

makePlayer("INT_BUSTOS","INT","Fabricio Bustos","LD",79,12),
makePlayer("INT_RENE","INT","René","LE",78,6),
makePlayer("INT_VITAO","INT","Vitão","ZAG",81,10),
makePlayer("INT_ROBERT_RENAN","INT","Robert Renan","ZAG",82,15),
makePlayer("INT_MERCADO","INT","Gabriel Mercado","ZAG",77,2),

makePlayer("INT_ARANGUIZ","INT","Charles Aránguiz","VOL",82,3),
makePlayer("INT_BRUNO_HEN","INT","Bruno Henrique","VOL",78,4),
makePlayer("INT_MAURICIO","INT","Maurício","MEI",81,12),
makePlayer("INT_ALAN_PATRICK","INT","Alan Patrick","MEI",83,18),
makePlayer("INT_THIAGO_MAIA","INT","Thiago Maia","VOL",79,9),

makePlayer("INT_WANDERSON","INT","Wanderson","ATA",80,9),
makePlayer("INT_PEDRO_HEN","INT","Pedro Henrique","ATA",78,5),
makePlayer("INT_LUCCA","INT","Lucca","ATA",75,2),
makePlayer("INT_ENNER","INT","Enner Valencia","ATA",84,22),
makePlayer("INT_BRUNO_RODRIGUES","INT","Bruno Rodrigues","ATA",78,6),
makePlayer("INT_GABRIEL","INT","Gabriel","VOL",77,2),
makePlayer("INT_LUIZ_ADRIANO","INT","Luiz Adriano","ATA",75,1.8),
// =====================
// PALMEIRAS – SÉRIE A 2025
// =====================
makePlayer("PAL_WEVERTON","PAL","Weverton","GOL",85,25),
makePlayer("PAL_MARCELO_LOMBA","PAL","Marcelo Lomba","GOL",74,1),

makePlayer("PAL_MAYKE","PAL","Mayke","LD",80,7),
makePlayer("PAL_MARCO_ROCHA","PAL","Marcos Rocha","LD",77,2),
makePlayer("PAL_MURILO","PAL","Murilo","ZAG",81,12),
makePlayer("PAL_GOMEZ","PAL","Gustavo Gómez","ZAG",85,22),
makePlayer("PAL_VANDERLAN","PAL","Vanderlan","LE",76,3),
makePlayer("PAL_PIQUEREZ","PAL","Piquerez","LE",83,18),

makePlayer("PAL_ZE_RAF","PAL","Zé Rafael","VOL",83,10),
makePlayer("PAL_RIOS","PAL","Richard Ríos","VOL",81,8),
makePlayer("PAL_GAB_MENINO","PAL","Gabriel Menino","MEI",78,7),
makePlayer("PAL_ANIBAL","PAL","Aníbal Moreno","VOL",82,14),
makePlayer("PAL_VEIGA","PAL","Raphael Veiga","MEI",85,28),

makePlayer("PAL_ENDRICK","PAL","Endrick","ATA",86,45),
makePlayer("PAL_RONY","PAL","Rony","ATA",81,12),
makePlayer("PAL_DUDU","PAL","Dudu","ATA",84,20),
makePlayer("PAL_FLACO","PAL","Flaco López","ATA",80,9),
makePlayer("PAL_LAZARO","PAL","Lázaro","ATA",76,6),
makePlayer("PAL_LUIZ_GUILH","PAL","Luis Guilherme","MEI",75,7),
// =====================
// CORINTHIANS – SÉRIE A 2025
// =====================
makePlayer("COR_CASSIO","COR","Cássio","GOL",82,3),
makePlayer("COR_CARLOS_MIGUEL","COR","Carlos Miguel","GOL",80,12),

makePlayer("COR_FAGNER","COR","Fagner","LD",78,2),
makePlayer("COR_FELIPE_AUGUSTO","COR","Felipe Augusto","LD",72,1),
makePlayer("COR_GIL","COR","Gil","ZAG",76,1),
makePlayer("COR_CAETANO","COR","Caetano","ZAG",74,3),
makePlayer("COR_MURILLO","COR","Murillo","ZAG",78,10),

makePlayer("COR_FAUSTO_VERA","COR","Fausto Vera","VOL",80,9),
makePlayer("COR_MAYCON","COR","Maycon","VOL",79,8),
makePlayer("COR_BIDON","COR","Breno Bidon","VOL",74,1),
makePlayer("COR_RENATO","COR","Renato Augusto","MEI",83,3),
makePlayer("COR_ROJAS","COR","Matías Rojas","MEI",81,8),

makePlayer("COR_ROMERO","COR","Ángel Romero","ATA",79,4),
makePlayer("COR_ADSON","COR","Adson","ATA",76,5),
makePlayer("COR_WESLEY","COR","Wesley","ATA",75,6),
makePlayer("COR_YURI","COR","Yuri Alberto","ATA",82,16),
makePlayer("COR_PEDRO","COR","Pedro","ATA",73,2),
makePlayer("COR_GIOVANE","COR","Giovane","ATA",72,1.5),

   // =====================
// BOTAFOGO – SÉRIE A 2025
// =====================
makePlayer("BOT_GATITO","BOT","Gatito Fernández","GOL",81,9),
makePlayer("BOT_PERRY","BOT","Lucas Perri","GOL",79,7),

makePlayer("BOT_DI_PLACIDO","BOT","Di Plácido","LD",77,4),
makePlayer("BOT_RAFINHA","BOT","Rafael","LD",76,3),
makePlayer("BOT_MARCAL","BOT","Marçal","LE",78,5),
makePlayer("BOT_HUGO","BOT","Hugo","LE",74,2.5),

makePlayer("BOT_ADRYELSON","BOT","Adryelson","ZAG",80,8),
makePlayer("BOT_CUESTA","BOT","Victor Cuesta","ZAG",79,7),
makePlayer("BOT_SAMPAIO","BOT","Philipe Sampaio","ZAG",76,3.5),

makePlayer("BOT_MARLON_FREITAS","BOT","Marlon Freitas","VOL",79,7),
makePlayer("BOT_TCHE_TCHE","BOT","Tchê Tchê","VOL",78,6),
makePlayer("BOT_DANILO_BARBOSA","BOT","Danilo Barbosa","VOL",77,5),

makePlayer("BOT_GABRIEL_PIRES","BOT","Gabriel Pires","MEI",78,6),
makePlayer("BOT_LUCAS_FERNANDES","BOT","Lucas Fernandes","MEI",77,5),
makePlayer("BOT_EDUARDO","BOT","Eduardo","MEI",79,7),

makePlayer("BOT_TIQUINHO","BOT","Tiquinho Soares","ATA",82,11),
makePlayer("BOT_JUNIOR_SANTOS","BOT","Júnior Santos","ATA",79,7),
makePlayer("BOT_VICTOR_SA","BOT","Victor Sá","ATA",78,6),
makePlayer("BOT_LUIS_HENRIQUE","BOT","Luis Henrique","ATA",77,6),
makePlayer("BOT_MATHEUS_NASC","BOT","Matheus Nascimento","ATA",75,4),

// =====================
// CRUZEIRO – SÉRIE A 2025
// =====================
makePlayer("CRU_RAF_CABRAL","CRU","Rafael Cabral","GOL",80,7),
makePlayer("CRU_ANDERSON","CRU","Anderson","GOL",75,2.5),

makePlayer("CRU_WILLIAM","CRU","William","LD",78,5),
makePlayer("CRU_HELO","CRU","Helibelton Palacios","LD",75,3.5),
makePlayer("CRU_KAIKI","CRU","Kaiki","LE",76,4),
makePlayer("CRU_MARLON","CRU","Marlon","LE",78,5.5),

makePlayer("CRU_LUCAS_OLIVEIRA","CRU","Lucas Oliveira","ZAG",78,5),
makePlayer("CRU_LUC_CASTAN","CRU","Luciano Castán","ZAG",77,4),
makePlayer("CRU_NERIS","CRU","Neris","ZAG",75,3),

makePlayer("CRU_FILIPE_MACHADO","CRU","Filipe Machado","VOL",76,3.5),
makePlayer("CRU_IAN_LUCCAS","CRU","Ian Luccas","VOL",75,3),
makePlayer("CRU_MATHEUS_JUSSA","CRU","Matheus Jussa","VOL",75,3),

makePlayer("CRU_RAMIRO","CRU","Ramiro","MEI",78,5),
makePlayer("CRU_JORGINHO","CRU","Jorginho","MEI",77,4.5),
makePlayer("CRU_NIKAO","CRU","Nikão","MEI",78,6),

makePlayer("CRU_WESLEY","CRU","Wesley","ATA",77,5.5),
makePlayer("CRU_BRUNO_RODRIGUES","CRU","Bruno Rodrigues","ATA",80,8),
makePlayer("CRU_MATEUS_VITAL","CRU","Mateus Vital","ATA",77,5),
makePlayer("CRU_HENRIQUE_DOURADO","CRU","Henrique Dourado","ATA",76,4),
makePlayer("CRU_RAFA_SILVA","CRU","Rafael Silva","ATA",75,3.5),

// =====================
// FLUMINENSE – SÉRIE A 2025
// =====================
makePlayer("FLU_FABIO","FLU","Fábio","GOL",82,8),
makePlayer("FLU_PEDRO_RANGEL","FLU","Pedro Rangel","GOL",75,2.5),

makePlayer("FLU_SAMUEL_XAVIER","FLU","Samuel Xavier","LD",78,5.5),
makePlayer("FLU_GUGA","FLU","Guga","LD",77,5),
makePlayer("FLU_MARCELO","FLU","Marcelo","LE",83,10),
makePlayer("FLU_DIOGO_BARBO","FLU","Diogo Barbosa","LE",76,4),

makePlayer("FLU_NINO","FLU","Nino","ZAG",81,9),
makePlayer("FLU_FELIPE_MELO","FLU","Felipe Melo","ZAG",78,3.5),
makePlayer("FLU_MANOEL","FLU","Manoel","ZAG",77,4),

makePlayer("FLU_ANDRE","FLU","André","VOL",83,12),
makePlayer("FLU_MARTINELLI","FLU","Martinelli","VOL",79,7),
makePlayer("FLU_ALEXANDRE_JESUS","FLU","Alexandre Jesus","VOL",74,2.5),

makePlayer("FLU_GANSO","FLU","Paulo Henrique Ganso","MEI",82,9),
makePlayer("FLU_LIMA","FLU","Lima","MEI",79,7),
makePlayer("FLU_ARIAS","FLU","Jhon Arias","MEI",82,12),

makePlayer("FLU_KENO","FLU","Keno","ATA",80,8),
makePlayer("FLU_CAN0","FLU","Germán Cano","ATA",84,13),
makePlayer("FLU_JOHN_KENNEDY","FLU","John Kennedy","ATA",79,7),
makePlayer("FLU_LELE","FLU","Lelê","ATA",76,4.5),
makePlayer("FLU_ISAAC","FLU","Isaac","ATA",74,2.5),

// =====================
// CRICIÚMA – SÉRIE B 2025
// =====================
makePlayer("CRI_GUSTAVO","CRI","Gustavo","GOL",75,2.5),
makePlayer("CRI_ALISSON","CRI","Alisson","GOL",72,1.5),

makePlayer("CRI_CRISTOVAM","CRI","Cristovam","LD",74,2),
makePlayer("CRI_HELOIR","CRI","Helder","LD",72,1.5),
makePlayer("CRI_HEREDA","CRI","Hereda","LE",73,2),
makePlayer("CRI_MARCOS_CIANI","CRI","Marcos Ciani","LE",72,1.5),

makePlayer("CRI_RODRIGO","CRI","Rodrigo","ZAG",74,2),
makePlayer("CRI_FABIO_SAMPAIO","CRI","Fábio Sampaio","ZAG",73,1.8),
makePlayer("CRI_RUY","CRI","Ruy","ZAG",72,1.5),

makePlayer("CRI_FELIPE_MATHEUS","CRI","Felipe Matheus","VOL",75,2.5),
makePlayer("CRI_ARILSON","CRI","Arilson","VOL",74,2),
makePlayer("CRI_UBERABA","CRI","Uberaba","VOL",73,1.8),

makePlayer("CRI_MARQUINHOS","CRI","Marquinhos Gabriel","MEI",76,3),
makePlayer("CRI_CLAUDINHO","CRI","Claudinho","MEI",75,2.5),
makePlayer("CRI_IGOR","CRI","Igor","MEI",73,1.8),

makePlayer("CRI_ELDER_SANTOS","CRI","Élder Santos","ATA",75,2.5),
makePlayer("CRI_LLOID","CRI","Léo Gamalho","ATA",76,3),
makePlayer("CRI_FILIPE_VIZEU","CRI","Filipe Vizeu","ATA",75,2.5),
makePlayer("CRI_RADAEL","CRI","Radael","ATA",73,2),
makePlayer("CRI_FERNANDINHO","CRI","Fernandinho","ATA",72,1.5),

// =====================
// SÃO PAULO – SÉRIE A 2025
// =====================
makePlayer("SAO_RAFINHA","SAO","Rafinha","LD",78,1),
makePlayer("SAO_IGOR_VIN","SAO","Igor Vinícius","LD",80,9),

makePlayer("SAO_ARBOLEDA","SAO","Arboleda","ZAG",82,11),
makePlayer("SAO_DIEGO_COSTA","SAO","Diego Costa","ZAG",79,7),
makePlayer("SAO_BERALDO","SAO","Beraldo","ZAG",81,16),
makePlayer("SAO_JALEX","SAO","Jalex","ZAG",72,1.2),

makePlayer("SAO_WELL_RATO","SAO","Wellington Rato","MEI",77,6),
makePlayer("SAO_PABLO_MAIA","SAO","Pablo Maia","VOL",82,18),
makePlayer("SAO_LUCAS","SAO","Lucas Moura","ATA",84,20),
makePlayer("SAO_LUCAS_PERRI","SAO","Lucas Perri","GOL",81,14),
makePlayer("SAO_JANDREI","SAO","Jandrei","GOL",76,5),

makePlayer("SAO_LUCIA","SAO","Luciano","ATA",82,10),
makePlayer("SAO_CALLERI","SAO","Jonathan Calleri","ATA",84,18),
makePlayer("SAO_JAMES","SAO","James Rodríguez","MEI",82,8),

makePlayer("SAO_NESTOR","SAO","Rodrigo Nestor","MEI",80,12),
makePlayer("SAO_MICHEL","SAO","Michel Araújo","MEI",78,6),

makePlayer("SAO_MOREIRA","SAO","Moreira","LE",75,3),
makePlayer("SAO_WELLINGTON","SAO","Wellington","LE",78,8),

makePlayer("SAO_RATO","SAO","Wellington Rato","MEI",77,5),
makePlayer("SAO_NIKAO","SAO","Nikão","MEI",76,3),
makePlayer("SAO_JUAN","SAO","Juan","ATA",74,2),
// =====================
// SANTOS – SÉRIE A 2025
// =====================
makePlayer("SAN_JOAO_PAULO","SAN","João Paulo","GOL",82,12),
makePlayer("SAN_VEGA","SAN","Gabriel Vega","GOL",73,1.1),

makePlayer("SAN_JOAQUIM","SAN","Joaquim","ZAG",80,9),
makePlayer("SAN_BASSO","SAN","João Basso","ZAG",78,8),
makePlayer("SAN_MESSIAS","SAN","Messias","ZAG",76,3),

makePlayer("SAN_DODO","SAN","Dodô","LE",78,8),
makePlayer("SAN_GAB_INOC","SAN","Gabriel Inocêncio","LD",75,2),

makePlayer("SAN_RODRIGO_F","SAN","Rodrigo Fernández","VOL",79,6),
makePlayer("SAN_ALISON","SAN","Alison","VOL",76,4),

makePlayer("SAN_SOTELDO","SAN","Soteldo","ATA",82,15),
makePlayer("SAN_MAR_LEO","SAN","Marcos Leonardo","ATA",84,20),
makePlayer("SAN_MORELOS","SAN","Morelos","ATA",78,7),
makePlayer("SAN_Patati","SAN","Weslley Patati","ATA",76,4),

makePlayer("SAN_NONATO","SAN","Nonato","MEI",77,5),
makePlayer("SAN_IVONEI","SAN","Ivonei","MEI",74,2),

makePlayer("SAN_CAMILO","SAN","Camilo","MEI",76,3.3),
makePlayer("SAN_SANDRY","SAN","Sandry","VOL",74,2.5),
makePlayer("SAN_FURMAN","SAN","Furman","VOL",75,3),
makePlayer("SAN_RINCON","SAN","Rincón","VOL",76,4),
// =====================
// GRÊMIO – SÉRIE A 2025
// =====================
makePlayer("GRE_GRANDO","GRE","Gabriel Grando","GOL",79,6),
makePlayer("GRE_Rafael_Cabral","GRE","Rafael Cabral","GOL",77,4),

makePlayer("GRE_KANNEMANN","GRE","Kannemann","ZAG",82,5),
makePlayer("GRE_GEROMEL","GRE","Geromel","ZAG",80,1),
makePlayer("GRE_GUSTAVO_MARTINS","GRE","Gustavo Martins","ZAG",76,4),
makePlayer("GRE_RODRIGO_ELY","GRE","Rodrigo Ely","ZAG",77,3),

makePlayer("GRE_REINALDO","GRE","Reinaldo","LE",79,4),
makePlayer("GRE_CUIABANO","GRE","Cuiabano","LE",76,3),
makePlayer("GRE_JOAO_PEDRO","GRE","João Pedro","LD",78,4),

makePlayer("GRE_VILLASANTI","GRE","Villasanti","VOL",82,10),
makePlayer("GRE_PEPÊ","GRE","Pepê","VOL",81,8),
makePlayer("GRE_CRISTALDO","GRE","Franco Cristaldo","MEI",80,6),

makePlayer("GRE_GALDINO","GRE","Galdino","ATA",76,3),
makePlayer("GRE_FERREIRA","GRE","Ferreira","ATA",79,8),
makePlayer("GRE_NATHAN","GRE","Nathan Fernandes","ATA",74,2.2),

makePlayer("GRE_GUSTAVO_NUNES","GRE","Gustavo Nunes","ATA",75,3.5),
makePlayer("GRE_EDENILSON","GRE","Edenilson","MEI",78,4),
makePlayer("GRE_SUAREZ","GRE","Luis Suárez","ATA",84,10), // fim do contrato? você decide se mantém
makePlayer("GRE_ANDRE","GRE","André Henrique","ATA",74,1.8),
// ======================
// ATLÉTICO-MG – SÉRIE A 2025
// ======================
makePlayer("AMG_EVERSON","AMG","Everson","GOL",82,10),
makePlayer("AMG_MATHEUS_MEND","AMG","Matheus Mendes","GOL",73,1),

makePlayer("AMG_G_ARANA","AMG","Guilherme Arana","LE",85,22),
makePlayer("AMG_MARIANO","AMG","Mariano","LD",77,1),
makePlayer("AMG_SARAVIA","AMG","Saravia","LD",78,4),
makePlayer("AMG_JEMERSON","AMG","Jemerson","ZAG",79,4),
makePlayer("AMG_BRUNO_F","AMG","Bruno Fuchs","ZAG",78,5),
makePlayer("AMG_NATHAN_SILVA","AMG","Nathan Silva","ZAG",80,7),

makePlayer("AMG_OTAVIO","AMG","Otávio","VOL",80,12),
makePlayer("AMG_BATTAGLIA","AMG","Battaglia","VOL",82,9),
makePlayer("AMG_ALAN_FRANCO","AMG","Alan Franco","VOL",79,5),

makePlayer("AMG_ZARACHO","AMG","Zaracho","MEI",84,18),
makePlayer("AMG_IGOR_GOMES","AMG","Igor Gomes","MEI",80,10),
makePlayer("AMG_PALACIOS","AMG","Palacios","MEI",74,3),

makePlayer("AMG_HULK","AMG","Hulk","ATA",85,8),
makePlayer("AMG_PAULINHO","AMG","Paulinho","ATA",84,25),
makePlayer("AMG_PAVON","AMG","Pavón","ATA",81,10),
makePlayer("AMG_VARGAS","AMG","Vargas","ATA",79,4),
makePlayer("AMG_CADU","AMG","Cadu","ATA",75,2),
// =====================
// BAHIA – SÉRIE A 2025
// =====================
makePlayer("BAH_MARCOS_FELIPE","BAH","Marcos Felipe","GOL",78,6),
makePlayer("BAH_DANILO_FERNANDES","BAH","Danilo Fernandes","GOL",75,2.5),

makePlayer("BAH_KANU","BAH","Kanu","ZAG",77,4),
makePlayer("BAH_GABRIEL_XAVIER","BAH","Gabriel Xavier","ZAG",76,3.5),
makePlayer("BAH_VITOR_HUGO_ZAG","BAH","Vitor Hugo","ZAG",76,3.5),

makePlayer("BAH_LUCAS_ESTEVES","BAH","Lucas Esteves","LE",75,3),
makePlayer("BAH_LUC_JUBA","BAH","Luciano Juba","LE",78,5.5),
makePlayer("BAH_CICINHO","BAH","Cicinho","LD",76,3),

makePlayer("BAH_REZENDE","BAH","Rezende","VOL",76,3.5),
makePlayer("BAH_ACEVEDO","BAH","Acevedo","VOL",77,4.5),
makePlayer("BAH_YAGO_FELIPE","BAH","Yago Felipe","VOL",77,4),

makePlayer("BAH_CAULY","BAH","Cauly","MEI",80,8),
makePlayer("BAH_JEAN_LUCAS","BAH","Jean Lucas","MEI",79,7),
makePlayer("BAH_THACIANO","BAH","Thaciano","MEI",77,4.5),
makePlayer("BAH_LUAN","BAH","Luan","MEI",76,3),

makePlayer("BAH_BIEL","BAH","Biel","ATA",78,5),
makePlayer("BAH_EVERALDO","BAH","Everaldo","ATA",78,5.5),
makePlayer("BAH_RAF_RATAO","BAH","Rafael Ratão","ATA",77,4),
makePlayer("BAH_ADEMIR","BAH","Ademir","ATA",79,6),
makePlayer("BAH_VINICIUS_MINGOTTI","BAH","Vinícius Mingotti","ATA",75,2.8),

// =====================
// FORTALEZA – SÉRIE A 2025
// =====================
makePlayer("FOR_JOAO_RICARDO","FOR","João Ricardo","GOL",79,5),
makePlayer("FOR_SANTOS","FOR","Santos","GOL",76,3),

makePlayer("FOR_TITI","FOR","Titi","ZAG",79,4.5),
makePlayer("FOR_BENEVENTO","FOR","Benevenuto","ZAG",78,4),
makePlayer("FOR_TINGA","FOR","Tinga","ZAG",77,3.5),

makePlayer("FOR_BRUNO_PACHECO","FOR","Bruno Pacheco","LE",77,4),
makePlayer("FOR_DODO","FOR","Dodo","LE",75,3),
makePlayer("FOR_DUARTE","FOR","Dudu","LD",76,3.2),

makePlayer("FOR_ZE_WELISON","FOR","Zé Welison","VOL",78,4.5),
makePlayer("FOR_HERCULES","FOR","Hércules","VOL",77,4.5),
makePlayer("FOR_LUCAS_SASHA","FOR","Sasha","VOL",76,3.5),

makePlayer("FOR_POCCHETINO","FOR","Pochettino","MEI",79,5.5),
makePlayer("FOR_CALEX","FOR","Calebe","MEI",76,3),
makePlayer("FOR_KERVIN","FOR","Kervin Andrade","MEI",75,3),
makePlayer("FOR_ROMARINHO","FOR","Romarinho","MEI",78,4.5),
makePlayer("FOR_CRISPIM","FOR","Crispim","MEI",77,4),

makePlayer("FOR_LUCERO","FOR","Lucero","ATA",80,7),
makePlayer("FOR_YAGO_PIKACHU","FOR","Yago Pikachu","ATA",79,6),
makePlayer("FOR_MARINHO","FOR","Marinho","ATA",78,5.5),
makePlayer("FOR_MOISES","FOR","Moisés","ATA",79,6),
makePlayer("FOR_PEDRO_ROCHA","FOR","Pedro Rocha","ATA",77,4.5),
makePlayer("FOR_KAYZER","FOR","Kayzer","ATA",76,4),
makePlayer("FOR_SAMUEL","FOR","Samuel","ATA",75,3),

// =====================
// RB BRAGANTINO – SÉRIE A 2025
// =====================
makePlayer("RBB_CLEITON","RBB","Cleiton","GOL",78,5),
makePlayer("RBB_MAYCON_CEZAR","RBB","Maycon Cezar","GOL",73,1.5),

makePlayer("RBB_REALPE","RBB","Léo Realpe","ZAG",76,3.5),
makePlayer("RBB_LUCAS_CUNHA","RBB","Lucas Cunha","ZAG",77,4),
makePlayer("RBB_DOUGLAS_MENDES","RBB","Douglas Mendes","ZAG",74,2.2),

makePlayer("RBB_JUN_CAPIXABA","RBB","Juninho Capixaba","LE",79,5.5),
makePlayer("RBB_LUAN_CANDIDO","RBB","Luan Cândido","LE",78,5),
makePlayer("RBB_NATHAN_MENDES","RBB","Nathan Mendes","LD",77,4),
makePlayer("RBB_ANDRES_HURTADO","RBB","Andrés Hurtado","LD",76,3.5),

makePlayer("RBB_JADSOM","RBB","Jadsom","VOL",77,4),
makePlayer("RBB_MATHEUS_FERNANDES","RBB","Matheus Fernandes","VOL",76,3.5),
makePlayer("RBB_ERICK_RAMIREZ","RBB","Eric Ramires","MEI",78,5),
makePlayer("RBB_LUCAS_EVANGELISTA","RBB","Lucas Evangelista","MEI",80,7),
makePlayer("RBB_BRUNINHO","RBB","Bruninho","MEI",76,3.5),
makePlayer("RBB_GUSTAVINHO","RBB","Gustavinho","MEI",75,3),

makePlayer("RBB_HELINHO","RBB","Helinho","ATA",79,6),
makePlayer("RBB_VITINHO","RBB","Vitinho","ATA",78,5.5),
makePlayer("RBB_THIAGO_BORBAS","RBB","Thiago Borbas","ATA",80,7),
makePlayer("RBB_SASHA","RBB","Eduardo Sasha","ATA",78,5),
makePlayer("RBB_HENRY_MOSQUERA","RBB","Henry Mosquera","ATA",77,4.2),
makePlayer("RBB_LINCOLN","RBB","Lincoln","ATA",75,3),
makePlayer("RBB_MIGUEL","RBB","Miguel","ATA",74,2),

// =====================
// VASCO – SÉRIE A 2025
// =====================
makePlayer("VAS_LEO_JARDIM","VAS","Léo Jardim","GOL",79,5),
makePlayer("VAS_HALLSWORTH","VAS","Halls","GOL",73,1.5),

makePlayer("VAS_MEDEL","VAS","Medel","ZAG",80,3.5),
makePlayer("VAS_ROBSON_BAMBU","VAS","Robson Bambu","ZAG",76,3),
makePlayer("VAS_JOAO_VICTOR","VAS","João Victor","ZAG",77,4),

makePlayer("VAS_LUCAS_PITON","VAS","Lucas Piton","LE",79,6),
makePlayer("VAS_PAULO_HENRIQUE","VAS","Paulo Henrique","LD",76,3.5),
makePlayer("VAS_PUMA_RODRIGUEZ","VAS","Puma Rodríguez","LD",77,4),

makePlayer("VAS_HUGO_MOURA","VAS","Hugo Moura","VOL",77,4.5),
makePlayer("VAS_JAIR","VAS","Jair","VOL",78,5),
makePlayer("VAS_ZE_GABRIEL","VAS","Zé Gabriel","VOL",75,3),

makePlayer("VAS_PRAXEDES","VAS","Praxedes","MEI",78,5),
makePlayer("VAS_GALDAMES","VAS","Galdames","MEI",77,4),
makePlayer("VAS_PAYET","VAS","Payet","MEI",82,7),

makePlayer("VAS_GABRIEL_PEC","VAS","Gabriel Pec","ATA",81,9),
makePlayer("VAS_VEGETTI","VAS","Vegetti","ATA",80,7),
makePlayer("VAS_ERICK_MARCUS","VAS","Erick Marcus","ATA",76,3.5),
makePlayer("VAS_RAYAN","VAS","Rayan","ATA",75,3),
makePlayer("VAS_PAULINHO","VAS","Paulinho","ATA",77,4),
makePlayer("VAS_ROSSI","VAS","Rossi","ATA",78,5),
makePlayer("VAS_DAVID","VAS","David","ATA",77,4.5),
// =====================
// CEARÁ – SÉRIE A 2025
// =====================
makePlayer("CEA_RICHARD","CEA","Richard","GOL",76,3),
makePlayer("CEA_JOAO_RICARDO","CEA","João Ricardo","GOL",74,2),

makePlayer("CEA_LEO_SANTOS","CEA","Léo Santos","ZAG",75,2.8),
makePlayer("CEA_TIAGO_PAG","CEA","Tiago Pagnussat","ZAG",76,3),
makePlayer("CEA_DAVID_RICARDO","CEA","David Ricardo","ZAG",74,2),

makePlayer("CEA_BRUNO_FERREIRA","CEA","Bruno Ferreira","LD",74,2),
makePlayer("CEA_MICHEL_MACEDO","CEA","Michel Macedo","LD",75,2.5),
makePlayer("CEA_ALAN_RODRIGUES","CEA","Alan Rodrigues","LE",73,1.8),

makePlayer("CEA_RENATO_RICHARDSON","CEA","Richardson","VOL",76,3),
makePlayer("CEA_GUILHERME_CASTILHO","CEA","Guilherme Castilho","VOL",76,3),
makePlayer("CEA_GEOVANE","CEA","Geovane","VOL",74,2),

makePlayer("CEA_VINA","CEA","Vina","MEI",79,5),
makePlayer("CEA_JEAN_CARLOS","CEA","Jean Carlos","MEI",77,3.5),
makePlayer("CEA_CHAY","CEA","Chay","MEI",75,2.5),
makePlayer("CEA_ANDRE_LUIZ","CEA","André Luiz","MEI",74,2),

makePlayer("CEA_ERICK","CEA","Erick","ATA",78,4.5),
makePlayer("CEA_SAULO_MINEIRO","CEA","Saulo Mineiro","ATA",77,4),
makePlayer("CEA_JANDERSON","CEA","Janderson","ATA",76,3.5),
makePlayer("CEA_LUVANNOR","CEA","Luvannor","ATA",75,3),
makePlayer("CEA_CLEBER","CEA","Cléber","ATA",75,3),

// =====================
// SPORT – SÉRIE A 2025
// =====================
makePlayer("SPT_JORDAN","SPT","Jordan","GOL",74,2),
makePlayer("SPT_RENNAN","SPT","Renan","GOL",73,1.5),

makePlayer("SPT_RAF_THYERE","SPT","Rafael Thyere","ZAG",77,3.5),
makePlayer("SPT_SABINO","SPT","Sabino","ZAG",77,3.5),
makePlayer("SPT_CHICO_ZAG","SPT","Chico","ZAG",75,2.5),

makePlayer("SPT_LUCAS_HERNANDES","SPT","Lucas Hernandes","LE",75,2.8),
makePlayer("SPT_DALBERT","SPT","Dalbert","LE",76,3),
makePlayer("SPT_RENZO","SPT","Renzo","LD",74,2),
makePlayer("SPT_PEDRO_LIMA","SPT","Pedro Lima","LD",76,3.2),

makePlayer("SPT_FABIO_MATHEUS","SPT","Fábio Matheus","VOL",75,2.5),
makePlayer("SPT_DENILSON_VOL","SPT","Denílson","VOL",75,2.5),
makePlayer("SPT_RONALDO","SPT","Ronaldo","VOL",76,3),

makePlayer("SPT_ALAN_RUIZ","SPT","Alan Ruiz","MEI",77,3.5),
makePlayer("SPT_LUC_JUBA_MEI","SPT","Luciano Juba","MEI",79,5),
makePlayer("SPT_FABRICIO_DANIEL","SPT","Fabrício Daniel","MEI",76,3),
makePlayer("SPT_ALISSON_FARIAS","SPT","Alisson Farias","MEI",75,2.5),

makePlayer("SPT_GUSTAVO_COUTINHO","SPT","Gustavo Coutinho","ATA",78,4),
makePlayer("SPT_GABRIEL_SANTOS","SPT","Gabriel Santos","ATA",76,3),
makePlayer("SPT_EDINHO","SPT","Edinho","ATA",76,3),
makePlayer("SPT_WANDERSON","SPT","Wanderson","ATA",75,2.8),

// =====================
// JUVENTUDE – SÉRIE A 2025
// =====================
makePlayer("JUV_CESAR","JUV","César","GOL",76,2.8),
makePlayer("JUV_RENNAN","JUV","Renan","GOL",73,1.5),

makePlayer("JUV_VITOR_MENDES","JUV","Vitor Mendes","ZAG",76,3),
makePlayer("JUV_RODRIGO_SAM","JUV","Rodrigo Sam","ZAG",74,2.2),
makePlayer("JUV_RAFAEL_FORSTER","JUV","Rafael Forster","ZAG",75,2.5),

makePlayer("JUV_ALAN_RUSCHEL","JUV","Alan Ruschel","LE",75,2.5),
makePlayer("JUV_PAULO_HENRIQUE","JUV","Paulo Henrique","LD",75,2.5),

makePlayer("JUV_JEAN_IRMER","JUV","Jean Irmer","VOL",76,3),
makePlayer("JUV_JADSON","JUV","Jadson","VOL",75,2.8),

makePlayer("JUV_MATHEUS_VARGAS","JUV","Matheus Vargas","MEI",76,3),
makePlayer("JUV_GABRIEL_TOTA","JUV","Gabriel Tota","MEI",74,2),
makePlayer("JUV_CHICO_MEI","JUV","Chico","MEI",74,2),
makePlayer("JUV_LUCAS_BARBOSA","JUV","Lucas Barbosa","MEI",75,2.5),

makePlayer("JUV_NENE","JUV","Nenê","ATA",79,4),
makePlayer("JUV_GILBERTO","JUV","Gilberto","ATA",77,3.5),
makePlayer("JUV_ELTON","JUV","Elton","ATA",76,3),
makePlayer("JUV_RICARDO_BUENO","JUV","Ricardo Bueno","ATA",75,2.5),
makePlayer("JUV_CAPIXABA","JUV","Capixaba","ATA",76,3),
makePlayer("JUV_KELVI","JUV","Kelvi","ATA",73,1.8),

// =====================
// VITÓRIA – SÉRIE A 2025
// =====================
makePlayer("VIT_LUCAS_ARCANJO","VIT","Lucas Arcanjo","GOL",76,2.8),
makePlayer("VIT_THIAGO_RODRIGUES","VIT","Thiago Rodrigues","GOL",73,1.5),

makePlayer("VIT_WAGNER_LEONARDO","VIT","Wagner Leonardo","ZAG",76,3),
makePlayer("VIT_CAMUTANGA","VIT","Camutanga","ZAG",75,2.5),
makePlayer("VIT_DUDU_ZAG","VIT","Dudu","ZAG",74,2.2),

makePlayer("VIT_FELIPE_VIEIRA","VIT","Felipe Vieira","LE",74,2),
makePlayer("VIT_JOAO_LUCAS","VIT","João Lucas","LD",75,2.5),
makePlayer("VIT_RAILAN","VIT","Railan","LD",73,1.8),

makePlayer("VIT_WILLIAN_OLIVEIRA","VIT","Willian Oliveira","VOL",75,2.5),
makePlayer("VIT_RODRIGO_ANDRADE","VIT","Rodrigo Andrade","VOL",76,3),
makePlayer("VIT_GEGÊ","VIT","Gegê","VOL",74,2),

makePlayer("VIT_DANIEL","VIT","Daniel","MEI",76,3),
makePlayer("VIT_BRUNO_OLIVEIRA","VIT","Bruno Oliveira","MEI",75,2.5),
makePlayer("VIT_MATHEUSINHO","VIT","Matheusinho","MEI",75,2.5),
makePlayer("VIT_MARCO_ANTONIO","VIT","Marco Antônio","MEI",74,2),

makePlayer("VIT_LEO_GAMALHO","VIT","Léo Gamalho","ATA",77,3),
makePlayer("VIT_ZE_HUGO","VIT","Zé Hugo","ATA",75,2.5),
makePlayer("VIT_OSVALDO","VIT","Osvaldo","ATA",75,2.5),
makePlayer("VIT_RODRIGO_CARIOCA","VIT","Rodrigo Carioca","ATA",74,2.2),
makePlayer("VIT_IURY_CASTILHO","VIT","Iury Castilho","ATA",76,3),

// =====================
// MIRASSOL – SÉRIE A 2025
// =====================
makePlayer("MIR_JOAO_PAULO","MIR","João Paulo","GOL",74,2),
makePlayer("MIR_MATHEUS_OLIVEIRA_GOL","MIR","Matheus Oliveira","GOL",72,1.2),

makePlayer("MIR_LUIZ_OTAVIO","MIR","Luiz Otávio","ZAG",75,2.5),
makePlayer("MIR_RODRIGO_SAM_MIR","MIR","Rodrigo Sam","ZAG",74,2.2),
makePlayer("MIR_ROBSON","MIR","Robson","ZAG",73,1.8),

makePlayer("MIR_MORAES","MIR","Moraes","LE",74,2),
makePlayer("MIR_LUCAS_RAMON","MIR","Lucas Ramon","LD",74,2),
makePlayer("MIR_RODRIGO_FERREIRA","MIR","Rodrigo Ferreira","LD",73,1.8),

makePlayer("MIR_DANIELZINHO","MIR","Danielzinho","VOL",75,2.5),
makePlayer("MIR_CRISTIAN","MIR","Cristian","VOL",74,2),
makePlayer("MIR_PAULINHO","MIR","Paulinho","VOL",74,2),

makePlayer("MIR_CAMILO","MIR","Camilo","MEI",78,3),
makePlayer("MIR_FABRICIO","MIR","Fabrício","MEI",75,2.5),
makePlayer("MIR_KAUAN","MIR","Kauan","MEI",73,1.8),

makePlayer("MIR_ZE_ROBERTO","MIR","Zé Roberto","ATA",76,3),
makePlayer("MIR_NEQUEBA","MIR","Negueba","ATA",75,2.5),
makePlayer("MIR_RAF_SILVA","MIR","Rafael Silva","ATA",74,2.2),
makePlayer("MIR_GABRIEL","MIR","Gabriel","ATA",73,1.8),
makePlayer("MIR_VINICIUS","MIR","Vinícius","ATA",73,1.8),
// =====================
// CORITIBA – SÉRIE B 2025 (CFC)
// =====================
makePlayer("CFC_MARCOS","CFC","Marcos","GOL",74,2),
makePlayer("CFC_THIAGO_DOMBROSki","CFC","Thiago Dombroski","ZAG",74,2.2),
makePlayer("CFC_KUSCEVIC","CFC","Kuscevic","ZAG",76,3),
makePlayer("CFC_HENRIQUE","CFC","Henrique","ZAG",74,1.5),
makePlayer("CFC_NATANAEL","CFC","Natanael","LE",74,2),
makePlayer("CFC_MATHEUS_ALEXANDRE","CFC","Matheus Alexandre","LD",74,2),

makePlayer("CFC_WILLIAN_FARIAS","CFC","Willian Farias","VOL",75,2.5),
makePlayer("CFC_ANDREY","CFC","Andrey","VOL",77,3.5),
makePlayer("CFC_BRUNO_GOMES","CFC","Bruno Gomes","VOL",76,3),

makePlayer("CFC_BENITEZ","CFC","Benítez","MEI",77,3.5),
makePlayer("CFC_BOSCHILIA","CFC","Boschilia","MEI",76,3),
makePlayer("CFC_JEAN_PIERRE","CFC","Jean Pierre","MEI",75,2.5),

makePlayer("CFC_ALEF_MANGA","CFC","Alef Manga","ATA",77,4),
makePlayer("CFC_ROBSON","CFC","Robson","ATA",76,3),
makePlayer("CFC_KAIO_CESAR","CFC","Kaio César","ATA",75,2.8),
makePlayer("CFC_IGOR_PAIXAO","CFC","Igor Paixão","ATA",78,4.5),
makePlayer("CFC_GABRIEL","CFC","Gabriel","ATA",73,1.8),

// =====================
// ATHLETICO-PR – SÉRIE B 2025 (CAP)
// =====================
makePlayer("CAP_BENTO","CAP","Bento","GOL",80,8),
makePlayer("CAP_LEO_LINK","CAP","Léo Linck","GOL",73,1.5),

makePlayer("CAP_THIAGO_HELENO","CAP","Thiago Heleno","ZAG",76,2),
makePlayer("CAP_KAIQUE_ROCHA","CAP","Kaique Rocha","ZAG",75,2.5),
makePlayer("CAP_ESQUIVEL","CAP","Esquivel","LE",76,3),
makePlayer("CAP_MADSON","CAP","Madson","LD",76,3),

makePlayer("CAP_FERNANDINHO","CAP","Fernandinho","VOL",80,3),
makePlayer("CAP_ERICK","CAP","Erick","VOL",77,4),
makePlayer("CAP_CHRISTIAN","CAP","Christian","VOL",77,4),

makePlayer("CAP_BRUNO_ZAPELLI","CAP","Bruno Zapelli","MEI",78,5),
makePlayer("CAP_ALEX_SANTANA","CAP","Alex Santana","MEI",76,3.5),
makePlayer("CAP_LEO_CITTADINI","CAP","Léo Cittadini","MEI",76,3),

makePlayer("CAP_CANOBBIO","CAP","Canobbio","ATA",79,5.5),
makePlayer("CAP_VITOR_ROQUE","CAP","Vitor Roque","ATA",82,20),
makePlayer("CAP_PABLO","CAP","Pablo","ATA",76,3.5),
makePlayer("CAP_VITINHO","CAP","Vitinho","ATA",76,3.5),
makePlayer("CAP_JULIMAR","CAP","Julimar","ATA",74,2),

// =====================
// CHAPECOENSE – SÉRIE B 2025 (CHA)
// =====================
makePlayer("CHA_JOAO_PAULO","CHA","João Paulo","GOL",73,1.8),
makePlayer("CHA_MATHEUS_CAVALHEIRO","CHA","Matheus Cavalheiro","GOL",72,1.2),

makePlayer("CHA_RODRIGO_FREITAS","CHA","Rodrigo Freitas","ZAG",74,2),
makePlayer("CHA_CLEYTON","CHA","Cleylton","ZAG",73,1.8),
makePlayer("CHA_LUCAS_RIBEIRO","CHA","Lucas Ribeiro","ZAG",73,1.8),

makePlayer("CHA_BUSANELLO","CHA","Busanello","LE",75,2.5),
makePlayer("CHA_RONEI","CHA","Ronei","LD",74,2),

makePlayer("CHA_DARLAN","CHA","Darlan","VOL",74,2),
makePlayer("CHA_GUILHERME","CHA","Guilherme","VOL",74,2),

makePlayer("CHA_TIAGO_REAL","CHA","Tiago Real","MEI",75,2.2),
makePlayer("CHA_GEOVANE","CHA","Geovane","MEI",74,2),
makePlayer("CHA_VINI_PAULISTA","CHA","Vini Paulista","MEI",73,1.8),

makePlayer("CHA_PEROTTI","CHA","Perotti","ATA",76,3),
makePlayer("CHA_ALISSON_FARIAS","CHA","Alisson Farias","ATA",75,2.5),
makePlayer("CHA_KAIO_NUNES","CHA","Kaio Nunes","ATA",74,2),
makePlayer("CHA_PABLO_OLIVEIRA","CHA","Pablo Oliveira","ATA",73,1.8),

// =====================
// REMO – SÉRIE B 2025 (REM)
// =====================
makePlayer("REM_VINICIUS","REM","Vinícius","GOL",74,2),
makePlayer("REM_ZÉ_CARLOS","REM","Zé Carlos","GOL",72,1.2),

makePlayer("REM_RAF_JANSEN","REM","Rafael Jansen","ZAG",74,2),
makePlayer("REM_DANIEL_FELIPE","REM","Daniel Felipe","ZAG",73,1.8),
makePlayer("REM_IGOR_FERNANDES","REM","Igor Fernandes","LE",73,1.8),
makePlayer("REM_KEVIN","REM","Kevin","LD",74,2),

makePlayer("REM_LUCAS_SIQUEIRA","REM","Lucas Siqueira","VOL",75,2.5),
makePlayer("REM_ANDERSON_UCHOA","REM","Anderson Uchôa","VOL",74,2.2),

makePlayer("REM_GEDOZ","REM","Felipe Gedoz","MEI",75,2.5),
makePlayer("REM_ERICK_FLORES","REM","Erick Flores","MEI",74,2),
makePlayer("REM_JEAN_SILVA","REM","Jean Silva","MEI",73,1.8),

makePlayer("REM_MURIQUI","REM","Muriqui","ATA",76,3),
makePlayer("REM_NETO_PESSOA","REM","Neto Pessoa","ATA",74,2.2),
makePlayer("REM_RONALD","REM","Ronald","ATA",74,2),
makePlayer("REM_PEDRO_VITOR","REM","Pedro Vitor","ATA",73,1.8),
makePlayer("REM_DIEGO_GUERRA","REM","Diego Guerra","ATA",73,1.8),

// =====================
// GOIÁS – SÉRIE B 2025 (GOI)
// =====================
makePlayer("GOI_TADEU","GOI","Tadeu","GOL",79,5),
makePlayer("GOI_MARCOS","GOI","Marcos","GOL",72,1.5),

makePlayer("GOI_MAGUINHO","GOI","Maguinho","LD",75,2.5),
makePlayer("GOI_APODI","GOI","Apodi","LD",76,3),
makePlayer("GOI_SIDIMAR","GOI","Sidimar","ZAG",74,2.2),
makePlayer("GOI_YAN_SOUTO","GOI","Yan Souto","ZAG",74,2),
makePlayer("GOI_SANDER","GOI","Sander","LE",76,3),
makePlayer("GOI_DANILO_BARCELOS","GOI","Danilo Barcelos","LE",74,2),

makePlayer("GOI_MATHEUS_SALES","GOI","Matheus Sales","VOL",74,2.2),
makePlayer("GOI_CAIO_VINICIUS","GOI","Caio Vinícius","VOL",75,2.5),

makePlayer("GOI_FELLipe_BASTOS","GOI","Fellipe Bastos","MEI",75,2),
makePlayer("GOI_LUAN_DIAS","GOI","Luan Dias","MEI",76,2.8),
makePlayer("GOI_EV_BRENO","GOI","Everton Brito","MEI",74,2),

makePlayer("GOI_DIEGO_GONCALVES","GOI","Diego Gonçalves","ATA",75,2.5),
makePlayer("GOI_NICOLAS","GOI","Nicolás","ATA",76,3),
makePlayer("GOI_MARCAO","GOI","Marcão","ATA",74,2),
makePlayer("GOI_PEDRO_RAUL","GOI","Pedro Raul","ATA",78,4.5),

// =====================
// NOVORIZONTINO – SÉRIE B 2025 (NOV)
// =====================
makePlayer("NOV_GIOVANNI","NOV","Giovanni","GOL",73,1.8),
makePlayer("NOV_GEORGE","NOV","George","GOL",72,1.2),

makePlayer("NOV_BRUNO_AGUIAR","NOV","Bruno Aguiar","ZAG",74,2),
makePlayer("NOV_RODOLFO_FILEMON","NOV","Rodolfo Filemon","ZAG",74,2),
makePlayer("NOV_LEO_BAIANO","NOV","Léo Baiano","ZAG",73,1.8),

makePlayer("NOV_REVERSON","NOV","Reverson","LE",73,1.8),
makePlayer("NOV_FELIPE_RODRIGUES","NOV","Felipe Rodrigues","LD",74,2),

makePlayer("NOV_GUSTAVO_BOCHECHA","NOV","Gustavo Bochecha","MEI",75,2.5),
makePlayer("NOV_RICARDINHO","NOV","Ricardinho","MEI",74,2),
makePlayer("NOV_ANDERSON_MEI","NOV","Anderson","MEI",73,1.8),

makePlayer("NOV_DOUGLAS_BAGGIO","NOV","Douglas Baggio","ATA",75,2.5),
makePlayer("NOV_AILON","NOV","Aylon","ATA",74,2),
makePlayer("NOV_QUERINO","NOV","Quirino","ATA",74,2),
makePlayer("NOV_HELIO_BORGES","NOV","Hélio Borges","ATA",74,2),
makePlayer("NOV_CLEO_SILVA","NOV","Cléo Silva","ATA",73,1.8),

// =====================
// CRB – SÉRIE B 2025 (CRB)
// =====================
makePlayer("CRB_DIogo_SILVA","CRB","Diogo Silva","GOL",73,1.8),
makePlayer("CRB_VICTOR_CAICARA","CRB","Victor Caicara","GOL",72,1.2),

makePlayer("CRB_GUM","CRB","Gum","ZAG",74,1.5),
makePlayer("CRB_FABIO_ALEMÃO","CRB","Fábio Alemão","ZAG",73,1.8),
makePlayer("CRB_SALES","CRB","Sales","ZAG",73,1.8),

makePlayer("CRB_GUILHERME_ROMAO","CRB","Guilherme Romão","LE",74,2),
makePlayer("CRB_RAUL_PRATA","CRB","Raul Prata","LD",74,2),

makePlayer("CRB_MARCOS_BAIA","CRB","Marcos Baía","VOL",74,2),
makePlayer("CRB_WESLEY","CRB","Wesley","VOL",74,2),
makePlayer("CRB_YAGO","CRB","Yago","VOL",73,1.8),

makePlayer("CRB_DIEGO_TORRES","CRB","Diego Torres","MEI",75,2.5),
makePlayer("CRB_RAFAEL_LONGUINE","CRB","Rafael Longuine","MEI",74,2),
makePlayer("CRB_JHON_CAFE","CRB","Jhon Cley","MEI",73,1.8),

makePlayer("CRB_ANSELMO_RAMON","CRB","Anselmo Ramon","ATA",76,2.8),
makePlayer("CRB_HYURI","CRB","Hyuri","ATA",74,2),
makePlayer("CRB_EMERSON_NEG","CRB","Emerson Negueba","ATA",74,2),
makePlayer("CRB_BRUNINHO_ATA","CRB","Bruninho","ATA",73,1.8),

// =====================
// AVAÍ – SÉRIE B 2025 (AVA)
// =====================
makePlayer("AVA_GLEDSON","AVA","Gledson","GOL",73,1.8),
makePlayer("AVA_GLÉSSON","AVA","Glégson","GOL",72,1.2),

makePlayer("AVA_BETAO","AVA","Betão","ZAG",73,1.2),
makePlayer("AVA_ALEMAO","AVA","Alemão","ZAG",74,2),
makePlayer("AVA_RAF_PEREIRA","AVA","Rafael Pereira","ZAG",73,1.8),

makePlayer("AVA_EDILSON","AVA","Edílson","LD",74,2),
makePlayer("AVA_RANIELE","AVA","Raniele","LE",74,2),

makePlayer("AVA_BRUNO_SILVA","AVA","Bruno Silva","VOL",75,2.5),
makePlayer("AVA_JEAN_CLEBER","AVA","Jean Cléber","VOL",74,2),
makePlayer("AVA_MARCOS_SERRATO","AVA","Marcos Serrato","VOL",73,1.8),

makePlayer("AVA_RENATO","AVA","Renato","MEI",75,2.5),
makePlayer("AVA_LOURENCO","AVA","Lourenço","MEI",74,2),
makePlayer("AVA_PEDRO_CASTRO","AVA","Pedro Castro","MEI",74,2),

makePlayer("AVA_BISSOLI","AVA","Bissoli","ATA",76,2.8),
makePlayer("AVA_WILLIAM_POTTKER","AVA","William Pottker","ATA",76,3),
makePlayer("AVA_GETULIO","AVA","Getúlio","ATA",74,2.2),
makePlayer("AVA_ROMULO","AVA","Rômulo","ATA",74,2),

// =====================
// CUIABÁ – SÉRIE B 2025 (CUI)
// =====================
makePlayer("CUI_WALTER","CUI","Walter","GOL",75,2.5),
makePlayer("CUI_JOAO_CARLOS","CUI","João Carlos","GOL",73,1.8),

makePlayer("CUI_PAULAO","CUI","Paulão","ZAG",75,2.5),
makePlayer("CUI_MARLLON","CUI","Marllon","ZAG",75,2.5),
makePlayer("CUI_ALAN_EMPERUR","CUI","Alan Empereur","ZAG",76,3),

makePlayer("CUI_UENDEL","CUI","Uendel","LE",75,2.5),
makePlayer("CUI_JOAO_LUCAS","CUI","João Lucas","LD",75,2.5),

makePlayer("CUI_LUCAS_MINEIRO","CUI","Lucas Mineiro","VOL",76,3),
makePlayer("CUI_AUREMIR","CUI","Auremir","VOL",74,2),
makePlayer("CUI_CAMILO_VOL","CUI","Camilo","VOL",75,2.5),

makePlayer("CUI_RAF_GAVA","CUI","Rafael Gava","MEI",75,2.5),
makePlayer("CUI_PEPE","CUI","Pepê","MEI",76,3),

makePlayer("CUI_DEYVERSON","CUI","Deyverson","ATA",77,3),
makePlayer("CUI_CLAYSON","CUI","Clayson","ATA",76,2.8),
makePlayer("CUI_JONATHAN_CAFU","CUI","Jonathan Cafú","ATA",75,2.5),
makePlayer("CUI_ANDRE_LUIS","CUI","André Luís","ATA",74,2),

// =====================
// ATLÉTICO-GO – SÉRIE B 2025 (ACG)
// =====================
makePlayer("ACG_RONALDO","ACG","Ronaldo","GOL",74,2),
makePlayer("ACG_LUAN_POLLI","ACG","Luan Polli","GOL",73,1.8),

makePlayer("ACG_EDSON","ACG","Edson","ZAG",74,2),
makePlayer("ACG_WANDERSON_ZAG","ACG","Wanderson","ZAG",74,2),
makePlayer("ACG_MARLON_FREITAS_ZAG","ACG","Marlon Freitas","ZAG",75,2.5),

makePlayer("ACG_DUDU","ACG","Dudu","LD",75,2.5),
makePlayer("ACG_JEFFERSON","ACG","Jefferson","LE",74,2),

makePlayer("ACG_BARALHAS","ACG","Baralhas","VOL",76,3),
makePlayer("ACG_MATHEUS_SALES","ACG","Matheus Sales","VOL",74,2.2),

makePlayer("ACG_SHAYLON","ACG","Shaylon","MEI",76,3),
makePlayer("ACG_RICKSON","ACG","Rickson","MEI",74,2),
makePlayer("ACG_ARTHUR_GOMES","ACG","Arthur Gomes","MEI",75,2.5),

makePlayer("ACG_LUIZ_FERNANDO","ACG","Luiz Fernando","ATA",76,3),
makePlayer("ACG_WELLINGTON_RATO","ACG","Wellington Rato","ATA",76,3),
makePlayer("ACG_AIRTON","ACG","Airton","ATA",74,2),
makePlayer("ACG_GABRIEL_BARROS","ACG","Gabriel Barros","ATA",73,1.8),

// =====================
// OPERÁRIO – SÉRIE B 2025 (OPE)
// =====================
makePlayer("OPE_RICARDO_VARELA","OPE","Ricardo Varela","GOL",73,1.8),
makePlayer("OPE_VANDERLEI","OPE","Vanderlei","GOL",72,1.2),

makePlayer("OPE_RICARDO_SILVA","OPE","Ricardo Silva","ZAG",74,2),
makePlayer("OPE_PHILIPE_SAMPAIO","OPE","Philipe Sampaio","ZAG",73,1.8),
makePlayer("OPE_RAFEL_CHAVES","OPE","Rafael Chaves","ZAG",73,1.8),

makePlayer("OPE_JEAN_CARLOS_LE","OPE","Jean Carlos","LE",73,1.8),
makePlayer("OPE_ARTHUR","OPE","Arthur","LD",73,1.8),

makePlayer("OPE_ANDRE_CUNHA","OPE","André Cunha","VOL",74,2),
makePlayer("OPE_HENRIQUE_VOL","OPE","Henrique","VOL",74,2),
makePlayer("OPE_MARCELO_SANTOS","OPE","Marcelo Santos","VOL",73,1.8),

makePlayer("OPE_RAFAEL_OIVEIRA","OPE","Rafael Oliveira","MEI",74,2),
makePlayer("OPE_THIAGO_POTIGUAR","OPE","Thiago Potiguar","MEI",73,1.8),

makePlayer("OPE_SCHMIDT","OPE","Schmidt","ATA",74,2),
makePlayer("OPE_RICARDINHO_ATA","OPE","Ricardinho","ATA",73,1.8),
makePlayer("OPE_FELIPE_AUGUSTO","OPE","Felipe Augusto","ATA",73,1.8),
makePlayer("OPE_WILLIAN","OPE","Willian","ATA",73,1.8),

// =====================
// VILA NOVA – SÉRIE B 2025 (VNO)
// =====================
makePlayer("VNO_DINIERE","VNO","Dinière","GOL",73,1.8),
makePlayer("VNO_GEORGE_GOL","VNO","George","GOL",72,1.2),

makePlayer("VNO_RAFEL_DONATO","VNO","Rafael Donato","ZAG",74,2),
makePlayer("VNO_ALAN_GRAFIte","VNO","Alan Grafite","ZAG",73,1.8),
makePlayer("VNO_ANDERSON_ZAG","VNO","Anderson","ZAG",73,1.8),

makePlayer("VNO_WILLIAN_FORMIGA","VNO","Willian Formiga","LE",74,2),
makePlayer("VNO_RAFINHA_LD","VNO","Rafinha","LD",73,1.8),

makePlayer("VNO_ARTHUR_REZENDE","VNO","Arthur Rezende","MEI",75,2.5),
makePlayer("VNO_RAFEL_LUCAS","VNO","Rafael Lucas","MEI",74,2),
makePlayer("VNO_LESIROM","VNO","Lescano","VOL",74,2),

makePlayer("VNO_NETO_PERSONA","VNO","Neto Pessoa","ATA",74,2),
makePlayer("VNO_PABLO_DYego","VNO","Pablo Dyego","ATA",73,1.8),
makePlayer("VNO_DANILO_GOMES","VNO","Danilo Gomes","ATA",73,1.8),
makePlayer("VNO_CLEITINHO","VNO","Cleitinho","ATA",73,1.8),

// =====================
// AMÉRICA-MG – SÉRIE B 2025 (AME)
// =====================
makePlayer("AME_CAVICHIOLI","AME","Cavichioli","GOL",75,2.5),
makePlayer("AME_MATHEUS_CAVICHIOLI","AME","Matheus Cavichioli","GOL",73,1.8),

makePlayer("AME_DANILO_AVELAR","AME","Danilo Avelar","ZAG",75,2.2),
makePlayer("AME_RICARDO_SILVA","AME","Ricardo Silva","ZAG",74,2),
makePlayer("AME_MARLON","AME","Marlon","LE",76,3),

makePlayer("AME_MATEUS_HENRIQUE","AME","Mateus Henrique","LD",73,1.8),

makePlayer("AME_ALÊ","AME","Alê","MEI",76,2.5),
makePlayer("AME_JUNINHO","AME","Juninho","VOL",76,3),
makePlayer("AME_MASTRIANI_VOL","AME","Mastriani","VOL",75,2.5),

makePlayer("AME_BENITEZ","AME","Benítez","MEI",77,3.5),
makePlayer("AME_GUSTAVINHO","AME","Gustavinho","MEI",75,2.5),
makePlayer("AME_PEDRINHO","AME","Pedrinho","MEI",75,2.5),

makePlayer("AME_ALOISIO","AME","Aloísio \"Boi Bandido\"","ATA",77,2.8),
makePlayer("AME_EVERALDO","AME","Everaldo","ATA",76,2.5),
makePlayer("AME_WELLINGTON_PAULISTA","AME","Wellington Paulista","ATA",75,2),
makePlayer("AME_INDIo","AME","Índio","ATA",74,2),

// =====================
// ATHLETIC – SÉRIE B 2025 (ATC)
// =====================
makePlayer("ATC_JOAO_FELIPE","ATC","João Felipe","GOL",73,1.8),
makePlayer("ATC_GABRIEL_GOL","ATC","Gabriel","GOL",72,1.2),

makePlayer("ATC_WESLEY_ZAG","ATC","Wesley","ZAG",73,1.8),
makePlayer("ATC_DOUGLAS_ZAG","ATC","Douglas","ZAG",73,1.8),
makePlayer("ATC_MATHEUS_ZAG","ATC","Matheus","ZAG",73,1.8),

makePlayer("ATC_GUILHERME_LE","ATC","Guilherme","LE",73,1.8),
makePlayer("ATC_RAFAEL_LD","ATC","Rafael","LD",73,1.8),

makePlayer("ATC_BIDU","ATC","Bidu","MEI",74,2),
makePlayer("ATC_GABRIEL_VIEIRA","ATC","Gabriel Vieira","MEI",74,2),
makePlayer("ATC_TOMAS","ATC","Tomás","VOL",73,1.8),

makePlayer("ATC_CARLOS_ALBERTO","ATC","Carlos Alberto","ATA",74,2),
makePlayer("ATC_LUCAS_COELHO","ATC","Lucas Coelho","ATA",73,1.8),
makePlayer("ATC_GUILHERME_ATA","ATC","Guilherme","ATA",73,1.8),
makePlayer("ATC_EMERSON","ATC","Emerson","ATA",73,1.8),

// =====================
// BOTAFOGO-SP – SÉRIE B 2025 (BFS)
// =====================
makePlayer("BFS_JOAO_CARLOS","BFS","João Carlos","GOL",74,2),
makePlayer("BFS_EMERSON_GOL","BFS","Emerson","GOL",72,1.2),

makePlayer("BFS_ROBSON","BFS","Robson","ZAG",74,2),
makePlayer("BFS_MATHEUS_COSTA","BFS","Matheus Costa","ZAG",74,2),
makePlayer("BFS_PATRICK_BREY","BFS","Patrick Brey","LE",74,2),
makePlayer("BFS_LUCAS_MENDES","BFS","Lucas Mendes","LD",74,2),

makePlayer("BFS_FILLIPPE_SOUTTO","BFS","Fillipe Soutto","VOL",74,2),
makePlayer("BFS_EDSON","BFS","Edson","VOL",74,2),

makePlayer("BFS_GUILHERME_MADRUGA","BFS","Guilherme Madruga","MEI",75,2.5),
makePlayer("BFS_RAFAEL_TAVARES","BFS","Rafael Tavares","MEI",74,2),
makePlayer("BFS_OSMAN","BFS","Osman","MEI",74,2),

makePlayer("BFS_GUSTAVO_HENRIQUE","BFS","Gustavo Henrique","ATA",75,2.5),
makePlayer("BFS_ROBINHO","BFS","Robinho","ATA",74,2),
makePlayer("BFS_LUCAS_DELGADO","BFS","Lucas Delgado","ATA",74,2),
makePlayer("BFS_Douglas_BAGGIO","BFS","Douglas Baggio","ATA",74,2),

// =====================
// FERROVIÁRIA – SÉRIE B 2025 (FER)
// =====================
makePlayer("FER_SAULO","FER","Saulo","GOL",73,1.8),
makePlayer("FER_PABLO_GOL","FER","Pablo","GOL",72,1.2),

makePlayer("FER_ANDERSON_ZAG","FER","Anderson","ZAG",73,1.8),
makePlayer("FER_RAFEL_MARTINS","FER","Rafael Martins","ZAG",73,1.8),
makePlayer("FER_DIEGO_IVO","FER","Diego Ivo","ZAG",73,1.8),

makePlayer("FER_ARRUDA","FER","Arruda","LE",73,1.8),
makePlayer("FER_CLAUDINHO_LD","FER","Claudinho","LD",73,1.8),

makePlayer("FER_MATHEUS_OLIVEIRA","FER","Matheus Oliveira","MEI",74,2),
makePlayer("FER_CLAYTON","FER","Clayton","MEI",74,2),
makePlayer("FER_COUTINHO","FER","Coutinho","VOL",73,1.8),

makePlayer("FER_BRUNO_SANTOS","FER","Bruno Santos","ATA",74,2),
makePlayer("FER_RAFAEL_MARQUES","FER","Rafael Marques","ATA",73,1.8),
makePlayer("FER_MARQUINHOS","FER","Marquinhos","ATA",73,1.8),
makePlayer("FER_TONY","FER","Tony","ATA",73,1.8),

// =====================
// AMAZONAS – SÉRIE B 2025 (AMZ)
// =====================
makePlayer("AMZ_JOAO_Paulo","AMZ","João Paulo","GOL",73,1.8),
makePlayer("AMZ_Matheus","AMZ","Matheus","GOL",72,1.2),

makePlayer("AMZ_DIEGO_LORENZI","AMZ","Diego Lorenzi","ZAG",73,1.8),
makePlayer("AMZ_LUIS_ROBERTO","AMZ","Luis Roberto","ZAG",73,1.8),
makePlayer("AMZ_WESLEY_ZAG","AMZ","Wesley","ZAG",73,1.8),

makePlayer("AMZ_JOAO_LUCAS","AMZ","João Lucas","LE",73,1.8),
makePlayer("AMZ_MIKAEL","AMZ","Mikael","LD",73,1.8),

makePlayer("AMZ_IGOR_MACHADO","AMZ","Igor Machado","VOL",74,2),
makePlayer("AMZ_MARCELO_PEREIRA","AMZ","Marcelo Pereira","VOL",73,1.8),
makePlayer("AMZ_RAPHAEL","AMZ","Raphael","MEI",74,2),
makePlayer("AMZ_MATHEUS_OLIVEIRA_MEI","AMZ","Matheus Oliveira","MEI",74,2),

makePlayer("AMZ_WANDERSON","AMZ","Wanderson","ATA",74,2),
makePlayer("AMZ_RONIEL","AMZ","Roniel","ATA",74,2),
makePlayer("AMZ_DAVID_BRAGA","AMZ","David Braga","ATA",73,1.8),
makePlayer("AMZ_JOAO_VICTOR","AMZ","João Victor","ATA",73,1.8),

// =====================
// VOLTA REDONDA – SÉRIE B 2025 (VRD)
// =====================
makePlayer("VRD_ANDRE","VRD","André","GOL",73,1.8),
makePlayer("VRD_JEFF","VRD","Jefferson","GOL",72,1.2),

makePlayer("VRD_WALLACE","VRD","Wallace","ZAG",73,1.8),
makePlayer("VRD_BRUNO_BARRA","VRD","Bruno Barra","ZAG",73,1.8),
makePlayer("VRD_MARCELO","VRD","Marcelo","ZAG",73,1.8),

makePlayer("VRD_JULINHO","VRD","Julinho","LE",73,1.8),
makePlayer("VRD_JOAO_CARLOS_LD","VRD","João Carlos","LD",73,1.8),

makePlayer("VRD_PEDRO_ANTONIO","VRD","Pedro Antônio","VOL",73,1.8),
makePlayer("VRD_BRUNO_CESAR","VRD","Bruno César","MEI",74,2),
makePlayer("VRD_LUCAS_SILVA","VRD","Lucas Silva","MEI",74,2),

makePlayer("VRD_CRISTIANO","VRD","Cristiano","ATA",74,2),
makePlayer("VRD_JHULIAN","VRD","Jhullian","ATA",73,1.8),
makePlayer("VRD_JOAO_MARcos","VRD","João Marcos","ATA",73,1.8),
makePlayer("VRD_PEDRO","VRD","Pedro","ATA",73,1.8),

// =====================
// PAYSANDU – SÉRIE B 2025 (PAY)
// =====================
makePlayer("PAY_MATHEUS_NOGUEIRA","PAY","Matheus Nogueira","GOL",73,1.8),
makePlayer("PAY_THIAGO_COELHO","PAY","Thiago Coelho","GOL",72,1.2),

makePlayer("PAY_GENILSON","PAY","Genilson","ZAG",73,1.8),
makePlayer("PAY_BRUNO_LEO","PAY","Bruno Leonardo","ZAG",73,1.8),
makePlayer("PAY_DIONATHAN","PAY","Dionathan","ZAG",73,1.8),

makePlayer("PAY_IGOR_MARQUES","PAY","Igor Marques","LE",73,1.8),
makePlayer("PAY_LUCAS_MAZETTI","PAY","Lucas Mazetti","LD",73,1.8),

makePlayer("PAY_MARCOS_ANTONIO","PAY","Marcos Antônio","VOL",73,1.8),
makePlayer("PAY_GEOVANE_MEI","PAY","Geovane","MEI",74,2),
makePlayer("PAY_RICARDINHO_MEI","PAY","Ricardinho","MEI",74,2),

makePlayer("PAY_MARCUS_VINICIUS","PAY","Marcus Vinícius","ATA",74,2),
makePlayer("PAY_MARCELO_TOSCANO","PAY","Marcelo Toscano","ATA",73,1.8),
makePlayer("PAY_THIAGO_SANTOS","PAY","Thiago Santos","ATA",73,1.8),
makePlayer("PAY_JOHN_CAFE","PAY","John Cley","ATA",73,1.8),

// =====================
// TOMBENSE – SÉRIE B 2025 (TOM)
// =====================
makePlayer("TOM_LUCAS_FRANCA","TOM","Lucas França","GOL",73,1.8),
makePlayer("TOM_FELIPE_GARCIA","TOM","Felipe Garcia","GOL",72,1.2),

makePlayer("TOM_ROGER_CARVALHO","TOM","Roger Carvalho","ZAG",73,1.8),
makePlayer("TOM_MANOEL","TOM","Manoel","ZAG",73,1.8),
makePlayer("TOM_WESLEY_MARANHAO","TOM","Wesley","ZAG",73,1.8),

makePlayer("TOM_GUILHERME_SANTOS","TOM","Guilherme Santos","LE",73,1.8),
makePlayer("TOM_EDILSON_LD","TOM","Edílson","LD",73,1.8),

makePlayer("TOM_ZE_RICARDO","TOM","Zé Ricardo","VOL",74,2),
makePlayer("TOM_IGOR_HENRIQUE","TOM","Igor Henrique","VOL",74,2),
makePlayer("TOM_RODRIGO","TOM","Rodrigo","MEI",74,2),
makePlayer("TOM_JEAN_LUCAS","TOM","Jean Lucas","MEI",74,2),

makePlayer("TOM_DANIEL_AMORIM","TOM","Daniel Amorim","ATA",75,2.5),
makePlayer("TOM_KEKE","TOM","Keké","ATA",74,2),
makePlayer("TOM_EV_GALDINO","TOM","Everton Galdino","ATA",74,2),
makePlayer("TOM_MARQUINHOS_ATA","TOM","Marquinhos","ATA",73,1.8),
];

// -------------------------------------------------------
// COMPETIÇÕES
// -------------------------------------------------------
const competitions = [
  {
    id: "BRA-A",
    name: "Campeonato Brasileiro Série A",
    type: "league",
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
    doubleRoundRobin: true
  },
  {
    id: "BRA-B",
    name: "Campeonato Brasileiro Série B",
    type: "league",
    pointsForWin: 3,
    pointsForDraw: 1,
    pointsForLoss: 0,
    doubleRoundRobin: true
  }
];

// -------------------------------------------------------
// HELPERS
// -------------------------------------------------------
function getTeamById(teamId) {
  return teams.find(t => t.id === teamId) || null;
}

function calcularValorPorOVR(ovr) {
  if (ovr >= 85) return 60;
  if (ovr >= 80) return 35;
  if (ovr >= 75) return 20;
  if (ovr >= 70) return 10;
  if (ovr >= 65) return 5;
  return 2;
}

// Gera elenco genérico só para times sem elenco real cadastrado
function gerarElencoPadrao(team) {
  const baseOVR = team.division === "A" ? 76 : 70;
  const positions = [
    "GOL",
    "ZAG", "ZAG",
    "LE", "LD",
    "VOL", "VOL",
    "MEI", "MEI",
    "ATA", "ATA",
    "ATA", "MEI", "VOL", "ZAG", "ATA", "MEI", "GOL"
  ];

  return positions.map((pos, idx) => {
    const ovr = baseOVR + (Math.floor(Math.random() * 7) - 3);
    return {
      id: `${team.id}_GEN_${idx + 1}`,
      teamId: team.id,
      name: `Jogador ${idx + 1}`,
      position: pos,
      overall: ovr,
      age: 20 + (idx % 10),
      morale: 75,
      value: calcularValorPorOVR(ovr),
      face: `assets/faces/${team.id}_GEN_${idx + 1}.png`
    };
  });
}

function carregarElencoDoTime(teamId) {
  const team = getTeamById(teamId);
  if (!team) return [];

  const elencoReal = players.filter(p => p.teamId === teamId);
  if (elencoReal.length > 0) return elencoReal;

  return gerarElencoPadrao(team);
}

// Expor globalmente
window.Database = {
  teams,
  players,
  competitions,
  getTeamById,
  carregarElencoDoTime
};
