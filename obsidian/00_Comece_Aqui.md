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

37. **[[Atualizacao_2026-06-12_Refino_UI_Fase4_Responsividade_Grids]]**
    Fase 4: corrige o bug critico da sidebar no mobile (virou drawer off-canvas abaixo de 768px, com hamburguer/backdrop/X; estatica em md+) e melhora os grids de KPI (1->2->4 colunas). Dashboard agora usavel do celular ao desktop. Validado em 375/768/desktop. Commit 9f7b038.

38. **[[Atualizacao_2026-06-12_Refino_UI_Fase5_Consistencia_Componentes]]**
    Fase 5: consistencia de cards/modais/filtros. Sistema de raio em 2 niveis (containers rounded-xl, controles rounded-lg); classes .modal-overlay/.modal-panel padronizam os 3 modais (hairline dourado); todos os selects/inputs soltos (bg-black/35) passam a usar .form-input. Build/lint/151 testes ok; validado por inspecao de DOM (screenshot do harness travou). Commit bcf0ea8.

39. **[[Atualizacao_2026-06-12_Refino_UI_Fase6_Assinatura_Entrada]]**
    Fase 6: eleva o padrao sem mudar identidade. Assinatura = entrada orquestrada das telas (keyframe vitra-rise, easeOutQuint, reduced-motion safe) + tabular-nums nos KPIs. Bug corrigido: fill-mode `both` criava containing-block (matrix identidade != none) e deslocava modais fixed; troca para `backwards`. Commit 3f3bb7f.

40. **[[Atualizacao_2026-06-12_Refino_UI_Fase7_Kanban_Calendario]]**
    Fase 7: transforma as duas telas ainda "funcionais". Kanban (Conteudos): colunas viram lanes reais (rounded-xl, dot de status, contagem, empty state tracejado, card com barra-acento). Calendario: filtros viram segmented control (pill group), empty state com chip dourado e voz humana, cards do dia rounded-xl. Commit 3cec0d2.

41. **[[Atualizacao_2026-06-15_Publicacao_Meta_Fase1]]**
    Agente de campanhas Meta no dashboard (fase 1): Edge publish-meta-ads cria campanha->conjunto->criativo->anuncio na conta real em status PAUSED via Graph API (mesma sequencia do spike via MCP), com painel "Revisar e publicar" no Trafego Pago, teto de orcamento do operador, gate de QA e botao separado de ativar (confirm). Ativar de verdade exige o secret META_ACCESS_TOKEN. Commit b9a76d9.

42. **[[Atualizacao_2026-06-15_Meta_Fase2a_Sync_Metricas]]**
    Fase 2a: Edge sync-metrics-from-meta puxa insights da Meta (read-only) e faz upsert idempotente em premium_metrics; botao "Sincronizar agora (Meta)" na tela de Metricas. Migration de indice unico aplicada. Restante da fase 2 (2b multiplos conjuntos+IA, 2c audiences, 2d formulario instantaneo) sequenciado. Commit ea037b5.

43. **[[Atualizacao_2026-06-15_Meta_Fase2b_Conjuntos_IA]]**
    Fase 2b: Edge suggest-meta-audiences (IA propoe publico/posicionamento por conjunto) + build_draft refatorado para N conjuntos (1 por ad_group, CBO, resolve interesses/geo via Graph search, tudo PAUSED) + UI "Sugerir publicos por IA" revisavel. Verificado ao vivo: 3 conjuntos coerentes por funil. Build real depende do META_ACCESS_TOKEN. Commit 009992b.

44. **[[Atualizacao_2026-06-15_Meta_Fase2c_Audiences]]**
    Fase 2c: Edge manage-audiences (list / create_website por pixel / create_lookalike via Graph) + targetingFor usa custom_audiences no retargeting + UI "Publicos da Meta" (listar/criar) e seletor de publico nos conjuntos de retarget. Gated; criacao real depende do META_ACCESS_TOKEN. Resta 2d (formulario instantaneo, exige ToS de Lead). Commit fe8a9ce.

