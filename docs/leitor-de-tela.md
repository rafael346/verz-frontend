# Roteiro de teste com leitor de tela (NVDA)

O `npm run e2e` já confere a acessibilidade automaticamente: o axe roda as regras WCAG 2.1 A/AA nas telas
principais, nos temas claro e escuro. Mas ele não ouve a página. Este roteiro cobre o que só uma pessoa com leitor de
tela percebe: a ordem da leitura, os anúncios ao vivo e para onde o foco vai. Leva uns 20 minutos.

## Preparar

1. Instale o [NVDA](https://www.nvaccess.org/download/) (gratuito) e abra o Chrome.
2. Suba a pilha e carregue a demonstração (`seed_demo`, README do `verz-backend`). As senhas estão lá.
3. Abra `http://localhost:8080` em **duas janelas**: uma com a Ana (você, com o NVDA) e outra anônima com a Bia
   (para provocar lances).

Atalhos do NVDA que bastam: **Tab** (próximo controle), **H** (próximo título), **D** (próxima região), **K** (próximo
link), **Insert+F7** (lista de links e títulos), **Insert+Espaço** (alterna entre navegar e digitar), **Ctrl** (para
de falar).

## O que precisa ser ouvido

| Tela | Faça | O NVDA tem que dizer |
|---|---|---|
| Qualquer uma | Tab logo ao abrir | "Pular para o conteúdo"; depois "verz Casa de Leilões, página inicial, link" |
| Vitrine | H, H, H | o título "Vitrine", a contagem ("4 lotes em pregão agora") e cada lote pelo título |
| Vitrine | Tab até um cartão | um link só por cartão, com o título da obra |
| Sala | entrar no lote disputado | título da obra; "Lance atual", valor; "Termina", tempo restante |
| Sala | na outra janela, a Bia dá um lance | sem você mexer em nada: "Você foi superado" (e o valor novo ao navegar) |
| Sala | digitar "1,00" e "Dar lance" | a recusa ("Lance abaixo do mínimo…") é lida; o foco vai para o aviso |
| Sala | apagar o campo e "Dar lance" | "Informe um valor em reais…", com o foco no campo "Seu lance" |
| Sala | lance quando faltarem menos de 2 min | "Pregão prorrogado até…" é anunciado |
| Carteira | atalho "R$ 500" e "Depositar" | "Depósito de R$ 500,00 feito. Disponível agora: …" |
| Painel | "Cancelar lote" num lote com lances | o foco vai para "Manter"; a pergunta é lida junto ("Cancelar este lote? …") |
| Painel | "Sim, cancelar" sem motivo | "Informe o motivo…", com o foco no campo do motivo |
| Painel | digitar o motivo | a contagem "n/200" só é lida quando você navega até ela, não a cada tecla |
| Auditoria | H | "Histórico íntegro"; cada lance com "Confere" ou "Não confere" (a palavra, não só o símbolo) |
| Comprovante | H, depois a lista | "Comprovante autêntico"; as três verificações, cada uma com "Confere" |

## Se algo falhar

Anote a tela, o que você fez, o que o NVDA disse e o que deveria ter dito. Se o NVDA ficar mudo, confira se está no
modo de navegação (**Insert+Espaço**).
