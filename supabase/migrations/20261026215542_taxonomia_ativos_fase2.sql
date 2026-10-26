-- Taxonomia global de classes de ativos, fase 2 de 2 (ciclo 013, issue #138, BL-014 e parcela de
-- BL-009). Fecha a janela de transição (D19): a aplicação já usa só as funções novas da fase 1
-- (cadastrar_ativo_taxonomia, editar_detalhes_ativo_taxonomia), então saem as funções públicas
-- das classes do usuário e as assinaturas antigas de cadastro e edição, com o auxiliar privado
-- delas. Só se aplica depois do deploy da aplicação nova (roteiro E2).
--
-- classes_ativo e ativos.classe_id continuam como legado, só de leitura: o usuário só tem SELECT
-- nas próprias linhas (nenhum privilégio de escrita, nem para o administrador) e nenhuma função
-- escreve mais nelas. Servem à dica "antes: X" de quem ficou sem classe e saem num ciclo futuro,
-- por migração nova. Sem cascade: se algo ainda dependesse destas funções, a migração falharia.
--
-- criar_ativo (cadastro básico, sem metadados) continua; conferir_nome, resolver_instituicao e as
-- funções de instituição também.

drop function public.criar_classe(text);
drop function public.renomear_classe(uuid, text);
drop function public.excluir_classe(uuid);
drop function public.cadastrar_ativo(
  text, public.tipo_ajuste, uuid, text, uuid, text, boolean, boolean, boolean, boolean);
drop function public.editar_detalhes_ativo(uuid, uuid, text, uuid, text, boolean, boolean, boolean, boolean);
drop function private.resolver_classe(uuid, uuid, text);
