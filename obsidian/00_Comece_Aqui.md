# ðŸ›ï¸ Vitra Agentes de Marketing â€” Central do Obsidian

Seja bem-vindo ao Vault do Obsidian para o projeto **Vitra Agentes de Marketing**. Este vault foi criado para documentar toda a arquitetura de agentes, identidade visual, configuraÃ§Ãµes de ambiente e o roadmap de evoluÃ§Ã£o do sistema.

## ðŸ—ºï¸ Mapa do Projeto (Notas Principais)

Navegue pelas seÃ§Ãµes do projeto utilizando os links abaixo:

1. **[[Arquitetura_Agentes_v2]]**
   Entenda os 8 agentes de IA autÃ´nomos, como se comunicam e o fluxo do pipeline quinzenal e de urgÃªncia.

2. **[[Sistema_Cards_Visuais]]**
   Detalhes dos 9 geradores HTML â†’ PNG via Puppeteer (DPR 2x), schemas de dados e o pipeline de produÃ§Ã£o.

3. **[[Brand_Guide_Vitra]]**
   A paleta de cores exata, regras de aplicaÃ§Ã£o de logotipo, tipografia, tom de voz e pilares editoriais.

4. **[[ConfiguraÃ§Ãµes_ENV]]**
   Todas as variÃ¡veis de ambiente necessÃ¡rias no `.env` e as instruÃ§Ãµes para manutenÃ§Ã£o (ex: renovaÃ§Ã£o do token Canva).

5. **[[Protocolo_Anti_Ban_Meta]]**
   Boas prÃ¡ticas de uso da Meta Graph API v20, controle de limites de taxa (rate limits) e precauÃ§Ãµes contra bloqueios.

6. **[[Roadmap_Futuro]]**
   O que estÃ¡ funcionando, quais sÃ£o as pendÃªncias atuais e o plano para as prÃ³ximas fases.

7. **[[Atualizacao_2026-05-26_Estado_Atual]]**
   Registro das mudanÃ§as recentes entre a Ãºltima atualizaÃ§Ã£o do vault e o estado atual do projeto: Supabase, logos corrigidas, OpenSquad e regras de marca.

8. **[[Atualizacao_2026-05-28_Logos_Verticais_Aprovadas]]**
   Registro da criacao da logo vertical aprovada da Vitra Imobiliaria, suas variacoes cromaticas em 8K/16K e o commit publicado no GitHub.

9. **[[Atualizacao_2026-05-28_Brandbook_Avatar_Social]]**
   Registro da atualizacao do brandbook fonte, da secao de variacoes aprovadas e do avatar social com V isolado.

10. **[[Atualizacao_2026-05-28_Logos_Premium_Aprovadas]]**
    Registro das logos horizontal e vertical aprovadas da Vitra Premium, da atualizacao da hero do brandbook Premium e do commit publicado no GitHub.

11. **[[Ferramenta Operacional Premium/00 - Indice]]**
    Documentacao viva do desenvolvimento da ferramenta operacional para criacao de campanhas, geracao de conteudos, aprovacao, publicacao e metricas da Vitra Premium.

12. **[[Atualizacao_2026-05-29_Ferramenta_Operacional_Premium_Fase_1]]**
    Registro da Fase 1 da ferramenta operacional Premium: dashboard React, Supabase, migracao aplicada, commits publicados e proximos passos.

13. **[[Atualizacao_2026-06-01_Automacao_Trafego_Pago_Premium]]**
    Registro da automacao inicial do fluxo de trafego pago Premium (geracao, revisao e exportacao de criativos Meta Ads).

14. **[[Atualizacao_2026-06-04_Templates_Vitra_Imobiliaria_Trafego_Pago]]**
    Registro da aprovacao dos templates reutilizaveis de trafego pago da Vitra Imobiliaria dentro da plataforma operacional multi-marca.

15. **[[Atualizacao_2026-06-05_Variacoes_Por_Template_Aprovado]]**
    Registro da transformacao da antiga logica de variacoes criativas em variacoes por template aprovado, com contratos de campos variaveis, deploy da funcao `render-asset` e commit publicado.

16. **[[Atualizacao_2026-06-06_Fase0_Rede_de_Seguranca]]**
    Registro da Fase 0: rede de seguranca testavel (funcoes puras de texto/medida extraidas para `_shared`, harness de overflow) antes de mexer nas heuristicas de render.

17. **[[Atualizacao_2026-06-06_Fase1_Fluxo_Automatico]]**
    Registro da Fase 1: estabilizacao do fluxo automatico de render (claim atomico, maquina de estados com retry, reaper de orfaos travados).

18. **[[Atualizacao_2026-06-06_Geracao_Automatica_Render_Asset]]**
    Registro da correcao do CORS da funcao `render-asset`, tratamento do erro transitorio `546`, validacoes remotas e commit publicado.

19. **[[Atualizacao_2026-06-06_Fase2_P1_P2_Autocomplete]]**
    Registro da Fase 2 (P1/P2): auto-ajuste da fonte por largura/formato nos templates e correcao do autocomplete do brief.

20. **[[Atualizacao_2026-06-06_Fase2-3_Fechar_Fabrica]]**
    Registro do mapeamento multi-agente e execucao das 3 frentes para fechar a fabrica de criativos (render-version, validacao por formato, Premium full-res).

21. **[[Atualizacao_2026-06-06_Auditoria_Copy_e_Correcoes_Tecnicas]]**
    Registro da auditoria multi-agente da geracao de copy dos 4 templates aprovados + correcoes tecnicas (commit `a23fc7f`); reescritas de copy propostas para revisao do marketing.

