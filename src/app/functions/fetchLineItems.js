const hubspot = require('@hubspot/api-client');

// Importar requisitos do JSON (vocÃª pode colocar esse JSON no mesmo arquivo ou importar)
const requisitos = [
  {
    "sku": "DOCU-GRAL-24692090982",
    "propsDeal": [
      {
        "name": "de_qual_pais_e_o_antecedente_penal_",
        "type": "select",
        "options": [
          { "value": "brasil", "label": "Brasil" },
          { "value": "argentina", "label": "Argentina" },
          { "value": "chile", "label": "Chile" },
          { "value": "uruguai", "label": "Uruguai" },
          { "value": "paraguai", "label": "Paraguai" },
          { "value": "outro", "label": "Outro paÃ­s" }
        ]
      }
    ]
  },
  {
    "sku": "DOCU-GRAL-24662242337",
    "propsDeal": [
      {
        "name": "qual_documento_sera_emitido_",
        "type": "select",
        "options": [
          { "value": "certidao_nascimento", "label": "CertidÃ£o de Nascimento" },
          { "value": "certidao_casamento", "label": "CertidÃ£o de Casamento" },
          { "value": "certidao_obito", "label": "CertidÃ£o de Ã“bito" },
          { "value": "diploma", "label": "Diploma" },
          { "value": "historico", "label": "HistÃ³rico Escolar" }
        ]
      },
      {
        "name": "se_for_para_lmd__informar_qual_o_consulado_de_apresentacao_",
        "type": "select",
        "options": [
          { "value": "consulado_sp", "label": "Consulado SÃ£o Paulo" },
          { "value": "consulado_rj", "label": "Consulado Rio de Janeiro" },
          { "value": "consulado_brasilia", "label": "Consulado BrasÃ­lia" },
          { "value": "outro_consulado", "label": "Outro Consulado" }
        ]
      }
    ]
  },
  {
    "sku": "DOCU-GRAL-24662242335",
    "propsDeal": [
      {
        "name": "em_qual_pais_sera_feito_o_registro_",
        "type": "select",
        "options": [
          { "value": "brasil", "label": "Brasil" },
          { "value": "argentina", "label": "Argentina" },
          { "value": "chile", "label": "Chile" },
          { "value": "uruguai", "label": "Uruguai" },
          { "value": "paraguai", "label": "Paraguai" },
          { "value": "outro", "label": "Outro paÃ­s" }
        ]
      }
    ]
  },
  {
    "sku": "DOCU-EDUC-24692245591",
    "propsDeal": [
      {
        "name": "ensino_medio_finalizado_",
        "type": "select",
        "options": [
          { "value": "sim", "label": "Sim" },
          { "value": "nao", "label": "NÃ£o" },
          { "value": "cursando", "label": "Cursando" }
        ]
      }
    ]
  },
  {
    "sku": "DOCU-GRAL-24657435405",
    "propsDeal": [
      {
        "name": "qual_desses_e_o_servico_",
        "type": "select",
        "options": [
          { "value": "apostila", "label": "Apostila de Haia" },
          { "value": "traducao", "label": "TraduÃ§Ã£o Juramentada" },
          { "value": "legalizacao", "label": "LegalizaÃ§Ã£o Consular" },
          { "value": "reconhecimento", "label": "Reconhecimento de Firma" }
        ]
      }
    ]
  },
  {
    "sku": "DOCU-GRAL-24664984750",
    "propsDeal": [
      {
        "name": "formato_digital_ou_fisico",
        "type": "select",
        "options": [
          { "value": "digital", "label": "Digital" },
          { "value": "fisico", "label": "FÃ­sico" },
          { "value": "ambos", "label": "Ambos" }
        ]
      },
      {
        "name": "com_ou_sem_pagina_adicional",
        "type": "select",
        "options": [
          { "value": "com_pagina", "label": "Com pÃ¡gina adicional" },
          { "value": "sem_pagina", "label": "Sem pÃ¡gina adicional" }
        ]
      }
    ]
  },
  {
    "sku": "DOCU-GRAL-24666686901",
    "propsDeal": [
      {
        "name": "em_qual_pais_sera_feita_a_homologacao",
        "type": "select",
        "options": [
          { "value": "brasil", "label": "Brasil" },
          { "value": "argentina", "label": "Argentina" },
          { "value": "chile", "label": "Chile" },
          { "value": "uruguai", "label": "Uruguai" },
          { "value": "paraguai", "label": "Paraguai" },
          { "value": "outro", "label": "Outro paÃ­s" }
        ]
      }
    ]
  }
];

