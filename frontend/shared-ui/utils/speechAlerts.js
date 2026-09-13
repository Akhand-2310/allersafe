export function speakAlert(text, options = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options.rate || 0.95;
  utterance.pitch = options.pitch || 1;
  utterance.volume = options.volume || 1;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function speakRiskAlerts(results) {
  const riskyDishes = results.filter(dish => ['red', 'yellow'].includes(dish.overall_risk));
  if (!riskyDishes.length) return false;

  const message = riskyDishes.map(dish => {
    const risk = dish.overall_risk === 'red' ? 'high allergy risk' : 'possible allergy risk';
    const allergens = dish.detected_allergens?.length
      ? dish.detected_allergens.join(' and ')
      : 'possible cross contact';
    return `Allergy risk detected. Dish: ${dish.name}. Risk: ${allergens}. Please avoid eating this dish and confirm with restaurant staff.`;
  }).join(' ');

  return speakAlert(message, { rate: 0.9 });
}

