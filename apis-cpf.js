/**
 * APIs de CPF disponíveis no projeto
 * Adicione/remova APIs conforme necessário
 */

const CPF_APIS = [
  {
    name: 'ElaiFlow',
    enabled: true,
    url: (cpf) => `https://back.shadonapi.pro/consultar-filtrada/cpf?cpf=${cpf}&token=c93601cbe0fce3f5c5b1e3b40c840f500fb162f91103beb42e839b7839813f93`,
    extractor: (data) => ({
      nome: data.nome,
      mae: data.mae,
      data: data.nascimento
    }),
    timeout: 3000
  },

  {
    name: 'DNNL',
    enabled: true,
    url: (cpf) => `https://searchapi.dnnl.live/consulta?token_api=4097&cpf=${cpf}`,
    extractor: (data) => ({
      nome: data.NOME,
      mae: data.NOME_MAE,
      data: data.NASC
    }),
    timeout: 3000
  },

  {
    name: 'ZapGroup',
    enabled: false, // Desabilitado por enquanto
    url: (cpf) => `https://back.shadonapi.pro/api/v1/cpf/${cpf}`,
    extractor: (data) => ({
      nome: data.nome_completo,
      mae: data.nome_mae,
      data: data.data_nascimento
    }),
    timeout: 5000
  }
];

/**
 * Dados para fallback (quando todas as APIs falharem)
 */
const FAKE_DATA = {
  nomes: [
    'João Silva Santos',
    'Maria Oliveira Costa',
    'Pedro Pereira Lima',
    'Ana Carolina Martins',
    'Carlos Roberto Alves',
    'Fernanda Souza Ferreira',
    'Lucas Gabriel Cardoso',
    'Julia Beatriz Ribeiro'
  ],
  maes: [
    'Maria Aparecida dos Santos',
    'Ana Paula de Oliveira',
    'Patricia Souza Lima',
    'Sandra Regina Alves',
    'Claudia Maria Pereira',
    'Rosangela Silva Nascimento',
    'Francisca Almeida Rocha',
    'Luciana Barbosa Martins'
  ],
  datas: [
    '15/03/1985',
    '22/07/1990',
    '08/11/1988',
    '30/01/1992',
    '12/06/1987',
    '25/09/1989',
    '14/04/1991',
    '07/12/1986'
  ],

  generate() {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    return {
      nome: pick(this.nomes),
      mae: pick(this.maes),
      data: pick(this.datas)
    };
  }
};

/**
 * Testa uma API de CPF
 */
async function testCPFAPI(cpf, api) {
  try {
    console.log(`🔍 Tentando ${api.name}...`);
    const url = api.url(cpf);
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(api.timeout || 3000)
    });

    if (!res.ok) {
      console.warn(`⚠️ ${api.name}: HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    const extracted = api.extractor(data);

    if (extracted.nome) {
      console.log(`✅ ${api.name} OK:`, extracted);
      return { api: api.name, data: extracted };
    }

    return null;
  } catch (err) {
    console.warn(`⚠️ ${api.name} falhou:`, err.message);
    return null;
  }
}

/**
 * Consulta CPF com fallback automático
 */
async function consultarCPF(cpf) {
  const enabledAPIs = CPF_APIS.filter(api => api.enabled);

  for (const api of enabledAPIs) {
    const result = await testCPFAPI(cpf, api);
    if (result) return result;
  }

  // Fallback: dados fake
  console.warn('⚠️ Todas as APIs falharam. Usando dados fake...');
  return {
    api: 'Fake (offline)',
    data: FAKE_DATA.generate()
  };
}

// Export para Node.js (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CPF_APIS, FAKE_DATA, testCPFAPI, consultarCPF };
}