exports.main = async (context = {}) => {
  const { parameters = {}, accessToken, secrets = {} } = context;
  const { dealId } = parameters;

  console.log('=== INICIANDO fetchLineItems ===');
  console.log('Deal ID recebido:', dealId);

  if (!dealId) {
    console.error('ParÃ¢metro dealId ausente');
    return { error: 'ParÃ¢metro dealId ausente.' };
  }

  // Tentar diferentes fontes de token de acesso
  const token = accessToken || secrets.ACCESS_TOKEN || secrets.HUBSPOT_ACCESS_TOKEN || process.env.HUBSPOT_ACCESS_TOKEN;
  
  if (!token) {
    console.error('Token de acesso nÃ£o encontrado');
    return { error: 'Token de acesso nÃ£o encontrado.' };
  }

  console.log('Token encontrado, iniciando cliente HubSpot...');

  const hubspotClient = new hubspot.Client({ accessToken: token });

  try {
    console.log('1. Buscando associaÃ§Ãµes de line items...');
    
    // Buscar associaÃ§Ãµes com diferentes tentativas de API
    let associations;
    try {
      // Tentar API v4 primeiro
      associations = await hubspotClient.crm.associations.v4.basicApi.getPage(
        'deals', 
        dealId, 
        'line_items',
        { limit: 100 }
      );
    } catch (v4Error) {
      console.log('API v4 falhou, tentando API v3:', v4Error.message);
      try {
        // Fallback para API v3
        associations = await hubspotClient.crm.associations.basicApi.getPage(
          'deals',
          dealId,
          'line_items'
        );
      } catch (v3Error) {
        console.error('Ambas APIs falharam:', v3Error.message);
        throw v3Error;
      }
    }

    console.log('AssociaÃ§Ãµes encontradas:', JSON.stringify(associations, null, 2));
    
    const lineItemIds = (associations.results || []).map(r => r.toObjectId || r.to?.id);
    console.log('IDs de line items extraÃ­dos:', lineItemIds);

    if (!lineItemIds.length) {
      console.log('Nenhum line item encontrado para o deal');
      return { 
        matchingSkus: [], 
        dealProperties: {},
        debug: {
          dealId,
          lineItemsCount: 0,
          message: 'Nenhum line item associado ao deal'
        }
      };
    }

    console.log('2. Buscando dados dos line items...');
    
    // Buscar propriedades de todos os line items
    const lineItemsData = [];
    for (const lineItemId of lineItemIds) {
      try {
        console.log(`Buscando line item ${lineItemId}...`);
        const lineItem = await hubspotClient.crm.lineItems.basicApi.getById(
          lineItemId, 
          ['hs_sku', 'name', 'hs_product_id']
        );
        lineItemsData.push(lineItem);
        console.log(`Line item ${lineItemId}:`, {
          hs_sku: lineItem.properties.hs_sku,
          name: lineItem.properties.name
        });
      } catch (lineItemError) {
        console.error(`Erro ao buscar line item ${lineItemId}:`, lineItemError.message);
      }
    }

    console.log('3. Extraindo e normalizando SKUs...');
    
    // Extrair SKUs e normalizar
    const skusPresentes = [];
    lineItemsData.forEach(lineItem => {
      const sku = lineItem.properties.hs_sku;
      if (sku && typeof sku === 'string') {
        const skuNormalizado = sku.trim().toUpperCase();
        if (skuNormalizado && !skusPresentes.includes(skuNormalizado)) {
          skusPresentes.push(skuNormalizado);
        }
      }
    });
    
    console.log('SKUs presentes (normalizados):', skusPresentes);

    console.log('4. Comparando com requisitos...');
    
    // Normalizar SKUs dos requisitos para comparaÃ§Ã£o
    const skusRequisitosNormalizados = requisitos.map(r => ({
      ...r,
      skuNormalizado: r.sku.trim().toUpperCase()
    }));
    
    console.log('SKUs dos requisitos (normalizados):', skusRequisitosNormalizados.map(r => r.skuNormalizado));

    // Encontrar matches
    const matchingSkus = skusRequisitosNormalizados.filter(req => {
      const match = skusPresentes.includes(req.skuNormalizado);
      console.log(`Comparando ${req.skuNormalizado}: ${match ? 'MATCH!' : 'nÃ£o encontrado'}`);
      return match;
    });

    console.log('Matching SKUs encontrados:', matchingSkus.length);

    if (matchingSkus.length === 0) {
      return {
        matchingSkus: [],
        dealProperties: {},
        debug: {
          dealId,
          lineItemsCount: lineItemsData.length,
          skusPresentes,
          skusRequisitos: skusRequisitosNormalizados.map(r => r.skuNormalizado),
          message: 'Nenhum SKU dos line items corresponde aos requisitos'
        }
      };
    }

    console.log('5. Buscando propriedades do deal...');
    
    // Buscar propriedades necessÃ¡rias do deal
    const propsNecessarias = [...new Set(
      matchingSkus.flatMap(r => r.propsDeal.map(p => p.name))
    )];
    
    console.log('Propriedades necessÃ¡rias:', propsNecessarias);

    let dealProperties = {};
    if (propsNecessarias.length > 0) {
      try {
        const dealResp = await hubspotClient.crm.deals.basicApi.getById(dealId, propsNecessarias);
        dealProperties = dealResp.properties || {};
        console.log('Propriedades do deal carregadas:', Object.keys(dealProperties));
      } catch (dealError) {
        console.error('Erro ao buscar propriedades do deal:', dealError.message);
      }
    }

    console.log('=== FINALIZANDO com sucesso ===');

    return {
      matchingSkus,
      dealProperties,
      debug: {
        dealId,
        lineItemsCount: lineItemsData.length,
        skusPresentes,
        matchingSkusCount: matchingSkus.length,
        propsNecessarias
      }
    };

  } catch (error) {
    console.error('Erro geral em fetchLineItems:', error);
    console.error('Stack trace:', error.stack);
    
    return {
      error: error.message,
      debug: {
        dealId,
        errorType: error.constructor.name,
        errorDetails: error.response?.body || 'Sem detalhes adicionais'
      }
    };
  }
};