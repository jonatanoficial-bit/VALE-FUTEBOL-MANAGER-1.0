/*
 * Validator for data schemas. Performs basic checks on the loaded
 * JSON data and returns an object with an `ok` boolean and
 * `errorMessage` if there are problems. The intent is to catch
 * missing fields early and display a user‑friendly error on load.
 */

export function validateAll(data) {
  try {
    const { cities, units, cases, localization, backgrounds } = data;
    // Cities: ensure each has id, name, country and emergencyNumbers
    if (!Array.isArray(cities)) throw new Error('cities deve ser um array');
    cities.forEach((c) => {
      if (!c.id || !c.name || !c.country || !c.emergencyNumbers) {
        throw new Error(`Cidade inválida: ${JSON.stringify(c)}`);
      }
    });
    // Units: ensure each has unitId, name, agency, role
    if (!Array.isArray(units)) throw new Error('units deve ser um array');
    units.forEach((u) => {
      if (!u.unitId || !u.name || !u.agency || !u.role) {
        throw new Error(`Unidade inválida: ${JSON.stringify(u)}`);
      }
    });
    // Cases: ensure each has caseId, agency, protocol, dispatch, outcomes
    if (!Array.isArray(cases)) throw new Error('cases deve ser um array');
    cases.forEach((cs) => {
      if (!cs.caseId || !cs.agency || !cs.protocol || !cs.dispatch || !cs.outcomes) {
        throw new Error(`Caso inválido: ${JSON.stringify(cs)}`);
      }
    });
    // Localization: must contain pt-BR and en-US objects
    if (typeof localization !== 'object') throw new Error('localization deve ser um objeto');
    if (!localization['pt-BR'] || !localization['en-US']) {
      throw new Error('localization deve conter pt-BR e en-US');
    }
    // Backgrounds: mapping of regionTag to bg id
    if (typeof backgrounds !== 'object') throw new Error('backgrounds deve ser um objeto');
    return { ok: true };
  } catch (err) {
    return { ok: false, errorMessage: err.message };
  }
}