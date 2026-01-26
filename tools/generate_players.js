#!/usr/bin/env node
/**
 * Vale Futebol Manager 2026 - Players Generator
 * Gera /data/base_2025/players.json a partir de:
 * - football-data.org (Europa / competições cobertas)
 * - API-FOOTBALL (Brasil e muitas ligas) [recomendado se você quer Brasil real]
 *
 * Se um time não tiver mapeamento/API, gera elenco placeholder para não quebrar o jogo.
 *
 * Uso:
 *   node tools/generate_players.js --pack base_2025
 *
 * ENV:
 *   FOOTBALL_DATA_TOKEN=...
 *   APIFOOTBALL_KEY=...
 */

"use strict";

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const getArg = (k, def = null) => {
  const idx = args.indexOf(k);
  if (idx === -1) return def;
  return args[idx + 1] ?? def;
};

const PACK_ID = getArg("--pack", "base_2025");

// Paths do projeto
const ROOT = process.cwd();
const PACK_DIR = path.join(ROOT, "data", PACK_ID);
const MANIFEST_PATH = path.join(PACK_DIR, "manifest.json");
const CLUBS_PATH = path.join(PACK_DIR, "clubs.json");
const OUT_PLAYERS_PATH = path.join(PACK_DIR, "players.json");
const TEAM_MAP_PATH = path.join(PACK_DIR, "team_map.json");

function fail(msg) {
  console.error("❌", msg);
  process.exit(1);
}

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}
function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf-8");
}

