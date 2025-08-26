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
  Alert,
  Box,
  Heading,
  Tag
} from '@hubspot/ui-extensions';

const SkuCard = ({ context, actions }) => {
  const [loading, setLoading] = useState(true);
  const [matchingSkus, setMatchingSkus] = useState([]);
  const [dealProperties, setDealProperties] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const [saving, setSaving] = useState({});
  const [success, setSuccess] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        
        const { crm } = context;
        const dealId = crm.objectId;
        
        console.log('=== INICIANDO fetchData no componente ===');
        console.log('Deal ID:', dealId);
        console.log('Context:', context);

        // Chamar a funÃ§Ã£o serverless
        const response = await actions.executeServerlessFunction({
          functionName: 'fetchLineItems',
          parameters: { dealId }
        });

        console.log('Resposta da funÃ§Ã£o serverless:', response);

        if (response.error) {
          throw new Error(response.error);
        }

        setMatchingSkus(response.matchingSkus || []);
        setDealProperties(response.dealProperties || {});
        setDebugInfo(response.debug);

        console.log('Matching SKUs:', response.matchingSkus);
        console.log('Deal Properties:', response.dealProperties);

      } catch (error) {
        console.error('Erro no fetchData:', error);
        setErrorMessage(`Erro ao carregar dados: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [context, actions]);

  const handleSave = async (skuIndex, propName, value) => {
    const saveKey = `${skuIndex}-${propName}`;
    
    try {
      setSaving(prev => ({ ...prev, [saveKey]: true }));
      
      // Atualizar propriedade do deal
      await actions.updateCrmObjectProperties({
        [propName]: value
      });

      // Atualizar estado local
      setDealProperties(prev => ({
        ...prev,
        [propName]: value
      }));

      // Mostrar mensagem de sucesso
      setSuccess(prev => ({ ...prev, [saveKey]: true }));
      
      // Remover mensagem de sucesso apÃ³s 3 segundos
      setTimeout(() => {
        setSuccess(prev => ({ ...prev, [saveKey]: false }));
      }, 3000);

    } catch (error) {
      console.error('Erro ao salvar:', error);
      setErrorMessage(`Erro ao salvar propriedade ${propName}: ${error.message}`);
    } finally {
      setSaving(prev => ({ ...prev, [saveKey]: false }));
    }
  };

  if (loading) {
    return (
      <Flex direction="column" align="center" gap="medium">
        <LoadingSpinner label="Carregando informaÃ§Ãµes dos SKUs..." />
        <Text>Verificando line items do deal...</Text>
      </Flex>
    );
  }

  if (errorMessage) {
    return (
      <Alert variant="error" title="Erro">
        <Text>{errorMessage}</Text>
        {debugInfo && (
          <Box marginTop="small">
            <Text format={{ variant: 'microcopy' }}>
              Debug Info: {JSON.stringify(debugInfo, null, 2)}
            </Text>
          </Box>
        )}
      </Alert>
    );
  }

  if (matchingSkus.length === 0) {
    return (
      <Alert variant="warning" title="Nenhum SKU encontrado">
        <Text>
          Nenhum dos SKUs configurados foi encontrado nos line items deste deal.
        </Text>
        {debugInfo && (
          <Box marginTop="small">
            <Text format={{ fontWeight: 'bold' }}>InformaÃ§Ãµes de Debug:</Text>
            <Text format={{ variant: 'microcopy' }}>
              â€¢ Deal ID: {debugInfo.dealId}<br/>
              â€¢ Line Items encontrados: {debugInfo.lineItemsCount}<br/>
              â€¢ SKUs presentes: {debugInfo.skusPresentes?.join(', ') || 'Nenhum'}<br/>
              â€¢ SKUs configurados: {debugInfo.skusRequisitos?.join(', ') || 'Nenhum'}<br/>
              â€¢ Mensagem: {debugInfo.message}
            </Text>
          </Box>
        )}
      </Alert>
    );
  }

  return (
    <Flex direction="column" gap="large">
      <Box>
        <Heading>ConfiguraÃ§Ã£o de SKUs</Heading>
        <Text format={{ variant: 'microcopy' }}>
          {matchingSkus.length} SKU(s) encontrado(s) nos line items deste deal
        </Text>
      </Box>

      {matchingSkus.map((requisito, skuIndex) => (
        <Box 
          key={`${requisito.sku}-${skuIndex}`}
          padding="medium" 
          style={{ 
            border: '1px solid #e5e8ed', 
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}
        >
          <Flex direction="column" gap="medium">
            {/* CabeÃ§alho do SKU */}
            <Flex direction="row" justify="between" align="center">
              <Heading level={3}>SKU: {requisito.sku}</Heading>
              <Tag variant="success">Encontrado</Tag>
            </Flex>
            
            <Divider />

            {/* Campos para cada propriedade */}
            {requisito.propsDeal.map((prop, propIndex) => {
              const currentValue = dealProperties[prop.name] || '';
              const saveKey = `${skuIndex}-${prop.name}`;
              const isSaving = saving[saveKey];
              const showSuccess = success[saveKey];

              return (
                <Box key={`${prop.name}-${propIndex}`}>
                  <Flex direction="column" gap="small">
                    <Text format={{ fontWeight: 'bold' }}>
                      {prop.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>

                    <Flex direction="row" gap="small" align="end">
                      <Box flex={1}>
                        {prop.type === 'select' ? (
                          <Select
                            name={prop.name}
                            value={currentValue}
                            placeholder="Selecione uma opÃ§Ã£o..."
                            options={[
                              { value: '', label: '-- Selecione --' },
                              ...prop.options
                            ]}
                            onChange={(value) => {
                              // Atualizar estado local imediatamente para feedback visual
                              setDealProperties(prev => ({
                                ...prev,
                                [prop.name]: value
                              }));
                            }}
                          />
                        ) : (
                          <Input
                            name={prop.name}
                            value={currentValue}
                            placeholder={`Digite ${prop.name.replace(/_/g, ' ')}`}
                            onChange={(value) => {
                              // Atualizar estado local imediatamente para feedback visual
                              setDealProperties(prev => ({
                                ...prev,
                                [prop.name]: value
                              }));
                            }}
                          />
                        )}
                      </Box>

                      <Button
                        variant="primary"
                        size="small"
                        disabled={isSaving || !currentValue}
                        onClick={() => handleSave(skuIndex, prop.name, currentValue)}
                      >
                        {isSaving ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </Flex>

                    {showSuccess && (
                      <Alert variant="success" title="Salvo com sucesso!">
                        <Text format={{ variant: 'microcopy' }}>
                          O valor foi atualizado no deal.
                        </Text>
                      </Alert>
                    )}
                  </Flex>
                </Box>
              );
            })}
          </Flex>
        </Box>
      ))}

      {/* InformaÃ§Ãµes de debug (apenas em desenvolvimento) */}
      {debugInfo && process.env.NODE_ENV === 'development' && (
        <Box padding="small" style={{ backgroundColor: '#f0f0f0', fontSize: '12px' }}>
          <Text format={{ fontWeight: 'bold' }}>Debug Info:</Text>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </Box>
      )}
    </Flex>
  );
};

// Registrar a extensÃ£o
hubspot.extend(({ context, actions }) => (
  <SkuCard context={context} actions={actions} />
));