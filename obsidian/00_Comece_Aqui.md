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

67. **[[Atualizacao_2026-06-18_Skill_Vitra_Conteudo_Planejador_Editorial]]**
    Skill nova `vitra-conteudo` (planejador editorial orgânico, LOCAL em .claude/). Analise PO: o per-post ja e capability do app (generate-content) — nao virar skill p/ nao duplicar fonte unica. A lacuna real e PLANEJAMENTO EM LOTE (calendario/pauta). A skill, de um briefing (marca/periodo/foco), monta o plano por pilares (legenda/CTA/hashtags/roteiro/visual por post na voz da marca) reusando contentPlaybook+copyValidation; saida = markdown + JSON formato createContentPost (importavel p/ o board). Smoke test independente OK (funil equilibrado, voz correta, zero vocab Premium). Follow-up: botao "Importar plano". (.claude e gitignored — skill nao versionada.)

68. **[[Atualizacao_2026-06-18_Conteudo_Importar_Plano_Editorial]]**
    Conteúdo: botao "Importar plano" (3o modo da aba Produção, ao lado de Gerar posts/Criar do zero). Cola o JSON do plano da skill vitra-conteudo -> `importContentPlan` cria os posts em lote como rascunhos no funil (tolerante a falha por item; data preservada -> Calendário). `createContentPost` ganhou scheduledFor+source. E2E ao vivo OK (2 posts importados, draft + scheduled_for + pilar/formato corretos). Fecha o ciclo planejamento->producao->publicacao. Commit 43553f4.

69. **[[Atualizacao_2026-06-18_Conteudo_Gerar_Arte_Do_Post]]**
    Conteúdo: "Gerar arte do post" — imagem branded a partir do TEXTO (antes a IA so dava direcao visual). Motor Canvas 2D no cliente (postArt.js), sem dependencia nova e SEM o render-asset/Satori pago — cartao tipografico fiel ao brandbook por marca (navy+dourado / preto+dourado), dimensoes por formato. PostArtModal (preview + Baixar PNG + Salvar no post -> upload bucket 'cards' + metadata.art_url) por card do funil. E2E ao vivo OK (arte 1080x1920; PNG 200/image/png/406KB). Distinto de "Gerar criativos"/"Gerar cortes" (pago). Commit 3d9627f.

70. **[[Atualizacao_2026-06-18_Conteudo_Arte_Foto_Thumbnail_Publicacao]]**
    Conteúdo: cluster de arte. Variante COM FOTO (postArt.js photoUrl: hero+scrim, crossOrigin+fallback); PostArtModal com toggle Tipografico|Com foto + URL; thumbnail da arte (metadata.art_url) no card do funil e no Calendário; "Marcar publicado" copia art_url p/ a publicacao (midia de referencia). E2E ao vivo OK (foto+scrim sem taint; thumbnail no card). Resta sequenciado: Config editorial, DAM, publicacao nativa via Graph. Commit 4428158.

71. **[[Atualizacao_2026-06-18_Conteudo_Configuracoes_Editoriais]]**
    Conteúdo: aba "Configurações" — governanca da pauta POR MARCA (tabela premium_editorial_settings: pilares ativos, tom padrao, cadencia, diretrizes). Nao e tela morta: pilares ativos filtram o seletor de Pilar na Produção, tom padrao pre-seleciona, e as diretrizes entram no prompt do "Gerar posts" via context (sem redeploy da edge). E2E ao vivo OK (salvou; Produção listou so os 2 pilares ativos). Resta: DAM, depois publicacao nativa via Graph. Commit 041f967.

72. **[[Atualizacao_2026-06-18_Conteudo_Biblioteca_DAM]]**
    Conteúdo: Biblioteca (DAM) — acervo de midia organica por marca (tabela premium_media_assets, bucket 'cards'). Helpers list/register/upload/delete; uploadPostArt AUTO-REGISTRA a arte ao salvar no post; view Biblioteca.jsx (grid por marca/kind, enviar/copiar URL/baixar/excluir) no menu Produção de conteúdo. E2E ao vivo OK (arte salva apareceu no acervo; excluir removeu storage+linha). Resta so: publicacao nativa via Graph (entrega dedicada). Commit (ver git).

73. **[[Atualizacao_2026-06-18_Conteudo_Simplifica_Organico]]**
    Conteúdo: simplifica a secao organica separando do chrome PAGO (a secao reusa o PremiumDashboard e herdava roupa de campanha). Itens 1-3: oferta-first -> ORGANICO-first ("Oferta vinculada" comeca em "Sem oferta — conteudo de marca"; paid segue na 1a campanha); KPIs do header agora organicos (Conteúdos/Rascunhos/Agendados/Publicados no lugar de Campanhas/Assets/Investimento/leads); removidos a aba "Modelo" e o botao "Nova oferta" do organico. So UI; Trafego Pago intacto. E2E ao vivo OK; console limpo. Resta: publicacao nativa via Graph. Commit bb269c6.

74. **[[Atualizacao_2026-06-18_Conteudo_Vinculo_Oferta_Contextual]]**
    Conteúdo (item 4): fim do seletor GLOBAL de oferta no topo do organico — a secao opera em visao de MARCA (KPIs/funil/Publicações brand-wide). O vinculo com oferta virou CONTEXTUAL, dentro do card "Novo conteúdo" (estado interno linkedCampaignId, default "Sem oferta"). PublicationsSection herda oferta/marca do conteudo escolhido. E2E ao vivo OK (salvar manual vinculando TOM MENINO DEUS -> post com aquela campaign_id; funil brand-wide 40 com tags MARCA+oferta); server limpo sem erros. So UI; Trafego Pago intacto. Resta so: publicacao nativa via Graph. Commit 5ac7f79.

75. **[[Atualizacao_2026-06-18_Conteudo_Clareza_Salvar_Rascunho]]**
    Conteúdo: clareza do "Salvar rascunho". Analise do fluxo Gerar posts -> Salvar: mecanica ja certa, faltava feedback de "pra onde foi" + proximo passo. Entregue: banner "Rascunho salvo em Conteúdos em produção — abaixo. Próximo passo: Aprovar"; ROLA+DESTACA o item (ring dourado+badge "novo" ~3,5s); funil ordena mais recentes no topo; bloco IA rotulado "Sugestões da IA" (aviso que somem ao gerar novas); "Salvo no board"->"Salvo em rascunhos"; microcopy do funil com "Acompanhe também em Conteúdos/Calendário". So UI. E2E ao vivo OK; console limpo. Resta so: publicacao nativa via Graph. Commit 2508911.

76. **[[Atualizacao_2026-06-18_Trafego_Preset_Campanha_Referencia_Fase1]]**
    Tráfego: padrao reutilizavel "campanha de referencia -> preset". Analisadas 2 campanhas TOM MENINO DEUS: 30.05 (R$2.539, 179 leads, CPL R$14,19 = referencia validada) vs 10.06 (nova, CPL R$16,71). FASE 1: acao read_campaign_config na edge publish-meta-ads (READ-ONLY) le/normaliza o blueprint via Graph (summarizeGeo). Blueprint REAL da 30.05: OUTCOME_LEADS+QUALITY_LEAD+LOWEST_COST_WITHOUT_CAP+CBO R$15/dia; regional raio-ponto 1mi age 25-65; amplo cidade POA age 18-65; FB+IG; generos todos. Verificado ao vivo. Commit d2efbac.