function nowIso() {
  return new Date().toISOString();
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choose(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function slugify(s) {
  return String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// ===============================
// HTTP helper (Node 18+ tem fetch)
// ===============================
async function httpJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} em ${url} :: ${txt.slice(0, 200)}`);
  }
  return res.json();
}

// ===============================
// Providers
// ===============================
async function fetchSquadFootballData(teamId, token) {
  // football-data.org: Team resource possui squad
  // Docs: /v4/teams/{id} 2
  const url = `https://api.football-data.org/v4/teams/${teamId}`;
  const data = await httpJson(url, {
    headers: { "X-Auth-Token": token }
  });

  const squad = Array.isArray(data?.squad) ? data.squad : [];
  return squad.map((p) => ({
    name: p.name,
    pos: normalizePosFootballData(p.position),
    age: p.dateOfBirth ? calcAge(p.dateOfBirth) : null,
    nationality: p.nationality || null
  }));
}

function normalizePosFootballData(position) {
  // football-data.org costuma trazer: "Goalkeeper", "Defence", "Midfield", "Offence"
  const pos = String(position || "").toLowerCase();
  if (pos.includes("goal")) return "GK";
  if (pos.includes("def")) return "DEF";
  if (pos.includes("mid")) return "MID";
  if (pos.includes("off") || pos.includes("att") || pos.includes("forward")) return "ATT";
  return "MID";
}

async function fetchSquadApiFootball(teamId, season, key) {
  // API-FOOTBALL v3 tem endpoint squads (times/squads) na doc 3
  // Exemplo comum: /players/squads?team=XXX
  // Observação: alguns campos variam por plano/retorno.
  const url = `https://v3.football.api-sports.io/players/squads?team=${encodeURIComponent(teamId)}`;
  const data = await httpJson(url, {
    headers: {
      "x-apisports-key": key
    }
  });

  const responseArr = Array.isArray(data?.response) ? data.response : [];
  const teamBlock = responseArr[0] || {};
  const players = Array.isArray(teamBlock?.players) ? teamBlock.players : [];

  return players.map((p) => ({
    name: p.name,
    pos: normalizePosApiFootball(p.position),
    age: typeof p.age === "number" ? p.age : null,
    nationality: p.nationality || null
  }));
}

function normalizePosApiFootball(position) {
  // API-FOOTBALL costuma trazer: "Goalkeeper", "Defender", "Midfielder", "Attacker"
  const pos = String(position || "").toLowerCase();
  if (pos.includes("goal")) return "GK";
  if (pos.includes("def")) return "DEF";
  if (pos.includes("mid")) return "MID";
  if (pos.includes("att") || pos.includes("forw") || pos.includes("strik")) return "ATT";
  return "MID";
}

// ===============================
// Fallback squad (sempre gera algo)
// ===============================
function generateFallbackSquad(club, size = 25) {
  const base = typeof club.overall === "number" ? club.overall : 65;
  const firstNames = ["Joao","Pedro","Lucas","Mateus","Gabriel","Rafael","Bruno","Diego","Vitor","Caio","Renan","Andre","Thiago","Henrique","Arthur","Marcos","Felipe","Danilo","Gustavo","Leo"];
  const lastNames = ["Silva","Souza","Santos","Oliveira","Pereira","Lima","Costa","Ribeiro","Carvalho","Almeida","Gomes","Rocha","Martins","Barbosa","Ferreira","Mendes","Araujo","Cardoso","Teixeira","Moura"];

  const positions = [];
  // Distribuição típica
  positions.push(...Array.from({ length: 3 }, () => "GK"));
  positions.push(...Array.from({ length: 8 }, () => "DEF"));
  positions.push(...Array.from({ length: 9 }, () => "MID"));
  positions.push(...Array.from({ length: 5 }, () => "ATT"));

  // Ajusta tamanho
  while (positions.length < size) positions.push("MID");
  while (positions.length > size) positions.pop();

  return positions.map((pos, i) => {
    const age = randInt(17, 35);
    const ovr = Math.min(90, Math.max(50, base + randInt(-6, 8)));
    return {
      id: `${club.id}_gen_${i + 1}`,
      clubId: club.id,
      name: `${choose(firstNames)} ${choose(lastNames)}`,
      pos,
      age,
      overall: ovr,
      value: Math.round((ovr * 900000) * (age <= 23 ? 1.2 : 1.0)),
      nationality: club.country || null,
      source: "generated"
    };
  });
}

function calcAge(dobIso) {
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return null;
  const diff = Date.now() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

// ===============================
// Main
// ===============================
async function main() {
  if (!fs.existsSync(MANIFEST_PATH)) fail(`Manifest não encontrado: ${MANIFEST_PATH}`);
  if (!fs.existsSync(CLUBS_PATH)) fail(`clubs.json não encontrado: ${CLUBS_PATH}`);

  const clubsJson = readJson(CLUBS_PATH);
  const clubs = Array.isArray(clubsJson?.clubs) ? clubsJson.clubs : [];
  if (clubs.length === 0) fail("clubs.json está vazio. Preencha clubs antes.");

  const teamMap = readJson(TEAM_MAP_PATH) || { footballData: {}, apiFootball: {} };

  const FOOTBALL_DATA_TOKEN = process.env.FOOTBALL_DATA_TOKEN || "";
  const APIFOOTBALL_KEY = process.env.APIFOOTBALL_KEY || "";

  console.log("==================================================");
  console.log("VFM26 Players Generator");
  console.log("Pack:", PACK_ID);
  console.log("Clubs:", clubs.length);
  console.log("football-data token:", FOOTBALL_DATA_TOKEN ? "OK" : "NÃO");
  console.log("api-football key:", APIFOOTBALL_KEY ? "OK" : "NÃO");
  console.log("Team map:", fs.existsSync(TEAM_MAP_PATH) ? "OK" : "NÃO (será criado)");
  console.log("==================================================");

  // Cria team_map.json base se não existir
  if (!fs.existsSync(TEAM_MAP_PATH)) {
    const initialMap = { footballData: {}, apiFootball: {} };
    writeJson(TEAM_MAP_PATH, initialMap);
    console.log("📝 Criado:", TEAM_MAP_PATH);
    console.log("➡️ Edite team_map.json para mapear seus clubes para IDs das APIs (opcional, mas recomendado).");
  }

  const playersOut = [];
  const report = [];

  for (const club of clubs) {
    const clubId = club.id;
    let squad = [];
    let source = "generated";

    // Preferência: API-FOOTBALL para Brasil (e geral) se existir mapeamento + key
    const apiFootballTeamId = teamMap?.apiFootball?.[clubId];
    if (APIFOOTBALL_KEY && apiFootballTeamId) {
      try {
        squad = await fetchSquadApiFootball(apiFootballTeamId, "2025", APIFOOTBALL_KEY);
        source = "api-football";
      } catch (e) {
        console.warn(`⚠️ Falha API-FOOTBALL (${clubId}):`, e.message);
      }
    }

    // Fallback: football-data.org se existir mapeamento + token
    if (squad.length === 0) {
      const footballDataTeamId = teamMap?.footballData?.[clubId];
      if (FOOTBALL_DATA_TOKEN && footballDataTeamId) {
        try {
          squad = await fetchSquadFootballData(footballDataTeamId, FOOTBALL_DATA_TOKEN);
          source = "football-data";
        } catch (e) {
          console.warn(`⚠️ Falha football-data (${clubId}):`, e.message);
        }
      }
    }

    // Se não conseguiu real, gera placeholder (nunca quebra)
    if (squad.length === 0) {
      const gen = generateFallbackSquad(club, 25);
      playersOut.push(...gen);
      report.push({ clubId, clubName: club.name, players: gen.length, source: "generated" });
      continue;
    }

    // Converte squad real para nosso formato
    const base = typeof club.overall === "number" ? club.overall : 65;
    const normalized = squad
      .filter(p => p?.name)
      .slice(0, 35) // limite de segurança
      .map((p, idx) => {
        const age = typeof p.age === "number" ? p.age : randInt(18, 33);
        // overall estimado (porque APIs muitas vezes não dão overall)
        const ovr = Math.min(90, Math.max(50, base + randInt(-5, 7)));
        return {
          id: `${clubId}_${slugify(p.name)}_${idx + 1}`,
          clubId,
          name: p.name,
          pos: p.pos || "MID",
          age,
          overall: ovr,
          value: Math.round((ovr * 950000) * (age <= 23 ? 1.25 : 1.0)),
          nationality: p.nationality || club.country || null,
          source
        };
      });

    // Se veio muito curto, completa com gerados
    if (normalized.length < 18) {
      const extra = generateFallbackSquad(club, 25 - normalized.length);
      playersOut.push(...normalized, ...extra);
      report.push({ clubId, clubName: club.name, players: normalized.length + extra.length, source: `${source}+generated` });
    } else {
      playersOut.push(...normalized);
      report.push({ clubId, clubName: club.name, players: normalized.length, source });
    }

    // Pequeno delay para evitar rate limit
    await new Promise(r => setTimeout(r, 350));
  }

  const payload = {
    meta: {
      generatedAt: nowIso(),
      packId: PACK_ID,
      totalPlayers: playersOut.length,
      note: "Elencos via API quando possível; fallback gerado quando não houver mapeamento/cobertura."
    },
    players: playersOut,
    report
  };

  writeJson(OUT_PLAYERS_PATH, payload);
  console.log("✅ Gerado:", OUT_PLAYERS_PATH);
  console.log("Jogadores:", playersOut.length);
  console.log("Dica: veja report dentro do players.json para saber quais clubes vieram da API.");
}

main().catch((e) => {
  console.error("❌ Erro fatal:", e);
  process.exit(1);
});