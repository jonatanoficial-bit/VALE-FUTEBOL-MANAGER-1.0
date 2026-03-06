export function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

export function formatClock(sec){
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec/60);
  const s = sec%60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export function pick(arr){
  return arr[Math.floor(Math.random()*arr.length)];
}

export function uid(prefix='id'){
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function severityLabel(sev){
  if (sev === 'high') return 'ALTA';
  if (sev === 'medium') return 'MÉDIA';
  return 'BAIXA';
}