77. **[[Atualizacao_2026-06-18_Trafego_Preset_Fases2e3a]]**
    Tráfego: preset Fases 2+3a. FASE 2 (commit 9d1f92f): tabela premium_meta_presets + helpers readMetaCampaignConfig/presetBlueprintFromConfig (normaliza: age 25-65, raio 2km, cidade macro, FB+IG, 3x3, form por ticket)/save/list/delete. FASE 3a (commit 89ab518): targetingFor aceita geo por conjunto — radius (custom_locations lat/lng+km) = regional; city (city_key) = macro. deno+deploy OK; tabela verificada. Backend do "clonar a vencedora" completo. RESTA: painel de presets no Tráfego Pago (importar/salvar/listar/usar->semeia o build) + build PAUSED ao vivo do produto Azenha (precisa endereco->lat/lng + 1 criativo aprovado).

78. **[[Atualizacao_2026-06-19_Trafego_Painel_Presets_e_Azenha]]**
    Tráfego: painel de Presets (MetaPresetsPanel no Tráfego Pago) — importa config de campanha de referencia, mostra blueprint padronizado e salva/lista/exclui presets por marca. E2E ao vivo: importou a 30.05 -> blueprint OUTCOME_LEADS/QUALITY_LEAD/CBO R$15/25-65/regional 2km+cidade/mais volume -> salvou. AZENHA: endereco Carlos Barbosa 531 geocodificado (lat -30.0608422, lng -51.2115284), preset "Padrão Lead Imóvel — Azenha" criado com raio 2km nesse ponto + cidade POA + form mais_volume (ticket alto). Build ao vivo PAUSED depende de: criar a campanha Azenha + aprovar >=1 criativo (3x3); ativar = confirm. Commit e6386df.

79. **[[Atualizacao_2026-06-19_Trafego_Auto_Seed_Preset]]**
    Tráfego: AUTO-SEED do preset. "Usar preset" semeia o PublishMetaPanel: objetivo (OUTCOME_LEADS->leads_form), orcamento (CBO), e os 2 conjuntos por geografia como proposta a revisar (regional geo=radius lat/lng+km; macro geo=city), com linha "Geo: raio Nkm (lat,lng)". targetingFor (Fase 3a) aplica no build. E2E ao vivo: preset Azenha -> painel com Leads (formulário)+R$15/dia+Regional(raio 2km -30.0608,-51.2115)+Cidade(POA) 25-65. Padrao "clonar a vencedora" COMPLETO (importar->normalizar->persistir->auto-seed->build geo raio->PAUSED->activate confirm). Commit 770cc02.

80. **[[Atualizacao_2026-06-19_Trafego_Build_PAUSED_Azenha_E2E]]**
    Tráfego: build PAUSED da Azenha ponta a ponta (validacao do preset). Campanha "Residencial Azenha 531" + 1 criativo aprovado de TESTE (placeholder) -> build_draft com o blueprint (leads_form, CBO R$15, 2 conjuntos: regional raio 2km em -30.0608/-51.2115 + cidade POA). meta_campaign_id 120252930267170221, 2 conjuntos PAUSED, zero gasto. read_campaign_config CONFERIU: radius_point 2km no ponto da Azenha + city 264859, age 25-65, FB+IG, lead form pt-BR is_optimized_for_quality=false (mais volume/sem SMS, ticket alto). Limpo via delete_draft + rows de teste (form leadgen orfao fica inofensivo). Achado: build usa LEAD_GENERATION; ref usa QUALITY_LEAD -> refinar leads_form no playbook. So validacao (sem codigo). Sem commit de codigo.

81. **[[Atualizacao_2026-06-19_Skill_Vitra_Trafego_e_QualityLead]]**
    Skill nova `vitra-trafego` (v1, LOCAL em .claude/) — estrategista de Meta Ads: analisa campanhas pagas, ranqueia VENCEDORAS por contexto (CPL/leads/maturidade), extrai o padrao e ADAPTA a um novo imovel (endereco→raio, ticket→form, publico, regiao, objetivo). So PROPOE: relatorio markdown + JSON do preset (forma de premium_meta_presets.blueprint, importavel/auto-seed). NAO executa/ativa — build do app, PAUSED, sob aprovacao. Espelha vitra-conteudo (organico). Regras: vencedora=CPL≤mediana+leads≥30+madura; score+proveniencia; TTL p/ depreciar; nunca fora dos guards. + Ajuste no objectivePlaybook: leads_form optimization_goal LEAD_GENERATION→QUALITY_LEAD (DEPOIS revertido — ver item 82). (.claude gitignored — skill nao versionada.)

135. **[[Atualizacao_2026-06-24_Imovel_Vendido_Video_Watermark_Modelo_Texto]]**
    Adicionado 2º modelo selecionável de marca d'água no vídeo: Texto (VITRA) = video-aprovadas/texto-vitra op15/25/40 (1600×420), ao lado do Horizontal (V+VITRA). Copiados wm-vitra-texto-op{15,25,40}.png p/ public/pecas; JS WM_FILES{horizontal,texto}+wmStyle+setWmStyle, applyWm monta wm-vitra-{modelo}-op{op}.png; UI ganhou seletor "Marca d'água (modelo)" e a opacidade aplica aos dois. Padrão Horizontal·40% inalterado. Verificado por pixels (horizontal op40 6601×1480 centro 540 brilho 123; texto op40 1600×420 centro 540 brilho 122); build OK (6 PNGs em dist/pecas). Commit 94ba970.

134. **[[Atualizacao_2026-06-24_Imovel_Vendido_Video_Watermark_Master_op40]]**
    A pedido do cliente, a marca d'água do vídeo passou a usar a master oficial horizontal-aprovada-branca op40 (vitra-mae-watermark-horizontal-branca-op40.png, 6601×1480) no lugar da derivada de vídeo. Copiados wm-vitra-h-branca-op{15,25,40}.png p/ public/pecas (removidas as wm-vitra-video-h-*); padrão op40 (boot+botão); seletor 15/25/40 mantido. Verificado por pixels: fonte op40 carrega (6601×1480), centralizada nos 2 formatos (centro 539≈540), brilho ~123 sobre navy; build OK. Commit e73b96b.

133. **[[Atualizacao_2026-06-24_Imovel_Vendido_Video_Watermark_Oficial]]**
    Correção: a marca d'água do vídeo "Imóvel Vendido" passou a usar o PNG OFICIAL aprovado para vídeo (brand/watermark/video-aprovadas, v-vitra-horizontal op15/25/40) em vez do lockup redesenhado no canvas (que ainda acrescentava "IMOBILIÁRIA" — a oficial é só V+VITRA). Copiados wm-vitra-video-h-op{15,25,40}.png p/ public/pecas; drawWatermark desenha o PNG centralizado (sem redesenhar glifo, sem filtro — regra da marca); seletor de opacidade 15/25/40 (padrão 25%). Same-origin → canvas não fica tainted (MediaRecorder ok). Verificado via amostragem de pixels (op25 brilho ~89, op40 ~122 sobre navy); build OK com PNGs em dist/pecas. Inalterado o resto. Commit d66f70a.