22. **[[Atualizacao_2026-06-06_Deploy_Fase1_Producao]]**
    Registro do deploy da Fase 1 em producao.

23. **[[Atualizacao_2026-06-06_Limpeza_Honestidade_UI]]**
    Registro da limpeza de honestidade da UI (remocao de rotulos e dados que nao refletiam o estado real do sistema).

24. **[[Atualizacao_2026-06-07_Autonomo_Estabilidade_Worker_UX]]**
    Registro da sessao autonoma: fechamento da Fase 2/3 com deploy, preparo do render-worker e ajustes de UX (Fase 4). Detalhe tecnico no `CHANGELOG.md`.

25. **[[Atualizacao_2026-06-07_Copiloto_IA_Marketing]]**
    Registro da virada para COPILOTO de marketing imobiliario por IA: a ferramenta passa a conhecer a Vitra e tira do operador o trabalho de pensar a peca, mantendo-o como aprovador.

26. **[[Atualizacao_2026-06-09_Capas_Sociais_e_Estudio_de_Pecas]]**
    Registro da suite de capas/banners sociais (Facebook, LinkedIn, YouTube) como geradores HTML->PNG e da integracao no dashboard via o menu Estudio de Pecas.

27. **[[Atualizacao_2026-06-09_Rebrand_Imobiliaria_e_Rename_Vitra_Marketing_Hub]]**
    Registro do rebrand do dashboard para a marca-mae Vitra Imobiliaria (navy + dourado, tema dinamico por marca) e do rename do projeto para Vitra Marketing Hub.

28. **[[Atualizacao_2026-06-09_Sidebar_Acordeao]]**
    Registro do ajuste de UX da sidebar em acordeao: apenas a secao da view ativa fica expandida por vez.

29. **[[Atualizacao_2026-06-11_Template_05_Estudio_Criativos_Excluir_Campanhas]]**
    Registro do 5o template da Imobiliaria (foto + checklist, paleta alinhada ao brandbook), da nova secao Estudio de Criativos, da exclusao de campanhas pela UI e do contexto de copywriting. Commits 529ebc6, aee7749, 1ce33b3, c36831a.

30. **[[Atualizacao_2026-06-11_Safe_Zone_Dual_e_Template_06_Duo_Selos]]**
    Registro da skill margem-seguranca-criativos (safe zones do Meta), da correcao de safe zone no template Oferta com duas fotos e do 6o template (Oferta duo com selos, fiel a peca da Zona Norte). Commits 8bfc960, 4284748, e3112fa.

31. **[[Atualizacao_2026-06-12_Template_07_Hero_Panel_San_Clemente]]**
    7o template aprovado da Vitra Imobiliaria (Hero com painel e galeria), fiel a peca San Clemente / Bairro Gloria: foto hero + painel azul do brandbook + setas douradas + preco + galeria lateral, nos 3 formatos com safe zone nativa. Aparece no modal Nova Campanha. Inclui nota de processo sobre o bug de separacao de marcas corrigido na v59. Commit d2d1734.

32. **[[Atualizacao_2026-06-12_Oculta_Templates_Antigos_Modal]]**
    O modal Nova Campanha da Imobiliaria passa a oferecer so os 3 templates aprovados mais recentes (Foto de fundo com checklist, Oferta duo com selos, Hero com painel e galeria); os 4 antigos ganham `hidden: true` e saem da selecao, mas seguem no catalogo resolvendo por id para campanhas/assets ja criados. Commit e9e20af.

33. **[[Atualizacao_2026-06-12_Hero_Checklist_Safe_Zone]]**
    Auditoria de safe zone dos 3 templates selecionaveis: duo-selos e hero-panel passam; o hero-checklist (Template 05) reprovava nos 3 formatos e foi corrigido (logo fora dos cantos, CTA fora das faixas de reels/base, margens 108/89). Deploy do Edge agora via Supabase CLI (le do disco, fim da divergencia disco/deploy). 6 previews regenerados. Commit 45b229b.

34. **[[Atualizacao_2026-06-12_Refino_UI_Fase1_Central]]**
    Inicio do refino de layout com a skill frontend-design (referencia vitra.cria.digital, mantendo navy+dourado). Fase 1 na Central Imobiliaria: KPIs (numero off-white + dourado acento, icone em chip, hover), cards de campanha (barra-acento, hover, meta-row com icones) e abas. So apresentacao, zero logica. Commit 54f8890.

35. **[[Atualizacao_2026-06-12_Refino_UI_Fase2_Header_Modal]]**
    Fase 2 do refino: header/hero (CTA primario solido com tinta brand-aware via --surface-0, titulo Playfair) e modal Nova Campanha (eyebrow com a marca + Playfair, "Criar Campanha" solido). Validado nas duas marcas (sem azul na Premium). Define o vocabulario de CTA primario/secundario reaproveitavel. Commit d34dfcf.

36. **[[Atualizacao_2026-06-12_Refino_UI_Fase3_Vocabulario_Compartilhado]]**
    Fase 3: espalha o vocabulario para todas as views via componentes compartilhados (header PremiumPageHeader + classe .btn-gold no index.css) e alinha o MetricTile do Metricas ao StatTile. Consistencia de um ponto so. Registra a armadilha do text-white/52 no @apply. Commit 080c2ac.

---

## ðŸš€ Como Executar o Projeto

No terminal do projeto (na raiz `d:\LEONARDO\Vitra\vitra-agentes-marketing`):

```bash
# Rodar o sistema em modo desenvolvimento (Watch mode)
npm run dev

# Rodar o dashboard do projeto (Vite + React)
npm run dashboard
```

---
*Nota: Este Vault estÃ¡ sincronizado localmente na pasta `obsidian/` na raiz do repositÃ³rio.*
