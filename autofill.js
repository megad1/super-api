/**
 * autofill.js
 * Pré-preenche apenas campos de input que estão vazios
 * Inclua este script no final de cada HTML que precisa
 */

(function() {
  const FILL_DELAY = 50;

  // Mapa de campos e seus possíveis identificadores
  const FIELD_MAP = {
    cpf: {
      keys: ['cpf'],
      storageKey: 'cpf',
      selectors: [
        'input[id*="cpf" i]',
        'input[name*="cpf" i]',
        'input[placeholder*="CPF"]',
        'input[placeholder*="cpf"]',
        'input[data-field*="cpf" i]',
      ],
      formatter: (val) => formatCPF(val)
    },

    nome: {
      keys: ['nome', 'name', 'nome_completo'],
      storageKey: 'nome',
      selectors: [
        'input[id*="name" i]',
        'input[name*="name" i]',
        'input[name*="nome" i]',
        'input[id*="nome" i]',
        'input[placeholder*="nome"]',
        'input[data-field*="name" i]',
      ],
      formatter: (val) => val
    },

    nomeMae: {
      keys: ['mae', 'nome_mae', 'mother'],
      storageKey: 'nome_mae',
      selectors: [
        'input[id*="mae" i]',
        'input[id*="mother" i]',
        'input[name*="mae" i]',
        'input[name*="mother" i]',
        'input[placeholder*="mãe"]',
        'input[placeholder*="mae"]',
        'input[data-field*="mae" i]',
      ],
      formatter: (val) => val
    },

    dataNasc: {
      keys: ['data_nasc', 'nascimento', 'birthDate', 'birth_date'],
      storageKey: 'data_nasc',
      selectors: [
        'input[id*="data" i]',
        'input[id*="birth" i]',
        'input[id*="nasc" i]',
        'input[name*="data" i]',
        'input[name*="birth" i]',
        'input[name*="nasc" i]',
        'input[placeholder*="data"]',
        'input[placeholder*="nascimento"]',
        'input[type="date"]',
        'input[data-field*="birth" i]',
        'input[data-field*="nasc" i]',
      ],
      formatter: (val) => formatDate(val)
    },

    email: {
      keys: ['email', 'e-mail'],
      storageKey: 'email',
      selectors: [
        'input[id*="email" i]',
        'input[name*="email" i]',
        'input[type="email"]',
        'input[placeholder*="email"]',
        'input[placeholder*="@"]',
        'input[data-field*="email" i]',
      ],
      formatter: (val) => val
    },

    telefone: {
      keys: ['telefone', 'telephone', 'phone', 'celular'],
      storageKey: 'telefone',
      selectors: [
        'input[id*="phone" i]',
        'input[id*="telefone" i]',
        'input[id*="celular" i]',
        'input[name*="phone" i]',
        'input[name*="telefone" i]',
        'input[name*="celular" i]',
        'input[placeholder*="telefone"]',
        'input[placeholder*="celular"]',
        'input[placeholder*="("]',
        'input[type="tel"]',
        'input[data-field*="phone" i]',
      ],
      formatter: (val) => formatPhone(val)
    }
  };

  /**
   * Formata telefone
   */
  function formatPhone(phone) {
    if (!phone) return '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
    } else if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    return phone;
  }

  /**
   * Formata CPF com máscara
   */
  function formatCPF(cpf) {
    if (!cpf) return '';
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return cpf;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  }

  /**
   * Formata data (tenta converter entre formatos)
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';

    // Se já está em formato DD/MM/YYYY, retorna
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      return dateStr;
    }

    // Se está em formato ISO (YYYY-MM-DD), converte
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }

    return dateStr;
  }

  /**
   * Pré-preenche um campo específico
   */
  function fillField(fieldName, fieldConfig) {
    const value = localStorage.getItem(fieldConfig.storageKey);

    if (!value) {
      console.log(`⏭️ ${fieldName}: sem valor no localStorage`);
      return;
    }

    const formattedValue = fieldConfig.formatter(value);
    let filled = false;

    // Tenta preencher usando os seletores
    fieldConfig.selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        // Pula se já tem valor
        if (el.value && el.value.trim()) return;

        el.value = formattedValue;
        // Dispara eventos para frameworks JS detectarem a mudança
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));

        filled = true;
        console.log(`✅ ${fieldName}: preenchido em ${selector}`);
      });
    });

    if (!filled) {
      console.log(`⚠️ ${fieldName}: nenhum campo encontrado`);
    }
  }

  /**
   * Pré-preenche todos os campos
   */
  function autoFillForm() {
    console.log('🤖 Iniciando auto-preenchimento de formulário...');

    Object.entries(FIELD_MAP).forEach(([fieldName, fieldConfig]) => {
      fillField(fieldName, fieldConfig);
    });

    // Log do localStorage para debug
    console.log('📦 Dados no localStorage:', {
      cpf: localStorage.getItem('cpf'),
      nome: localStorage.getItem('nome'),
      nomeMae: localStorage.getItem('nome_mae'),
      dataNasc: localStorage.getItem('data_nasc')
    });
  }

  // Aguarda DOM estar pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(autoFillForm, FILL_DELAY);
    });
  } else {
    setTimeout(autoFillForm, FILL_DELAY);
  }

  // Re-executa ao fazer navegação com histório (SPA)
  window.addEventListener('popstate', () => {
    setTimeout(autoFillForm, FILL_DELAY);
  });

  // Expõe função global pra chamar manualmente se necessário
  window.autoFillForm = autoFillForm;
})();
