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
  codigoFamilia: "familia-lennon-d33119",

  // Cole aqui os valores do firebaseConfig mostrados no console do Firebase.
  // Deixe apiKey vazio para continuar no modo local.
  firebase: {
    apiKey: "AIzaSyDCrITDTAXccnMiavS3ioPtMdZC161MIEo",
    authDomain: "mercado-da-familia-eb173.firebaseapp.com",
    projectId: "mercado-da-familia-eb173",
    storageBucket: "mercado-da-familia-eb173.firebasestorage.app",
    messagingSenderId: "463349401864",
    appId: "1:463349401864:web:5cef55ba5636c1ce1ec4bd"
  }
};
