// Ordem atual da cadeia de upsells.
// Fluxo: front -> oferecer iof -> tarifa_cadastro -> tenf -> ativar_conta -> registro_contrato -> limite_adicional -> taxa_processamento -> app_supersim -> tac -> consultoria_financeira -> processamento_administrativo -> destino final
const upsellOrder = [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Ao terminar toda a cadeia, encerra o funil sem voltar para uma oferta já exibida.
const finalDestination = '/concluido.html';

function upsellPathFor(n) {
  return '/up' + n;
}

function getCookie(name) {
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split('=');
    if (cookieName === name) {
      return cookieValue;
    }
  }
  return null;
}

function setCookie(name, value, days = 30) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
}

function markUpsellAsVisited(upsellNumber) {
  if (upsellOrder.indexOf(upsellNumber) !== -1) {
    setCookie(`visited_upsell_${upsellNumber}`, 'true', 30);
  }
}

function hasVisitedUpsell(upsellNumber) {
  return getCookie(`visited_upsell_${upsellNumber}`) === 'true';
}

// Retorna o número do próximo upsell ainda não visitado, na ordem do /ga (-1 = acabou)
function getNextUpsellNumber() {
  for (let i = 0; i < upsellOrder.length; i++) {
    if (!hasVisitedUpsell(upsellOrder[i])) {
      return upsellOrder[i];
    }
  }
  return -1;
}

function redirectToNextUpsell() {
  const next = getNextUpsellNumber();
  const queryString = window.location.search; // mantém UTMs/params na navegação
  if (next >= 0) {
    window.location.href = upsellPathFor(next) + queryString;
  } else {
    window.location.href = finalDestination + queryString;
  }
}

function initUpsell(currentUpsellNumber) {
  markUpsellAsVisited(currentUpsellNumber);
  console.log(`Upsell ${currentUpsellNumber} carregado e marcado como visitado.`);
}

window.redirectToNextUpsell = redirectToNextUpsell;
window.initUpsell = initUpsell;
