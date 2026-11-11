# Registro de uso de IA

Este arquivo registra o uso de IA nesta pasta a partir de 11/11/2026. Prompts anteriores à criação deste registro não foram fornecidos e não estão sendo reconstruídos.

## 11/11/2026 - Leitura dos materiais e preparação de SOA

**Ferramenta:** Codex.

**Pedido do usuário (transcrição):**

> eu tenho um trabalho pra fazer que é a global solution, eu tenho ela todo semestre na fiap, as materias que vou precisar fazer sao a de soa que é arquitetura orientada a servico e Testing, Compliance & Quality Assurance
>
> esse agua na rua.md que coloquei aqui junto apra vc ler é a ideia que eu e meu grupo decidimos abordar, eu quero usar essa pasta gs que criei pra eu fazer os trabalhos dentro dela, quero comecar fazendo soa, esse .html que temos aqui dentro é oq o professor colocou tb no teams, quero que vc leia tudo e entenda pra me ajudar a comecar a fazer soa, se tiver alguam duvida me avise, leia tanto o pdf oficial da gs, quando site, quanto o html e todo o resto que tenho, seja um especialisat em engenharia de software

**Esclarecimento posterior do usuário (transcrição):**

> vamos fazer separado, back de soa vamos fazer em node memso que é mais facil e o professor autorizou ne

**Materiais consultados:** PDF oficial de 40 páginas; guia HTML de SOA; `agua-na-rua.md`; `inegrantes.md`; `link-sitegs.md`; conteúdo público do site oficial da GS; documentação oficial do NestJS sobre primeiros passos, banco e OpenAPI (links no plano de SOA).

**Apoio da IA:** interpretação dos requisitos e pesos; proposta de recorte do backend, entidades, regras, endpoints, ferramentas e sequência de implementação; identificação de pendências; preparação do README e do plano de SOA; atualização da ficha para separar os backends Node e C#.

**Limites do resultado:** planejamento ainda sem implementação da API. Janela de atualização de 30 minutos e detalhes do contrato são propostas, não requisitos do professor nem validação com moradores. Não foram produzidas evidências de aplicação funcionando, testes passando ou impacto comprovado.

**Revisão necessária pela equipe:** compreender as decisões, validar o recorte com moradores e alinhar o contrato com os demais integrantes antes de apresentar o projeto como concluído.

## 11/11/2026 - Conferência de prompts e vídeo de Testing

**Pedido do usuário (transcrição):**

> pq isso de registrar prompts? precisa relamente disso? acho que emu amgio que gez esse md do agua na rua errou, em algum documento da gs pede pra registrar prompt? e tb na materia de qa fala que tem gravar video em algum lugar? se nao tiver ja tire tb do agua na rua .ms isso de video de qa, mas leia bem as coisas da gs oficial

**Verificação:** releitura do PDF oficial, com conferência visual das páginas 21 e 23 e conferência da página 39, já inspecionada visualmente na análise inicial. A página 21 orienta registrar prompts em `prompts.md`. A página 23 orienta enviar na disciplina de Testing o link de um pitch no YouTube de até quatro minutos, sob o título “Pitch (Prêmio melhor GS)”. A página 39 distribui a avaliação de QA entre Features e Test Cases e não inclui vídeo nessa rubrica.

**Resultado:** mantidas as duas menções na ficha, com referências às páginas e esclarecimento de que o pitch consta nas regras gerais da GS. O PDF não declara expressamente se esse pitch é opcional nem lhe atribui peso na rubrica de QA.


## 11/11/2026 - Implementação e verificação do backend de SOA

**Pedido do usuário (transcrição):**

> ok então vamos la comece a produzir nosso backend de soa, seja um engenheiro de softwrae senior para elr todos os requisitos que temos no html que o professor mandou pra gente e tb no pdf da gs pra garantir que estamso cumrpindo tudo e que vamso tirar nota maxima

**Materiais conferidos:** rubrica de SOA na página 27 do PDF e texto completo dos requisitos e da autoavaliação do HTML. Documentação oficial de validação, Swagger e testes do NestJS e migrações do TypeORM; versões e compatibilidade conferidas no registro npm.

**Apoio da IA:** implementação do domínio, casos de uso, contratos de repositório e relógio, persistência TypeORM/PostgreSQL, três migrações com evolução e seed, controllers/DTOs, documentação automática, configuração local, testes, scripts de evidências, README e matriz de requisitos. A ficha comum foi reproduzida no README de SOA.

**Decisões adotadas:** backend Node independente do C#; NestJS 11 em CommonJS e Jest/ts-jest para preservar metadados de decorators; PostgreSQL também nos testes; proteção de coordenadas e natureza do ponto para não reatribuir histórico; origens e horários de registro atribuídos pelo servidor.

**Verificação:** build e tipagem; 81 testes em três suítes; migrações do zero e rollback; persistência entre instâncias; contrato OpenAPI; consulta executada no navegador pela interface Swagger. A conferência visual identificou e levou à correção do tipo dos parâmetros de paginação no contrato. Os relatórios reais ficam em soa/evidencias/.

**Limites:** janela de 30 minutos continua como hipótese configurável; seed totalmente fictício; nenhuma validação de ruas, impacto ou moradores foi fabricada; publicação no GitHub e envio acadêmico permanecem pendentes. O código cobre os critérios técnicos fornecidos, mas a IA não garante a nota atribuída pelo professor.

