/*
 * Dispatch evaluation. Determines whether the units selected by the
 * player satisfy the case definition. Returns an object with outcome
 * ('success', 'partial', 'fail', or 'prank') and a message used for
 * user feedback.
 */

export function evaluateDispatch(call, caseDef, selectedUnitIds, units) {
  // If this case is a prank, the correct action is not to dispatch any units
  if (caseDef.baseSeverity === 'prank') {
    if (selectedUnitIds.length === 0) {
      return { outcome: 'success', message: 'Trote encerrado corretamente.' };
    }
    return { outcome: 'fail', message: 'Você despachou unidades em um trote.' };
  }
  // Map selected units to roles
  const selectedRoles = selectedUnitIds.map((id) => {
    const unit = units.find((u) => u.unitId === id);
    return unit ? unit.role : null;
  }).filter(Boolean);
  const correctRoles = caseDef.dispatch.correctRoles || [];
  const alternativeRoles = caseDef.dispatch.alternativeRoles || [];
  const isCorrect = selectedRoles.every((role) => correctRoles.includes(role));
  if (isCorrect && selectedRoles.length === correctRoles.length) {
    return { outcome: 'success', message: 'Unidades corretas despachadas.' };
  }
  // Partial: if roles include at least one correct or alternative
  const hasSome = selectedRoles.some((r) => correctRoles.includes(r) || alternativeRoles.includes(r));
  if (hasSome) {
    return { outcome: 'partial', message: 'Algumas unidades corretas, mas não todas.' };
  }
  return { outcome: 'fail', message: 'Unidades incorretas ou insuficientes.' };
}