45. **[[Atualizacao_2026-06-15_Meta_Fase2e_Objetivos_Flexiveis]]**
    Fase 2e: objetivos flexiveis via _shared/objectivePlaybook.ts (fonte unica Deno+Vite). Seletor "Objetivo da campanha" (Reconhecimento/Trafego/Engajamento/Leads ativos; Leads-formulario e Vendas em 🔒 destravaveis por ToS/pixel). build_draft e suggest-meta-audiences derivam do playbook. Padronizacao mantida; tudo PAUSED+gate. Verificado no preview. Commit 6996c32.

46. **[[Atualizacao_2026-06-15_Meta_Fase2d_Formulario_Lead]]**
    Fase 2d: formulario instantaneo de Lead. leads_form destravado (ToS da Vitra Imobiliaria confirmado true pelo nosso token); publish-meta-ads valida ToS por Pagina em runtime (422 acionavel antes de criar nada), garante/reusa leadgen_form, monta conjunto LEAD_GENERATION ON_AD + promoted_object e criativo que abre o form. UI ganha campo de Politica de Privacidade. Guard testado ao vivo. Resta leads_retrieval no token + atribuir Paginas das outras marcas. Commit bd021de. E2E fechado + idempotencia do form via banco (commit e87b7a8).

47. **[[Atualizacao_2026-06-15_Meta_Guards_Marca_e_Aprovacao]]**
    Guards anti-contaminacao no publish-meta-ads: (1) brand_mismatch (conta/Pagina nao pode ser de marca diferente da campanha), (2) so criativos approved vao ao ar (nada de render generated/teste), (3) acao delete_draft (DELETE na Meta + limpa banco). Validado ao vivo; 2 rascunhos de teste apagados. Hoje nenhuma campanha tem criativo approved -> e2e limpo exige aprovar 1 criativo antes. Commit 505c721.

48. **[[Atualizacao_2026-06-16_Meta_Objetivo_WhatsApp]]**
    Objetivo Conversas (WhatsApp) no playbook: OUTCOME_ENGAGEMENT / CONVERSATIONS / destination WHATSAPP / CTA WHATSAPP_MESSAGE, needs ['whatsapp']. Comecou 🔒; DESTRAVADO (commit e5f6554) ao confirmar que a Pagina Vitra Imobiliaria tem WhatsApp conectado (principal +55 51 8225-0218). page_status deu falso negativo (token nao le confiavel). Commits 20769fe + e5f6554.

49. **[[Atualizacao_2026-06-16_Meta_Objetivo_Vendas_Pixel]]**
    Objetivo Vendas/Conversoes (OFFSITE_CONVERSIONS): exige pixel_id da conta (valida via act_/adspixels) + evento de conversao (default LEAD); promoted_object{pixel_id,event}. list_pixels em manage-audiences; UI com seletor de pixel + evento. Imobiliaria tem "Pixel Site Vitra" ativo; Premium sem pixel. Verificado (pixel_required / pixel_invalid / passa guard). Playbook completo. Commit b4f5f90.

50. **[[Atualizacao_2026-06-16_Fix_Render_546_CORS]]**
    Fix: cortes falhando com "CORS"+546 no render-asset. Causa: execucoes de render CONCORRENTES (auto-render + manual) abriam isolates paralelos que estouravam o limite (546 volta sem CORS -> browser mostra "CORS"). Correcao: fila unica (renderChain) serializa as execucoes no premiumData.js; sem tocar no edge/output. Commit 341a305.

51. **[[Atualizacao_2026-06-16_Criativos_Preco_Repetido_e_CTA]]**
    Criativos hero-checklist: guard no render (isPriceLikeHeadline/heroBenefitHeadline) evita headline = preco quando o bloco De/Por ja mostra a oferta; generate-copy (Imobiliaria) sem "Simular financiamento" + CTAs consultivos e regra anti-preco na headline. Dado da campanha TOM MENINO DEUS corrigido e re-renderizado; PNG conferido. Commit 35e6932.

52. **[[Atualizacao_2026-06-16_Auto_Descoberta_Contas_Paginas]]**
    Painel "Publicar na Meta" auto-descobre contas (/me/adaccounts) e Paginas (act_/promote_pages) reais do token: acoes list_ad_accounts/list_pages em manage-audiences, helpers, e selects auto-carregados (pre-seleciona a conta da marca; fallback input manual). Verificado: PoA/RH/Premium + Pagina Vitra Imobiliaria. Commit 652f795.

