import { CITY_BY_ID, CITIES_INDEX, PHASE2_CALLS } from './contentFallback.js';

export async function loadCityIndex(){
  try{
    const res = await fetch('data/cities/index.json', { cache:'no-store' });
    if (!res.ok) throw new Error('HTTP '+res.status);
    return await res.json();
  }catch(e){
    console.warn('[content] fetch city index failed, fallback:', e);
    return CITIES_INDEX;
  }
}

export async function loadCity(cityId){
  try{
    const res = await fetch(`data/cities/${cityId}.json`, { cache:'no-store' });
    if (!res.ok) throw new Error('HTTP '+res.status);
    return await res.json();
  }catch(e){
    console.warn('[content] fetch city failed, fallback:', e);
    if (CITY_BY_ID[cityId]) return CITY_BY_ID[cityId];
    throw e;
  }
}

export async function loadCalls(){
  try{
    const res = await fetch('data/calls/phase2_calls.json', { cache:'no-store' });
    if (!res.ok) throw new Error('HTTP '+res.status);
    return await res.json();
  }catch(e){
    console.warn('[content] fetch calls failed, fallback:', e);
    return PHASE2_CALLS;
  }
}
