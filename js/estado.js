// Contexto do app: config sendo editada, estado do servidor e ações (salvar, avisar, chamar a API)
import { createContext, useContext } from '../vendor/preact-htm.js';

export const Ctx = createContext(null);

/**
 * @returns {{
 *   cfg: any, estado: any, ui: any, sujo: boolean,
 *   mudar: (fn: (cfg: any) => void) => void, setUi: (patch: object) => void,
 *   aviso: (texto: string, meme?: string, opcoes?: { erro?: boolean, link?: string }) => void,
 *   salvar: () => Promise<boolean>, recarregar: () => Promise<void>, api: string
 * }}
 */
export const useApp = () => useContext(Ctx);