53. **Dropdowns no tema Vitra** — (a) fix CSS do <select> nativo: fundo solido surface-2 + color-scheme dark + chevron/opcao dourada (popup deixou de ser branco), commit 247b48b; (b) **[[Atualizacao_2026-06-16_VitraSelect_Dropdown_Custom]]** — componente proprio acessivel VitraSelect (pixel-perfect, teclado/ARIA/type-ahead) aplicado a TODOS os dropdowns do app.

54. **[[Atualizacao_2026-06-17_Meta_Advantage_Audience_Build_E2E]]**
    Build na Meta funcional E2E: faltava `targeting_automation.advantage_audience` (exigido agora pela Meta no ad set). targetingFor envia advantage_audience:0 (publico explicito). Verificado ao vivo: campanha+conjunto+criativo+anuncio PAUSED na PoA, depois apagados. Lembrete: destino obrigatorio p/ qualquer objetivo. Commit 506b541.

55. **[[Atualizacao_2026-06-17_IA_Menu_Organico_x_Pago]]**
    Refatoracao SO de navegacao (App.jsx): marcas com 2 pilares (Conteúdo & Curadoria = organico / Tráfego Pago = pago); nova secao "Produção de conteúdo" (Calendário, Conteúdos); "Operação compartilhada" -> "Inteligência & automação" (Agentes, Métricas); Pipeline mesclado em Conteúdos (fora do menu, reversivel). Sem tocar em telas nem no fluxo de Trafego Pago. Commit 2e00915.

56. **[[Atualizacao_2026-06-17_Conteudo_Curadoria_So_Organico]]**
    "Conteúdo & Curadoria" vira organico puro: abas Tráfego Pago (duplicata do destino pago) e Métricas (duplicata da transversal) removidas; "Campanhas" -> "Ofertas" (raiz compartilhada/seletor, sem rotulo publicitario). Abas: Ofertas · Produção · Publicações · Modelo. So a lista TABS; fluxo de Tráfego Pago intacto (verificado). Commit 74c7651.

57. **[[Atualizacao_2026-06-17_Menu_Conteudo_e_remove_Ofertas]]**
    Menu "Conteúdo & Curadoria" -> "Conteúdo"; aba "Ofertas" removida da central de conteudo (virou seletor compacto "Oferta em foco" no topo; criar segue no botao Nova campanha). Abas: Produção · Publicações · Modelo. So navegacao/UI; Tráfego Pago intacto. Commit e4cce39.

58. **[[Atualizacao_2026-06-17_Hero_Conteudo_Ambas_Marcas]]**
    Hero da central Conteúdo alinhado ao foco organico nas 2 marcas (brandProfiles): titulos "Conteúdo Vitra Imobiliária/Premium" + subtitles de publicacoes organicas. Separacao de marca (Imob sem "curadoria"). So copy do hero; Tráfego Pago intacto. Commit 43301a8.

59. **[[Atualizacao_2026-06-17_Conteudo_FaseA_IA_Editorial]]**
    Conteúdo Fase A (base do canal organico): _shared/contentPlaybook.ts (pilares/tipos/formatos/tons, fonte unica) + edge generate-content (Claude, modo organico: ideia/legenda/roteiro/hashtags/CTA/visual na voz da marca + copyValidation) + helper generateContentWithAI + re-export + teste (155). Verificado ao vivo (gate + geracao on-brand). Proximo: Fase B (UI Novo conteúdo). Commit 66fc380.

60. **[[Atualizacao_2026-06-17_Conteudo_FaseB_Producao_Novo_Conteudo]]**
    Conteúdo Fase B: aba Produção conteudo-first. ContentProductionSection (tipo+pilar+formato+tom + briefing -> Gerar com IA -> revisar/editar -> Salvar) grava em premium_content_posts via createContentPost (status 'draft' conforme CHECK; campaign_id=oferta em foco; save guardado sem oferta). Sem tabelas novas. Verificado: geracao on-brand + insert real (limpo). Status EN x board PT a alinhar na Fase C. Commit d9ff490.

