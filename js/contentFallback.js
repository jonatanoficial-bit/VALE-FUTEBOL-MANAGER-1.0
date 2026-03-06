// Embedded fallback content (Fase 3)
// Used when running via file:// where fetch() may be blocked.
// Source of truth remains /data/*.json in deployments.

export const CITY_BY_ID = {
  "nova_aurora": {
    "id": "nova_aurora",
    "name": "Nova Aurora (Simulação)",
    "country": "BR",
    "center": {
      "lat": -23.55052,
      "lng": -46.633308
    },
    "zoom": 12,
    "bbox": {
      "minLat": -23.62,
      "minLng": -46.72,
      "maxLat": -23.49,
      "maxLng": -46.55
    },
    "bases": [
      {
        "id": "pol_base",
        "type": "police",
        "lat": -23.555,
        "lng": -46.64
      },
      {
        "id": "fire_base",
        "type": "fire",
        "lat": -23.545,
        "lng": -46.61
      },
      {
        "id": "med_base",
        "type": "medical",
        "lat": -23.56,
        "lng": -46.6
      }
    ]
  },
  "sao_paulo": {
    "id": "sao_paulo",
    "name": "São Paulo - SP",
    "country": "BR",
    "center": {
      "lat": -23.55052,
      "lng": -46.633308
    },
    "zoom": 11,
    "bbox": {
      "minLat": -23.75,
      "minLng": -46.83,
      "maxLat": -23.4,
      "maxLng": -46.36
    },
    "bases": [
      {
        "id": "pol_base",
        "type": "police",
        "lat": -23.548,
        "lng": -46.638
      },
      {
        "id": "fire_base",
        "type": "fire",
        "lat": -23.563,
        "lng": -46.655
      },
      {
        "id": "med_base",
        "type": "medical",
        "lat": -23.556,
        "lng": -46.625
      }
    ]
  },
  "rio_de_janeiro": {
    "id": "rio_de_janeiro",
    "name": "Rio de Janeiro - RJ",
    "country": "BR",
    "center": {
      "lat": -22.906847,
      "lng": -43.172897
    },
    "zoom": 12,
    "bbox": {
      "minLat": -23.08,
      "minLng": -43.8,
      "maxLat": -22.76,
      "maxLng": -43.1
    },
    "bases": [
      {
        "id": "pol_base",
        "type": "police",
        "lat": -22.912,
        "lng": -43.2
      },
      {
        "id": "fire_base",
        "type": "fire",
        "lat": -22.916,
        "lng": -43.17
      },
      {
        "id": "med_base",
        "type": "medical",
        "lat": -22.93,
        "lng": -43.22
      }
    ]
  },
  "brasilia": {
    "id": "brasilia",
    "name": "Brasília - DF",
    "country": "BR",
    "center": {
      "lat": -15.793889,
      "lng": -47.882778
    },
    "zoom": 12,
    "bbox": {
      "minLat": -15.9,
      "minLng": -48.1,
      "maxLat": -15.68,
      "maxLng": -47.7
    },
    "bases": [
      {
        "id": "pol_base",
        "type": "police",
        "lat": -15.793,
        "lng": -47.88
      },
      {
        "id": "fire_base",
        "type": "fire",
        "lat": -15.803,
        "lng": -47.87
      },
      {
        "id": "med_base",
        "type": "medical",
        "lat": -15.78,
        "lng": -47.9
      }
    ]
  },
  "new_york": {
    "id": "new_york",
    "name": "New York City - USA",
    "country": "US",
    "center": {
      "lat": 40.7128,
      "lng": -74.006
    },
    "zoom": 12,
    "bbox": {
      "minLat": 40.55,
      "minLng": -74.25,
      "maxLat": 40.92,
      "maxLng": -73.7
    },
    "bases": [
      {
        "id": "pol_base",
        "type": "police",
        "lat": 40.73,
        "lng": -73.995
      },
      {
        "id": "fire_base",
        "type": "fire",
        "lat": 40.711,
        "lng": -74.012
      },
      {
        "id": "med_base",
        "type": "medical",
        "lat": 40.741,
        "lng": -73.975
      }
    ]
  },
  "london": {
    "id": "london",
    "name": "London - UK",
    "country": "UK",
    "center": {
      "lat": 51.5072,
      "lng": -0.1276
    },
    "zoom": 12,
    "bbox": {
      "minLat": 51.35,
      "minLng": -0.45,
      "maxLat": 51.7,
      "maxLng": 0.2
    },
    "bases": [
      {
        "id": "pol_base",
        "type": "police",
        "lat": 51.515,
        "lng": -0.1
      },
      {
        "id": "fire_base",
        "type": "fire",
        "lat": 51.507,
        "lng": -0.09
      },
      {
        "id": "med_base",
        "type": "medical",
        "lat": 51.501,
        "lng": -0.12
      }
    ]
  }
};

