# Revisão detalhada do backend de SOA

Data: 11/11/2026. Revisão do código e da entrega local, após a implementação inicial.

**Atualização de publicação em 11/11/2026:** código e evidências publicados em [agua-na-rua-GS-SOA-2026](https://github.com/CezarBacanieski/agua-na-rua-GS-SOA-2026). A pendência de versionamento foi resolvida após a revisão técnica; o envio acadêmico e a fundamentação territorial permanecem pendentes.

## Parecer

A implementação, após as correções desta revisão, cobre o conteúdo técnico dos cinco critérios fornecidos para SOA. A publicação no GitHub e o preenchimento do link foram concluídos após a revisão técnica. O envio do link ao professor permanece pendente. O vínculo com um problema territorial real também precisa ser sustentado por evidências do grupo.

Não se atribui nota nesta revisão. Existência de código, quantidade de testes e cobertura não garantem a pontuação do professor. A própria página HTML informa que seus subitens são uma leitura da rubrica.

## Base da conferência

- [PDF oficial](<../GS CitizenTech - 3ES Fev - FIAP 2026 -  (1).pdf>), página 27: entregáveis e cinco critérios de SOA.
- PDF, páginas 17 a 21: problema real, cidadão, pesquisa, ficha sugerida, uso de IA e dados.
- PDF, página 23: prazo e envio por um integrante.
- [HTML do professor](<../Global Solution 2026.2_Arquitetura Orientada a Serviços e Web Services 1.html>): 22 subitens de autoavaliação extraídos e conferidos, com pesos somando 10,0.
- Código fonte completo, scripts, Compose, README, migrações, testes e evidências. A conferência foi feita além da matriz escrita anteriormente.

## Achados corrigidos

### R1 - Entrada inválida podia resultar em erro interno (prioridade média)

**Reprodução:** `POST /pontos` com um caractere nulo em um campo textual e `GET /pontos?bairro=%00` retornavam 500. DTO e domínio aceitavam o texto, mas o PostgreSQL recusava o caractere.

**Correção:** validação de caracteres nulos nos DTOs de cadastro e filtro; o construtor do domínio também recusa esse conteúdo sem depender de HTTP ou SQL.

**Verificação:** testes positivos e negativos no domínio e por HTTP. As mesmas duas requisições agora retornam 400 na API em execução, registradas em [revisao-http.json](evidencias/revisao-http.json).

Arquivos: [domínio](src/dominio/ponto-monitorado.ts), [DTOs](src/api/dtos.ts), [testes HTTP](tests/integracao/api.spec.ts).

### R2 - Geração de migrações podia remover proteções do banco (prioridade média)

**Reprodução:** o comando `migration:generate --check`, sem modificar arquivos ou banco, identificou diferenças. O SQL sugerido removia nove restrições CHECK e o índice de consulta do histórico. As migrações existentes funcionavam, mas esses elementos não estavam representados no mapeamento ORM.

**Correção:** as restrições CHECK foram declaradas no mapeamento com os mesmos nomes usados pelo PostgreSQL. Os índices com expressão ou ordenação específica foram identificados como mantidos pelas migrações, com `synchronize: false` no metadata de cada índice. Isso não ativa sincronização automática do esquema.

**Verificação:** um novo teste exige ausência de SQL de alteração entre ORM e banco. `npm run migration:check` passou com a mensagem de que não existem alterações de esquema. Registro em [compatibilidade-esquema.txt](evidencias/compatibilidade-esquema.txt).

As três migrações já aplicadas **não foram reescritas**; a correção foi no metadata das entidades. Não houve necessidade de mudar o esquema existente.

Arquivos: [entidades ORM](src/infraestrutura/entidades.ts), [teste de migrações](tests/integracao/migracoes.spec.ts) e [comandos npm](package.json).

### R3 - Evidência antiga podia sobreviver a uma execução reprovada (prioridade média)

**Cenário no código anterior:** se Docker, build ou tipagem falhassem antes de chamar o Jest, o JSON de uma execução anterior aprovada continuava no disco. O capturador verificava apenas esse JSON e podia apresentar um resultado antigo como atual.

**Correção:** o comando registra o estado da última execução e invalida o JSON anterior antes do preflight. A captura exige estado APROVADA e resultado do Jest iniciado depois do começo desse comando.

**Verificação:** uma suíte de ferramentas simula uma falha de preflight em pasta temporária, sem criar serviços Docker. Ela confirma que o resultado anterior é removido, que o estado muda para FALHOU e que a captura é recusada. Isso não fabrica uma falha da aplicação: é um teste controlado do fluxo de evidências.

Arquivos: [executor](scripts/testar.mjs), [capturador](scripts/capturar-evidencias.mjs), [regressão](tests/ferramentas/evidencias.spec.ts) e [estado atual](evidencias/ultima-execucao.json).

### R4 - Limite Unicode divergente entre domínio e contrato (prioridade baixa)

O domínio usava `string.length`, que conta unidades UTF-16, enquanto o limite do contrato, a validação de entrada e o PostgreSQL consideram caracteres Unicode. Um nome com 100 caracteres fora do plano básico, como emojis, era aceito pelo DTO e recusado pelo domínio.

O domínio agora conta caracteres Unicode. O limite de 100 é aceito e o caractere excedente é recusado; ambos foram testados, inclusive com persistência real via HTTP.

### Melhoria da comprovação dos testes

A evidência anterior mostrava um relatório de resultados estruturados, com o log recolhido. Foi acrescentado um [print da saída real dos comandos](evidencias/testes-saida.png), referenciado no README. O arquivo é uma captura da saída exibida em relatório HTML, identificado como tal; não é apresentado como captura de um terminal.

## Resultado por critério

| Critério oficial | Peso | Resultado técnico local | Evidência central |
|---|---:|---|---|
| Estruturação do domínio | 3,0 | Atendido no código | Entidades com regras, camadas, DTOs, relação entre ponto e observação e testes sem HTTP/banco |
| Conexão com banco | 3,0 | Atendido e verificado em PostgreSQL | CRUD completo, chave estrangeira, parâmetros de ambiente, consultas e persistência entre processos |
| Migrações | 1,5 | Implementação, versionamento e publicação atendidos | Criação, evolução, seed, histórico, rollback, instalação limpa e compatibilidade ORM/banco |
| Documentação automática | 1,5 | Atendido localmente | Dez operações em Swagger/OpenAPI, resumos, tags, exemplos, erros, parâmetros funcionais e prints |
| Testes automatizados | 1,0 | Atendido e reexecutado | Comando único, testes de domínio e HTTP, status/corpo conferidos e evidências atualizadas |

A [matriz de requisitos](MATRIZ-REQUISITOS.md) localiza os 22 subitens nos arquivos. Não foi identificado um endpoint, uma tabela ou uma regra adicional obrigatória nos materiais fornecidos que esteja ausente do recorte técnico implementado.

O CRUD de uma entidade é suficiente segundo o guia; Pontos possui esse CRUD. Observações são registros preservados de histórico, sem edição ou exclusão pública. O guia não exige CRUD completo de todas as entidades, três entidades mínimas, SOAP, vários microsserviços, autenticação, hospedagem em nuvem ou integração física de sensor nesta entrega de SOA.

## Verificações executadas

- `npm run test:coverage`: build, tipagem, quatro suítes e **95 testes aprovados**.
- `npm run migration:check`: nenhuma alteração inesperada proposta pelo gerador.
- Teste de migrações: banco vazio, evolução com cadastro da primeira versão, seed sem duplicação, rollback completo e chave estrangeira RESTRICT.
- Instalação limpa: `npm ci`, novo `.env`, novo banco/volume em projeto Docker temporário, subida da API e recuperação de cadastro após encerrar e iniciar outro processo.
- Swagger: página carregada no navegador e GET /pontos executado pela interface com resposta 200.
- Contrato: 46 referências internas de schema verificadas e todos os parâmetros de paginação documentados como inteiros.
- Regressão de entradas nulas: duas requisições reais agora recusadas com 400.
- README e matriz: links locais e existência dos arquivos conferidos; ficha comum preservada no início do README de SOA.
- Credencial de desenvolvimento: busca exata sem exibir a senha, verificando que ela não foi incluída nos arquivos de entrega. `.env` e diretórios gerados estão previstos no `.gitignore`. Na auditoria anterior à publicação ainda não havia histórico Git; os arquivos versionados também foram conferidos na etapa de publicação para impedir inclusão da credencial local.

| Suíte | Casos | Resultado |
|---|---:|---|
| `ferramentas/evidencias.spec.ts` | 1 | Aprovada |
| `integracao/api.spec.ts` | 46 | Aprovada |
| `integracao/migracoes.spec.ts` | 3 | Aprovada |
| `unidade/dominio.spec.ts` | 45 | Aprovada |

Cobertura de linhas de domínio/aplicação: **98,05%**; funções: **100%**. Essa medição não representa cobertura de infraestrutura, controllers ou scripts. Os testes HTTP exercitam parte dessas camadas, mas não se está afirmando cobertura integral delas.

[Log de testes](evidencias/testes.txt) · [Resultado JSON](evidencias/testes.json) · [Instalação limpa](evidencias/instalacao-limpa.txt) · [Relatório visual](evidencias/verificacao.png)

## Pendências que ainda impedem tratar a entrega como concluída

### P1 - Repositório publicado; envio acadêmico pendente

O PDF exige **link do GitHub** com código, README, documentação e evidências. A revisão identificou originalmente a ausência de Git e do link preenchido. Essa parte foi resolvida com o versionamento e a publicação autorizados pelo usuário em 11/11/2026.

Versionamento, publicação, preenchimento do link e acesso público foram conferidos. A equipe ainda precisa enviar o link na tarefa de SOA por um integrante, até **19/11/2026, às 23h55**. O envio acadêmico não foi realizado.

A publicação precisa preservar a estrutura de arquivos referenciada pelos READMEs, incluindo `soa/`, o registro de prompts e os arquivos usados como fontes; se a estrutura publicada mudar, os links relativos precisam ser ajustados e conferidos.

### P2 - Evidência territorial e interpretação pela equipe

As páginas 17 a 19 do PDF pedem um problema real e contato com quem convive com ele. Os arquivos atuais ainda descrevem a seleção dos pontos e conversas com moradores como atividades futuras. A afirmação sobre histórico de drenagem e intervenções no Jardim Peri não veio acompanhada, nesta pasta, de evidência territorial atual que tenha sido verificada nesta revisão.

A equipe deve documentar a observação do problema e a escolha dos pontos sem expor dados pessoais de moradores. Dados simulados são permitidos no protótipo; isso não substitui fundamentar o problema real da CitizenTech.

A janela de 30 minutos continua sendo uma hipótese configurável, identificada como tal. O funcionamento dessa regra está testado; sua adequação à realidade ainda não foi validada.

Cada integrante também precisa compreender e explicar o projeto, como pede a página 21. Isso depende da equipe e não é comprovado pela execução dos testes.

## Limites e cuidados já documentados

- Dados de demonstração explicitamente fictícios; não há comprovação de condição atual das ruas nem de redução de danos.
- Rotas de escrita abertas para a demonstração acadêmica local; autenticação e moderação não fazem parte do recorte implementado nem aparecem como requisitos de SOA no material fornecido.
- A auditoria de produção registrada reportou zero vulnerabilidades. A auditoria completa tem seis avisos baixos na cadeia de ferramentas de desenvolvimento, documentados no README. Os relatórios são datados e não constituem garantia futura.
- A publicação no GitHub foi autorizada e realizada após a revisão técnica. Não houve convite a professores nem envio de trabalho no Teams ou Portal.

## Conclusão da revisão

Os problemas reproduzidos foram corrigidos e receberam testes. O backend está tecnicamente preparado para a entrega de SOA segundo os materiais disponíveis. O código está publicado no GitHub. O encerramento da entrega depende do envio acadêmico e da fundamentação territorial pelo grupo; não é correto tratar esses passos como concluídos nem prometer nota máxima.
