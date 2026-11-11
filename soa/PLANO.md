# Plano de SOA - Água na Rua

Plano iniciado em 11/11/2026, atualizado após a implementação. O backend está disponível em Node.js/TypeScript, com PostgreSQL, migrações e 95 testes aprovados. Consulte [README.md](README.md) para execução e [MATRIZ-REQUISITOS.md](MATRIZ-REQUISITOS.md) para evidências de cada critério. A validação territorial e a janela operacional continuam pendentes.

## 1. O que os materiais pedem

O PDF oficial, página 27, permite **qualquer linguagem** e pede um backend integrado à CitizenTech, com código no GitHub, README de execução e integrantes, documentação dos endpoints e evidências.

| Critério oficial | Peso | Como demonstrar no Água na Rua |
|---|---:|---|
| Estruturação do domínio | 3,0 | Entidades e regras do problema separadas de HTTP e persistência |
| Conexão com banco | 3,0 | CRUD persistente de pontos, observações relacionadas e consulta por período |
| Migrações | 1,5 | Criação, evolução do esquema e dados de demonstração versionados |
| Documentação automática | 1,5 | OpenAPI gerada do código e interface navegável com exemplos e erros |
| Testes automatizados | 1,0 | Regras do domínio e contrato HTTP verificados por comando documentado |

O guia HTML detalha: CRUD completo de pelo menos uma entidade; relacionamento com chave estrangeira; consulta além do CRUD; DTOs; pelo menos duas migrações, incluindo evolução do esquema; seed versionado; testes unitários e pelo menos um teste da API. Usaremos esses detalhes como checklist de preparação.

Não há exigência nesses materiais de SOAP, barramento, vários microsserviços ou implantação em nuvem. Um serviço REST organizado cobre o recorte descrito pelo professor.

## 2. Decisão de linguagem e ferramentas

**Decisão confirmada pelo usuário:** backend de SOA independente em **Node.js**, separado do backend de C#.

**Ferramentas implementadas:** TypeScript, NestJS 11, TypeORM 1, PostgreSQL 17, Swagger/OpenAPI e testes com Jest, ts-jest e Supertest. NestJS e TypeORM seguem a pilha Node demonstrada no HTML do professor. O executor Jest em CommonJS preserva os metadados de decorators na compilação dos testes. As versões estão fixadas no package.json e no lockfile.

O domínio será TypeScript puro. Classes de domínio não terão decorators de NestJS, TypeORM ou Swagger. Os modelos de persistência ficarão na infraestrutura; os DTOs HTTP ficarão na API.

As dependências serão instaladas no projeto de SOA, com lockfile versionado. A conexão virá do ambiente, com `.env.example` e sem credenciais reais no Git. A implementação e as migrações serão próprias de SOA.

## 3. Recorte do backend

**Problema, conforme a ficha:** quem depende de ruas sujeitas a alagamento enfrenta dificuldade para encontrar informações recentes e localizadas sobre água acumulada no seu caminho.

A primeira versão permitirá cadastrar e consultar pontos acompanhados, registrar observações e consultar a observação mais recente de cada ponto com horário, origem e indicação de atualização.

O recorte inicial terá aproximadamente três pontos de demonstração, identificados como simulados. Ruas reais e sua necessidade atual de acompanhamento dependem de validação pelo grupo.

Favoritos continuam previstos na persistência local do app. ML, Wokwi, notificações e transmissão de sensores não são dependências desta entrega. O registro manual de observações já permite demonstrar o backend completo.

## 4. Entidades e significado dos dados

### PontoMonitorado

Representa um trecho ou local acompanhado. Campos propostos: `id`, `nome`, `cidade`, `bairro`, `referenciaLocal`, `latitude`, `longitude`, `dadosSimulados` e `criadoEm`.

Nome e localização devem ser válidos. Latitude e longitude precisam respeitar seus intervalos geográficos. Pontos usados apenas na demonstração devem ser identificáveis como simulados.