132. **[[Atualizacao_2026-06-23_Imovel_Vendido_Video_Mascara_v2]]**
    Ajustes na máscara do vídeo "Imóvel Vendido" + novo formato 4:5. (1) Marca d'água: logo virou marca d'água oficial VITRA IMOBILIÁRIA centralizada horizontalmente (leve transparência, safe). (2) Carimbo: removido o selo circular, sobrou só "VENDIDO" com tratamento de carimbo (moldura dupla dourada, inclinado -8°, translúcido) no canto superior-direito livre. (3) Headline: degradê inferior escuro e suave (4 stops, fade longo, sem faixa rígida) atrás da headline. Novo toggle 9:16⇄4:5 com layout por formato (LAYOUT.story|feed); 9:16 mantém posições aprovadas, 4:5 (1080×1350) com layout próprio; export/capa nomeiam o formato. Inalterados: mensagem/corretor, colchetes, régua, gradiente do topo, fluxo. Verificado no preview nos 2 formatos (console limpo); lint+build OK. Commit 6349563.

131. **[[Atualizacao_2026-06-23_Imovel_Vendido_Video_Fase1]]** (base: [[Analise_Imovel_Vendido_Video]])
    Nova peça em VÍDEO "Imóvel Vendido" no Estúdio de Peças (Marketing Institucional, Imobiliária), 9:16 para Reels/Stories/WhatsApp Status. Gerador public/pecas/imovel-vendido-video-vitra-imobiliaria.html: sobe o vídeo do corretor tocando o sino, máscara navy+dourado (logo VITRA, selo VENDIDO, colchetes, gradientes, mensagem + nome do corretor) aplicada por cima SEM cobrir o centro. Fase 1 client-side (sem backend): canvas compositing + zoom/arraste p/ enquadrar + corte início/fim + áudio original on/off + trilha mixada (WebAudio) + capa PNG + export via MediaRecorder (MP4 se suportado, senão WebM). Estados processando/sucesso/erro, validação ≤60s/≤150MB, safe-area 9:16. Texto/logo desenhados nativamente no canvas (fontes da marca). Catálogo: novo formato imovel-vendido-video em pecasCatalog (view data-driven inalterada). Verificado no preview (máscara + console limpo); lint+build OK. Commit c611811.

130. **Template 11: fix do preço estourando o card** — o valor "R$ 950 mil" extrapolava o retângulo branco porque o estimador de largura (Inter caixa-alta) subdimensiona o Poppins nesse corpo grande e o fator 0.84 inflava o orçamento. Fit do preço passou a fator 1.0 + padding pW-72 → cabe dentro do card com folga nos 3 formatos. Re-render conferido. Commit 3210cef.

129. **[[Atualizacao_2026-06-23_Template_11_Ajuste_Fino]]**
    Ajuste fino do Template 11 a partir das marcações do cliente: card de preço → largura total da coluna com o valor preenchendo (1:1 514px, 9:16 508px, 1.91:1 preenche o vão até a galeria); removidos telefone e site do rodapé (1:1 e 9:16 ficam só com o CTA) — tiradas as variáveis phone/website do builder + campos do catálogo (contact_footer→cta_footer); galeria do 1.91:1 recolhida para dentro da safe. Re-render dos 3 formatos (sem+com moldura) conferido. Commit 5ba6897.

128. **[[Atualizacao_2026-06-23_Template_11_Ficha]]**
    11º template Imobiliária "Ficha do imóvel" (de uma referência visual de marca concorrente — só conceito, sem copiar logo/contatos): fundo navy sólido + logo/headline/subtítulo + 4 cards de atributo (ícone de linha em tile branco + barra navy) + card de preço dourado + galeria de 3 fotos + rodapé de contato (CTA + régua dourada + telefone/site). Edge buildVitraFichaSvg + ícones por palavra-chave (fichaIconKind/fichaIconSvg: suíte→cama, vaga→garagem, piscina→pool, m²→área, etc.), 3 formatos próprios + safe zone (rodapé omitido no 1.91:1), maxImages=3. Catálogo família vitra-imobiliaria-ficha-imovel (fieldGroups, 5 recipes, renderVersion ficha-imovel-approved-v1, 6 previews) + dispatch/allowlist + guard test (11 imob/7 selecionáveis). Adaptação: azul→navy, preço→dourado. Verificado nos 3 formatos vs referência. Commit a47e747.

127. **[[Atualizacao_2026-06-23_Template_10_Ajuste_Fino]]**
    Ajuste fino do Template 10 a partir das marcações do cliente (sem mexer em conteúdo/cores/fontes): 9:16 — barra de subtítulo "2 DORM..." tinha largura 580 (maior que preço/checklist=470) e invadia a galeria → 470 (alinha a coluna e libera a galeria); 1.91:1 — caixa do wordmark VITRA sobrepunha a 1ª foto e encostava na margem → recolocada na própria faixa acima da galeria ([858,60,238,62]), galeria desce/encolhe ([136,276,416]/128), dentro da safe. 1:1 inalterado. Re-render sem+com moldura conferido. Commit 591a381.

126. **[[Atualizacao_2026-06-23_Template_10_Oportunidade]]**
    10º template Imobiliária "Oportunidade no bairro" (de uma referência visual do cliente): foto aérea/hero full-bleed + coluna de blocos navy à esquerda (eyebrow OPORTUNIDADE + bairro em Anton + caixa de preço + barra de subtítulo/tipologia + painel de checklist com 6 selos-check dourados) + galeria de 3 fotos em moldura navy à direita + wordmark VITRA em caixa navy no topo. Edge buildVitraOportunidadeSvg (hero + blocos navy gradiente + galeria emoldurada offset), 3 formatos próprios + safe zone, maxImages=4. Catálogo família vitra-imobiliaria-oportunidade-bairro (fieldGroups, 5 recipes, renderVersion oportunidade-bairro-approved-v1, 6 previews) + dispatch/allowlist + guard test (10 imob/6 selecionáveis). Adaptação de marca: checks verdes da referência → dourados (paleta oficial). Verificado 1:1 e 9:16 vs referência. Commit 6f88e67.

125. **[[Atualizacao_2026-06-23_Template_09_Vitrine]]**
    9º template Imobiliária "Vitrine alto padrão" (de uma referência visual do cliente): painel navy com corte diagonal à esquerda (foto do prédio atrás) + headline (Anton) + De/Por + checklist de 5 selos-check dourados + CTA pill clara; coluna de 3 fotos arredondadas à direita sobre off-white. Edge buildVitraVitrineSvg (polígono diagonal + galeria + selos + De/Por), 3 formatos próprios + safe zone, maxImages=4. Catálogo família vitra-imobiliaria-vitrine-gallery (fieldGroups, 5 recipes, renderVersion vitrine-gallery-approved-v1, 6 previews) + dispatch/allowlist + guard test (9 imob/5 selecionáveis). Polimento: removido tag colidente, bullets sem truncar. Verificado 1:1 e 9:16 vs referência. Commit 25f9061.

