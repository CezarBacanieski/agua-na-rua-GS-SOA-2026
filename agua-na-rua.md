# Ficha da CitizenTech — Água na Rua

- **Nome:** Água na Rua.
- **Cidade e bairro:** São Paulo — Jardim Peri, com seleção de ruas e pontos específicos após validação com moradores.
- **Cidadão beneficiado:** moradores que precisarão circular por trechos sujeitos a alagamento, especialmente ao sair ou retornar do trabalho.
- **Problema em uma frase:** quem depende de ruas sujeitas a alagamento enfrenta dificuldade para encontrar informações recentes e localizadas sobre água acumulada no seu caminho.
- **Como funcionará:** o cidadão consultará pontos acompanhados, visualizará a última observação com horário e origem, salvará favoritos e poderá registrar uma nova ocorrência.
- **O que cada parte fará:** o software organizará as observações; o ML investigará padrões históricos de alagamento; o circuito demonstrará monitoramento local da elevação da água; infraestrutura, segurança e testes sustentarão a proposta.
- **Indicador de impacto:** será medido o tempo para encontrar a informação mais recente sobre um trecho. Também será avaliado se o usuário identificará corretamente sua origem, atualização e eventual ausência de informação.
- **ODS relacionados:** **ODS 11, meta 11.5**, pela contribuição ao acesso à informação sobre desastres relacionados à água; **ODS 13, meta 13.1**, pelo apoio à preparação e adaptação comunitária. O protótipo não comprovará redução de danos ou vítimas.
- **Link do repositório:** [agua-na-rua-GS-SOA-2026](https://github.com/CezarBacanieski/agua-na-rua-GS-SOA-2026).

## Proposta

O grupo desenvolverá um protótipo para organizar informações sobre pontos sujeitos a alagamento em um pequeno território. O recorte inicial terá aproximadamente três pontos, selecionados após conversas com moradores e investigação das condições atuais.

O Jardim Peri será investigado por possuir histórico documentado de problemas de drenagem. Como houve intervenções na região, a equipe verificará se os trechos escolhidos ainda apresentarão uma necessidade relevante de acompanhamento.

Cada observação mostrará local, horário, origem e condição relatada. O aplicativo distinguirá informação recente, informação antiga e **ausência de informação**. A falta de registros não será apresentada como garantia de passagem livre, e a solução não recomendará atravessar áreas alagadas.

As disciplinas compartilharão o mesmo problema, cidadão e conceito. Os componentes poderão funcionar separadamente, mantendo as conexões descritas abaixo.

## Participação das oito disciplinas

| Disciplina | O que o grupo construirá ou demonstrará |
|---|---|
| **SOA e Web Services** | Desenvolverá um backend independente em Node.js com TypeScript para consultar pontos e registrar observações, com domínio organizado, banco, migrações, documentação dos endpoints e testes automatizados. |
| **C# Software Development** | Desenvolverá um backend próprio em C#/.NET para o mesmo conceito de CitizenTech, separado da implementação de SOA, demonstrando POO, interfaces, injeção de dependência, Web API, EF Core, LINQ, operações assíncronas e testes unitários. |
| **IA & Machine Learning** | Investigará padrões de recorrência e sazonalidade das ocorrências públicas de alagamento. Utilizará KMeans + PCA para explorar agrupamentos de áreas e apoiar a escolha de pontos para monitoramento. O notebook será independente do aplicativo. |
| **Mobile Development & IoT** | Desenvolverá um app com React Native, TypeScript, Expo e Expo Router para consultar pontos, visualizar observações, salvar favoritos e registrar ocorrências. Consumirá API ou mock identificado e utilizará SQLite para persistência local. |
| **Operating Systems** | Provisionará uma VM Linux por Shell Script para executar a API e uma página web de acompanhamento. Demonstrará serviços, monitoramento, logs e recuperação após falha. |
| **Physical Computing** | Simulará no Wokwi um ESP32 com sensor ultrassônico, display e sinalização. A variação da distância representará a elevação da água, sem exigir conexão com o app. |
| **Cybersecurity** | Demonstrará identificação de PII nos relatos, taint analysis, bloqueio ou sanitização de saídas inseguras, explicação dos achados por LLM e painel de Risco Cidadão, seguindo o material anterior da disciplina. |
| **Testing, Compliance & QA** | Organizará Features, critérios de aceite e testes positivos e negativos no Azure Boards, com evidências em PDF (página 39 do documento oficial). As regras gerais também orientam enviar pela disciplina de Testing o link de um pitch no YouTube de até quatro minutos, na seção “Pitch (Prêmio melhor GS)” (página 23); esse vídeo não aparece na rubrica específica de QA. |

## Dados públicos para Machine Learning

A fonte principal será o [GeoSampa — ocorrências de alagamento](https://metadados.geosampa.prefeitura.sp.gov.br/geonetwork/srv/api/records/432c06b1-03a1-4b1f-9210-423e1b58e869). O catálogo oficial informa registros da Defesa Civil/SIGRC e histórico disponível desde **2013**.

O recorte pretendido será **2013–2025**. Download, campos, cobertura e consistência ainda precisarão ser verificados. A análise representará ocorrências registradas, não todos os alagamentos existentes.

Serão avaliadas pelo menos dez combinações de três hiperparâmetros, com validação apenas no treino e avaliação separada. O estudo não prometerá prever a próxima enchente.

## Limites da demonstração

- **Dados reais:** histórico público utilizado no ML e informações territoriais que forem verificadas.
- **Dados de demonstração:** leituras do Wokwi, mocks e relatos fictícios para testes, sempre identificados.
- **Evoluções futuras:** sensores instalados, transmissão automática, notificações e integração entre dispositivo e aplicativo.

**Nota à equipe:** esta Ficha deverá permanecer igual nos READMEs das disciplinas para manter a consistência do projeto. O registro dos prompts utilizados em `prompts.md` é uma orientação expressa do documento oficial da GS, na página 21, em “IA como copiloto”.
