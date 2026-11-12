/* Mercado da Família: onde os dados ficam guardados.
   Dois modos com as mesmas funções:
   - local: tudo salvo no próprio aparelho (localStorage);
   - nuvem: Firebase Firestore, compartilhado em tempo real com a família. */
(function () {
  "use strict";

  const COLECOES = ["compras", "despensa", "gastos", "recados", "ajustes"];
  const VERSAO_FIREBASE = "10.12.2";
  const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  function criarLocal(config) {
    const chave = "mercado:" + (config.codigoFamilia || "local");
    const ouvintes = {};
    let dados = {};
    const completar = d => { COLECOES.forEach(c => { if (!d[c]) d[c] = {}; }); return d; };
    try { dados = JSON.parse(localStorage.getItem(chave)) || {}; } catch (e) { dados = {}; }
    completar(dados);

    const salvar = () => { try { localStorage.setItem(chave, JSON.stringify(dados)); } catch (e) { /* armazenamento cheio ou bloqueado */ } };
    const avisar = col => {
      const lista = Object.entries(dados[col]).map(([id, d]) => ({ id, ...d }));
      (ouvintes[col] || []).forEach(f => f(lista));
    };
    // outra aba do mesmo navegador alterou os dados
    window.addEventListener("storage", e => {
      if (e.key !== chave) return;
      try { dados = completar(JSON.parse(e.newValue) || {}); } catch (_) { return; }
      COLECOES.forEach(avisar);
    });

    return {
      modo: "local",
      ouvir(col, aoMudar) { (ouvintes[col] = ouvintes[col] || []).push(aoMudar); setTimeout(() => avisar(col), 0); },
      async criar(col, d) { const id = novoId(); dados[col][id] = d; salvar(); avisar(col); return id; },
      async definir(col, id, d) { dados[col][id] = d; salvar(); avisar(col); },
      async alterar(col, id, d) { if (!dados[col][id]) return; dados[col][id] = { ...dados[col][id], ...d }; salvar(); avisar(col); },
      async apagar(col, id) { delete dados[col][id]; salvar(); avisar(col); }
    };
  }

  async function criarNuvem(config, aoMudarEstado) {
    const base = `https://www.gstatic.com/firebasejs/${VERSAO_FIREBASE}/`;
    const [{ initializeApp }, fs] = await Promise.all([
      import(base + "firebase-app.js"),
      import(base + "firebase-firestore.js")
    ]);
    const app = initializeApp(config.firebase);
    let banco;
    try {
      // guarda uma cópia no aparelho para o site abrir mesmo sem internet
      banco = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
    } catch (e) {
      banco = fs.getFirestore(app);
    }
    const familia = String(config.codigoFamilia || "minha-familia").replace(/[^A-Za-z0-9_-]/g, "-");
    const ref = col => fs.collection(banco, "familias", familia, col);

    return {
      modo: "nuvem",
      ouvir(col, aoMudar, aoFalhar) {
        fs.onSnapshot(ref(col), { includeMetadataChanges: true }, snap => {
          aoMudarEstado(snap.metadata.fromCache ? "offline" : "ok");
          aoMudar(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, aoFalhar);
      },
      async criar(col, d) { const r = await fs.addDoc(ref(col), d); return r.id; },
      async definir(col, id, d) { await fs.setDoc(fs.doc(ref(col), id), d); },
      async alterar(col, id, d) { await fs.updateDoc(fs.doc(ref(col), id), d); },
      async apagar(col, id) { await fs.deleteDoc(fs.doc(ref(col), id)); }
    };
  }

  window.MercadoDados = { COLECOES, criarLocal, criarNuvem };
})();