124. **[[Atualizacao_2026-06-23_Template_08_Lancamento_Premium]]**
    Versão Premium (preto+dourado) do Template 08 Lançamento, SÓ na marca Vitra Premium (entrada no array premium do catálogo → modal filtra por marca). Mesma densidade da v2 Imob: painel preto institucional + selo PRÉ-LANÇAMENTO + headline + destaque dourado + 3 setas + "a partir de"/preço + CTA Lista VIP, voz de alto padrão. Motor SVG-direto passou a servir Premium: buildVitraLancamentoSvg brand-aware (preto/dourado + wordmark VITRA PREMIUM), PREMIUM_DIRECT_SVG_FAMILIES + helpers, modelKey/roteamento/dispatch/maxImages reconhecem a family. Guard: Premium 1→2. Verificado ao vivo (wordmark PREMIUM completo, 3 formatos, 6 previews). Commit d200ad4.

123. **[[Atualizacao_2026-06-23_Template_08_Lancamento_v2_Redesign]]**
    Redesenho do Template 08 "Lançamento" (v1 estava genérica). v2 com densidade no nível do San Clemente: foto hero + painel navy institucional + selo de lançamento dourado + headline + destaque dourado + 3 diferenciais com setas + "A partir de"/preço + CTA pill "Entrar na lista VIP". Campos novos (differentials + price), recipes de escassez/exclusividade, renderVersion→lancamento-approved-v2. Verificado: 3 formatos conferidos (selo, headline, destaque, setas, preço, CTA; safe zone reels ok); 6 previews regerados; bug de seed (\n literal) corrigido. lint+164 testes+build. Commit 2ff588a.

122. **[[Atualizacao_2026-06-23_Template_08_Lancamento]]**
    8º template aprovado da Imobiliária "Lançamento / Em breve" (teaser topo de funil): foto hero + selo dourado (tag) + headline + localização + CTA, sem De/Por. Mesma arquitetura do San Clemente: catálogo (família vitra-imobiliaria-lancamento, fieldGroups c/ tagline=selo, 5 recipes, renderVersion lancamento-approved-v1, 6 previews) + Edge buildVitraLancamentoSvg (3 formatos + safe zone) + dispatch + allowlist VITRA_IMOBILIARIA_TEMPLATE_FAMILIES (faltava → caía no fallback) + renderVersions mirror + guard test (8 templates/4 selecionáveis). Verificado ao vivo (1:1 e 9:16 conferidos, safe zone ok, 6 PNGs servidos). Só Imobiliária nesta primeira. Commit b59d566.

121. **[[Atualizacao_2026-06-23_Per_Placement_Leadgen]]**
    Anúncios de formulário (leadgen) usavam só o 1:1; 9:16 e 1.91:1 ignorados. Causa: no P1 eu gateei per-placement com !isLeadForm (asset_feed_spec recusou o form antes). Fix no build_draft: removido o gate; lead form anexado via asset_feed_spec.call_to_actions (lead_gen_form_id); link_urls sempre presente (asset customization exige link); base64 em chunks no upload (corrige WORKER_RESOURCE_LIMIT com vários cortes). Regras: 9:16→story/reels, 1.91:1→coluna direita, 1:1→default. Verificado: build leadgen 2 conceitos × 3 formatos → per_placement:true nos 2 anúncios, sem fallback. 4 testes apagados; campanha real do usuário preservada. Commit 6b2daf2.

120. **[[Atualizacao_2026-06-23_Cracha_Nitidez_Foto_Export]]**
    Foto do crachá saía mole no PNG. Causa: export com scale:1 → foto rasterizada em ~300px (caixa do círculo), independente da resolução enviada. Fix sem mexer no layout: EXPORT_SS=2 (html2canvas scale:2) → PNG 1370×2102 px (~600 DPI), foto amostrada da fonte em ~600px (nítida). Janela de captura segue 685×1051 (mesma composição/sangria/enquadramento). Aviso de UI atualizado (use foto ≥600px, evite zoom alto). Verificado: export 1370×2102, 600 DPI, 151ms. Commit 3f9a7db.

119. **[[Atualizacao_2026-06-23_Imovel_Vendido_Premium]]**
    Versão Premium (preto+dourado, editorial) do modelo "Imóvel Vendido": logo VITRA PREMIUM (V dourado, sem azul), selo VENDIDO dourado, Playfair editorial, presets na voz Premium ("alto padrão"/"curadoria"/"patrimônio"), multiformato + fundo opcional. Variante vitra_premium no formato imovel-vendido (categoria Marketing Institucional); exibida conforme a marca ativa. Verificado ao vivo (export 1080×1350). Commit 1314018.

118. **[[Atualizacao_2026-06-23_Imovel_Vendido_Institucional]]**
    Novo modelo "Imóvel Vendido" em nova categoria "Marketing Institucional" (pecasCatalog, ícone BadgeCheck, Imobiliária) — prova social de venda concluída SEM dados do imóvel/cliente. Gerador imovel-vendido-institucional-vitra-imobiliaria.html: multiformato (Feed 4:5/Story 9:16/WhatsApp 1:1), selo VENDIDO (medalhão dourado + V), mensagem principal por presets editáveis (variações), complemento, rodapé+slogan, imagem de fundo opcional. Esqueleto validado (correções html2canvas). Verificado ao vivo (selo + headline + export 1080×1350). Sem back-end. Commit 1b5131c.

117. **[[Atualizacao_2026-06-23_Cracha_Persistencia_e_CSV]]**
    Próximo passo do crachá: persistência local + lote por CSV. Decisão de PO: gerador é página estática → persistência client-side (localStorage + CSV) em vez de acoplar banco a página pública. Importar CSV (nome;cargo;setor;matricula;qr) → lista do lote; Baixar modelo CSV; Registros salvos no localStorage (salvar/dedup nome+matrícula, salvar lote, abrir, excluir, exportar todos CSV); foto reanexada ao reabrir. Verificado por eval: CSV 2 registros → salvar → 2 salvos (dedup) → abrir 2º → card "Carlos Lima". Sem back-end. Commit 1ea6297.

