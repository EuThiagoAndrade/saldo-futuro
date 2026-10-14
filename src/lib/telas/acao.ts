// Estado devolvido pelas Server Actions dos formulários (D3): mensagem em português de sucesso
// ou de recusa, nunca detalhe técnico.

export interface EstadoAcao {
  ok?: string;
  erro?: string;
}

export const ESTADO_INICIAL: EstadoAcao = {};
