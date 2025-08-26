/* fetchLineItems.js */

const hubspot = require('@hubspot/api-client');

const requisitos = [
  { sku: 'DOCU-GRAL-24692090982', propsDeal: ['de_qual_pais_e_o_antecedente_penal_'] },
  { sku: 'DOCU-GRAL-24662242337', propsDeal: ['qual_documento_sera_emitido_', 'se_for_para_lmd__informar_qual_o_consulado_de_apresentacao_'] },
  { sku: 'DOCU-GRAL-24662242335', propsDeal: ['em_qual_pais_sera_feito_o_registro_'] },
  { sku: 'DOCU-EDUC-24692245591', propsDeal: ['ensino_medio_finalizado_'] },
  { sku: 'DOCU-GRAL-24657435405', propsDeal: ['qual_desses_e_o_servico_'] },
  { sku: 'DOCU-GRAL-24664984750', propsDeal: ['formato_digital_ou_fisico', 'com_ou_sem_pagina_adicional'] },
  { sku: 'DOCU-GRAL-24666686901', propsDeal: ['em_qual_pais_sera_feita_a_homologacao'] }
];

exports.main = async (context = {}) => {
  const { parameters = {}, accessToken, secrets = {} } = context;
  const { dealId } = parameters;

  if (!dealId) return { error: 'Parâmetro dealId ausente.' };

  const token = accessToken || secrets.ACCESS_TOKEN || process.env.HUBSPOT_API_KEY;
  if (!token) return { error: 'Token de acesso não encontrado.' };

  const hubspotClient = new hubspot.Client({ accessToken: token });

  try {
    // 1. Fetch associações de line items
    const assoc = await hubspotClient.crm.associations.v4.basicApi.getPage('deals', dealId, 'line_items', 100);
    console.log('DEBUG: Associações retornadas:', assoc); // Log: Veja se results tem itens
    const lineItemIds = (assoc.results || []).map(r => r.toObjectId);
    console.log('DEBUG: IDs de line items:', lineItemIds); // Log: Deve mostrar array de IDs

    if (!lineItemIds.length) {
      console.log('DEBUG: Nenhum line item encontrado.');
      return { matchingSkus: [], dealProperties: {} };
    }

    // 2. Buscar hs_sku de cada line item
    const lineItems = await Promise.all(
      lineItemIds.map(id =>
        hubspotClient.crm.lineItems.basicApi.getById(id, ['hs_sku'])
      )
    );
    console.log('DEBUG: Line items completos:', lineItems); // Log: Veja hs_sku em cada

    const skusPresentes = [
      ...new Set(
        lineItems
          .map(li => li.properties.hs_sku || '')
          .map(sku => sku.trim().toUpperCase())
          .filter(sku => sku) // Remove vazios
      )
    ];
    console.log('DEBUG: SKUs presentes (normalizados):', skusPresentes); // Log: Deve mostrar ['DOCU-GRAL-24692090982', 'DOCU-GRAL-24662242337']

    // 3. Buscar as propriedades necessárias do deal
    const propsNecessarias = [...new Set(requisitos.flatMap(r => r.propsDeal))];
    const dealResp = await hubspotClient.crm.deals.basicApi.getById(dealId, propsNecessarias);
    console.log('DEBUG: Propriedades do deal:', dealResp.properties); // Log: Veja valores das props
    const dealProperties = dealResp.properties || {};

    // 4. Filtrar requisitos que aparecem nos SKUs presentes
    const matchingSkus = requisitos.filter(r =>
      skusPresentes.includes(r.sku.trim().toUpperCase())
    );
    console.log('DEBUG: Matching SKUs encontrados:', matchingSkus); // Log: Deve mostrar os objetos correspondentes

    return { matchingSkus, dealProperties };
  } catch (err) {
    console.error('Erro em fetchLineItems:', err.response?.body || err.message);
    return { error: err.message };
  }
};
