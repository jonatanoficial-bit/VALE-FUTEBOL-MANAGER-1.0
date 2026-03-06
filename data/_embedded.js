/* Auto-generated embedded data fallback. */
export const EMBEDDED_DATA = {
  "cities": [
    {
      "id": "sp",
      "name": "São Paulo",
      "country": "Brazil",
      "region": "São Paulo",
      "emergencyNumbers": {
        "police": "190",
        "fire": "193"
      },
      "timezone": "America/Sao_Paulo",
      "tags": [
        "br",
        "metro"
      ]
    },
    {
      "id": "nyc",
      "name": "New York City",
      "country": "USA",
      "region": "New York",
      "emergencyNumbers": {
        "police": "911",
        "fire": "911"
      },
      "timezone": "America/New_York",
      "tags": [
        "us",
        "metro"
      ]
    },
    {
      "id": "london",
      "name": "London",
      "country": "United Kingdom",
      "region": "England",
      "emergencyNumbers": {
        "police": "999",
        "fire": "999"
      },
      "timezone": "Europe/London",
      "tags": [
        "eu",
        "metro"
      ]
    },
    {
      "id": "generic_br",
      "name": "Genérico BR",
      "country": "Brazil",
      "region": "Genérico",
      "emergencyNumbers": {
        "police": "190",
        "fire": "193"
      },
      "timezone": "America/Sao_Paulo",
      "tags": [
        "br"
      ]
    },
    {
      "id": "generic_us",
      "name": "Generic US",
      "country": "USA",
      "region": "Generic",
      "emergencyNumbers": {
        "police": "911",
        "fire": "911"
      },
      "timezone": "America/Chicago",
      "tags": [
        "us"
      ]
    },
    {
      "id": "generic_eu",
      "name": "Genérico EU",
      "country": "EU",
      "region": "Generic",
      "emergencyNumbers": {
        "police": "112",
        "fire": "112"
      },
      "timezone": "Europe/Brussels",
      "tags": [
        "eu"
      ]
    }
  ],
  "units": [
    {
      "unitId": "pm_area",
      "name": "PM Área",
      "agency": "police",
      "region": [
        "sp",
        "generic_br"
      ],
      "role": "patrol",
      "capabilityTags": [
        "patrol"
      ],
      "cooldownSec": 60,
      "availabilityRules": {}
    },
    {
      "unitId": "rota",
      "name": "ROTA",
      "agency": "police",
      "region": [
        "sp",
        "generic_br"
      ],
      "role": "swat",
      "capabilityTags": [
        "tactical"
      ],
      "cooldownSec": 120,
      "availabilityRules": {}
    },
    {
      "unitId": "gate",
      "name": "GATE",
      "agency": "police",
      "region": [
        "sp",
        "generic_br"
      ],
      "role": "special_ops",
      "capabilityTags": [
        "hostage",
        "negotiation"
      ],
      "cooldownSec": 180,
      "availabilityRules": {}
    },
    {
      "unitId": "aguia",
      "name": "Águia",
      "agency": "police",
      "region": [
        "sp",
        "generic_br"
      ],
      "role": "air_support",
      "capabilityTags": [
        "air_support"
      ],
      "cooldownSec": 300,
      "availabilityRules": {}
    },
    {
      "unitId": "choque",
      "name": "Choque",
      "agency": "police",
      "region": [
        "sp",
        "generic_br"
      ],
      "role": "riot_control",
      "capabilityTags": [
        "riot",
        "crowd"
      ],
      "cooldownSec": 150,
      "availabilityRules": {}
    },
    {
      "unitId": "ab",
      "name": "Auto Bomba",
      "agency": "fire",
      "region": [
        "sp",
        "generic_br"
      ],
      "role": "fire_engine",
      "capabilityTags": [
        "firefighting"
      ],
      "cooldownSec": 180,
      "availabilityRules": {}
    },
    {
      "unitId": "ur",
      "name": "Unidade de Resgate",
      "agency": "fire",
      "region": [
        "sp",
        "generic_br"
      ],
      "role": "ambulance",
      "capabilityTags": [
        "medical"
      ],
      "cooldownSec": 180,
      "availabilityRules": {}
    },
    {
      "unitId": "usa",
      "name": "Suporte Avançado",
      "agency": "fire",
      "region": [
        "sp",
        "generic_br"
      ],
      "role": "ambulance_advanced",
      "capabilityTags": [
        "medical",
        "advanced"
      ],
      "cooldownSec": 240,
      "availabilityRules": {}
    },
    {
      "unitId": "hazmat_br",
      "name": "HazMat BR",
      "agency": "fire",
      "region": [
        "sp",
        "generic_br"
      ],
      "role": "hazmat",
      "capabilityTags": [
        "hazardous"
      ],
      "cooldownSec": 300,
      "availabilityRules": {}
    },
    {
      "unitId": "us_patrol",
      "name": "Patrol Unit",
      "agency": "police",
      "region": [
        "nyc",
        "generic_us"
      ],
      "role": "patrol",
      "capabilityTags": [
        "patrol"
      ],
      "cooldownSec": 60,
      "availabilityRules": {}
    },
    {
      "unitId": "swat_us",
      "name": "SWAT",
      "agency": "police",
      "region": [
        "nyc",
        "generic_us"
      ],
      "role": "swat",
      "capabilityTags": [
        "tactical"
      ],
      "cooldownSec": 180,
      "availabilityRules": {}
    },
    {
      "unitId": "bomb_squad_us",
      "name": "Bomb Squad",
      "agency": "police",
      "region": [
        "nyc",
        "generic_us"
      ],
      "role": "bomb_squad",
      "capabilityTags": [
        "explosive"
      ],
      "cooldownSec": 240,
      "availabilityRules": {}
    },
    {
      "unitId": "air_us",
      "name": "Air Support US",
      "agency": "police",
      "region": [
        "nyc",
        "generic_us"
      ],
      "role": "air_support",
      "capabilityTags": [
        "air_support"
      ],
      "cooldownSec": 300,
      "availabilityRules": {}
    },
    {
      "unitId": "engine_us",
      "name": "Fire Engine US",
      "agency": "fire",
      "region": [
        "nyc",
        "generic_us"
      ],
      "role": "fire_engine",
      "capabilityTags": [
        "firefighting"
      ],
      "cooldownSec": 180,
      "availabilityRules": {}
    },
    {
      "unitId": "ambulance_us",
      "name": "Ambulance US",
      "agency": "fire",
      "region": [
        "nyc",
        "generic_us"
      ],
      "role": "ambulance",
      "capabilityTags": [
        "medical"
      ],
      "cooldownSec": 180,
      "availabilityRules": {}
    },
    {
      "unitId": "hazmat_us",
      "name": "HazMat US",
      "agency": "fire",
      "region": [
        "nyc",
        "generic_us"
      ],
      "role": "hazmat",
      "capabilityTags": [
        "hazardous"
      ],
      "cooldownSec": 300,
      "availabilityRules": {}
    },
    {
      "unitId": "eu_patrol",
      "name": "Patrol EU",
      "agency": "police",
      "region": [
        "london",
        "generic_eu"
      ],
      "role": "patrol",
      "capabilityTags": [
        "patrol"
      ],
      "cooldownSec": 60,
      "availabilityRules": {}
    },
    {
      "unitId": "eu_special",
      "name": "Special Response EU",
      "agency": "police",
      "region": [
        "london",
        "generic_eu"
      ],
      "role": "swat",
      "capabilityTags": [
        "tactical"
      ],
      "cooldownSec": 180,
      "availabilityRules": {}
    },
    {
      "unitId": "eu_air",
      "name": "Air Unit EU",
      "agency": "police",
      "region": [
        "london",
        "generic_eu"
      ],
      "role": "air_support",
      "capabilityTags": [
        "air_support"
      ],
      "cooldownSec": 300,
      "availabilityRules": {}
    },
    {
      "unitId": "eu_fire",
      "name": "Fire EU",
      "agency": "fire",
      "region": [
        "london",
        "generic_eu"
      ],
      "role": "fire_engine",
      "capabilityTags": [
        "firefighting"
      ],
      "cooldownSec": 180,
      "availabilityRules": {}
    },
    {
      "unitId": "eu_ambulance",
      "name": "Ambulance EU",
      "agency": "fire",
      "region": [
        "london",
        "generic_eu"
      ],
      "role": "ambulance",
      "capabilityTags": [
        "medical"
      ],
      "cooldownSec": 180,
      "availabilityRules": {}
    }
  ],
  "cases": [
    {
      "caseId": "br1",
      "agency": "police",
      "regionTags": [
        "br"
      ],
      "title": "Assalto a mão armada",
      "introCallerLine": "Alô, eu estou na padaria e estão nos assaltando!",
      "baseSeverity": "high",
      "protocol": {
        "requiredQuestions": [
          "addr",
          "desc",
          "risk"
        ],
        "questions": [
          {
            "id": "addr",
            "prompt": "Qual é o endereço da ocorrência?",
            "response": "É na Rua das Flores, 123, Vila Mariana.",
            "addsFacts": {
              "location": "Rua das Flores, 123"
            },
            "scoreImpact": 0,
            "timeCostSec": 5
          },
          {
            "id": "desc",
            "prompt": "O que está acontecendo?",
            "response": "Dois homens armados estão roubando o caixa.",
            "addsFacts": {
              "armed": true
            },
            "scoreImpact": 0,
            "timeCostSec": 5
          },
          {
            "id": "risk",
            "prompt": "Há feridos ou reféns?",
            "response": "Não há feridos, mas eles estão ameaçando as pessoas.",
            "addsFacts": {
              "victims": false
            },
            "scoreImpact": 0,
            "timeCostSec": 5
          },
          {
            "id": "status",
            "prompt": "Os suspeitos ainda estão no local?",
            "response": "Sim, estão saindo agora!",
            "addsFacts": {
              "suspectsLeaving": true
            },
            "scoreImpact": 0,
            "timeCostSec": 5
          }
        ]
      },
      "dispatch": {
        "correctRoles": [
          "patrol",
          "swat",
          "air_support"
        ],
        "alternativeRoles": [
          "patrol"
        ]
      },
      "outcomes": {
        "success": {
          "text": "Suspeitos detidos sem feridos.",
          "scoreDeltas": {
            "points": 10,
            "xp": 20
          }
        },
        "partial": {
          "text": "Suspeitos fugiram com o dinheiro.",
          "scoreDeltas": {
            "points": 5,
            "xp": 10
          }
        },
        "fail": {
          "text": "Os suspeitos se feriram e escaparam.",
          "scoreDeltas": {
            "points": -5,
            "xp": 0
          }
        }
      },
      "fairness": {
        "maxSpawnWeight": 5,
        "minSpawnCooldown": 60,
        "rarity": 1
      }
    },
    {
      "caseId": "br2",
      "agency": "fire",
      "regionTags": [
        "br"
      ],
      "title": "Incêndio em apartamento",
      "introCallerLine": "Socorro! Um incêndio começou no meu apartamento!",
      "baseSeverity": "high",
      "protocol": {
        "requiredQuestions": [
          "addr",
          "people",
          "desc"
        ],
        "questions": [
          {
            "id": "addr",
            "prompt": "Qual é o endereço do incêndio?",
            "response": "Avenida Paulista, 999, apartamento 12B.",
            "addsFacts": {
              "location": "Avenida Paulista, 999"
            },
            "scoreImpact": 0,
            "timeCostSec": 5
          },
          {
            "id": "people",
            "prompt": "Há pessoas presas ou feridas?",
            "response": "Meu marido está preso no quarto!",
            "addsFacts": {
              "victim": true
            },
            "scoreImpact": 0,
            "timeCostSec": 5
          },
          {
            "id": "desc",
            "prompt": "Você sabe o que causou o incêndio?",
            "response": "Uma panela pegou fogo e as chamas se espalharam.",
            "addsFacts": {
              "cause": "cooking"
            },
            "scoreImpact": 0,
            "timeCostSec": 5
          }
        ]
      },
      "dispatch": {
        "correctRoles": [
          "fire_engine",
          "ambulance"
        ],
        "alternativeRoles": [
          "fire_engine"
        ]
      },
      "outcomes": {
        "success": {
          "text": "Incêndio controlado e vítimas resgatadas.",
          "scoreDeltas": {
            "points": 12,
            "xp": 20
          }
        },
        "partial": {
          "text": "Incêndio extinto mas vítimas feridas.",
          "scoreDeltas": {
            "points": 6,
            "xp": 10
          }
        },
        "fail": {
          "text": "O edifício foi perdido e houve fatalidades.",
          "scoreDeltas": {
            "points": -8,
            "xp": 0
          }
        }
      },
      "fairness": {
        "maxSpawnWeight": 4,
        "minSpawnCooldown": 90,
        "rarity": 1
      }
    },
    {
      "caseId": "br3",
      "agency": "police",
      "regionTags": [
        "br"
      ],
      "title": "Trote: Dinossauro no quintal",
      "introCallerLine": "Tem um dinossauro no meu quintal!",
      "baseSeverity": "prank",
      "protocol": {
        "requiredQuestions": [
          "addr",
          "desc"
        ],
        "questions": [
          {
            "id": "addr",
            "prompt": "Qual é o endereço?",
            "response": "Rua Imaginária, 0.",
            "addsFacts": {},
            "scoreImpact": 0,
            "timeCostSec": 3
          },
          {
            "id": "desc",
            "prompt": "Qual é a situação?",
            "response": "Um dinossauro gigante está comendo minhas plantas.",
            "addsFacts": {},
            "scoreImpact": 0,
            "timeCostSec": 3
          }
        ]
      },
      "dispatch": {
        "correctRoles": [],
        "alternativeRoles": []
      },
      "outcomes": {
        "success": {
          "text": "Você identificou o trote e não despachou unidades.",
          "scoreDeltas": {
            "points": 5,
            "xp": 5
          }
        },
        "partial": {
          "text": "Você demorou muito para encerrar o trote.",
          "scoreDeltas": {
            "points": 2,
            "xp": 2
          }
        },
        "fail": {
          "text": "Você despachou unidades em um trote.",
          "scoreDeltas": {
            "points": -5,
            "xp": 0
          }
        }
      },
      "fairness": {
        "maxSpawnWeight": 2,
        "minSpawnCooldown": 120,
        "rarity": 2
      }
    },
    {
      "caseId": "us1",
      "agency": "police",
      "regionTags": [
        "us"
      ],
      "title": "Home invasion",
      "introCallerLine": "There's someone breaking into my house!",
      "baseSeverity": "high",
      "protocol": {
        "requiredQuestions": [
          "addr",
          "desc",
          "risk"
        ],
        "questions": [
          {
            "id": "addr",
            "prompt": "What is the address of the emergency?",
            "response": "123 Main Street, Apartment 2B.",
            "addsFacts": {
              "location": "123 Main Street"
            },
            "scoreImpact": 0,
            "timeCostSec": 5
          },
          {
            "id": "desc",
            "prompt": "Tell me exactly what's happening?",
            "response": "I hear glass breaking and footsteps downstairs.",
            "addsFacts": {
              "suspectInside": true
            },
            "scoreImpact": 0,
            "timeCostSec": 5
          },
          {
            "id": "risk",
            "prompt": "Is anyone hurt?",
            "response": "No, I'm hiding in my bedroom.",
            "addsFacts": {
              "victim": false
            },
            "scoreImpact": 0,
            "timeCostSec": 5
          }
        ]
      },
      "dispatch": {
        "correctRoles": [
          "patrol",
          "swat"
        ],
        "alternativeRoles": [
          "patrol"
        ]
      },
      "outcomes": {
        "success": {
          "text": "Suspect arrested without injury.",
          "scoreDeltas": {
            "points": 10,
            "xp": 20
          }
        },
        "partial": {
          "text": "Suspect fled before officers arrived.",
          "scoreDeltas": {
            "points": 5,
            "xp": 10
          }
        },
        "fail": {
          "text": "Victim harmed; suspect escaped.",
          "scoreDeltas": {
            "points": -5,
            "xp": 0
          }
        }
      },
      "fairness": {
        "maxSpawnWeight": 4,
        "minSpawnCooldown": 60,
        "rarity": 1
      }
    },
    {
      "caseId": "us2",
      "agency": "fire",
      "regionTags": [
        "us"
      ],
      "title": "Vehicle accident with injuries",
      "introCallerLine": "There's been a car accident on the highway!",
      "baseSeverity": "medium",
      "protocol": {
        "requiredQuestions": [
          "addr",
          "injuries",
          "hazard"
        ],
        "questions": [
          {
            "id": "addr",
            "prompt": "Where is the accident located?",
            "response": "I'm on Highway 50 near mile marker 14.",
            "addsFacts": {
              "location": "Highway 50, MM14"
            },
            "scoreImpact": 0,
            "timeCostSec": 5
          },
          {
            "id": "injuries",
            "prompt": "Is anyone injured?",
            "response": "Yes, a driver is unconscious and bleeding.",
            "addsFacts": {
              "injuries": true
            },
            "scoreImpact": 0,
            "timeCostSec": 5
          },
          {
            "id": "hazard",
            "prompt": "Is there fire or smoke?",
            "response": "I see smoke coming from the engine.",
            "addsFacts": {
              "fire": true
            },
            "scoreImpact": 0,
            "timeCostSec": 5
          }
        ]
      },
      "dispatch": {
        "correctRoles": [
          "fire_engine",
          "ambulance",
          "hazmat"
        ],
        "alternativeRoles": [
          "fire_engine",
          "ambulance"
        ]
      },
      "outcomes": {
        "success": {
          "text": "Vítimas socorridas e incêndio controlado.",
          "scoreDeltas": {
            "points": 8,
            "xp": 15
          }
        },
        "partial": {
          "text": "Vítimas socorridas, mas o incêndio se espalhou.",
          "scoreDeltas": {
            "points": 4,
            "xp": 8
          }
        },
        "fail": {
          "text": "Resgate falhou e houve explosão.",
          "scoreDeltas": {
            "points": -6,
            "xp": 0
          }
        }
      },
      "fairness": {
        "maxSpawnWeight": 3,
        "minSpawnCooldown": 90,
        "rarity": 1
      }
    },
    {
      "caseId": "eu1",
      "agency": "police",
      "regionTags": [
        "eu"
      ],
      "title": "Assalto a banco em andamento",
      "introCallerLine": "Hello, there's a bank robbery in progress!",
      "baseSeverity": "high",
      "protocol": {
        "requiredQuestions": [
          "addr",
          "desc",
          "hostages"
        ],
        "questions": [
          {
            "id": "addr",
            "prompt": "What's the address of the bank?",
            "response": "221B Baker Street, London.",
            "addsFacts": {
              "location": "221B Baker Street"
            },
            "scoreImpact": 0,
            "timeCostSec": 5
          },
          {
            "id": "desc",
            "prompt": "What is happening exactly?",
            "response": "Four masked men with guns are robbing the bank.",
            "addsFacts": {
              "armed": true
            },
            "scoreImpact": 0,
            "timeCostSec": 5
          },
          {
            "id": "hostages",
            "prompt": "Are there any hostages?",
            "response": "Yes, several customers are being held.",
            "addsFacts": {
              "hostages": true
            },
            "scoreImpact": 0,
            "timeCostSec": 5
          }
        ]
      },
      "dispatch": {
        "correctRoles": [
          "patrol",
          "swat",
          "air_support"
        ],
        "alternativeRoles": [
          "patrol"
        ]
      },
      "outcomes": {
        "success": {
          "text": "Robbers apprehended and hostages freed.",
          "scoreDeltas": {
            "points": 12,
            "xp": 20
          }
        },
        "partial": {
          "text": "Robbers fled with some money, hostages safe.",
          "scoreDeltas": {
            "points": 6,
            "xp": 10
          }
        },
        "fail": {
          "text": "Hostages injured, robbers escaped.",
          "scoreDeltas": {
            "points": -8,
            "xp": 0
          }
        }
      },
      "fairness": {
        "maxSpawnWeight": 3,
        "minSpawnCooldown": 60,
        "rarity": 1
      }
    }
  ],
  "localization": {
    "pt-BR": {
      "turn": "Turno",
      "time": "Tempo",
      "points": "Pontos",
      "calls": "Chamadas",
      "rank": "Rank",
      "call_queue": "Fila de Chamadas",
      "no_active_call": "Nenhuma chamada ativa",
      "select_call": "Selecione uma chamada na fila para começar.",
      "ask_question": "Perguntar",
      "dispatch": "Despachar",
      "dispatch_units": "Despacho de Unidades",
      "call_report": "Relatório da Chamada",
      "result": "Resultado",
      "units": "Unidades",
      "prank_end": "Trote encerrado corretamente."
    },
    "en-US": {
      "turn": "Turn",
      "time": "Time",
      "points": "Points",
      "calls": "Calls",
      "rank": "Rank",
      "call_queue": "Call Queue",
      "no_active_call": "No active call",
      "select_call": "Select a call from the queue to start.",
      "ask_question": "Ask",
      "dispatch": "Dispatch",
      "dispatch_units": "Dispatch Units",
      "call_report": "Call Report",
      "result": "Outcome",
      "units": "Units",
      "prank_end": "Prank ended correctly."
    }
  },
  "audio": {},
  "backgrounds": {
    "generic": "central_generic.png",
    "br": "central_br.png",
    "us": "central_us.png",
    "eu": "central_eu.png",
    "map": "map_grid.png",
    "alert": "alert_screen.png"
  }
};
export default EMBEDDED_DATA;