### Observacao

Representa uma informação sobre um ponto em determinado instante. Campos propostos: `id`, `pontoId`, `condicaoRelatada`, `observadoEm`, `registradoEm`, `origem` e `dadosSimulados`.

Condições propostas: `SEM_AGUA_APARENTE`, `AGUA_ACUMULADA` e `ALAGAMENTO_RELATADO`. Esses termos descrevem o relato e não comprovam segurança para passagem.

Para a primeira versão, a origem será `RELATO_MANUAL`, atribuída pelo serviço. Não será permitido ao cliente declarar que um relato veio de sensor ou órgão oficial. `dadosSimulados` indica a natureza dos dados, independentemente de sua origem.

Usaremos campos estruturados e não solicitaremos nome, telefone, CPF ou endereço residencial do autor. Texto livre e identificação de usuários ficam fora do primeiro recorte.

### Relacionamento

Um `PontoMonitorado` possui zero ou muitas `Observacao`. Cada observação pertence a exatamente um ponto, com chave estrangeira no banco.

### Resumo da informação

O resumo será calculado na consulta, sem uma terceira tabela. Ele conterá `ultimaObservacao` e `atualizacao`, com valores `RECENTE`, `ANTIGA` ou `SEM_INFORMACAO`.

Condição relatada e atualização são informações diferentes. Por exemplo: uma observação pode relatar água acumulada e estar antiga.

## 5. Regras de negócio propostas

| ID | Regra | Verificação principal |
|---|---|---|
| RN01 | Uma observação precisa estar vinculada a um ponto existente | Ponto inexistente resulta em 404, sem gravar observação |
| RN02 | `observadoEm` não pode ser posterior ao instante atual | Horário futuro resulta em 422 |
| RN03 | O serviço define `registradoEm`; o consumidor não escolhe esse horário | A resposta contém o instante de registro atribuído pelo serviço |
| RN04 | Sem observações, o ponto fica `SEM_INFORMACAO`, com `ultimaObservacao: null` | A API não cria uma condição de rua livre |
| RN05 | A atualização depende da idade da observação | Limites da janela de atualização são testados |
| RN06 | A última observação é escolhida por `observadoEm`, não pela ordem de chegada | Um relato antigo registrado depois não substitui um mais recente |
| RN07 | Pontos com observações não podem ser excluídos | DELETE retorna 409 e preserva o histórico |
| RN08 | Consultas por período exigem início menor ou igual ao fim | Intervalo invertido resulta em 422 |
| RN09 | Observações de pontos simulados também devem ser simuladas | Tentativa de apresentar o dado como real resulta em 422 |
| RN10 | Coordenadas e natureza simulada identificam o ponto e são imutáveis no PUT | Mudança de identidade resulta em 422; demais campos do cadastro podem ser corrigidos |

**Parâmetro provisório de demonstração:** uma observação é recente por até 30 minutos, inclusive. Acima disso é antiga. Esse número é uma escolha inicial do protótipo, sem validação operacional; deverá ser discutido com o grupo. Usaremos um relógio substituível nos testes para verificar os limites de forma determinística.

Os horários terão fuso explícito na entrada e serão normalizados para UTC. Empates em `observadoEm` serão resolvidos por `registradoEm` e identificador, para manter uma ordem estável.

Validação de formato ocorre nos DTOs. Regras de negócio ficam no domínio; a aplicação coordena a busca do ponto, a execução das regras e a persistência.

## 6. Contrato HTTP inicial proposto