61. **[[Atualizacao_2026-06-17_Conteudo_FaseC_Unifica_Board_Calendario]]**
    Conteúdo Fase C: status como fonte unica (contentPlaybook); board Conteúdos (Kanban) e Calendário REAPONTADOS de tabelas legadas para premium_content_posts (lanes por contentStatusLane; calendario por scheduled_for); updateContentPost + controles status/Agendar/Marcar publicado(link) na aba Produção; fix do timeout do loadPremiumWorkspace (8s->20s). Verificado ao vivo (6 campanhas, gerar+salvar, board 6 lanes, agendar/publicar). Resta Fase D (metricas organicas + Biblioteca/Config). Commit 090414c.

62. **[[Atualizacao_2026-06-17_Fix_Load_Resiliente_Dashboard]]**
    Fix do "Tempo esgotado ao consultar o Supabase Premium": era 1 timeout GLOBAL no Promise.all (uma query lenta derrubava tudo). Agora safeQuery por dataset (timeout proprio + degrada p/ vazio); so campanhas e critica; timeouts generosos (campanhas 25s, paralelo) + payloads menores (assets 600->150 etc.). Posts de teste B/C limpos via service-role. Commit 5e5a286.

63. **[[Atualizacao_2026-06-17_Conteudo_FaseD_Metricas_Organico_Pago]]**
    Conteúdo Fase D: Métricas com corte Orgânico | Pago (derivado do publication_type). Pills Todos/Orgânico/Pago filtram tiles+totais+tabela; KPIs proprios (Orgânico: engajamento/salvos/novos seguidores; Pago: cliques/leads/investimento+CPL). So UI. Verificado ao vivo. Fecha o nucleo do canal organico (A-D). Resta Biblioteca/Config. Commit d09c658.

64. **[[Atualizacao_2026-06-17_Conteudo_Oferta_Vinculada_Contextual]]**
    Conteúdo: "Oferta em foco" deixou de ser obrigatoria (era heranca do schema NOT NULL, nao decisao de produto). Opcao A content-first: migration deixa campaign_id nullable; campo vira "Oferta vinculada (opcional)" + "Sem oferta — conteudo de marca"; vinculo CONTEXTUAL por tipo (offer required|suggested|none no contentPlaybook); tracker "Conteudos em producao" por marca (tag Marca/Oferta). E2E ao vivo: salvou post institucional sem oferta (campaign_id null), tag MARCA no board. Commit e59d5d0.

65. **[[Atualizacao_2026-06-18_Conteudo_Fluxo_Publicacao_Por_Acoes]]**
    Conteúdo: aba Produção reorganizada por FUNIL DE AÇÕES. Status deixa de ser dropdown de 7 opcoes — passa a ser DERIVADO da acao (Aprovar→Agendar→Publicar); data so aparece ao agendar. Entrada dupla "Novo conteúdo" (Gerar com IA | Criar do zero/manual). Publicar UNIFICADO: "Marcar publicado" tambem cria a publicacao real (premium_publications) p/ destravar metricas. Header: "Novo conteúdo" + "Nova oferta" (Nova campanha so no Tráfego Pago). migration: premium_publications.campaign_id nullable; brand_scope via metadata (coluna GENERATED). E2E ao vivo OK (rascunho manual → aprovado → publicado + publicacao criada). Commit 28ebbdf.

66. **[[Atualizacao_2026-06-18_Conteudo_Gerar_Posts_Remove_Render_Pago]]**
    Conteúdo: corrige "0 criativo(s) gerado(s)". Causa: a secao exibia assets nao-meta_ads e oferecia "Gerar criativos", mas o render-asset so processa channel=meta_ads -> 0. E render Satori e conceito de tráfego pago, nao post organico. Fix: REMOVIDA a matriz de criativos + "Gerar criativos" da secao Conteúdo; a geracao organica vira "Gerar posts" (IA, ja funcional) e o entregavel e o post (texto) no funil. Render de arte fica no Tráfego Pago/Estúdio ("Gerar cortes"). Follow-up: "Gerar arte do post" (imagem organica). Commit a71e262.

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
