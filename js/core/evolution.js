/*
 * Evolution module. Handles time‑based changes to a case while the call
 * is ongoing. Each case can define a set of timeline events that
 * occur at specified seconds since the call started, optionally
 * conditioned on missing facts. The module exposes a function
 * `processEvolution` that should be called regularly (e.g. each second)
 * with the current call and case definition. It returns any new
 * logs to be added and updates to severity.
 */

export function processEvolution(call, caseDef, elapsedSec) {
  const events = caseDef.evolution?.timelineEvents || [];
  const newLogs = [];
  let newSeverity = call.severity;
  for (const ev of events) {
    if (ev.processed) continue;
    if (elapsedSec >= ev.atSec) {
      // Check if missing facts block this event
      if (ev.ifMissingFacts) {
        const missing = ev.ifMissingFacts.some((f) => !call.facts[f]);
        if (missing) continue;
      }
      if (ev.applySeverityChange) {
        newSeverity = ev.applySeverityChange;
      }
      if (ev.addLogs) {
        newLogs.push(...ev.addLogs);
      }
      ev.processed = true;
    }
  }
  return { newLogs, newSeverity };
}