116. **[[Atualizacao_2026-06-23_Cracha_Corporativo_PVC]]**
    Nova categoria "Crachá Corporativo" no Estúdio de Peças (pecasCatalog, ícone Contact, Imobiliária), fiel à seção "Crachá Corporativo" do brandbook (navy gradient, slot oval, ícone V, foto circular c/ anel dourado, nome/cargo, rodapé borda-topo dourada; CR-80 PVC 0,76mm sublimática frente/verso). Gerador cracha-corporativo-vitra-imobiliaria.html: form (nome/cargo/setor/matrícula/cidade/QR) + foto circular com zoom/arraste + frente/verso (verso = QR caixa branca + matrícula + slogan "Viva·Invista·Evolua") + guias de corte/segurança + lote (Nome;Cargo;Setor;Matrícula) + export PNG 300dpi. Técnico: corte 5,4×8,5cm=638×1004px; sangria 2mm→685×1051px (exportado); segurança 4mm. Verificado: export real 685×1051 @300dpi em 221ms; frente/verso fiéis. lint+build. Commit 7f7dec8.

115. **[[Atualizacao_2026-06-23_Boas_Vindas_e_Premium_Endomarketing]]**
    +Boas-vindas a novo colaborador (Imobiliária + Premium) e versões Premium (preto+dourado, editorial, logo só dourado/sem azul) de comunicado/metas/aniversariantes. PO: o Convite de evento (futebol/churrasco verde-amarelo) NÃO cruza p/ Premium (destoa do luxo). pecasCatalog: categoria interno com 5 modelos; evento só Imob, os demais Imob+Premium. Construídos sobre o esqueleto do evento-interno (correções html2canvas embutidas). Verificado por PNG real: boas-vindas Imob, metas Premium, aniversariantes Premium 9:16 — íntegros. lint+build. Commit 92aa42f.

114. **[[Atualizacao_2026-06-23_Endomarketing_3_Modelos]]**
    +3 modelos na categoria Comunicação Interna (pecasCatalog, Imobiliária), multiformato (Feed 4:5 · Stories/Status 9:16 · Post 1:1), editáveis + foto opcional + export PNG: Aniversariantes do mês (lista dia+nome, confetes), Comunicado interno (selo+título+mensagem+assinatura) e Metas batidas (número gigante + parabéns ao time). Construídos sobre o esqueleto validado do evento-interno, com as correções de export do html2canvas embutidas. Verificado ao vivo (PNG real 1080×1350 íntegro nos 3). Commit 6d719c9.

113. **[[Atualizacao_2026-06-23_Fix_Export_PNG_Evento_Interno]]**
    Fix do PNG quebrado do evento-interno (texto sobreposto só no export, preview ok). Causa html2canvas 1.4.1: (1) transform:scale inline no .frame vencia o CSS body.exporting → capturava o palco escalado (432×540) e desenhava 1080px dentro → colapso; (2) inset:0 não resolvido → .content largura auto, flex encolhe, texto quebra letra a letra. Fix: exportPeca zera transform/margin inline do .frame na captura (restaura no finally); camadas absolutas usam top/left:0+width/height:100% em vez de inset:0; white-space:nowrap nos títulos. Verificado rasterizando o PNG na página: 1080×1350 e 1080×1920 corretos. Commit b1b95aa.

112. **[[Atualizacao_2026-06-23_Estudio_Pecas_Comunicacao_Interna]]**
    Nova categoria "Comunicação Interna" (endomarketing) no Estúdio de Peças (pecasCatalog data-driven, ícone PartyPopper, Imobiliária) — peças de cultura/engajamento do time. Gerador multiformato public/pecas/evento-interno-vitra-imobiliaria.html: Feed 4:5, Stories/Status 9:16 e Post 1:1 num só, textos editáveis + upload da foto do ambiente como fundo (fallback gradiente da marca), export PNG por formato. 1ª peça: evento Brasil × Escócia (amanhã 19h, salão de vendas, churrasco — cada um leva um corte), navy+dourado + acento verde-amarelo sutil + Copa 2026. Correções html2canvas (createPattern 0: gradiente em caixa 2px→sólido; bandeira emoji→texto). Verificado: menu mostra a categoria, 3 formatos exportam. lint+164 testes+build. Commit 8bec85c.

111. **[[Atualizacao_2026-06-23_Copy_Guard_Limite_Palavra_e_Murano]]**
    Guard de marca (copyValidation) passa a casar por LIMITE DE PALAVRA (regex (?<!\p{L})termo(?!\p{L}), flag iu) em vez de substring cru — corrige falso-positivo "curado" dentro de "proCURADOs" (reprovava copy legítima da Imobiliária; visto ao gerar o ângulo de preço do Murano). +2 testes (164 total). Redeploy generate-copy + publish-meta-ads. Também: Murano finalizado — os 2 conceitos com copy fraca/descrição vazia ("Destaque", "Lista") ganharam copy completa via vitra-copy nos 3 cortes (só texto_principal+descrição, sem re-render/sem mexer na arte aprovada); Oportunidade segue generated p/ aprovação humana; meta_campaign_id null/planning (limpo). Commit d0076b5.

110. **[[Atualizacao_2026-06-23_Render_9x16_Endurecido]]**
    render-asset endurecido p/ 9:16 (fim do reenfileiramento manual). Causa: 9:16 da Imobiliária renderiza full 1080x1920 (SCALE_TALL só afetava Premium/satori); OOM em isolate frio mata o isolate e prende o asset em rendering. Fix edge: TALL_RASTER (default 0.85 → 918x1632, -28% memória, secret PREMIUM_RENDER_TALL_RASTER) nos 2 motores; 1 corte alto por invocação (probe força limit=1); reaper 10→3 min; MAX_RENDER_ATTEMPTS 3→4. Cliente: WORKER_RESOURCE_LIMIT = transitório + reset dos presos em rendering→queued antes do retry (isolate quente + raster menor → passa). Verificado: 9:16 rendered:1 de primeira, PNG 918x1632. Commit 9605900.

109. **[[Atualizacao_2026-06-23_Per_Placement_IG_e_Render_3_Formatos]]**
    Fecha o P1: per-placement passou a FUNCIONAR de fato. #2 instagram: build busca a conta IG da Página; instagram_actor_id (legado) era rejeitado → trocado por instagram_user_id (moderno) no object_story_spec → aceito. #1 render: cortes 9:16/alguns 1.91:1 estavam approved SEM public_url; renderizados via render-asset um a um (9:16 dá WORKER_RESOURCE_LIMIT/OOM em isolate frio → reset queued + retry). Os 3 conceitos agora têm os 3 formatos. Verificado ao vivo: build Leads(clique) FB+IG todos os posicionamentos → per_placement:true, formats:[feed,story,wide], ads:1, sem fallback; banco confirmou. 4 rascunhos de teste apagados. Assets restaurados (Oportunidade→generated p/ gate humano). Commit d00f20a.

108. **[[Atualizacao_2026-06-23_Criativo_Por_Posicionamento_P1]]**
    P1 da revisão: build usa a arte certa por posicionamento (asset_feed_spec) em vez de 1 imagem recortada. 1 anúncio por CONCEITO (conceptsFor agrupa por ad_label; fmtRole: 1:1/4:5→feed, 9:16→story, 1.91:1→wide); asset_customization_rules (story em stories/reels, wide na coluna direita, feed base); imagens via /adimages→hash. Fallback seguro p/ imagem única (nunca quebra o build). Leadgen mantém imagem única (form só anexa nela) + nota; per-placement vale p/ tráfego/vendas. Bug corrigido: lead_gen_form_id em link_urls causava "(#100) Invalid keys" — removido, asset_feed_spec passou a ser aceito (erros restantes são no /ads: pixel/conta-IG, wiring por objetivo). Resposta ganha placement_notes; publicação grava per_placement+formats. 8 rascunhos de teste criados e apagados. deno check; deploy CLI. Pendente: renderizar os 3 formatos (9:16 sem url), instagram_actor_id. Commit 43436a5.

