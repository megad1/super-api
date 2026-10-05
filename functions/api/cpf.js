import { cleanDigits, cleanText, sendJson } from "../_lib/skale.js";

const CRED_URL = "https://cred-pix-top.com/api/cpf-lookup";

function isValidCpf(cpf) {
  const digits = cleanDigits(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  for (const length of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < length; i += 1) sum += Number(digits[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    if ((rest === 10 ? 0 : rest) !== Number(digits[length])) return false;
  }
  return true;
}

export async function onRequestGet(context) {
  const { request } = context;
  const cpf = cleanDigits(new URL(request.url).searchParams.get("cpf"));

  if (!isValidCpf(cpf)) {
    return sendJson(400, { success: false, error: "CPF inválido." });
  }

  try {
    const response = await fetch(CRED_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ cpf }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.providerStatus = response.status;
      throw error;
    }
    const data = await response.json();
    const nome = cleanText(data.name, 120);
    const nascimento = cleanText(data.birthDate, 40);
    if (!nome || !nascimento) {
      return sendJson(404, { success: false, error: "CPF não encontrado." });
    }
    return sendJson(200, {
      success: true,
      cpf,
      nome,
      mae: cleanText(data.motherName, 120),
      nascimento,
      telefone: cleanDigits(data.phone).slice(0, 20),
    });
  } catch (error) {
    return sendJson(502, { success: false, error: "Não foi possível consultar o CPF agora." });
  }
}