**Verificação adicional concluída:** instalação por `npm ci` em pasta temporária sem `.env` e sem `node_modules`, criação de banco/volume novos em projeto Docker isolado, aplicação das migrações e persistência após reiniciar o processo. Recursos temporários removidos. Registro em `soa/evidencias/instalacao-limpa.txt`. A revisão final confirmou links locais, ficha comum idêntica e ausência da senha local nos arquivos de entrega.


## 11/11/2026 - Revisão detalhada de conformidade e código

**Pedido do usuário (transcrição):**

> seja um engenheiro de softwrae senior para ver se realmente cobre todos os criterios que o professor pediu, revise detalhadamente

**Trabalho da IA:** revisão independente da matriz anterior, conferindo PDF, 22 subitens do HTML, código fonte, migrações, contrato, testes, scripts e documentação. Reproduziu retorno 500 em textos/filtro com caractere nulo e divergência de esquema que faria o gerador remover restrições/índice. Identificou também a possibilidade de reutilizar evidência antiga após falha anterior ao Jest e uma divergência de limite Unicode. Corrigiu esses comportamentos sem reescrever migrações já aplicadas, acrescentou regressões e proteção do estado das evidências.

**Resultado:** 95 testes aprovados em quatro suítes; compatibilidade ORM/banco sem alterações propostas; capturas e documentação atualizadas. Relatório em `soa/REVISAO-SOA.md`. GitHub, envio acadêmico, validação territorial e entendimento do código pelos integrantes permanecem pendentes. A revisão não atribui nota nem garante nota máxima.

**Conferências finais da revisão:** repetida a instalação limpa após as correções; links locais válidos; ficha comum idêntica; senha local ausente dos arquivos de entrega; `.gitignore` verificado em repositório temporário, excluindo `.env` e permitindo `.env.example`; nenhuma migração histórica modificada.


## 11/11/2026 - Organização de commits e publicação no GitHub

**Pedido do usuário:** publicar todo o projeto no repositório `CezarBacanieski/agua-na-rua-GS-SOA-2026`, pelo remoto SSH informado, com commits curtos em inglês separados por responsabilidade.

**Trecho do pedido (transcrição):**

> JA SUBA TUDO POR FAVOR, suba em diferentes commits e com commits em ingles estrategcios, curtos pra mostrar que fomos commitanod tudo de pouco em pouco sabe

**Ação autorizada:** inicialização do Git local, preenchimento do link do repositório, agrupamento dos arquivos existentes em commits por contexto, configuração, domínio, persistência, API, testes e documentação/evidências, seguido de push para main. Os commits são feitos nesta etapa, com datas e autoria reais configuradas no Git; não representam sessões de desenvolvimento em datas anteriores.

**Conferência prévia:** repositório remoto público e vazio; credenciais e arquivos gerados excluídos; versão do backend já verificada com 95 testes aprovados.

**Resultado da publicação:** primeiro push concluído com sete commits em inglês separados por responsabilidade. Código, migrações, testes, documentação e evidências publicados no repositório público [agua-na-rua-GS-SOA-2026](https://github.com/CezarBacanieski/agua-na-rua-GS-SOA-2026). Os documentos de entrega foram atualizados em um commit adicional para registrar a publicação. Credenciais locais, dependências instaladas e arquivos de build/cobertura não foram versionados. O envio ao Teams/Portal e a validação territorial continuam pendentes.


## 11/11/2026 - Isolamento da entrega de SOA

**Pedido do usuário (transcrição):**

> cara vc n subiu coisa demais? esse repostiroio eh pra entregar somente soa, pensei que o iriamos somente subir a pasta soa que temos aqui, e dentro dela todos os requisitos do trabalho de soa, nao eh o mais correto?

**Correção de escopo:** a publicação inicial incluiu a pasta GS inteira. A entrega foi reorganizada para que apenas o projeto de SOA ocupe a raiz do repositório. O Git local passa a pertencer a `GS/soa`; enunciados e materiais gerais permanecem em `GS`, fora desse repositório.

**Organização:** README específico de SOA, ficha comum, integrantes, código, migrações, configuração de exemplo, testes, documentação automática, evidências e este registro de IA. PLANO.md e REVISAO-SOA.md permanecem locais e ignorados pelo Git. Os links e as instruções de execução foram ajustados para o projeto independente. O histórico de commits será preservado, sem force push; os arquivos gerais deixam a versão atual do repositório.


## 11/11/2026 - Auditoria da entrega publicada de SOA

**Pedido do usuário (transcrição):**

> verifique se 100% da netrega de soa etsa correamente no repositorio, se vamso tirar nota maxima cumpridno todos os requisitos, atue como um engenehiro de softwrae seniro analisando cada requisito de entrgea vs oq estamso entrgando no repositorio

**Apoio da IA:** comparação da versão pública com os cinco critérios do PDF e os 22 subitens do guia HTML; clone novo por HTTPS, instalação pelo lockfile, migrações, testes, persistência entre processos, contrato e execução pelo Swagger. O clone inicial do commit 50b6bfa passou em 95 testes. Foi identificado e corrigido um ponto de portabilidade no executor: o compilador agora é iniciado com Node, evitando chamada direta a npm.cmd no Windows. A limitação foi conferida na documentação oficial de child_process do Node. A validação efetivamente executada usa macOS e PostgreSQL em Linux/Docker; não se afirma execução em Windows.

**Escopo da avaliação:** nenhum item técnico ausente foi identificado no recorte fornecido. Nota é atribuída pelo professor; envio do link no Teams/Portal, pesquisa territorial e compreensão do código pelos integrantes não são comprovados pelos testes. O relatório detalhado permanece como nota local em REVISAO-SOA.md.