| Método e rota | Finalidade | Sucesso | Principais erros |
|---|---|---|---|
| `POST /pontos` | Cadastrar ponto | 201 e localização do recurso | 400, 422 |
| `GET /pontos` | Listar com filtro por bairro e paginação | 200 | 400 |
| `GET /pontos/{id}` | Consultar ponto | 200 | 400, 404 |
| `PUT /pontos/{id}` | Atualizar cadastro preservando coordenadas e natureza dos dados | 200 | 400, 404, 422 |
| `DELETE /pontos/{id}` | Excluir ponto sem observações | 204 | 400, 404, 409 |
| `POST /pontos/{id}/observacoes` | Registrar observação | 201 e localização do recurso | 400, 404, 422 |
| `GET /pontos/{id}/observacoes` | Consultar histórico por período, com paginação | 200 | 400, 404, 422 |
| `GET /pontos/{id}/observacoes/{observacaoId}` | Consultar observação registrada | 200 | 400, 404 |
| `GET /pontos/{id}/resumo` | Consultar última observação e atualização | 200 | 400, 404 |

Um ponto existente sem observações terá histórico vazio com 200. Um ponto inexistente retornará 404. O resumo de um ponto existente sem observações retornará 200 com `SEM_INFORMACAO`.

Proposta de parâmetros para histórico: `de`, `ate`, `pagina` e `tamanho`. Ordenação da observação mais recente para a mais antiga; paginação limitada para evitar respostas sem limite.

Os DTOs não devolverão diretamente entidades ORM. O contrato documentará campos obrigatórios, enums, limites, exemplos, paginação e os erros efetivamente implementados.

## 7. Estrutura prevista

```text
soa/
  README.md                 # ficha comum, execução, testes e evidências
  PLANO.md
  package.json
  package-lock.json
  .env.example
  compose.yaml              # PostgreSQL de desenvolvimento
  src/
    dominio/                # entidades, valores e regras; TypeScript puro
    aplicacao/              # casos de uso e interfaces de repositório
    infraestrutura/         # ORM, repositórios e configuração do banco
    api/                    # controllers, DTOs e tratamento de erros
    migrations/             # histórico versionado do esquema
    main.ts
  tests/
    unidade/
    integracao/
  evidencias/               # registros reais da execução
```

O domínio não importa API ou infraestrutura. A infraestrutura implementa os contratos de persistência usados pela aplicação. O ponto de composição conecta as implementações aos casos de uso.

A estrutura foi implementada; os arquivos adicionais de configuração, scripts e evidências estão descritos no README.

## 8. Ordem de implementação

1. Criar o projeto Node/TypeScript e os comandos de desenvolvimento, build e testes.
2. Implementar o domínio e testar as regras centrais, especialmente ausência de informação, horários e atualização.
3. Configurar PostgreSQL, modelos ORM, chave estrangeira e primeira migração.
4. Implementar CRUD de pontos e verificar persistência após reiniciar a aplicação.
5. Implementar registro, histórico e resumo das observações.
6. Registrar uma evolução real do esquema em nova migração e incluir seed versionado de demonstração. Não criar migrações vazias só para atingir quantidade.
7. Gerar OpenAPI pelo código com Swagger UI, descrições, tags, exemplos e respostas de erro.
8. Testar o contrato HTTP usando banco de teste separado; conferir migrações em banco vazio.
9. Escrever e executar as instruções do README, capturar evidências e preparar o repositório para avaliação.

O primeiro fluxo completo será: cadastrar ponto, registrar observação e consultar resumo persistido. Depois serão completados os demais endpoints e cenários.

## 9. Checklist baseado na autoavaliação do HTML

Os itens técnicos abaixo foram implementados e verificados localmente; a matriz de requisitos aponta os arquivos e evidências. Publicação em preparação; envio acadêmico pendente.

### Domínio - 3,0

- [x] Nomes e entidades ligados ao problema (0,5).
- [x] Separação entre domínio, aplicação, infraestrutura e API (0,75).
- [x] Pelo menos duas regras de negócio no domínio (0,75).
- [x] DTOs de entrada e saída com validação (0,5).
- [x] Relacionamento entre entidades (0,5).

### Banco - 3,0