107. **[[Atualizacao_2026-06-23_Copy_Descricao_Obrigatoria_P0]]**
    P0 da revisão de copy do Murano: corrige "Descrição" vazia nos anúncios. Causa raiz: (1) generate-copy DESCARTAVA o campo description na montagem da resposta (gerava mas não repassava); (2) nada exigia descrição p/ publicar. Fix: generate-copy repassa description; build_draft torna descrição OBRIGATÓRIA (criativo sem ela é pulado com motivo em skipped_creatives); UI: check "Descrição" no readiness/QA, gate publishableAssets exige descricao, AdEditModal com campo obrigatório (borda âmbar + aviso + Salvar bloqueado) e "Gerar 3 ângulos" propaga aos 3 cortes via saveAd. Verificado: curl (desc agora preenchida), UI (loop gerar→aplicar→salvar), banco (3 cortes c/ mesma descrição), build pula tudo sem descrição. lint+162 testes+build; deploys CLI. Commit 631815d.

106. **[[Atualizacao_2026-06-22_Multi_Anunciantes_Desativado]]**
    "Anúncios com vários anunciantes" desmarcado por padrão em todo build novo: build_draft cria o conjunto com is_multi_advertiser_ads_enabled:false; loop resiliente (máx 3) retira o param se o objetivo recusar (e os interesses depreciados), nunca falha — devolve multi_advertiser_off/note. read_campaign_config lê o campo. UI: linha de status "Desativado — enviado à Meta em todo anúncio novo (não altera existentes)". Validação: write da Graph ACEITOU false (sem erro); read devolve null (Meta não ecoa o off) → fonte de verdade é o que enviamos. Build PAUSED de teste criado e apagado. lint+162 testes+build; deploy CLI. Commit e2bb56e.

105. **[[Atualizacao_2026-06-22_Posicionamentos_UI_e_Default]]**
    Posicionamentos manuais ponta a ponta. Frente 1: buildGeoAdSets nasce com o preset recomendado (FB+IG + posições exatas) — toda campanha nova já sobe correta. Frente 2: UI "Plataformas e posicionamentos" no PublishMetaPanel (preset+origem, toggles FB/IG/Messenger/AN, checkboxes por plataforma com incompatíveis ⚠, avisos de incompatibilidade/entrega restrita, restaurar recomendado, Advantage+ omite). handleBuild injeta publisher_platforms+*_positions. Frente 3: re-build PAUSED da Murano (120253161779440221) — antiga=None/None/adv0 (Advantage+ tudo), nova=FB+IG+posições exatas/adv1, igual à referência. lint+162 testes+build. Commit cc5d6a4.

104. **[[Atualizacao_2026-06-22_Posicionamentos_Analise_Base]]**
    Análise de Posicionamentos manuais das referências: TODOS os conjuntos = FB+IG (Messenger e Audience Network OFF), positions feed/marketplace/story/reels/profile (+notification FB; macro 30.05 + explore/profile_reels no IG); sem coluna da direita/in-stream/pesquisa/instant article. Casa 100% com Feed 4:5 + Story 9:16. read_campaign_config capta *_positions; build_draft aceita posições explícitas (precedência) ou omite (Advantage+). 3 presets em _shared/placementPresets.ts (FB+IG recomendado / Feed+Stories enxuto / Automático) + mapa de incompatíveis. UI do campo "Plataformas" = próxima entrega. deno+deploy CLI. Commit fba657f.

103. **[[Atualizacao_2026-06-22_Estimativa_Publico_Meta]]**
    Estimativa NUMÉRICA real de público via delivery_estimate da Meta. Edge publish-meta-ads ação estimate_audience (monta targeting geo+idade+interest_ids+públicos+Advantage; QUALITY_LEAD→LEAD_GENERATION p/ estimar). premiumData estimateAudience. UI: botão "Estimar alcance (Meta)" no Direcionamento detalhado estima cada conjunto por geografia e mostra a faixa (~X mil–Y mi). Verificado: Porto Alegre ~925k–1,1mi; Região 2km ~64–75 mil. deno+lint+162 testes+build OK; deploy CLI. Fecha o ciclo (análise→presets→build→UI→estimativa). Commit 004a764.

102. **[[Atualizacao_2026-06-22_Direcionamento_Detalhado_UI]]**
    UI do Direcionamento detalhado no PublishMetaPanel: bloco com preset (origem visível, 3 presets), chips de interesses por tier (núcleo dourado obrigatório / recomendado / opcional removíveis), interesses extras por nome, toggle Advantage e estimativa qualitativa de alcance (Amplo/Médio/Específico, reativa). handleBuild aplica interest_ids+interest_keywords+advantage_audience aos conjuntos por geografia; build_draft já materializa. Padrão = "Intenção imobiliária (núcleo)" + Advantage on. lint+162 testes+build OK; verificado ao vivo (Murano: preset, chips, toggle Amplo→Médio). Commit 9d52426.

101. **[[Atualizacao_2026-06-22_Direcionamento_Detalhado_Analise]]**
    Análise do Direcionamento detalhado das referências: vencedores usaram SÓ interesses + Advantage=1 (sem comportamentos/demográficos/exclusões/públicos). Núcleo comum: Investimento + intenção imobiliária. 30.05 regional=luxo/investidor; 10.06=enxuto (casa/apto/condomínio). read_campaign_config estendido (detailed_targeting/exclusions/advantage). build_draft: interest_ids pré-resolvidos (sem busca→sem item indisponível) + advantage_audience por conjunto (achado: app forçava 0, ref usa 1). 3 presets em _shared/detailedTargetingPresets.ts (IDs reais, tiers core/recommended/optional). UI do campo = próxima entrega. deno+deploy CLI. Commit 91bb642.

100. **[[Atualizacao_2026-06-22_Trafego_Publicos_Analise_Base]]**
    Análise dos Públicos Personalizados das campanhas de referência: ACHADO — TOM 30.05/10.06 (vencedoras) NÃO usaram nenhum público (geo+idade+form apenas). read_campaign_config estendido (captura custom_audiences/excluded por conjunto) confirma INC/EXC vazios. Inventário da conta mapeado (lookalike/engajamento/seguidores/lista/form ativos + muitos inactive). Públicos viram camada OPCIONAL; presets recomendados: Excluir leads existentes (maior valor), Semelhante quente, Aquecidos. Base backend entregue: build_draft aceita incluir N + excluir N (dedup, sem overlap). UI do seletor = próxima entrega. Commit 5dc3cd4.

