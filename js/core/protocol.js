/*
 * Protocol handling.
 * Determines the next question for a given call and case definition.
 * Questions are defined per case in the data file. Each question may
 * include a prompt (what the dispatcher asks) and a response (what the
 * caller says). When all required questions have been asked, the
 * function returns null, indicating that the call is ready for dispatch.
 */

export function nextQuestionForCall(call, caseDef) {
  const answeredIds = Object.keys(call.answers || {});
  const requiredIds = caseDef.protocol.requiredQuestions || [];
  // Determine list of unanswered required questions first
  for (const rq of requiredIds) {
    if (!answeredIds.includes(rq)) {
      const q = caseDef.protocol.questions.find((qu) => qu.id === rq);
      return q || null;
    }
  }
  // If all required answered, optionally ask remaining optional questions if any
  for (const q of caseDef.protocol.questions) {
    if (!answeredIds.includes(q.id)) {
      return q;
    }
  }
  // No more questions
  return null;
}