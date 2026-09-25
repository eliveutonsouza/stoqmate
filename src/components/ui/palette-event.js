// Evento que abre a paleta de comandos (⌘K) a partir de um botão. Fica fora
// de command-palette.jsx pra quem dispara não puxar a paleta inteira pro
// bundle (ela é carregada com dynamic()).
export const OPEN_PALETTE_EVENT = 'stoqmate:open-palette';
