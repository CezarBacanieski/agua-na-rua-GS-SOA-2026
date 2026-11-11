# Matriz de requisitos e evidências - SOA

Referências: página 27 do [PDF oficial](<../GS CitizenTech - 3ES Fev - FIAP 2026 -  (1).pdf>) e autoavaliação do [HTML do professor](<../Global Solution 2026.2_Arquitetura Orientada a Serviços e Web Services 1.html>). Os critérios e pesos principais são oficiais; os subitens são a leitura da rubrica oferecida pelo guia, sujeita à avaliação do professor.

Revisada contra os 22 subitens do HTML em 11/11/2026. O relatório de achados está em [REVISAO-SOA.md](REVISAO-SOA.md). Esta matriz registra implementação e verificação local, sem atribuir uma nota ao grupo. O link do GitHub e o envio no Teams ainda estão pendentes.

## Estruturação do domínio - 3,0

| Item do guia | Peso | Implementação e verificação |
|---|---:|---|
| Entidades e nomes do problema | 0,5 | [PontoMonitorado](src/dominio/ponto-monitorado.ts), [Observacao](src/dominio/observacao.ts) e [ResumoInformacao](src/dominio/consulta.ts) |
| Domínio, aplicação, infraestrutura e API separados | 0,75 | Pastas em `src/`; domínio não importa framework nem banco; composição em [modulo-api.ts](src/api/modulo-api.ts) |
| Pelo menos duas regras no domínio | 0,75 | Horário não futuro, ausência de informação, janela de atualização, identidade territorial, natureza simulada e proteção de histórico; [testes unitários](tests/unidade/dominio.spec.ts) |
| DTOs com validação na entrada e saída separada da entidade | 0,5 | [dtos.ts](src/api/dtos.ts), ValidationPipe estrita em [bootstrap.ts](src/bootstrap.ts), mapeamento explícito nos DTOs de saída |
| Relacionamento no domínio | 0,5 | Observacao pertence a PontoMonitorado; `Observacao.registrar` recebe o ponto e protege a natureza dos dados; relação 1:N também mapeada no ORM |

## Banco de dados - 3,0

| Item do guia | Peso | Implementação e verificação |
|---|---:|---|
| Banco relacional persistente | 0,75 | PostgreSQL 17 no [Compose](compose.yaml), volume para desenvolvimento; teste fecha API e conexão e recupera o registro em novas instâncias |
| Conexão pelo ambiente, credenciais fora do Git e .env.example | 0,5 | [configuracao.ts](src/infraestrutura/configuracao.ts), [.env.example](.env.example), gerador de senha local e [.gitignore](../.gitignore) |
| CRUD completo persistido | 0,75 | [PontosService](src/aplicacao/pontos.service.ts), [controller](src/api/pontos.controller.ts) e [repositório](src/infraestrutura/repositorio-typeorm.ts); POST/GET/PUT/DELETE verificados por HTTP |
| Relacionamento com chave estrangeira | 0,5 | `fk_observacao_ponto`, ON DELETE RESTRICT na [primeira migração](src/migrations/1794394800000-CriaPontosEObservacoes.ts); teste também tenta exclusão direta no banco |
| Consulta além do CRUD | 0,5 | Bairro, paginação, período inclusivo, ordenação, desempate e última observação no [repositório](src/infraestrutura/repositorio-typeorm.ts) |

## Migrações - 1,5

| Item do guia | Peso | Implementação e verificação |
|---|---:|---|
| Ferramenta, histórico e ausência de auto-DDL | 0,5 | TypeORM, `historico_migracoes`, `synchronize: false`, `migrationsRun: false`; API recusa iniciar com migrações pendentes; [checagem de compatibilidade ORM/banco](evidencias/compatibilidade-esquema.txt) sem alterações inesperadas |
| Criação e evolução em migrações distintas | 0,5 | [Criação](src/migrations/1794394800000-CriaPontosEObservacoes.ts) e [referência/índices](src/migrations/1794394801000-AdicionaReferenciaEIndices.ts); teste evolui um registro legado e preserva seus dados |
| Seed de dados simulados | 0,25 | [CarregaDemonstracao](src/migrations/1794394802000-CarregaDemonstracao.ts), três pontos e três observações fictícias |
| Comando de criação do zero no README | 0,25 | `npm run db:init` no [README](README.md); [instalação em pasta e banco novos](evidencias/instalacao-limpa.txt); [teste de migrações](tests/integracao/migracoes.spec.ts) verifica reaplicação e rollback |

## Documentação automática - 1,5

| Item do guia | Peso | Implementação e verificação |
|---|---:|---|
| OpenAPI gerada com interface navegável | 0,5 | Swagger UI em `/docs`, JSON em `/openapi.json`, configurados em [bootstrap.ts](src/bootstrap.ts) |
| Resumo e tag em todos os endpoints | 0,25 | Controllers de pontos, observações e saúde; [teste HTTP](tests/integracao/api.spec.ts) confere as dez operações |
| Exemplos de entrada e saída | 0,25 | `ApiProperty` nos [DTOs](src/api/dtos.ts); contrato gerado e execução visual conferidos |
| Erros documentados | 0,25 | [ProblemaDto, ApiErros e filtro](src/api/erros.ts); erros 400, 404, 409, 422, 500 e 503 documentados conforme a rota |
| Link e print da documentação no README | 0,25 | [Visão do Swagger](evidencias/swagger.png) e [GET executado pela interface](evidencias/swagger-execucao.png), referenciados no README |

## Testes automatizados - 1,0

| Item do guia | Peso | Implementação e verificação |
|---|---:|---|
| Testes de regras sem HTTP e banco | 0,4 | [dominio.spec.ts](tests/unidade/dominio.spec.ts) |
| Teste da API com status e corpo | 0,3 | [api.spec.ts](tests/integracao/api.spec.ts), com PostgreSQL real e relógio controlado |
| Um comando, documentado e com evidência | 0,3 | `npm test`; [saída real](evidencias/testes.txt), [JSON do executor](evidencias/testes.json), [print da saída real](evidencias/testes-saida.png) e [relatório visual](evidencias/verificacao.png) |

## Combinados gerais e estado da entrega

- Ficha comum no início do README de SOA, nomes e RMs dos quatro integrantes.
- Dados do seed fictícios e identificados; ausência de coleta de dados pessoais de autores.
- Uso de IA registrado em [prompts.md](../prompts.md), conforme a página 21 do PDF.
- Evidências reais descritas em [evidencias/README.md](evidencias/README.md).
- Backend independente de C#, Mobile, ML e Wokwi para execução e teste.
- Pendentes: validação dos locais e janela recente com moradores, publicação no GitHub, link da ficha e envio por um integrante na tarefa da disciplina.

A implementação local cobre os itens técnicos acima. A validação territorial não foi simulada nem apresentada como concluída. A pontuação final e eventuais orientações adicionais da turma dependem do professor.

**Limite de entrega:** existem arquivos de migração e lockfile preparados para versionamento, mas esta pasta ainda não é um repositório Git. O histórico de commits, o link GitHub e a acessibilidade ao professor só poderão ser verificados após a publicação.