export const CITIES_INDEX = {
  "cities": [
    {
      "id": "nova_aurora",
      "name": "Nova Aurora (Simulação)",
      "country": "BR"
    },
    {
      "id": "sao_paulo",
      "name": "São Paulo - SP",
      "country": "BR"
    },
    {
      "id": "rio_de_janeiro",
      "name": "Rio de Janeiro - RJ",
      "country": "BR"
    },
    {
      "id": "brasilia",
      "name": "Brasília - DF",
      "country": "BR"
    },
    {
      "id": "new_york",
      "name": "New York City - USA",
      "country": "US"
    },
    {
      "id": "london",
      "name": "London - UK",
      "country": "UK"
    }
  ]
};

export const PHASE2_CALLS = {
  "calls": [
    {
      "id": "br_fire_kitchen_01",
      "region": "BR",
      "number": "193",
      "service": "FIRE",
      "type": "fire",
      "severity": "high",
      "opening": "193, Bombeiros. Qual sua emergência? Tem fumaça saindo da cozinha do apartamento do meu vizinho! O alarme disparou e eu estou no corredor.",
      "script": {
        "address": "Bloco B, Apto 204, Condomínio Aurora",
        "details": "Cheiro forte de gás e fumaça; porta quente; possível fogo em cozinha",
        "victims": "Possível pessoa dentro (não respondeu)",
        "instructions_ok": "Orientei evacuar e não abrir a porta quente. Mantiveram distância e avisaram outros moradores.",
        "instructions_bad": "Orientei abrir a porta para 'confirmar o fogo' e houve explosão de fumaça."
      },
      "events": [
        {
          "at": 18,
          "text": "O alarme ficou mais forte e a fumaça aumentou no corredor."
        },
        {
          "at": 36,
          "text": "Você ouve estalos; parece que o fogo está se espalhando."
        }
      ]
    },
    {
      "id": "us_med_choking_01",
      "region": "US",
      "number": "911",
      "service": "MED",
      "type": "medical",
      "severity": "high",
      "opening": "911, what's your emergency? My dad is choking! He can't breathe and he's turning red!",
      "script": {
        "address": "1418 Pine Street",
        "details": "Engasgo com alimento; tosse fraca; dificuldade para falar",
        "victims": "1 adulto",
        "instructions_ok": "Orientei golpes nas costas e manobras abdominais; melhorou até a chegada.",
        "instructions_bad": "Orientei dar água e deitar; piorou e perdeu consciência."
      },
      "events": [
        {
          "at": 25,
          "text": "A tosse ficou mais fraca. Ele está ficando pálido."
        }
      ]
    },
    {
      "id": "eu_pol_robbery_01",
      "region": "EU",
      "number": "112",
      "service": "POL",
      "type": "police",
      "severity": "high",
      "opening": "112, emergência. Tem um assalto acontecendo aqui na loja! Eu tô escondido atrás do balcão... ele tem uma arma!",
      "script": {
        "address": "Rua Central, 55 (Loja de Conveniência)",
        "details": "Suspeito armado; ameaça clientes; possível refém",
        "victims": "3 pessoas no local",
        "instructions_ok": "Orientei ficar escondido, silêncio e manter distância; descreveu suspeito e direção.",
        "instructions_bad": "Orientei confrontar o suspeito; ele reagiu e feriu um cliente."
      },
      "events": [
        {
          "at": 20,
          "text": "O suspeito gritou e começou a exigir dinheiro com mais agressividade."
        },
        {
          "at": 45,
          "text": "Parece que ele está indo para a porta. Pode fugir."
        }
      ]
    },
    {
      "id": "br_prank_01",
      "region": "BR",
      "number": "190",
      "service": "POL",
      "type": "prank",
      "severity": "low",
      "opening": "Alô... tem um dinossauro na minha rua! Ele tá comendo meu cachorro!",
      "script": {
        "address": "",
        "details": "Inconsistências; provável trote",
        "victims": "",
        "instructions_ok": "Identifiquei sinais de trote, encerrei e registrei como improcedente.",
        "instructions_bad": "Enviei viatura sem confirmar; desperdício de recurso."
      },
      "events": [
        {
          "at": 15,
          "text": "Você escuta risadas ao fundo e a pessoa muda a história."
        }
      ]
    }
  ]
};
