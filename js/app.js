/* Mercado da Família: telas e ações.
   Lista de compras → carrinho → em casa, mais cardápio, tarefas, gastos e recados. */
(function () {
  "use strict";

  const CFG = window.MERCADO_CONFIG || {};
  const { COLECOES, criarLocal, criarNuvem } = window.MercadoDados;

  /* ================= dados fixos ================= */
  const UNIDADES = ["un", "kg", "g", "L", "ml", "pct", "cx", "dz", "lata", "garrafa"];
  const CORREDORES = [
    ["Hortifrúti", "--c-horti"], ["Açougue e peixaria", "--c-acougue"], ["Frios e laticínios", "--c-frios"],
    ["Padaria", "--c-padaria"], ["Mercearia", "--c-mercearia"], ["Bebidas", "--c-bebidas"],
    ["Congelados", "--c-congelados"], ["Limpeza", "--c-limpeza"], ["Higiene", "--c-higiene"],
    ["Pet", "--c-pet"], ["Outros", "--c-outros"]
  ];
  const NOMES_CORREDOR = CORREDORES.map(c => c[0]);
  const COR = Object.fromEntries(CORREDORES);
  const BASICOS = ["Arroz", "Feijão", "Leite", "Pão", "Ovos", "Café", "Açúcar", "Óleo", "Papel higiênico", "Detergente"];

  // Palavras que ajudam a adivinhar o corredor pelo nome do produto
  const PALPITES = {
    "Hortifrúti": "banana maca laranja limao tomate alface cebola alho batata cenoura abobora abobrinha pepino pimentao mamao manga uva morango melancia melao abacate couve brocolis repolho mandioca aipim chuchu beterraba cheiro-verde salsa cebolinha fruta verdura legume ovos ovo bergamota",
    "Açougue e peixaria": "carne frango peixe patinho alcatra picanha costela linguica salsicha bife acem file coxa sobrecoxa peito moida tilapia salmao camarao porco lombo bisteca guisado maminha",
    "Frios e laticínios": "leite queijo presunto iogurte manteiga margarina requeijao mussarela creme-de-leite nata mortadela salame",
    "Padaria": "pao bolo torrada bisnaguinha cuca sonho rosca",
    "Mercearia": "arroz feijao acucar sal cafe oleo azeite macarrao farinha molho extrato milho ervilha atum sardinha bolacha biscoito achocolatado aveia granola vinagre tempero erva cuscuz polenta fermento maionese ketchup mostarda lentilha",
    "Bebidas": "agua refrigerante coca guarana suco cerveja vinho energetico cha",
    "Congelados": "sorvete pizza congelado lasanha nugget hamburguer gelo polpa",
    "Limpeza": "detergente sabao amaciante desinfetante sanitaria esponja vassoura lixo lustra multiuso alcool toalha limpador",
    "Higiene": "higienico shampoo condicionador sabonete dente escova desodorante absorvente fralda fio cotonete",
    "Pet": "racao areia petisco"
  };
  const UNIDADE_COMUM = { arroz: "kg", feijao: "kg", acucar: "kg", farinha: "kg", carne: "kg", frango: "kg", batata: "kg", tomate: "kg", cebola: "kg", banana: "kg", leite: "L", ovos: "dz", ovo: "dz", cafe: "pct" };
  const APELIDO_UNIDADE = { l: "L", litro: "L", litros: "L", quilo: "kg", quilos: "kg", kg: "kg", g: "g", ml: "ml", un: "un", unidade: "un", unidades: "un", pct: "pct", pacote: "pct", pacotes: "pct", cx: "cx", caixa: "cx", caixas: "cx", dz: "dz", duzia: "dz", duzias: "dz", lata: "lata", latas: "lata", garrafa: "garrafa", garrafas: "garrafa" };
  const DIAS = [["dom", "Domingo"], ["seg", "Segunda"], ["ter", "Terça"], ["qua", "Quarta"], ["qui", "Quinta"], ["sex", "Sexta"], ["sab", "Sábado"]];

  const TELAS = {
    lista: "Lista de compras", carrinho: "Carrinho", casa: "Em casa", mais: "Nossa casa",
    cardapio: "Cardápio da semana", tarefas: "Tarefas da casa", gastos: "Gastos do mercado", recados: "Recados"
  };
  const SUBTELAS = ["cardapio", "tarefas", "gastos", "recados"];

  /* ================= utilidades ================= */
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = s => String(s || "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const num = n => { const v = Math.round(Number(n || 0) * 100) / 100; return Number.isFinite(v) ? v : 0; };
  const fmt = n => num(n).toLocaleString("pt-BR");
  const preco = n => num(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const reais = n => num(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const lerDinheiro = t => num(String(t || "").replace(/[^\d.,]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
  const passoDe = u => (u === "g" || u === "ml") ? 100 : (u === "kg" || u === "L") ? 0.5 : 1;
  const porNome = (a, b) => a.nome.localeCompare(b.nome, "pt-BR");
  const corredorDe = c => NOMES_CORREDOR.includes(c) ? c : "Outros";
  const maiuscula = t => t.charAt(0).toUpperCase() + t.slice(1);
  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

  const isoDe = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hojeISO = () => isoDe(new Date());
  const dataDeISO = iso => { const [a, m, d] = String(iso).split("-").map(Number); return new Date(a, (m || 1) - 1, d || 1); };
  const diasAte = iso => Math.round((dataDeISO(iso) - dataDeISO(hojeISO())) / 86400000);
  const dataCurta = iso => dataDeISO(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  function inicioDaSemana() { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); }
  function quando(ms) {
    const d = new Date(ms), hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const dias = Math.round((dataDeISO(hojeISO()) - dataDeISO(isoDe(d))) / 86400000);
    if (dias === 0) return `hoje às ${hora}`;
    if (dias === 1) return `ontem às ${hora}`;
    return `${dataCurta(isoDe(d))} às ${hora}`;
  }

  const IC = {
    mais: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    certo: '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    carrinho: '<svg viewBox="0 0 24 24"><path d="M3 4h2l2.2 10.4a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg>',
    listaMais: '<svg viewBox="0 0 24 24"><path d="M4 6h12M4 12h8M4 18h8"/><path d="M18 11v8M14 15h8"/></svg>',
    lista: '<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/></svg>',
    casa: '<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/></svg>',
    prato: '<svg viewBox="0 0 24 24"><circle cx="13" cy="12" r="7"/><circle cx="13" cy="12" r="3"/><path d="M3 4v7M3 14v6"/></svg>',
    tarefa: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/></svg>',
    moeda: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M14.5 9.5c-.5-1-1.400-1.500-2.500-1.500-1.500 0-2.500.8-2.500 2s1 1.700 2.500 2 2.500.8 2.500 2-1 2-2.500 2c-1.200 0-2.100-.5-2.600-1.500M12 6.500v11"/></svg>',
    recado: '<svg viewBox="0 0 24 24"><path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-7l-4.500 4v-4H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/></svg>',
    pessoa: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.500 20c1-3.500 4-5 7.500-5s6.500 1.500 7.500 5"/></svg>',
    baixar: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>',
    subir: '<svg viewBox="0 0 24 24"><path d="M12 16V5M7 9l5-5 5 5M5 20h14"/></svg>',
    zap: '<svg viewBox="0 0 24 24"><path d="M4 20l1.300-4.200A8 8 0 1 1 8.400 19z"/><path d="M9 9c0 3 3 6 6 6l1-1.500-2-1-1 .8c-.8-.4-1.900-1.500-2.300-2.300l.8-1-1-2z"/></svg>',
    volta: '<svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>',
    esq: '<svg viewBox="0 0 24 24"><path d="m14 6-6 6 6 6"/></svg>',
    dir: '<svg viewBox="0 0 24 24"><path d="m10 6 6 6-6 6"/></svg>',
    prateleira: '<svg viewBox="0 0 24 24"><path d="M4 4v16M20 4v16M4 10h16M4 16h16"/><rect x="7" y="6" width="3" height="4"/><rect x="13" y="12" width="4" height="4"/></svg>',
    nuvem: '<svg viewBox="0 0 24 24"><path d="M7 18a4 4 0 0 1-.500-8 5.500 5.500 0 0 1 10.600 1.500A3.300 3.300 0 0 1 17 18z"/></svg>'
  };

  function palpiteCorredor(nome) {
    const n = norm(nome).replace(/\s+/g, "-");
    if (n.length < 3) return null;
    let melhor = null, tamanho = 0;
    for (const [corredor, palavras] of Object.entries(PALPITES))
      for (const p of palavras.split(" "))
        if (n.includes(p) && p.length > tamanho) { melhor = corredor; tamanho = p.length; }
    return melhor;
  }

  // Entende "2 kg de arroz", "arroz 2kg", "6 leite" ou só "arroz"
  function interpretar(texto) {
    const t = String(texto).trim().replace(/\s+/g, " ");
    const un = "(kg|g|ml|l|litros?|quilos?|un|unidades?|pct|pacotes?|cx|caixas?|dz|d[uú]zias?|latas?|garrafas?)";
    let nome = t, qtd = null, unidade = null;
    let m = t.match(new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*${un}?\\s+(?:de\\s+)?(.+)$`, "i"));
    if (m) { qtd = m[1]; unidade = m[2]; nome = m[3]; }
    else if ((m = t.match(new RegExp(`^(.+?)\\s+(\\d+(?:[.,]\\d+)?)\\s*${un}?$`, "i")))) { nome = m[1]; qtd = m[2]; unidade = m[3]; }
    return {
      nome: maiuscula(nome.trim()),
      qtd: qtd ? num(qtd.replace(",", ".")) : null,
      unidade: unidade ? APELIDO_UNIDADE[norm(unidade)] || null : null
    };
  }

  /* ================= estado ================= */
  let banco = null;
  const D = Object.fromEntries(COLECOES.map(c => [c, []]));
  const pronto = Object.fromEntries(COLECOES.map(c => [c, false]));
  let tela = "lista";
  let filtroCasa = "tudo";
  let buscaCasa = "";
  let mesGastos = hojeISO().slice(0, 7);
  const qtdPendente = new Map();
  let meuNome = "";
  try { meuNome = localStorage.getItem("mercado:nome") || ""; } catch (e) { /* sem armazenamento */ }

  const naLista = () => D.compras.filter(c => c.status !== "carrinho");
  const noCarrinho = () => D.compras.filter(c => c.status === "carrinho");
  const qtdAtual = d => qtdPendente.has(d.id) ? qtdPendente.get(d.id).valor : num(d.qtd);
  function situacao(d) {
    const q = qtdAtual(d);
    if (q <= 0) return "acabou";
    if (d.minimo > 0 && q <= d.minimo) return "acabando";
    return "";
  }
  const vencendo = d => d.validade && qtdAtual(d) > 0 && diasAte(d.validade) <= 7;
  const paraRepor = () => D.despensa.filter(situacao);
  const jaNaLista = nome => { const n = norm(nome); return D.compras.some(c => norm(c.nome) === n); };
  const conhecido = nome => { const n = norm(nome); return D.despensa.find(d => norm(d.nome) === n) || D.compras.find(c => norm(c.nome) === n); };
  const tarefaFeita = t => !!t.feita && (!t.repete || (t.feitaEm || 0) >= inicioDaSemana());
  const metaMensal = () => num((D.ajustes.find(a => a.id === "geral") || {}).meta);
  function pessoas() {
    const nomes = [meuNome, ...D.tarefas.map(t => t.responsavel), ...D.compras.map(c => c.por), ...D.recados.map(r => r.por), ...D.gastos.map(g => g.por)];
    return [...new Set(nomes.filter(Boolean))];
  }

  /* ================= avisos ================= */
  let relogioToast;
  function toast(msg, desfazer) {
    const t = $("#toast"), b = $("#toast-acao");
    $("#toast-txt").textContent = msg;
    b.hidden = !desfazer;
    b.onclick = desfazer ? () => { t.classList.remove("visivel"); desfazer(); } : null;
    t.classList.add("visivel");
    clearTimeout(relogioToast);
    relogioToast = setTimeout(() => t.classList.remove("visivel"), desfazer ? 4500 : 2600);
  }
  function aviso(html, dispensavel) {
    const a = $("#aviso");
    a.innerHTML = html ? `<div>${html}</div>${dispensavel ? '<button type="button" id="aviso-ok">Entendi</button>' : ""}` : "";
    a.hidden = !html;
    const b = $("#aviso-ok");
    if (b) b.onclick = () => { a.hidden = true; try { localStorage.setItem("mercado:aviso-local", "1"); } catch (e) { /* tudo bem */ } };
  }
  function sinal(estado) {
    $("#sinal").className = "sinal " + (estado === "ok" ? "ok" : estado === "erro" ? "erro" : "");
    $("#sinal-txt").textContent = { ok: "Sincronizado", local: "Só neste aparelho", offline: "Sem internet", erro: "Erro" }[estado] || "Conectando";
  }
  async function seguro(promessa) {
    try { await promessa; return true; }
    catch (e) {
      console.error(e);
      toast(e && e.code === "permission-denied"
        ? "O Firebase recusou. Confira as regras do banco no README."
        : "Não deu para salvar. Confira a internet e tente de novo.");
      return false;
    }
  }

  /* ================= navegação ================= */
  function mostrar(nova) {
    tela = TELAS[nova] ? nova : "lista";
    const aba = SUBTELAS.includes(tela) ? "mais" : tela;
    for (const t of Object.keys(TELAS)) $("#tela-" + t).hidden = t !== tela;
    for (const a of ["lista", "carrinho", "casa", "mais"]) {
      const b = $("#aba-" + a);
      if (a === aba) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    }
    $("#voltar").hidden = !SUBTELAS.includes(tela);
    $("#titulo").textContent = TELAS[tela];
    window.scrollTo({ top: 0 });
    render();
  }
  function irPara(nova) {
    if (location.hash.slice(1) === nova) mostrar(nova); else location.hash = nova;
  }
  window.addEventListener("hashchange", () => mostrar(location.hash.slice(1)));
  document.querySelectorAll("[data-ir]").forEach(b => b.addEventListener("click", () => irPara(b.dataset.ir)));
  $("#voltar").addEventListener("click", () => irPara("mais"));

  /* ================= render ================= */
  function agrupar(itens) {
    const g = new Map(NOMES_CORREDOR.map(n => [n, []]));
    itens.forEach(i => g.get(corredorDe(i.categoria)).push(i));
    g.forEach(a => a.sort(porNome));
    return [...g].filter(([, a]) => a.length);
  }
  const tituloGrupo = (nome, n, cor) => `<h2 class="grupo-t" style="--c:var(${cor || COR[nome] || "--c-outros"})"><i></i>${esc(nome)}<em>${n}</em></h2>`;
  const vazio = (icone, titulo, texto) => `<div class="bloco vazio"><div class="desenho">${icone}</div><strong>${titulo}</strong><p>${texto}</p></div>`;
  const espera = texto => `<div class="bloco vazio"><p>${texto}</p></div>`;

  function render() {
    const lista = naLista(), carrinho = noCarrinho(), repor = paraRepor();
    const alertas = new Set([...repor, ...D.despensa.filter(vencendo)].map(d => d.id)).size;

    // topo
    $("#resumo").innerHTML = resumoDaTela(lista, carrinho, repor);

    // selos da barra
    const selo = (id, n) => { const b = $(id); b.textContent = n; b.hidden = !n; };
    selo("#selo-lista", lista.length);
    selo("#selo-carrinho", carrinho.length);
    selo("#selo-casa", alertas);
    selo("#selo-mais", 0);

    // botão fixo acima da barra
    const fixo = $("#acao-fixa");
    if (tela === "carrinho" && carrinho.length) { fixo.hidden = false; fixo.innerHTML = `<button class="bt" data-acao="finalizar">${IC.casa}Finalizar compra</button>`; }
    else if (tela === "gastos") { fixo.hidden = false; fixo.innerHTML = `<button class="bt" data-acao="novo-gasto">${IC.mais}Registrar gasto</button>`; }
    else { fixo.hidden = true; fixo.innerHTML = ""; }

    // não redesenha a tela enquanto alguém digita num campo dela
    const foco = document.activeElement;
    if (foco && foco.matches && foco.matches("[data-vivo]")) return;

    ({ lista: renderLista, carrinho: renderCarrinho, casa: renderCasa, mais: renderMais, cardapio: renderCardapio, tarefas: renderTarefas, gastos: renderGastos, recados: renderRecados })[tela]();

    const nomes = [...new Set([...D.despensa, ...D.compras].map(i => i.nome))].sort((a, b) => a.localeCompare(b, "pt-BR"));
    $("#conhecidos").innerHTML = nomes.map(n => `<option value="${esc(n)}">`).join("");
  }

  function resumoDaTela(lista, carrinho, repor) {
    switch (tela) {
      case "lista": return lista.length ? `Faltam <b>${plural(lista.length, "produto", "produtos")}</b>` : carrinho.length ? "Tudo já está no carrinho" : "Nada para comprar por enquanto";
      case "carrinho": return carrinho.length ? `<b>${carrinho.length} de ${lista.length + carrinho.length}</b> produtos pegos` : "Vazio por enquanto";
      case "casa": return D.despensa.length ? `<b>${plural(D.despensa.length, "produto", "produtos")}</b>${repor.length ? `, ${repor.length} para repor` : ""}` : "Nada registrado ainda";
      case "mais": return meuNome ? `Olá, <b>${esc(meuNome)}</b>` : "Ferramentas da família";
      case "cardapio": return "O que vai ter para comer";
      case "tarefas": { const n = D.tarefas.filter(t => !tarefaFeita(t)).length; return n ? `<b>${plural(n, "tarefa", "tarefas")}</b> para fazer` : "Tudo em dia"; }
      case "gastos": return "Quanto a casa gasta por mês";
      case "recados": return D.recados.length ? plural(D.recados.length, "recado", "recados") : "Nenhum recado";
    }
    return "";
  }

  /* ---------- lista ---------- */
  function renderLista() {
    const sug = $("#sugestoes"), box = $("#lista"), rodape = $("#lista-rodape");
    if (!pronto.compras) { sug.innerHTML = rodape.innerHTML = ""; box.innerHTML = espera("Carregando a lista…"); return; }
    const lista = naLista();

    const faltando = paraRepor().filter(d => !jaNaLista(d.nome)).sort(porNome);
    if (faltando.length) {
      sug.innerHTML = `<p class="dica">Está acabando em casa</p><div class="fichas">${faltando.map(d => `<button class="ficha repor" data-acao="repor" data-id="${d.id}">${IC.mais}${esc(d.nome)}</button>`).join("")}</div>`;
    } else if (!D.compras.length && !D.despensa.length) {
      sug.innerHTML = `<p class="dica">Toque para adicionar os básicos</p><div class="fichas">${BASICOS.map(n => `<button class="ficha" data-acao="basico" data-nome="${esc(n)}">${IC.mais}${esc(n)}</button>`).join("")}</div>`;
    } else sug.innerHTML = "";

    if (!lista.length) {
      rodape.innerHTML = "";
      box.innerHTML = noCarrinho().length
        ? vazio(IC.carrinho, "Tudo no carrinho", "Você já pegou tudo. Abra o carrinho para finalizar a compra.")
        : vazio(IC.lista, "Lista vazia", "Escreva no campo acima o que precisa comprar. Pode digitar a quantidade junto, como “2 kg de arroz”.");
      return;
    }
    box.innerHTML = `<div class="pilha">${agrupar(lista).map(([corredor, itens]) => `
      <section class="grupo">${tituloGrupo(corredor, itens.length)}
        <div class="bloco">${itens.map(linhaLista).join("")}</div>
      </section>`).join("")}</div>`;
    rodape.innerHTML = `<a class="bt contorno" href="${linkWhatsApp()}" target="_blank" rel="noopener">${IC.zap}Enviar lista pelo WhatsApp</a>`;
  }
  function linhaLista(c) {
    return `<div class="linha toque" data-acao="pegar" data-id="${c.id}">
      <button class="marca" data-acao="pegar" data-id="${c.id}" aria-label="Pôr ${esc(c.nome)} no carrinho">${IC.certo}</button>
      <div class="linha-txt"><b>${esc(c.nome)}</b>${c.por ? `<small>${esc(c.por)} pediu</small>` : ""}</div>
      <button class="qtd-b" data-acao="editar-compra" data-id="${c.id}" aria-label="Editar ${esc(c.nome)}">${fmt(c.qtd)} ${esc(c.unidade)}</button>
    </div>`;
  }
  function linkWhatsApp() {
    const linhas = ["*Lista de compras*"];
    agrupar(naLista()).forEach(([corredor, itens]) => {
      linhas.push("", `*${corredor}*`);
      itens.forEach(i => linhas.push(`- ${i.nome} (${fmt(i.qtd)} ${i.unidade})`));
    });
    return "https://wa.me/?text=" + encodeURIComponent(linhas.join("\n"));
  }

  /* ---------- carrinho ---------- */
  function renderCarrinho() {
    const box = $("#carrinho");
    if (!pronto.compras) { box.innerHTML = espera("Carregando o carrinho…"); return; }
    const carrinho = noCarrinho().sort(porNome), faltam = naLista().length;
    if (!carrinho.length) {
      box.innerHTML = vazio(IC.carrinho, "Carrinho vazio", "No mercado, abra a lista e toque em cada produto quando colocar no carrinho.");
      return;
    }
    const total = carrinho.reduce((s, c) => s + num(c.preco), 0);
    const tudo = carrinho.length + faltam;
    box.innerHTML = `<div class="pilha">
      <div class="bloco painel">
        <div class="painel-linha"><span>Total do carrinho</span><span class="valor">${total ? reais(total) : "R$ —"}</span></div>
        <div class="trilho"><i style="width:${Math.round(carrinho.length / tudo * 100)}%"></i></div>
        <p class="nota">${faltam ? `Ainda ${faltam === 1 ? "falta 1 produto" : `faltam ${faltam} produtos`} da lista.` : "Você pegou tudo da lista."} Anotar o preço é opcional.</p>
      </div>
      <div class="bloco">${carrinho.map(linhaCarrinho).join("")}</div>
      <button class="bt claro" data-acao="esvaziar">${IC.volta}Devolver tudo para a lista</button>
    </div>`;
  }
  function linhaCarrinho(c) {
    return `<div class="linha">
      <button class="marca feita" data-acao="devolver" data-id="${c.id}" aria-label="Devolver ${esc(c.nome)} para a lista">${IC.certo}</button>
      <div class="linha-txt"><b>${esc(c.nome)}</b><small>${fmt(c.qtd)} ${esc(c.unidade)}</small></div>
      <label class="preco">R$<input data-vivo data-preco="${c.id}" inputmode="decimal" placeholder="0,00" value="${c.preco ? preco(c.preco) : ""}" aria-label="Preço de ${esc(c.nome)}"></label>
    </div>`;
  }

  /* ---------- em casa ---------- */
  function renderCasa() {
    const box = $("#casa"), filtros = $("#filtros-casa");
    const repor = paraRepor(), vence = D.despensa.filter(vencendo);
    const opcoes = [["tudo", "Tudo", D.despensa.length], ["repor", "Para repor", repor.length], ["vencendo", "Vencendo", vence.length]];
    filtros.innerHTML = D.despensa.length ? opcoes.map(([v, r, n]) => `<button type="button" class="ficha" data-acao="filtro-casa" data-valor="${v}" aria-pressed="${v === filtroCasa}">${r}${n ? ` (${n})` : ""}</button>`).join("") : "";
    if (!pronto.despensa) { box.innerHTML = espera("Carregando…"); return; }

    const b = norm(buscaCasa);
    const existeIgual = D.despensa.some(d => norm(d.nome) === b);
    const registrar = b && !existeIgual ? `<button class="bt claro" data-acao="registrar-casa">${IC.mais}Registrar “${esc(buscaCasa.trim())}” em casa</button>` : "";

    if (!D.despensa.length && !b) {
      box.innerHTML = vazio(IC.prateleira, "Nada registrado", "Digite acima o que tem em casa. Depois de cada compra, o carrinho preenche isso sozinho.");
      return;
    }
    let visiveis = D.despensa.filter(d => !b || norm(d.nome).includes(b));
    if (filtroCasa === "repor") visiveis = visiveis.filter(situacao);
    if (filtroCasa === "vencendo") visiveis = visiveis.filter(vencendo);
    if (!visiveis.length) {
      const msg = b ? `Nada encontrado com “${esc(buscaCasa.trim())}”.` : filtroCasa === "repor" ? "Nada para repor. A casa está abastecida." : "Nenhum produto perto de vencer.";
      box.innerHTML = `<div class="pilha">${registrar}${espera(msg)}</div>`;
      return;
    }
    let html = registrar;
    if (filtroCasa === "tudo" && !b && repor.length) {
      html += `<section class="grupo">${tituloGrupo("Para repor", repor.length, "--sol")}<div class="bloco">${repor.slice().sort(porNome).map(linhaCasa).join("")}</div></section>`;
      visiveis = visiveis.filter(d => !situacao(d));
    }
    html += agrupar(visiveis).map(([corredor, itens]) => `<section class="grupo">${tituloGrupo(corredor, itens.length)}<div class="bloco">${itens.map(linhaCasa).join("")}</div></section>`).join("");
    box.innerHTML = `<div class="pilha">${html}</div>`;
  }
  function linhaCasa(d) {
    const s = situacao(d), q = qtdAtual(d), listado = jaNaLista(d.nome);
    const etqs = [];
    if (s === "acabou") etqs.push('<span class="etq acabou">Acabou</span>');
    if (s === "acabando") etqs.push('<span class="etq acabando">Acabando</span>');
    if (vencendo(d)) { const n = diasAte(d.validade); etqs.push(`<span class="etq ${n < 0 ? "acabou" : "vence"}">${n < 0 ? "Venceu" : n === 0 ? "Vence hoje" : `Vence em ${plural(n, "dia", "dias")}`}</span>`); }
    if (listado) etqs.push('<span class="etq lista">Na lista</span>');
    return `<div class="linha">
      <button class="linha-txt" data-acao="editar-casa" data-id="${d.id}" aria-label="Editar ${esc(d.nome)}"><b>${esc(d.nome)}</b>${etqs.length ? `<small>${etqs.join("")}</small>` : ""}</button>
      <div class="passos">
        <button data-acao="menos" data-id="${d.id}" aria-label="Diminuir ${esc(d.nome)}" ${q <= 0 ? "disabled" : ""}>−</button>
        <span>${fmt(q)} ${esc(d.unidade)}</span>
        <button data-acao="mais" data-id="${d.id}" aria-label="Aumentar ${esc(d.nome)}">+</button>
      </div>
      <button class="icone-b" data-acao="repor" data-id="${d.id}" aria-label="Pôr ${esc(d.nome)} na lista de compras" title="Pôr na lista" ${listado ? "disabled" : ""}>${IC.listaMais}</button>
    </div>`;
  }

  /* ---------- mais ---------- */
  function renderMais() {
    const hoje = DIAS[new Date().getDay()][0];
    const cardapioHoje = D.cardapio.find(c => c.id === hoje) || {};
    const pratos = [cardapioHoje.almoco, cardapioHoje.jantar].filter(Boolean);
    const pendentes = D.tarefas.filter(t => !tarefaFeita(t)).length;
    const mesAtual = hojeISO().slice(0, 7);
    const gastoMes = D.gastos.filter(g => String(g.data).startsWith(mesAtual)).reduce((s, g) => s + num(g.total), 0);
    const ultimo = D.recados.slice().sort((a, b) => b.criadoEm - a.criadoEm)[0];
    const atalho = (ir, cor, icone, titulo, texto) => `<button class="atalho" data-ir-sub="${ir}" style="--c:var(${cor})"><span class="ic">${icone}</span><b>${titulo}</b><span>${texto}</span></button>`;

    $("#mais").innerHTML = `<div class="pilha">
      <div class="atalhos">
        ${atalho("cardapio", "--c-padaria", IC.prato, "Cardápio", pratos.length ? `Hoje: ${esc(pratos.join(" e "))}` : "Planeje as refeições da semana")}
        ${atalho("tarefas", "--c-frios", IC.tarefa, "Tarefas", pendentes ? `${plural(pendentes, "tarefa", "tarefas")} para fazer` : "Divida as tarefas da casa")}
        ${atalho("gastos", "--c-horti", IC.moeda, "Gastos", gastoMes ? `${reais(gastoMes)} neste mês` : "Acompanhe os gastos do mês")}
        ${atalho("recados", "--c-higiene", IC.recado, "Recados", ultimo ? `${esc(ultimo.por || "Alguém")}: ${esc(ultimo.texto)}` : "Deixe recados para a família")}
      </div>
      <div class="bloco">
        <button class="ajuste" data-acao="meu-nome">${IC.pessoa}<div><b>Seu nome</b><small>${meuNome ? esc(meuNome) : "Informe para a família saber quem pediu cada coisa"}</small></div></button>
        <button class="ajuste" data-acao="exportar">${IC.baixar}<div><b>Guardar uma cópia dos dados</b><small>Baixa um arquivo com tudo o que está salvo</small></div></button>
        <button class="ajuste" data-acao="importar">${IC.subir}<div><b>Trazer uma cópia guardada</b><small>Recupera os dados de um arquivo baixado antes</small></div></button>
        <div class="ajuste">${IC.nuvem}<div><b>${banco && banco.modo === "nuvem" ? "Compartilhado com a família" : "Salvo só neste aparelho"}</b><small>${banco && banco.modo === "nuvem" ? `Código da família: ${esc(CFG.codigoFamilia || "")}` : "Para compartilhar entre os celulares, configure o Firebase (veja o README)"}</small></div></div>
      </div>
    </div>`;
  }

  /* ---------- cardápio ---------- */
  function renderCardapio() {
    const hoje = new Date().getDay();
    const ordem = [...DIAS.slice(hoje), ...DIAS.slice(0, hoje)];
    const temAlgo = D.cardapio.some(c => c.almoco || c.jantar);
    $("#cardapio").innerHTML = `<div class="pilha">${ordem.map(([id, nome], i) => {
      const c = D.cardapio.find(x => x.id === id) || {};
      const campo = (ref, rotulo) => `<div class="refeicao"><label for="c-${id}-${ref}">${rotulo}</label><input data-vivo id="c-${id}-${ref}" data-dia="${id}" data-ref="${ref}" value="${esc(c[ref] || "")}" placeholder="Toque para escrever" maxlength="80"></div>`;
      return `<div class="bloco dia ${i === 0 ? "hoje" : ""}">
        <div class="dia-t">${nome}${i === 0 ? '<span class="hoje-e">hoje</span>' : ""}</div>
        ${campo("almoco", "Almoço")}${campo("jantar", "Jantar")}
      </div>`;
    }).join("")}
    ${temAlgo ? `<button class="bt claro" data-acao="limpar-cardapio">Limpar a semana</button>` : ""}</div>`;
  }

  /* ---------- tarefas ---------- */
  function renderTarefas() {
    const box = $("#tarefas");
    if (!pronto.tarefas) { box.innerHTML = espera("Carregando…"); return; }
    if (!D.tarefas.length) { box.innerHTML = vazio(IC.tarefa, "Nenhuma tarefa", "Escreva uma tarefa acima. Depois toque nela para escolher quem faz e se repete toda semana."); return; }
    const ordem = (a, b) => (a.criadoEm || 0) - (b.criadoEm || 0);
    const abertas = D.tarefas.filter(t => !tarefaFeita(t)).sort(ordem), feitas = D.tarefas.filter(tarefaFeita).sort(ordem);
    const linha = t => {
      const feita = tarefaFeita(t);
      const info = [t.responsavel ? esc(t.responsavel) : "Sem responsável", t.repete ? "toda semana" : ""].filter(Boolean).join(", ");
      return `<div class="linha ${feita ? "ok" : ""}">
        <button class="marca ${feita ? "feita" : ""}" data-acao="marcar-tarefa" data-id="${t.id}" aria-label="${feita ? "Desmarcar" : "Marcar como feita"}: ${esc(t.titulo)}">${IC.certo}</button>
        <button class="linha-txt" data-acao="editar-tarefa" data-id="${t.id}"><b>${esc(t.titulo)}</b><small>${info}</small></button>
      </div>`;
    };
    box.innerHTML = `<div class="pilha">
      ${abertas.length ? `<section class="grupo">${tituloGrupo("Para fazer", abertas.length, "--c-frios")}<div class="bloco">${abertas.map(linha).join("")}</div></section>` : espera("Tudo feito por aqui.")}
      ${feitas.length ? `<section class="grupo">${tituloGrupo("Feitas", feitas.length, "--folha")}<div class="bloco">${feitas.map(linha).join("")}</div></section>` : ""}
      ${feitas.some(t => !t.repete) ? `<button class="bt claro" data-acao="limpar-tarefas">Apagar as tarefas feitas</button>` : ""}
    </div>`;
  }

  /* ---------- gastos ---------- */
  function renderGastos() {
    const box = $("#gastos");
    if (!pronto.gastos) { box.innerHTML = espera("Carregando…"); return; }
    const doMes = m => D.gastos.filter(g => String(g.data).startsWith(m));
    const soma = lista => lista.reduce((s, g) => s + num(g.total), 0);
    const [ano, mes] = mesGastos.split("-").map(Number);
    const anterior = isoDe(new Date(ano, mes - 2, 1)).slice(0, 7);
    const nomeMes = maiuscula(new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }));
    const lista = doMes(mesGastos).sort((a, b) => String(b.data).localeCompare(String(a.data)) || (b.criadoEm || 0) - (a.criadoEm || 0));
    const total = soma(lista), totalAnterior = soma(doMes(anterior)), meta = metaMensal();
    const ehAtual = mesGastos === hojeISO().slice(0, 7);

    box.innerHTML = `<div class="pilha">
      <div class="mes">
        <button class="icone-b" data-acao="mes" data-passo="-1" aria-label="Mês anterior">${IC.esq}</button>
        <strong>${nomeMes}</strong>
        <button class="icone-b" data-acao="mes" data-passo="1" aria-label="Próximo mês" ${ehAtual ? "disabled" : ""}>${IC.dir}</button>
      </div>
      <div class="bloco painel">
        <div class="painel-linha"><span>Gasto no mês</span><span class="valor">${reais(total)}</span></div>
        ${meta ? `<div class="trilho ${total > meta ? "passou" : ""}"><i style="width:${Math.min(100, Math.round(total / meta * 100))}%"></i></div>
          <p class="nota">${total > meta ? `Passou ${reais(total - meta)} da meta de ${reais(meta)}.` : `Sobram ${reais(meta - total)} da meta de ${reais(meta)}.`}</p>` : ""}
        ${totalAnterior ? `<p class="nota">No mês anterior foram ${reais(totalAnterior)}.</p>` : ""}
        <button class="bt claro" data-acao="definir-meta">${meta ? "Mudar a meta do mês" : "Definir uma meta para o mês"}</button>
      </div>
      ${lista.length ? `<div class="bloco">${lista.map(g => `<button class="linha" data-acao="editar-gasto" data-id="${g.id}" style="width:100%;border-inline:0;border-bottom:0;background:none;text-align:left">
          <div class="linha-txt"><b>${esc(g.local || "Compra")}</b><small>${[dataCurta(g.data), g.itens ? plural(g.itens, "produto", "produtos") : "", g.por ? esc(g.por) : ""].filter(Boolean).join(", ")}</small></div>
          <span class="qtd-b">${reais(g.total)}</span>
        </button>`).join("")}</div>`
        : vazio(IC.moeda, "Nenhum gasto no mês", "Ao finalizar uma compra no carrinho, informe o total e ele aparece aqui.")}
    </div>`;
  }

  /* ---------- recados ---------- */
  function renderRecados() {
    const box = $("#recados");
    if (!pronto.recados) { box.innerHTML = espera("Carregando…"); return; }
    if (!D.recados.length) { box.innerHTML = vazio(IC.recado, "Nenhum recado", "Escreva acima um aviso para todo mundo ver, como “Vó vem almoçar domingo”."); return; }
    box.innerHTML = `<div class="pilha" style="gap:10px">${D.recados.slice().sort((a, b) => b.criadoEm - a.criadoEm).map(r => `<div class="bilhete">
      <div><p>${esc(r.texto)}</p><small>${esc(r.por || "Alguém")}, ${quando(r.criadoEm)}</small></div>
      <button class="icone-b" data-acao="apagar-recado" data-id="${r.id}" aria-label="Apagar recado">${IC.x}</button>
    </div>`).join("")}</div>`;
  }

  /* ================= folha (formulários) ================= */
  let aoEnviarFolha = null;
  const folha = $("#folha");
  function abrirFolha(titulo, corpo, aoEnviar) {
    aoEnviarFolha = aoEnviar;
    $("#toast").classList.remove("visivel");
    folha.innerHTML = `<div class="folha-topo"><h2>${titulo}</h2><button type="button" class="fechar" data-fechar aria-label="Fechar">${IC.x}</button></div>${corpo}`;
    folha.hidden = false; $("#fundo-folha").hidden = false;
    document.body.style.overflow = "hidden";
    const primeiro = folha.querySelector("[data-foco]");
    if (primeiro) setTimeout(() => { primeiro.focus(); if (primeiro.select) primeiro.select(); }, 60);
  }
  function fecharFolha() {
    aoEnviarFolha = null;
    folha.hidden = true; $("#fundo-folha").hidden = true; folha.innerHTML = "";
    document.body.style.overflow = "";
  }
  $("#fundo-folha").addEventListener("click", fecharFolha);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !folha.hidden) fecharFolha(); });
  folha.addEventListener("submit", e => { e.preventDefault(); if (aoEnviarFolha) aoEnviarFolha(Object.fromEntries(new FormData(folha))); });
  folha.addEventListener("click", e => {
    if (e.target.closest("[data-fechar]")) return fecharFolha();
    const ficha = e.target.closest("[data-valor]");
    if (ficha && ficha.parentElement.dataset.grupo) {
      const grupo = ficha.parentElement, campo = folha.querySelector(`[name="${grupo.dataset.grupo}"]`);
      const desmarcar = grupo.dataset.opcional && ficha.getAttribute("aria-checked") === "true";
      grupo.querySelectorAll("[data-valor]").forEach(f => f.setAttribute("aria-checked", !desmarcar && f === ficha));
      campo.value = desmarcar ? "" : ficha.dataset.valor;
      return;
    }
    const passo = e.target.closest("[data-passo]");
    if (passo) {
      const campo = folha.querySelector('[name="qtd"]'), un = (folha.querySelector('[name="unidade"]') || {}).value;
      campo.value = Math.max(0, num((Number(campo.value) || 0) + Number(passo.dataset.passo) * passoDe(un)));
    }
  });
  const grupoFichas = (nome, opcoes, atual, opcional) => `<input type="hidden" name="${nome}" value="${esc(atual || "")}">
    <div class="fichas" data-grupo="${nome}" ${opcional ? 'data-opcional="1"' : ""} role="radiogroup">${opcoes.map(o => {
      const [valor, cor] = Array.isArray(o) ? o : [o];
      return `<button type="button" class="ficha" role="radio" data-valor="${esc(valor)}" aria-checked="${valor === atual}" ${cor ? `style="--c:var(${cor})"` : ""}>${cor ? "<i></i>" : ""}${esc(valor)}</button>`;
    }).join("")}</div>`;
  const acoesFolha = (salvar, podeApagar) => `<div class="folha-acoes">${podeApagar ? '<button type="button" class="bt perigo" data-apagar>Apagar</button>' : ""}<button type="submit" class="bt">${salvar}</button></div>`;
  function ligarApagar(aoApagar) {
    const b = folha.querySelector("[data-apagar]"); if (!b) return;
    let armado = false;
    b.addEventListener("click", () => { if (!armado) { armado = true; b.textContent = "Confirmar"; return; } aoApagar(); });
  }

  function folhaProduto(col, item) {
    const emCasa = col === "despensa";
    abrirFolha("Editar produto", `
      <label class="campo"><span class="rot">Produto</span><input class="ent" name="nome" value="${esc(item.nome)}" required maxlength="60"></label>
      <div class="dois">
        <div class="campo"><span class="rot">Quantidade</span><div class="conta"><button type="button" data-passo="-1" aria-label="Diminuir">−</button><input name="qtd" type="number" min="0" step="any" inputmode="decimal" value="${num(item.qtd)}" aria-label="Quantidade"><button type="button" data-passo="1" aria-label="Aumentar">+</button></div></div>
        ${emCasa ? `<label class="campo"><span class="rot">Avisar quando tiver</span><input class="ent" name="minimo" type="number" min="0" step="any" inputmode="decimal" placeholder="Opcional" value="${item.minimo ? num(item.minimo) : ""}"></label>` : "<div></div>"}
      </div>
      <div class="campo"><span class="rot">Unidade</span>${grupoFichas("unidade", UNIDADES, item.unidade)}</div>
      <div class="campo"><span class="rot">Corredor do mercado</span>${grupoFichas("categoria", CORREDORES, corredorDe(item.categoria))}</div>
      ${emCasa ? `<label class="campo"><span class="rot">Validade (opcional)</span><input class="ent" name="validade" type="date" value="${esc(item.validade || "")}"></label>` : ""}
      ${acoesFolha("Salvar", true)}`,
      async v => {
        const nome = String(v.nome || "").trim(); if (!nome) return;
        const dados = { nome, qtd: num(v.qtd), unidade: v.unidade || "un", categoria: v.categoria || "Outros" };
        if (emCasa) { dados.minimo = num(v.minimo); dados.validade = v.validade || ""; }
        fecharFolha();
        if (await seguro(banco.alterar(col, item.id, dados))) toast("Alterações salvas");
      });
    ligarApagar(async () => {
      fecharFolha();
      const { id, ...copia } = item;
      if (await seguro(banco.apagar(col, id))) toast(`${item.nome} apagado`, () => seguro(banco.criar(col, copia)));
    });
  }

  function folhaFinalizar() {
    const itens = noCarrinho(); if (!itens.length) return;
    const soma = itens.reduce((s, c) => s + num(c.preco), 0);
    const locais = [...new Set(D.gastos.map(g => g.local).filter(Boolean))];
    abrirFolha("Finalizar compra", `
      <p class="nota">${maiuscula(plural(itens.length, "produto vai", "produtos vão"))} para “Em casa”, somando com o que já tem.</p>
      <label class="campo"><span class="rot">Quanto deu a compra? (opcional)</span><input class="ent" name="total" inputmode="decimal" placeholder="R$ 0,00" value="${soma ? preco(soma) : ""}" data-foco></label>
      <label class="campo"><span class="rot">Onde comprou? (opcional)</span><input class="ent" name="local" list="locais" placeholder="Nome do mercado" maxlength="40"></label>
      <datalist id="locais">${locais.map(l => `<option value="${esc(l)}">`).join("")}</datalist>
      ${acoesFolha("Finalizar compra")}`,
      async v => {
        const botao = folha.querySelector('[type="submit"]'); botao.disabled = true;
        let n = 0;
        for (const c of itens) {
          const igual = D.despensa.find(d => norm(d.nome) === norm(c.nome) && d.unidade === c.unidade);
          let ok;
          if (igual) { const nova = num(Number(igual.qtd) + Number(c.qtd)); ok = await seguro(banco.alterar("despensa", igual.id, { qtd: nova })); if (ok) igual.qtd = nova; }
          else ok = await seguro(banco.criar("despensa", { nome: c.nome, qtd: num(c.qtd), unidade: c.unidade, categoria: corredorDe(c.categoria), minimo: 0, validade: "", criadoEm: Date.now() }));
          if (ok && await seguro(banco.apagar("compras", c.id))) n++;
        }
        const total = lerDinheiro(v.total);
        if (n && total > 0) await seguro(banco.criar("gastos", { data: hojeISO(), local: String(v.local || "").trim(), total, itens: n, por: meuNome, criadoEm: Date.now() }));
        fecharFolha();
        if (n) { irPara("casa"); toast(`Compra finalizada: ${plural(n, "produto guardado", "produtos guardados")}`); }
      });
  }

  function folhaGasto(gasto) {
    const g = gasto || { data: hojeISO(), local: "", total: "" };
    abrirFolha(gasto ? "Editar gasto" : "Registrar gasto", `
      <label class="campo"><span class="rot">Valor</span><input class="ent" name="total" inputmode="decimal" placeholder="R$ 0,00" value="${g.total ? preco(g.total) : ""}" required data-foco></label>
      <div class="dois">
        <label class="campo"><span class="rot">Onde</span><input class="ent" name="local" placeholder="Mercado, feira…" maxlength="40" value="${esc(g.local)}"></label>
        <label class="campo"><span class="rot">Dia</span><input class="ent" name="data" type="date" value="${esc(g.data)}" max="${hojeISO()}" required></label>
      </div>
      ${acoesFolha(gasto ? "Salvar" : "Registrar gasto", !!gasto)}`,
      async v => {
        const total = lerDinheiro(v.total);
        if (!(total > 0)) { folha.querySelector('[name="total"]').focus(); return; }
        const dados = { total, local: String(v.local || "").trim(), data: v.data || hojeISO() };
        fecharFolha();
        if (gasto) { if (await seguro(banco.alterar("gastos", gasto.id, dados))) toast("Gasto alterado"); }
        else if (await seguro(banco.criar("gastos", { ...dados, itens: 0, por: meuNome, criadoEm: Date.now() }))) { mesGastos = dados.data.slice(0, 7); render(); toast("Gasto registrado"); }
      });
    if (gasto) ligarApagar(async () => {
      fecharFolha();
      const { id, ...copia } = gasto;
      if (await seguro(banco.apagar("gastos", id))) toast("Gasto apagado", () => seguro(banco.criar("gastos", copia)));
    });
  }

  function folhaMeta() {
    const meta = metaMensal();
    abrirFolha("Meta do mês", `
      <p class="nota">Quanto a família quer gastar no mercado por mês. Deixe vazio para tirar a meta.</p>
      <label class="campo"><span class="rot">Valor da meta</span><input class="ent" name="meta" inputmode="decimal" placeholder="R$ 0,00" value="${meta ? preco(meta) : ""}" data-foco></label>
      ${acoesFolha("Salvar meta")}`,
      async v => { fecharFolha(); if (await seguro(banco.definir("ajustes", "geral", { meta: lerDinheiro(v.meta) }))) toast("Meta salva"); });
  }

  function folhaTarefa(t) {
    abrirFolha("Editar tarefa", `
      <label class="campo"><span class="rot">Tarefa</span><input class="ent" name="titulo" value="${esc(t.titulo)}" required maxlength="80"></label>
      <div class="campo"><span class="rot">Quem faz</span>${pessoas().length ? grupoFichas("responsavel", pessoas(), t.responsavel || "", true) : '<input type="hidden" name="responsavel" value="">'}
        <input class="ent" name="outro" placeholder="${pessoas().length ? "Ou escreva outro nome" : "Nome de quem faz"}" maxlength="30"></div>
      <label class="alterna"><input type="checkbox" name="repete" ${t.repete ? "checked" : ""}>Repetir toda semana</label>
      <p class="nota">Tarefas que repetem voltam para “Para fazer” toda segunda-feira.</p>
      ${acoesFolha("Salvar", true)}`,
      async v => {
        const titulo = String(v.titulo || "").trim(); if (!titulo) return;
        const dados = { titulo, responsavel: String(v.outro || "").trim() || v.responsavel || "", repete: !!v.repete };
        fecharFolha();
        if (await seguro(banco.alterar("tarefas", t.id, dados))) toast("Tarefa salva");
      });
    ligarApagar(async () => {
      fecharFolha();
      const { id, ...copia } = t;
      if (await seguro(banco.apagar("tarefas", id))) toast("Tarefa apagada", () => seguro(banco.criar("tarefas", copia)));
    });
  }

  function folhaNome() {
    abrirFolha("Seu nome", `
      <p class="nota">Aparece para a família nos pedidos, tarefas e recados feitos neste aparelho.</p>
      <label class="campo"><span class="rot">Como você se chama?</span><input class="ent" name="nome" value="${esc(meuNome)}" maxlength="30" data-foco></label>
      ${acoesFolha("Salvar")}`,
      v => {
        meuNome = String(v.nome || "").trim();
        try { localStorage.setItem("mercado:nome", meuNome); } catch (e) { /* tudo bem */ }
        fecharFolha(); render(); toast(meuNome ? `Olá, ${meuNome}` : "Nome removido");
      });
  }

  /* ================= ações ================= */
  async function porNaLista(nome, qtd, unidade, categoria) {
    const igual = naLista().find(c => norm(c.nome) === norm(nome) && c.unidade === unidade);
    if (igual) {
      const nova = num(Number(igual.qtd) + qtd);
      if (await seguro(banco.alterar("compras", igual.id, { qtd: nova }))) toast(`${igual.nome} já estava na lista: agora ${fmt(nova)} ${unidade}`);
      return;
    }
    let id;
    if (await seguro(banco.criar("compras", { nome, qtd, unidade, categoria, status: "lista", por: meuNome, criadoEm: Date.now() }).then(i => { id = i; })))
      toast(`${nome} na lista`, () => seguro(banco.apagar("compras", id)));
  }
  function adicionarPeloTexto(texto) {
    const p = interpretar(texto); if (!p.nome) return;
    const antes = conhecido(p.nome);
    const unidade = p.unidade || (antes && antes.unidade) || UNIDADE_COMUM[norm(p.nome).split(" ")[0]] || "un";
    const categoria = (antes && corredorDe(antes.categoria)) || palpiteCorredor(p.nome) || "Outros";
    const qtd = p.qtd || (passoDe(unidade) === 100 ? 500 : 1);
    return porNaLista(antes ? antes.nome : p.nome, qtd, unidade, categoria);
  }

  $("#rapido-lista").addEventListener("submit", e => {
    e.preventDefault(); if (!banco) return;
    const campo = $("#novo-produto"), texto = campo.value.trim();
    if (!texto) { campo.focus(); return; }
    campo.value = ""; campo.focus();
    adicionarPeloTexto(texto);
  });

  async function registrarEmCasa() {
    const p = interpretar(buscaCasa); if (!p.nome || !banco) return;
    if (D.despensa.some(d => norm(d.nome) === norm(p.nome))) return;
    const unidade = p.unidade || UNIDADE_COMUM[norm(p.nome).split(" ")[0]] || "un";
    $("#busca-casa").value = ""; buscaCasa = "";
    if (await seguro(banco.criar("despensa", { nome: p.nome, qtd: p.qtd || 1, unidade, categoria: palpiteCorredor(p.nome) || "Outros", minimo: 0, validade: "", criadoEm: Date.now() })))
      toast(`${p.nome} registrado em casa`);
    render();
  }
  $("#rapido-casa").addEventListener("submit", e => { e.preventDefault(); registrarEmCasa(); });
  $("#busca-casa").addEventListener("input", e => { buscaCasa = e.target.value; render(); });

  $("#rapido-tarefa").addEventListener("submit", async e => {
    e.preventDefault(); if (!banco) return;
    const campo = $("#nova-tarefa"), titulo = campo.value.trim();
    if (!titulo) { campo.focus(); return; }
    campo.value = ""; campo.focus();
    await seguro(banco.criar("tarefas", { titulo: maiuscula(titulo), responsavel: "", repete: false, feita: false, criadoEm: Date.now() }));
  });
  $("#rapido-recado").addEventListener("submit", async e => {
    e.preventDefault(); if (!banco) return;
    const campo = $("#novo-recado"), texto = campo.value.trim();
    if (!texto) { campo.focus(); return; }
    campo.value = "";
    await seguro(banco.criar("recados", { texto, por: meuNome, criadoEm: Date.now() }));
  });

  // campos que salvam ao sair deles (preço no carrinho e cardápio)
  document.addEventListener("change", async e => {
    const el = e.target; if (!banco) return;
    if (el.dataset.preco) {
      await seguro(banco.alterar("compras", el.dataset.preco, { preco: lerDinheiro(el.value) }));
    } else if (el.dataset.dia) {
      const atual = D.cardapio.find(c => c.id === el.dataset.dia) || {};
      const { id, ...resto } = atual;
      await seguro(banco.definir("cardapio", el.dataset.dia, { almoco: "", jantar: "", ...resto, [el.dataset.ref]: el.value.trim() }));
    }
  });
  document.addEventListener("focusout", e => { if (e.target.matches && e.target.matches("[data-vivo]")) setTimeout(render, 0); });

  document.addEventListener("click", async e => {
    const sub = e.target.closest("[data-ir-sub]"); if (sub) { irPara(sub.dataset.irSub); return; }
    const el = e.target.closest("[data-acao]");
    if (!el || !banco || el.disabled) return;
    const { acao, id } = el.dataset;
    const compra = () => D.compras.find(x => x.id === id), emCasa = () => D.despensa.find(x => x.id === id);

    switch (acao) {
      case "pegar": {
        const c = compra(); if (!c || c.status === "carrinho") return;
        const linha = el.closest(".linha"); if (linha) linha.classList.add("saindo");
        setTimeout(async () => {
          if (await seguro(banco.alterar("compras", id, { status: "carrinho" }))) toast(`${c.nome} no carrinho`, () => seguro(banco.alterar("compras", id, { status: "lista" })));
          else if (linha) linha.classList.remove("saindo");
        }, 200);
        break;
      }
      case "devolver": { const c = compra(); if (c && await seguro(banco.alterar("compras", id, { status: "lista" }))) toast(`${c.nome} voltou para a lista`); break; }
      case "editar-compra": { e.stopPropagation(); const c = compra(); if (c) folhaProduto("compras", c); break; }
      case "editar-casa": { const d = emCasa(); if (d) folhaProduto("despensa", d); break; }
      case "basico": el.disabled = true; adicionarPeloTexto(el.dataset.nome); break;
      case "repor": {
        const d = emCasa(); if (!d || jaNaLista(d.nome)) return;
        el.disabled = true;
        const qtd = passoDe(d.unidade) === 100 ? 500 : Math.max(1, num(d.minimo || 1));
        porNaLista(d.nome, qtd, d.unidade, corredorDe(d.categoria));
        break;
      }
      case "mais": case "menos": {
        const d = emCasa(); if (!d) return;
        const valor = Math.max(0, num(qtdAtual(d) + (acao === "mais" ? 1 : -1) * passoDe(d.unidade)));
        const antes = qtdPendente.get(id); if (antes) clearTimeout(antes.relogio);
        qtdPendente.set(id, { valor, relogio: setTimeout(async () => {
          await seguro(banco.alterar("despensa", id, { qtd: qtdPendente.get(id).valor }));
          qtdPendente.delete(id); render();
        }, 700) });
        render();
        break;
      }
      case "esvaziar": el.disabled = true; for (const c of noCarrinho()) await seguro(banco.alterar("compras", c.id, { status: "lista" })); toast("Os produtos voltaram para a lista"); break;
      case "finalizar": folhaFinalizar(); break;
      case "filtro-casa": filtroCasa = el.dataset.valor; render(); break;
      case "registrar-casa": registrarEmCasa(); break;

      case "marcar-tarefa": { const t = D.tarefas.find(x => x.id === id); if (t) await seguro(banco.alterar("tarefas", id, { feita: !tarefaFeita(t), feitaEm: Date.now() })); break; }
      case "editar-tarefa": { const t = D.tarefas.find(x => x.id === id); if (t) folhaTarefa(t); break; }
      case "limpar-tarefas": el.disabled = true; for (const t of D.tarefas.filter(t => tarefaFeita(t) && !t.repete)) await seguro(banco.apagar("tarefas", t.id)); break;

      case "limpar-cardapio": {
        const copia = D.cardapio.map(c => ({ ...c }));
        for (const c of copia) await seguro(banco.apagar("cardapio", c.id));
        toast("Cardápio limpo", async () => { for (const { id: dia, ...resto } of copia) await seguro(banco.definir("cardapio", dia, resto)); });
        break;
      }

      case "novo-gasto": folhaGasto(); break;
      case "editar-gasto": { const g = D.gastos.find(x => x.id === id); if (g) folhaGasto(g); break; }
      case "definir-meta": folhaMeta(); break;
      case "mes": { const [a, m] = mesGastos.split("-").map(Number); mesGastos = isoDe(new Date(a, m - 1 + Number(el.dataset.passo), 1)).slice(0, 7); render(); break; }

      case "apagar-recado": {
        const r = D.recados.find(x => x.id === id); if (!r) return;
        const { id: _, ...copia } = r;
        if (await seguro(banco.apagar("recados", id))) toast("Recado apagado", () => seguro(banco.criar("recados", copia)));
        break;
      }

      case "meu-nome": folhaNome(); break;
      case "exportar": exportar(); break;
      case "importar": $("#arquivo-backup").click(); break;
    }
  });

  /* ================= cópia dos dados ================= */
  function exportar() {
    const conteudo = JSON.stringify({ app: "mercado-da-familia", versao: 1, exportadoEm: new Date().toISOString(), dados: D }, null, 2);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([conteudo], { type: "application/json" }));
    link.download = `mercado-da-familia-${hojeISO()}.json`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    toast("Cópia baixada");
  }
  $("#arquivo-backup").addEventListener("change", async e => {
    const arquivo = e.target.files[0]; e.target.value = "";
    if (!arquivo || !banco) return;
    try {
      const copia = JSON.parse(await arquivo.text());
      if (copia.app !== "mercado-da-familia" || !copia.dados) throw new Error("formato");
      let n = 0;
      for (const col of COLECOES)
        for (const { id, ...dados } of (copia.dados[col] || [])) { if (id && await seguro(banco.definir(col, id, dados))) n++; }
      toast(`Cópia trazida: ${plural(n, "registro", "registros")}`);
    } catch (erro) {
      console.error(erro);
      toast("Este arquivo não é uma cópia do Mercado da Família.");
    }
  });

  /* ================= início ================= */
  $("#casa-nome").textContent = `Casa da ${CFG.nomeFamilia || "Família"}`;
  document.title = `Mercado da ${CFG.nomeFamilia || "Família"}`;

  function conectar(b) {
    banco = b;
    if (b.modo === "local") {
      sinal("local");
      let visto = false; try { visto = localStorage.getItem("mercado:aviso-local") === "1"; } catch (e) { /* tudo bem */ }
      if (!visto) aviso("<b>Modo local:</b> os dados ficam só neste aparelho. Para a família toda ver as mesmas listas, configure o Firebase no arquivo <code>config.js</code>. O passo a passo está no README.", true);
    }
    COLECOES.forEach(col => b.ouvir(col, docs => { D[col] = docs; pronto[col] = true; render(); }, erro => {
      console.error(erro);
      pronto[col] = true; sinal("erro");
      aviso(erro && erro.code === "permission-denied"
        ? "<b>O Firebase recusou o acesso.</b> Confira as regras do Firestore (README, passo 3)."
        : "<b>Não foi possível carregar.</b> Confira a internet e recarregue a página.");
      render();
    }));
  }

  mostrar(location.hash.slice(1));
  if (CFG.firebase && CFG.firebase.apiKey) {
    criarNuvem(CFG, sinal).then(conectar).catch(erro => {
      console.error(erro);
      conectar(criarLocal(CFG));
      sinal("erro");
      aviso("<b>Não consegui conectar ao Firebase.</b> Usando o modo local por enquanto. Confira as chaves no arquivo <code>config.js</code>.");
    });
  } else {
    conectar(criarLocal(CFG));
  }
  window.addEventListener("online", () => banco && banco.modo === "nuvem" && sinal("ok"));
  window.addEventListener("offline", () => banco && banco.modo === "nuvem" && sinal("offline"));
})();