- [x] Banco relacional persistente (0,75).
- [x] Conexão pelo ambiente e `.env.example` (0,5).
- [x] CRUD completo de uma entidade persistindo (0,75).
- [x] Chave estrangeira no relacionamento (0,5).
- [x] Consulta além do CRUD, com filtro, período, ordenação ou paginação (0,5).

### Migrações - 1,5

- [x] Ferramenta configurada, sem criação automática do esquema pelo ORM (0,5).
- [x] Criação e evolução do esquema em migrações distintas (0,5).
- [x] Dados simulados por migração ou seed versionado (0,25).
- [x] Comando de criação do banco do zero documentado e verificado (0,25).

### Documentação automática - 1,5

- [x] OpenAPI gerada e acessível em interface navegável (0,5).
- [x] Resumos e tags em todos os endpoints (0,25).
- [x] Exemplos de entrada e saída (0,25).
- [x] Respostas de erro documentadas (0,25).
- [x] Link e print da documentação no README (0,25).

### Testes - 1,0

- [x] Testes de regras sem banco nem HTTP (0,4).
- [x] Pelo menos um teste da API verificando status e corpo (0,3).
- [x] Um comando executa os testes; comando e evidência no README (0,3).

## 10. Conexão com Testing, Compliance & Quality Assurance

O PDF, página 39, pede Features com descrição e critérios de aceite no Azure Boards (50%) e Test Cases funcionais positivos e negativos, de caixa-preta (50%). Cada caso precisa de objetivo, preparação, entradas, saídas esperadas e passos.

Também pede adicionar o professor como Admin, informar o link do projeto e reunir prints da relação e dos detalhes das Features e dos Test Cases em um único PDF. A página 23 orienta enviar, em Testing, o link de um pitch no YouTube de até quatro minutos.

A proposta já permite preparar Features de consulta de pontos, registro de observações e consulta de atualização/histórico. Favoritos pertencem à jornada do app e podem entrar no planejamento funcional do grupo mesmo estando fora da API inicial.

Os testes automatizados de SOA não substituem os Test Cases do Azure. Os comportamentos precisam ser consistentes entre código, documentação e critérios de aceite. O padrão específico ensinado em aula ainda não está nos arquivos fornecidos.

## 11. Pendências e dúvidas reais

- **Validação territorial:** quais três pontos serão acompanhados e que evidência atual confirma a necessidade? A ficha ainda apresenta essa investigação como futura. O histórico de drenagem citado nela não foi verificado nesta análise de requisitos.
- **Atualização:** combinar a janela de informação recente; 30 minutos é apenas uma proposta inicial.
- **Coordenação:** confirmar quem fornece os pontos e quem consumirá o contrato Node, para evitar que o app dependa de detalhes do backend de C#.
- **Testing, na próxima etapa:** obter o modelo usado em aula, o projeto Azure e a identificação do professor. Ainda não houve criação ou alteração em conta externa.
- **GitHub:** repositório local e remoto configurados, com link preenchido na ficha; aguardando confirmação do primeiro push.
- **Presença:** a página 23 diz “Sem chamadas durante a GS”; a página 24 diz “com chamada” a partir de 05/11. Confirmar com a coordenação/professor. Isso não impede desenvolver SOA.

O prazo de entrega é consistente: **19/11/2026, às 23h55**. A semana de orientação indicada é de 16 a 19/11.

## 12. Referências de implementação

Documentação oficial consultada em 11/11/2026 para conferir a proposta técnica:

- [Primeiros passos do NestJS](https://docs.nestjs.com/first-steps).
- [Integrações de banco do NestJS](https://docs.nestjs.com/techniques/database).
- [Geração de OpenAPI e Swagger](https://docs.nestjs.com/openapi/introduction).

O ambiente verificado tem Node.js 22.23.4, npm 10.9.9 e Docker Compose. O PostgreSQL de desenvolvimento e o de teste foram executados. A API, as migrações e os testes estão funcionando; os registros estão em evidencias/.