99. **[[Atualizacao_2026-06-22_Trafego_2_Conjuntos_Localizacao]]**
    Tráfego: toda campanha com 2 conjuntos por localização — Porto Alegre (cidade, key 264859) + Região do imóvel (raio ≤2km do endereço). Nova Edge geocode-address (Nominatim, server-side, sem chave) + helpers geocodeAddress/buildGeoAdSets/saveCampaignGeo/META_POA_CITY_KEY. Bloco "Localização · 2 conjuntos" no PublishMetaPanel: endereço→Localizar→lat/lng editáveis→slider raio 1–2km→"Definir os 2 conjuntos" (nomes padronizados, substitui proposta, persiste em brief.geo_target) + ver no mapa + aviso p/ endereço não encontrado. build_draft já cria raio+cidade. deno+lint+162 testes+build OK; deploy CLI; verificado ao vivo (Azenha→-30.0608/-51.2115; Murano→2 conjuntos na prévia). Commit ceffbe5.

98. **[[Atualizacao_2026-06-22_Feed_4x5]]**
    Feed organico 1:1 → 4:5 (1080×1350) em todo o fluxo. Fonte única postArt.DIMS.feed atualizada → render/cropper/prévias seguem. Drawer: toggle "Feed 4:5", frame do cropper 4/5, export 4:5; card da grade aspect-[4/5]; contentPlaybook spec do feed → "4:5 1080x1350" (prompt IA), generate-content redeployada. Story segue 9:16. Não toca nas peças PAGAS (1:1/9:16/1.91:1). lint+162 testes+build OK; verificado no preview. Commit 854d3b5.

97. **[[Atualizacao_2026-06-22_Cropper_Imagem_Propria]]**
    Cropper interativo na aba "Imagem própria" do drawer: arrastar p/ reposicionar (ponto focal) + slider de zoom (1×–3×) + "centralizar". Helper puro drawCroppedImage (cover+zoom+foco) alimenta a prévia E o arquivo salvo (canvas no tamanho do formato via postArtDims → JPEG 0.92 → uploadPostArt). Trocar feed/story re-recorta. Front-only; lint+162 testes+build OK; validado no preview (injeção de arquivo + zoom). Commit 6e1c929.

96. **[[Atualizacao_2026-06-22_Upload_Imagem_Propria_Drawer]]**
    Drawer "Prévia do post" ganha UPLOAD manual de imagem. Nova aba "Imagem própria": dropzone → preview no formato (feed/story) → "Salvar como arte" (imagem vira art_url sem branding) · Substituir · remover arte. Aba "Com foto": botão "Enviar arquivo" sobe o hero do card branded. Validação cliente (JPG/PNG/WebP · ≤8MB · avisa <1080px). Back-end: uploadPostArt grava no tipo real do arquivo (File é Blob); setActivePostArt(null) remove a arte; hero reusa uploadMediaAsset. Sem migração. lint+162 testes+build OK; verificado no preview. Commit 1d2fb4c.

95. **[[Atualizacao_2026-06-22_CTA_Curto_Geracao_Conteudo]]**
    Correção de raiz do CTA da arte: generate-content passa a gerar `cta` como rótulo CURTO de botão (≤22 chars, imperativo: "Agende sua visita", "Fale no WhatsApp") e manda a frase conversacional para o FINAL da legenda (regras 4/5 + schema). Combina com o truncamento do postArt.js (rede de segurança). Redeploy CLI. Verificado ao vivo: CTAs 16-17 chars + legenda terminando com o convite. Commit a052569.

94. **[[Atualizacao_2026-06-22_Fix_CTA_Overflow_Arte]]**
    Fix UX: CTA longo (frase) vazava a arte do post e invadia a assinatura da marca. postArt.js passa a TRUNCAR o CTA (reticências) p/ caber no espaço livre (W - margens - largura da marca) e clampa o pill; CTAs curtos seguem inteiros. Vale p/ cards, drawer e PNG (um ponto só: renderPostArtToCanvas). lint+build OK; verificado no preview (card "Cristal"). Commit 22406fd.

93. **[[Atualizacao_2026-06-22_Producao_Visual_Fase2]]**
    Produção visual (Conteúdo) Fase 2: board em GRADE thumbnail-first (grid 1/2/3 col) — cada card lidera com a arte (salva ou prévia ao vivo do texto) + chips + ação primária + "Prévia". Novo drawer PostDetailDrawer (substitui PostArtModal): arte (Tipográfico/Com foto + toggle Feed 1:1/Story 9:16 + canvas ao vivo + Salvar/Baixar) + VERSÕES (art_versions cap 6, trocar ativa via setActivePostArt) + edição de TEXTO no mesmo fluxo (updateContentPost ganhou title/caption/cta/hashtags) + ações do funil no rodapé. Sem migração (colunas/jsonb existentes). Verificado ao vivo: 15 cards/15 canvases, drawer + toggle 9:16. lint+162 testes+build OK. Fecha a proposta de 2 fases. Commit 8304ad6.

92. **[[Atualizacao_2026-06-22_Producao_Visual_Fase1]]**
    Produção visual (Conteúdo) Fase 1: aba deixa de ser text-only. Novo PostArtPreview (Canvas, reusa renderPostArtToCanvas) mostra a ARTE renderizada em cada card de sugestão da IA (atualiza ao editar legenda). "Gerar arte" promovido na lista do funil: era link apagado, virou botão dourado + chip SEM ARTE/ARTE PRONTA. Auto-arte ao aprovar (approve gera+salva a arte se faltar; best-effort) gated por flag editorial auto_art_on_approve (migration aditiva, default on) + toggle em Configurações. saveEditorialSettings ganhou autoArtOnApprove; helper artOptsFor. Verificado ao vivo: 3 canvases de prévia; aprovar gerou art_url (rede+banco). lint+162 testes+build OK. Fase 2 (grade+drawer+versões) pendente. Commit 47e87e1.

91. **[[Atualizacao_2026-06-19_Fix_Interesse_Depreciado_Meta]]**
    Fix: a Meta recusava o conjunto por interesse DEPRECIADO ("Porto Alegre" 6002925735321) no flexible_spec → build_draft falhava inteiro. Causa: targetingFor resolve interest_keywords (IA) em IDs, e um estava depreciado. Fix resiliente: graphPost anexa erro estruturado; ao falhar por direcionamento (subcode 1487079/deprecated_interest_id/Invalid parameter), remove os interesses depreciados (ou todos) e recria o conjunto SÓ com geo (retry único) — não troca por "Brazil" (amplo demais). Transparência: built[].targeting_note + targeting_adjustments na resposta + bloco azul na UI. deno+deploy CLI; lint+162 testes+build OK. Commit cf6a04a.

90. **[[Atualizacao_2026-06-19_Fix_Botao_Criar_Rascunho_Meta]]**
    Fix: botão "Criar rascunho na Meta" travava mesmo com tudo preenchido. Causa: canBuild exigia readyAds>0 (evaluateMetaAdReadiness), QA-polish mais rígido que o build_draft — pedia 3 cortes + source_image_url + UTM por anúncio; criativos aprovados sem isso davam "2 pendências"/"QA 0/3". Fix: gate alinhado ao contrato real do edge (publishableAssets = approved+public_url+título+texto+CTA) + lista clara do que falta (bloco âmbar + title no botão) em vez de desabilitar sem explicação. Vocabulário fica para o build (skipped_creatives). Só front; lint+162 testes+build OK. Commit f5a2e8c.

