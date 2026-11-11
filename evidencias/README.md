# Evidências reais de SOA

Capturas e relatórios produzidos a partir da execução local do backend. Os registros não representam validação territorial nem impacto comprovado.

| Arquivo | Origem |
|---|---|
| `testes.txt` / `testes.json` | Execução de `npm test` ou `npm run test:coverage` |
| `ultima-execucao.json` | Estado EM_EXECUCAO, APROVADA ou FALHOU do último comando de testes |
| `testes-saida.png` | Print da saída real dos comandos, exibida no relatório HTML |
| `compatibilidade-esquema.txt` | Comando `npm run migration:check`, sem mudanças inesperadas no esquema |
| `swagger.png` | Interface OpenAPI carregada no navegador |
| `swagger-execucao.png` | GET /pontos executado pelo botão Execute do Swagger |
| `verificacao.png` / `relatorio.html` | Relatório montado a partir do resultado dos testes, respostas HTTP e histórico do banco; não é captura de terminal |
| `migracoes.txt` | Comando `npm run migration:show` |
| `migracoes.json` | Consulta à tabela `historico_migracoes` do banco da aplicação |
| `api-respostas.json` | Requisições reais com status 200, 400, 409 e 422 |
| `revisao-http.json` | Regressão real de caractere nulo no cadastro e filtro, agora com 400 |
| `openapi.json` | Exportação do contrato gerado em /openapi.json |
| `instalacao-limpa.txt` | Instalação em pasta temporária, banco/volume novos e teste de persistência após reiniciar o processo |
| `auditoria-producao.json` / `auditoria-completa.json` | Resultado de npm audit, sem e com dependências de desenvolvimento |

Para atualizar as capturas, mantenha a API em execução e rode `npm run evidencias` após os testes. O script lê os dados simulados do seed e envia duas requisições que devem ser recusadas sem alterar o banco (exclusão com histórico e relato futuro). Ele também executa GET /pontos pela interface do Swagger.

A captura usa Playwright. No macOS, aproveita o Chrome instalado no caminho padrão. Em outros ambientes, execute `npx playwright install chromium`; um caminho alternativo de Chrome pode ser informado por `CHROME_PATH`.

O comando de evidências não substitui testes: exige estado APROVADA na última execução e um JSON do Jest gerado depois do início desse comando. Resultados antigos são invalidados antes do preflight, inclusive quando Docker, build ou tipagem falham. As auditorias e a instalação limpa têm registros separados e não são reexecutadas por esse comando.
