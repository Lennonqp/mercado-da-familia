/*
  Configuração do Mercado da Família
  ----------------------------------
  Sem Firebase, o site funciona no modo local: os dados ficam salvos
  apenas no aparelho em que o site está aberto.

  Para a família toda ver as mesmas listas, crie um projeto gratuito no
  Firebase e cole as chaves abaixo. O passo a passo está no README.md.
*/
window.MERCADO_CONFIG = {
  // Nome mostrado no topo do site, depois de "Casa da"
  nomeFamilia: "Família",

  // Código da família. Quem abrir o site com este código vê os mesmos dados.
  // Troque por algo que só vocês saibam, sem espaços (exemplo: "silva-quintal-2026").
  codigoFamilia: "minha-familia",

  // Cole aqui os valores do firebaseConfig mostrados no console do Firebase.
  // Deixe apiKey vazio para continuar no modo local.
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  }
};