89. **[[Atualizacao_2026-06-19_Porta_InApp_Vitra_Copy]]**
    Porta in-app da skill vitra-copy (P1/#4): gerar copy no anúncio + aplicar em 1 clique. Edge generate-copy ganhou o 4º campo `description` (schema+prompt, redeploy CLI). Helper `generateAdCopyAngles({campaign,brandScope})` monta os fatos de `brief.product_data` e pede 3 ângulos (preço-âncora/aspiração/escassez). No `AdEditModal`: bloco "Copy por IA" gera os 3 ângulos com headline(/40)/texto/descrição/CTA + issues do copyValidation (canal paid); "Aplicar a este anúncio" preenche título/texto/descrição (CTA enum fica no seletor). Recebe campaign (via asset.campaign_id) + brandScope. lint+162 testes+build OK; preview sem erros. Commit a349ea1.

88. **[[Atualizacao_2026-06-19_Auditoria_Skills_Trafego_Copy]]**
    Auditoria PO/dev das skills vitra-trafego e vitra-copy (gitignored, invocadas em sessão). Estrutura/frontmatter/refs OK nas duas. CORREÇÃO 1: vitra-trafego instruía QUALITY_LEAD no preset, mas o objectivePlaybook usa LEAD_GENERATION (QUALITY_LEAD exige CRM) — corrigidos os 5 pontos (SKILL.md + playbook) p/ LEAD_GENERATION, com nota de que a 30.05 usa QUALITY_LEAD mas não se copia. CORREÇÃO 2 (código): presetBlueprintFromConfig:753 normaliza QUALITY_LEAD→LEAD_GENERATION (o build já derivava do playbook; preset salvo deixava de ser enganoso). lint+162 testes+build OK. vitra-copy operacional em sessão; porta in-app de 1 clique = P1 (não defeito). Commit 50ad173.

87. **[[Atualizacao_2026-06-19_Correcoes_P0_Trafego_Copywriter]]**
    Correções P0 do diagnóstico Tráfego+Copywriter (zeradas, sem mudar arquitetura). P0.1: `revalidateCopyAngle` aceita `channel` e o fluxo de copy de anúncio passa `channel:'paid'` — fim do falso positivo (UI coerente com a Edge generate-copy; "alto padrão"/"exclusiva" liberados no pago Imob, "curadoria" segue bloqueado). +2 testes. P0.2: `publish-meta-ads` redeployado via Supabase CLI (do disco) → v20 com copyValidation contexto-aware + channel:'paid'; disco==prod. P0.3: build_draft devolve `skipped_creatives` (group/asset/headline/issues) + message; UI mostra bloco âmbar dos criativos pulados (antes era silencioso). lint+162 testes+build OK; preview sem erros. Commit cc1464e.

86. **[[Atualizacao_2026-06-19_Skill_Vitra_Copy_e_Guard_Contextual]]**
    Copy paga: skill `vitra-copy` (v1, gitignored) — copywriter de anuncios pagos ancorado nos padroes reais das campanhas vencedoras (SKILL.md + references/copy-playbook.md), irma de vitra-trafego/vitra-conteudo; alimenta a edge generate-copy. + Guard `copyValidation` contexto-aware: split PREMIUM_STRICT (sempre bloqueado na Imob) x MARKET_GENERIC (alto padrao/exclusivo); `bannedVocabForScope(scope,channel)` e `validateCopyAngle({channel})` liberam genericos de mercado SO no pago da Imob (decisao a), organico segue duro. Wiring: generate-copy + build_draft com channel:'paid'; generate-content estrito. lint+160 testes+build OK; generate-copy deploy v10. PENDENTE: redeploy publish-meta-ads via CLI (1 linha no gate). Commit 08c7446.

85. **[[Atualizacao_2026-06-19_Trafego_Seletor_Criativos_Por_Conjunto]]**
    Tráfego: seletor "Criativos por conjunto" (VitraSelect 1–4, padrao 3) no PublishMetaPanel -> buildMetaDraft envia creatives_per_adset -> build cria N anuncios/conjunto. E2E ao vivo: seletor presente, default 3, microcopy ok. Fecha a UI do 3x3. Commit 0987652.

84. **[[Atualizacao_2026-06-19_Trafego_Build_Multi_Criativo_3x3]]**
    Tráfego: build_draft multi-criativo. Antes 1 anuncio/conjunto; agora N anuncios (1 por criativo aprovado, default 3, via creatives_per_adset). feedsFor(spec) lista criativos do grupo (prefere 1:1, dedup, cap N), pre-valida copy, cria adset 1x e itera criativo->ad->publication. Resposta inclui ads (total)+ad_ids/conjunto. Removido feedOf. E2E: Azenha 3 criativos -> 2 conjuntos x 3 = 6 ads (meta 120252934350130221), PAUSED; orfao antigo apagado. deno+deploy OK. Espelha o 3x3 da vencedora. Commit 1d9a8be.

83. **[[Atualizacao_2026-06-19_Trafego_Campanha_Referencia_Dropdown]]**
    Tráfego: campanha de referência por DROPDOWN (sem digitar ID), espelhando a auto-descoberta de Conta/Página. Edge manage-audiences ganhou `list_campaigns` (read-only: id/name/objective/status/datas). Helper listMetaCampaigns. MetaPresetsPanel: seletor de Conta (auto, pre-seleciona marca) + dropdown de Campanha (nome·status·período) + filtro Todas/Ativas/Pausadas; recarrega ao trocar conta; estado vazio; fallback manual se nao listar. E2E ao vivo: 200 campanhas reais listadas; 30.05 -> Importar -> blueprint OK. Commit 9650341.

82. **[[Atualizacao_2026-06-19_Trafego_Campanha_Teste_Azenha_E2E_Completo]]**
    Tráfego: E2E COMPLETO da campanha de TESTE Azenha, mantida PAUSED. DB `[TESTE] Residencial Azenha 531` (fe266337) + 3 criativos aprovados (copies distintas, imagens Imob reaproveitadas) -> build_draft -> Meta campanha 120252931593820221, 2 conjuntos (regional radius 2km -30.0608/-51.2115 + cidade POA 264859), 2 anuncios, lead form 2198436384324809 (mais volume/sem SMS). read_campaign_config conferiu. ACHADO/CORRIGIDO: QUALITY_LEAD rejeitado ("Selecione um objeto promovido" — exige CRM/conversoes); revertido p/ LEAD_GENERATION (commit f69fd50), re-build OK. AJUSTES: build cria 1 anuncio/conjunto (3x3 nao exercido -> enhancement multi-criativo); forms orfaos acumulam; placeholders a trocar por reais. Campanha viva PAUSED, zero gasto.

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

