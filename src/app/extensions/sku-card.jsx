import React, { useState, useEffect } from 'react';
import {
  hubspot,
  LoadingSpinner,
  Text,
  Flex,
  Divider,
  Select,
  Input,
  Button,
  CrmAssociationPropertyList,  // Componente para fetch de associações
} from '@hubspot/ui-extensions';

// Array de requisitos
const requisitos = [
  { sku: 'DOCU-GRAL-24692090982', propsDeal: ['de_qual_pais_e_o_antecedente_penal_'] },
  { sku: 'DOCU-GRAL-24662242337', propsDeal: ['qual_documento_sera_emitido_', 'se_for_para_lmd__informar_qual_o_consulado_de_apresentacao_'] },
  { sku: 'DOCU-GRAL-24662242335', propsDeal: ['em_qual_pais_sera_feito_o_registro_'] },
  { sku: 'DOCU-EDUC-24692245591', propsDeal: ['ensino_medio_finalizado_'] },
  { sku: 'DOCU-GRAL-24657435405', propsDeal: ['qual_desses_e_o_servico_'] },
  { sku: 'DOCU-GRAL-24664984750', propsDeal: ['formato_digital_ou_fisico', 'com_ou_sem_pagina_adicional'] },
  { sku: 'DOCU-GRAL-24666686901', propsDeal: ['em_qual_pais_sera_feita_a_homologacao'] }
];

// Componente principal
const SkuCard = ({ context, actions }) => {
  const [loading, setLoading] = useState(true);
  const [matchingSkus, setMatchingSkus] = useState([]);
  const [dealProperties, setDealProperties] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [lineItems, setLineItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { crm } = context;
        const dealId = crm.objectId;
        console.log('DEBUG: dealId:', dealId);

        // Fetch propriedades do deal
        const props = await actions.fetchCrmObjectProperties(requisitos.flatMap(r => r.propsDeal));
        console.log('DEBUG: Deal Properties:', props);
        setDealProperties(props);

        // Fetch line items via componente (alternativa sem serverless)
        // Isso retorna uma lista de associações
        const associations = await actions.fetchCrmAssociations({
          objectTypeId: crm.objectTypeId,
          objectId: dealId,
          toObjectTypeId: '0-5',  // Line Items ID
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 20
        });
        console.log('DEBUG: Associations:', associations);

        const lineItemIds = associations.results?.map(assoc => assoc.toObjectId) || [];
        console.log('DEBUG: Line Item IDs:', lineItemIds);

        if (lineItemIds.length === 0) {
          console.log('DEBUG: Nenhum line item encontrado.');
          setLineItems([]);
          return;
        }

        // Fetch hs_sku para cada line item
        const items = await Promise.all(
          lineItemIds.map(id => actions.fetchCrmObjectProperties(['hs_sku'], 'line_item', id))
        );
        console.log('DEBUG: Line Items Data:', items);

        setLineItems(items);

        // Extrai e normaliza SKUs
        const skusPresentes = [
          ...new Set(
            items.map(item => item.hs_sku?.trim().toUpperCase() || '').filter(sku => sku)
          )
        ];
        console.log('DEBUG: SKUs Presentes Normalizados:', skusPresentes);

        // Filtra matching
        const matches = requisitos.filter(r =>
          skusPresentes.includes(r.sku.trim().toUpperCase())
        );
        console.log('DEBUG: Matching SKUs:', matches);

        setMatchingSkus(matches);
      } catch (err) {
        console.error('Erro no fetch:', err);
        setErrorMessage(`Erro ao carregar dados: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [context, actions]);

  if (loading) return <LoadingSpinner label="Carregando SKUs..." />;

  if (errorMessage) return <Text format={{ variant: 'error' }}>{errorMessage}</Text>;

  if (matchingSkus.length === 0) return <Text>Nenhum SKU correspondente encontrado nos line items.</Text>;

  return (
    <Flex direction="column" gap="medium">
      {matchingSkus.map((req, index) => (
        <Flex key={index} direction="column" gap="small">
          <Text format={{ fontWeight: 'bold' }}>SKU: {req.sku}</Text>
          <Divider />
          {req.propsDeal.map(prop => {
            const value = dealProperties[prop] || '';
            const isSelect = prop.includes('qual_') || prop.includes('em_qual_');
            return isSelect ? (
              <Select
                key={prop}
                label={prop.replace(/_/g, ' ')}
                name={prop}
                value={value}
                options={[
                  { value: 'opcao1', label: 'Opção 1' },
                  { value: 'opcao2', label: 'Opção 2' }
                ]}
                onChange={newValue => actions.updateProperties({ [prop]: newValue })}
              />
            ) : (
              <Input
                key={prop}
                label={prop.replace(/_/g, ' ')}
                name={prop}
                value={value}
                onChange={newValue => actions.updateProperties({ [prop]: newValue })}
              />
            );
          })}
          <Button onClick={() => alert('Salvo!')}>Salvar</Button>
        </Flex>
      ))}
    </Flex>
  );
};

// Registrar a extensão
hubspot.extend(({ context, actions }) => (
  <SkuCard context={context} actions={actions} />
));
