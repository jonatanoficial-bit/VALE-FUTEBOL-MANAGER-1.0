// data/geo.js
// Minimal geo + address helpers (Stage 7A)
// This file is intentionally lightweight and offline-first.

window.CITY_GEO = {
  br_sp: {
    center: [-23.55052, -46.633308],
    districts: [
      { name: "Bela Vista", lat: -23.561, lng: -46.655, streets: ["Av. Paulista", "Rua Augusta", "Rua Frei Caneca"], refs: ["MASP", "Hospital Sírio-Libanês", "Consolação"] },
      { name: "Pinheiros", lat: -23.561, lng: -46.694, streets: ["Av. Rebouças", "Rua dos Pinheiros", "Av. Brigadeiro Faria Lima"], refs: ["Largo da Batata", "Estação Faria Lima", "Shopping Eldorado"] },
      { name: "Centro", lat: -23.545, lng: -46.637, streets: ["Av. Ipiranga", "Rua da Consolação", "Av. São João"], refs: ["Praça da República", "Theatro Municipal", "Vale do Anhangabaú"] },
    ],
  },
  br_rio: {
    center: [-22.906847, -43.172897],
    districts: [
      { name: "Centro", lat: -22.906, lng: -43.180, streets: ["Av. Presidente Vargas", "Rua do Ouvidor", "Av. Rio Branco"], refs: ["Cinelândia", "Praça Mauá", "Arcos da Lapa"] },
      { name: "Copacabana", lat: -22.971, lng: -43.182, streets: ["Av. Atlântica", "Rua Barata Ribeiro", "Rua Siqueira Campos"], refs: ["Posto 5", "Forte de Copacabana", "Praça Serzedelo"] },
    ],
  },
  br_df: {
    center: [-15.793889, -47.882778],
    districts: [
      { name: "Asa Sul", lat: -15.812, lng: -47.906, streets: ["Eixo W", "W3 Sul", "SQS 308"], refs: ["Parque da Cidade", "Rodoviária", "Esplanada"] },
      { name: "Asa Norte", lat: -15.762, lng: -47.879, streets: ["Eixo W", "W3 Norte", "SQN 210"], refs: ["UnB", "Setor Hospitalar Norte", "Brasília Shopping"] },
    ],
  },
  us_nyc: {
    center: [40.7128, -74.0060],
    districts: [
      { name: "Midtown", lat: 40.754, lng: -73.984, streets: ["5th Avenue", "7th Avenue", "Broadway"], refs: ["Bryant Park", "Times Square", "Grand Central"] },
      { name: "Lower Manhattan", lat: 40.707, lng: -74.011, streets: ["Wall Street", "Broadway", "Water Street"], refs: ["World Trade Center", "Battery Park", "Fulton Center"] },
    ],
  },
  us_lax: {
    center: [34.0522, -118.2437],
    districts: [
      { name: "Downtown", lat: 34.040, lng: -118.251, streets: ["S Figueroa St", "W 7th St", "N Main St"], refs: ["Crypto.com Arena", "Union Station", "Grand Park"] },
      { name: "Hollywood", lat: 34.101, lng: -118.326, streets: ["Hollywood Blvd", "Sunset Blvd", "Vine St"], refs: ["Walk of Fame", "TCL Chinese Theatre", "Hollywood Sign"] },
    ],
  },
  eu_ldn: {
    center: [51.5072, -0.1276],
    districts: [
      { name: "Westminster", lat: 51.499, lng: -0.126, streets: ["Whitehall", "Victoria St", "The Mall"], refs: ["Big Ben", "Trafalgar Square", "Buckingham Palace"] },
      { name: "City of London", lat: 51.514, lng: -0.089, streets: ["Bishopsgate", "Fleet St", "London Wall"], refs: ["St Paul's Cathedral", "Bank Station", "Tower of London"] },
    ],
  },
  fr_paris: {
    center: [48.8566, 2.3522],
    districts: [
      { name: "1er/2e", lat: 48.865, lng: 2.335, streets: ["Rue de Rivoli", "Boulevard des Capucines", "Rue Saint-Honoré"], refs: ["Louvre", "Opéra", "Palais Royal"] },
      { name: "7e", lat: 48.857, lng: 2.308, streets: ["Avenue de Suffren", "Rue Cler", "Boulevard Saint-Germain"], refs: ["Tour Eiffel", "Invalides", "Champ de Mars"] },
    ],
  },
  de_berlin: {
    center: [52.5200, 13.4050],
    districts: [
      { name: "Mitte", lat: 52.520, lng: 13.388, streets: ["Unter den Linden", "Friedrichstraße", "Invalidenstraße"], refs: ["Brandenburg Gate", "Alexanderplatz", "Berlin Hbf"] },
      { name: "Kreuzberg", lat: 52.498, lng: 13.403, streets: ["Mehringdamm", "Oranienstraße", "Kottbusser Damm"], refs: ["Checkpoint Charlie", "Görlitzer Park", "East Side Gallery"] },
    ],
  },
  it_rome: {
    center: [41.9028, 12.4964],
    districts: [
      { name: "Centro Storico", lat: 41.902, lng: 12.480, streets: ["Via del Corso", "Via Nazionale", "Via Veneto"], refs: ["Piazza Venezia", "Fontana di Trevi", "Piazza Navona"] },
      { name: "Trastevere", lat: 41.889, lng: 12.469, streets: ["Viale di Trastevere", "Via Garibaldi", "Piazza Santa Maria"], refs: ["Gianicolo", "Isola Tiberina", "Campo de' Fiori"] },
    ],
  },
  jp_tokyo: {
    center: [35.6762, 139.6503],
    districts: [
      { name: "Shinjuku", lat: 35.690, lng: 139.700, streets: ["Shinjuku-dori", "Meiji-dori", "Yasukuni-dori"], refs: ["Shinjuku Station", "Kabukicho", "Tokyo Metropolitan Gov"] },
      { name: "Chiyoda", lat: 35.693, lng: 139.752, streets: ["Sotobori-dori", "Yasukuni-dori", "Hibiya-dori"], refs: ["Tokyo Station", "Imperial Palace", "Akihabara"] },
    ],
  },
  ca_toronto: {
    center: [43.6532, -79.3832],
    districts: [
      { name: "Downtown", lat: 43.651, lng: -79.381, streets: ["Yonge St", "Queen St W", "Bay St"], refs: ["CN Tower", "Union Station", "Nathan Phillips Square"] },
      { name: "North York", lat: 43.770, lng: -79.413, streets: ["Sheppard Ave", "Finch Ave", "Bathurst St"], refs: ["North York Centre", "Yorkdale", "Downsview Park"] },
    ],
  },
};

window.pickIncidentLocation = function pickIncidentLocation(cityId) {
  const geo = window.CITY_GEO && window.CITY_GEO[cityId];
  if (!geo || !geo.districts || !geo.districts.length) {
    return { address: "Localização indisponível", district: "—", latlng: null };
  }
  const d = geo.districts[Math.floor(Math.random() * geo.districts.length)];
  const street = d.streets[Math.floor(Math.random() * d.streets.length)];
  const ref = d.refs[Math.floor(Math.random() * d.refs.length)];
  const num = 10 + Math.floor(Math.random() * 1900);

  const jitterLat = (Math.random() - 0.5) * 0.01;
  const jitterLng = (Math.random() - 0.5) * 0.01;
  const lat = d.lat + jitterLat;
  const lng = d.lng + jitterLng;

  return {
    district: d.name,
    address: `${street}, ${num} — ${d.name} (próx. ${ref})`,
    latlng: [lat, lng],
  };
};
