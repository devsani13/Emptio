// ==========================================
// BACK-END - USUÁRIOS
// ==========================================

const CHAVE_USUARIOS = "chaveusuarios";
const CHAVE_CARRINHO_ATUAL = "carrinhoAtual";

// Guarda o carrinho mostrado na tela enquanto o usuário navega pela aplicação.
let carrinhoAtual = null;
// Guarda qual produto está sendo editado; null indica que um novo produto será criado.
let indiceEditando = null;
const CHAVE_CARRINHO_HISTORICO = "carrinhoAbertoHistorico";


// ==========================================
// CLASSE USUARIOS
// ==========================================

class Usuarios {
    constructor(nomeusuario, usuario, senha, carrinhos = []) {
        this.nomeusuario = nomeusuario;
        this.usuario = usuario;
        this.senha = senha;
        this.carrinhos = carrinhos;
    }
}


// ==========================================
// CLASSE USUARIOSDB
// ==========================================

class UsuariosDB {

    constructor() {
        this.usuarios = this.obterUsuarios();
    }

    // Recupera os usuários
    obterUsuarios() {
        try {
            const dados = localStorage.getItem(CHAVE_USUARIOS);
            if (!dados) return [];

            const usuarios = JSON.parse(dados);
            if (!Array.isArray(usuarios)) return [];

            return usuarios.map(usuario => {
                if (!Array.isArray(usuario.carrinhos)) {
                    usuario.carrinhos = [];
                }
                return usuario;
            });

        } catch (erro) {
            console.error("Não foi possível ler os usuários:", erro);
            return [];
        }
    }

    // Salva um novo usuário
    salvarUsuarios(usuario) {
        this.usuarios.push(usuario);
        return this.persistir();
    }

    // Verifica se o usuário já existe
    usuarioExiste(usuario) {
        return this.usuarios.some(u => u.usuario === usuario);
    }

    // Verifica login
    verificarLogin(usuario, senha) {
        return this.usuarios.find(u =>
            u.usuario === usuario && u.senha === senha
        ) || null;
    }

    async verificarLoginSeguro(usuario, senha) {
        const encontrado = this.usuarios.find(u => u.usuario === usuario);
        if (!encontrado) return null;

        const hashSenha = await hashSenhaAsync(senha);
        if (encontrado.senha === hashSenha) return encontrado;

        // Compatibilidade temporária com cadastros feitos antes da proteção.
        if (encontrado.senha === senha) {
            encontrado.senha = hashSenha;
            this.persistir();
            return encontrado;
        }

        return null;
    }

    persistir() {
        try {
            localStorage.setItem(
                CHAVE_USUARIOS,
                JSON.stringify(this.usuarios)
            );
            return true;
        } catch (erro) {
            console.error("Não foi possível salvar os usuários:", erro);
            return false;
        }
    }

    // Salva carrinho dentro do usuário
    salvarCarrinho(usuario, carrinho) {

        const encontrado = this.usuarios.find(
            u => u.usuario === usuario
        );

        if (!encontrado) return false;

        // Mantém o mesmo ID nas próximas atualizações
        if (!carrinho.idHistorico) {
            carrinho.idHistorico = Date.now();
        }

        if (!Array.isArray(encontrado.carrinhos)) {
            encontrado.carrinhos = [];
        }

        const registro = {
            id: carrinho.idHistorico,
            dataHora: new Date().toLocaleString("pt-BR"),
            timestamp: Date.now(),
            nomecarrinho: carrinho.nomecarrinho,

            produtos: carrinho.produtos.map(produto => ({
                nomeproduto: produto.nomeproduto,
                preco: produto.preco,
                quantidade: produto.quantidade
            })),

            total: carrinho.calcularTotal()
        };

        // Procura se o carrinho já foi salvo
        const indice = encontrado.carrinhos.findIndex(
            c => c.id === carrinho.idHistorico
        );

        if (indice !== -1) {
            // Atualiza o registro existente
            encontrado.carrinhos[indice] = registro;
        } else {
            // Cria um novo registro
            encontrado.carrinhos.push(registro);
        }

        return this.persistir();
    }

    // Recupera os carrinhos de determinado usuário
    obterCarrinhos(usuario) {

        const encontrado = this.usuarios.find(
            u => u.usuario === usuario
        );

        return encontrado ? encontrado.carrinhos : [];
    }

    excluirCarrinho(usuario, idCarrinho) {
        const encontrado = this.usuarios.find(
            u => u.usuario === usuario
        );

        if (!encontrado || !Array.isArray(encontrado.carrinhos)) {
            return false;
        }

        const indice = encontrado.carrinhos.findIndex(
            carrinho => Number(carrinho.id) === Number(idCarrinho)
        );

        if (indice === -1) return false;

        encontrado.carrinhos.splice(indice, 1);
        return this.persistir();
    }
}

function atualizarCarrinhoSalvo() {

    // Só atualiza se o carrinho já tiver sido salvo
    if (!carrinhoAtual || !carrinhoAtual.idHistorico) {
        return;
    }

    if (sessionStorage.getItem(CHAVE_CARRINHO_HISTORICO) === "true") {
        return;
    }

    const usuarioLogado = obterUsuarioLogado();

    if (!usuarioLogado) return;

    const dbusuario = new UsuariosDB();

    dbusuario.salvarCarrinho(
        usuarioLogado.usuario,
        carrinhoAtual
    );

    console.log("Carrinho atualizado no histórico!");
}

function obterUsuarioLogado() {
    try {
        const dados = sessionStorage.getItem("usuarioLogado");
        return dados ? JSON.parse(dados) : null;
    } catch (erro) {
        console.error("Não foi possível ler o usuário logado:", erro);
        sessionStorage.removeItem("usuarioLogado");
        return null;
    }
}

function persistirCarrinhoAtual() {
    try {
        if (sessionStorage.getItem(CHAVE_CARRINHO_HISTORICO) === "true") {
            return;
        }

        if (carrinhoAtual) {
            sessionStorage.setItem(
                CHAVE_CARRINHO_ATUAL,
                JSON.stringify(carrinhoAtual)
            );
        } else {
            sessionStorage.removeItem(CHAVE_CARRINHO_ATUAL);
        }
    } catch (erro) {
        console.error("Não foi possível salvar o carrinho atual:", erro);
    }
}

async function hashSenhaAsync(senha) {
    const bytes = new TextEncoder().encode(senha);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

// ==========================================
// CLASSE PRODUTO
// ==========================================

class Produto {

    constructor(nomeproduto, preco, quantidade) {
        this.nomeproduto = nomeproduto;
        this.preco = Number(preco);
        this.quantidade = Number(quantidade);
    }

    calcularSubtotal() {
        return this.preco * this.quantidade;
    }
}


// ==========================================
// CLASSE CARRINHO
// ==========================================

class Carrinho {

    constructor(nomecarrinho) {
        this.nomecarrinho = nomecarrinho;
        this.produtos = [];
    }

    adicionarProduto(produto) {
        this.produtos.push(produto);
    }

    removerProduto(indice) {
        this.produtos.splice(indice, 1);
    }

    calcularTotal() {
        let total = 0;
        for (let produto of this.produtos) {
            total += produto.calcularSubtotal();
        }
        return total;
    }
}


// ==========================================
// ELEMENTOS HTML
// ==========================================

const formulario = document.getElementById("productForm");
const dialog = document.getElementById("exampleDialogDark");

const formularioSalvar = document.getElementById("productForm2");
const dialogSalvar = document.getElementById("exampleDialogDark2");

const listaProdutos = document.querySelector(".product-list");

function capitalizarPrimeiraLetra(texto) {
    const textoLimpo = texto.trim();
    if (!textoLimpo) return "";

    return textoLimpo.charAt(0).toLocaleUpperCase("pt-BR") + textoLimpo.slice(1);
}


// ==========================================
// ATUALIZAR LISTA DE PRODUTOS
// ==========================================

function atualizarListaProdutos() {

    if (!listaProdutos) return;

    listaProdutos.replaceChildren();

    const listaResumo = document.querySelector(".lista-resumo");
    if (listaResumo) {
        listaResumo.replaceChildren();
    }

    if (!carrinhoAtual || carrinhoAtual.produtos.length === 0) {
        const estadoVazio = document.createElement("div");
        estadoVazio.className = "empty-state";
        estadoVazio.textContent = "Carrinho vazio, adicione um produto";
        listaProdutos.appendChild(estadoVazio);
        atualizarTotalResumo();
        return;
    }

    carrinhoAtual.produtos.forEach((produto, indice) => {
        adicionarCardProduto(
            produto.nomeproduto,
            produto.quantidade,
            produto.preco,
            produto.calcularSubtotal(),
            indice
        );
    });

    atualizarTotalResumo();
    filtrarProdutosCarrinho();
}

function atualizarTotalResumo() {
    const elementoTotal = document.getElementById("total-carrinho");
    if (!elementoTotal) return;

    const total = carrinhoAtual ? carrinhoAtual.calcularTotal() : 0;
    elementoTotal.textContent = total.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// ==========================================
// CARREGAR CATÁLOGO DE PRODUTOS (produtos.json)
// ==========================================

// ==========================================
// CARREGAR CATÁLOGO DE PRODUTOS (localStorage)
// ==========================================

async function carregarProdutosCombobox() {
    const modalAdicionar = document.getElementById("exampleDialogDark");
    if (!modalAdicionar) return;

    const menuCombobox = modalAdicionar.querySelector(".menu");
    if (!menuCombobox) return;

    try {
        const produtosIniciais = [
            { nome: "Arroz", preco: 25.50 },
            { nome: "Feijão", preco: 8.90 },
            { nome: "Macarrão", preco: 5.20 },
            { nome: "Óleo de Soja", preco: 7.80 },
            { nome: "Café", preco: 16.00 }
        ];

        let produtos = [];
        const dadosSalvos = localStorage.getItem("produtosCatalogoMod");
        
        if (dadosSalvos) {
            produtos = JSON.parse(dadosSalvos);
        } else {
            produtos = produtosIniciais;
            localStorage.setItem("produtosCatalogoMod", JSON.stringify(produtosIniciais));
        }

        menuCombobox.replaceChildren(); // Limpa as opções antigas

        produtos.forEach(produto => {
            const botaoItem = document.createElement("button");
            botaoItem.className = "menu-item";
            botaoItem.type = "button";

            const precoFormatado = Number(produto.preco).toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            botaoItem.innerHTML = `
                <span class="menu-item-content">
                    <span>${produto.nome}</span>
                    <small class="menu-item-description">R$ ${precoFormatado}</small>
                </span>
            `;

            menuCombobox.appendChild(botaoItem);
        });
    } catch (erro) {
        console.error("Não foi possível carregar o catálogo de produtos:", erro);
    }
}

// Executa o carregamento ao iniciar a aplicação
carregarProdutosCombobox();

// ==========================================
// SELEÇÃO AUTOMÁTICA NO COMBOBOX (#exampleDialogDark)
// ==========================================

document.addEventListener("click", function (event) {
    const modalAdicionar = document.getElementById("exampleDialogDark");
    if (!modalAdicionar) return;

    const itemSelecionado = event.target.closest("#exampleDialogDark .menu-item");
    if (!itemSelecionado) return;

    const campoNome = modalAdicionar.querySelector("#validationDefault01");
    const campoValor = modalAdicionar.querySelector("#validationDefaultValue");
    const rotuloCombobox = modalAdicionar.querySelector(".combobox-value");
    const botaoToggle = modalAdicionar.querySelector(".combobox-toggle");

    // 1. Extrai o nome do produto
    const spanNome = itemSelecionado.querySelector(".menu-item-content > span:first-child");
    const nomeProduto = spanNome ? spanNome.textContent.trim() : itemSelecionado.textContent.trim();

    // 2. Extrai o valor
    const spanDescricao = itemSelecionado.querySelector(".menu-item-description");
    const textoDescricao = spanDescricao ? spanDescricao.textContent.trim() : "";
    const valorProduto = textoDescricao.replace(/[^\d.,]/g, "").replace(",", ".");

    // 3. Preenche os campos de input
    if (campoNome) {
        campoNome.value = nomeProduto;
    }

    if (campoValor && valorProduto) {
        campoValor.value = valorProduto;
        // Aplica a máscara de formatação de moeda
        formatarMoedaInput(campoValor);
    }

    // 4. Limpa e reseta o combobox de volta ao estado padrão (vazio)
    setTimeout(() => {
        if (rotuloCombobox) {
            rotuloCombobox.textContent = "Selecionar Produto";
        }
        if (botaoToggle) {
            botaoToggle.removeAttribute("data-bs-value");
            botaoToggle.blur();
        }
    }, 50);

}, true);

// ==========================================
// MÁSCARA DE MOEDA EM TEMPO REAL (R$ 0,00)
// ==========================================

function formatarMoedaInput(input) {
    let apenasNumeros = input.value.replace(/\D/g, "");

    if (!apenasNumeros) {
        input.value = "";
        return;
    }

    const valorNumerico = Number(apenasNumeros) / 100;

    input.value = valorNumerico.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

const campoValorInput = document.getElementById("validationDefaultValue");

if (campoValorInput) {
    campoValorInput.addEventListener("input", function () {
        formatarMoedaInput(this);
    });
}

// ==========================================
// ADICIONAR E EDITAR PRODUTOS
// ==========================================

if (formulario) {

    formulario.addEventListener("submit", function(event) {

        event.preventDefault();

        const nome = capitalizarPrimeiraLetra(
            document.getElementById("validationDefault01").value
        );

        // 1. Limpa os pontos de milhar e troca a vírgula decimal por ponto para converter em Number
        const valorTexto = document.getElementById("validationDefaultValue").value;
        const valorLimpo = valorTexto.replace(/\./g, "").replace(",", ".");
        const preco = Number(valorLimpo);

        const quantidade = Number(
            document.getElementById("validationDefaultQuantity").value
        );

        // Validação
        if (
            !nome ||
            !Number.isFinite(preco) ||
            !Number.isFinite(quantidade) ||
            preco <= 0 ||
            quantidade <= 0
        ) {
            alert("Preencha os dados do produto corretamente!");
            return;
        }

        // EDITAR PRODUTO
        if (indiceEditando !== null) {
            const produto = carrinhoAtual.produtos[indiceEditando];

            produto.nomeproduto = nome;
            produto.preco = preco;
            produto.quantidade = quantidade;

            indiceEditando = null;
        }
        // ADICIONAR PRODUTO
        else {
            if (carrinhoAtual === null) {
                carrinhoAtual = new Carrinho("Meu Carrinho");
            }

            const produto = new Produto(nome, preco, quantidade);
            carrinhoAtual.adicionarProduto(produto);
        }

        atualizarListaProdutos();
        atualizarCarrinhoSalvo();
        persistirCarrinhoAtual();

        formulario.reset();

        if (dialog && dialog.open) {
            dialog.close();
        }

        console.log("Carrinho:", carrinhoAtual);
        console.log("Total:", carrinhoAtual.calcularTotal());
    });

}

// ==========================================
// SALVAR CARRINHO
// ==========================================

if (formularioSalvar) {

    formularioSalvar.addEventListener("submit", function(event) {

        event.preventDefault();

        if (!carrinhoAtual || carrinhoAtual.produtos.length === 0) {
            alert("Adicione pelo menos um produto ao carrinho!");
            return;
        }

        const campoNome = document.getElementById("nomecarrinho");

        if (!campoNome) {
            console.error("Campo nomecarrinho não encontrado!");
            return;
        }

        const novoNome = capitalizarPrimeiraLetra(campoNome.value);

        if (!novoNome) {
            alert("Digite um nome para o carrinho!");
            return;
        }

        const usuarioLogado = obterUsuarioLogado();

        if (!usuarioLogado) {
            alert("Nenhum usuário está logado!");
            return;
        }

        carrinhoAtual.nomecarrinho = novoNome;

        const dbusuario = new UsuariosDB();

        const salvo = dbusuario.salvarCarrinho(
            usuarioLogado.usuario,
            carrinhoAtual
        );

        if (salvo) {
            atualizarHistorico();
            carrinhoAtual = new Carrinho("Meu Carrinho");
            indiceEditando = null;
            sessionStorage.removeItem(CHAVE_CARRINHO_HISTORICO);
            persistirCarrinhoAtual();
            atualizarListaProdutos();
            atualizarBotaoCancelarCarrinho();

            alert("Carrinho salvo com sucesso!");

            formularioSalvar.reset();

            if (dialogSalvar && dialogSalvar.open) {
                dialogSalvar.close();
            }

            window.location.hash = "historico";

        } else {
            alert("Não foi possível salvar o carrinho.");
        }

    });

}


// ==========================================
// REMOVER PRODUTOS
// ==========================================

if (listaProdutos) {

    listaProdutos.addEventListener("click", function(event) {

        const botao = event.target.closest(".remover-produto");

        if (!botao || !carrinhoAtual) return;

        const card = botao.closest(".card");

        const cards = Array.from(
            listaProdutos.querySelectorAll(".card")
        );

        const indice = cards.indexOf(card);

        if (indice === -1) return;

        carrinhoAtual.removerProduto(indice);

        atualizarListaProdutos();
        atualizarCarrinhoSalvo();
        persistirCarrinhoAtual();

        console.log("Total atualizado:", carrinhoAtual.calcularTotal());

    });


    // ==========================================
    // EDITAR PRODUTOS
    // ==========================================

    listaProdutos.addEventListener("click", function(event) {

        const botao = event.target.closest(".editar-produto");

        if (!botao || !carrinhoAtual) return;

        const card = botao.closest(".card");

        const cards = Array.from(
            listaProdutos.querySelectorAll(".card")
        );

        const indice = cards.indexOf(card);

        if (indice === -1) return;

        const produto = carrinhoAtual.produtos[indice];

        indiceEditando = indice;

        document.getElementById("validationDefault01").value =
            produto.nomeproduto;

        const campoValorEdit = document.getElementById("validationDefaultValue");
        if (campoValorEdit) {
            // Preenche o valor e aplica a máscara para exibir formatado (ex: "5.50" vira "5,50")
            campoValorEdit.value = Number(produto.preco).toFixed(2).replace(".", ",");
            formatarMoedaInput(campoValorEdit);
        }

        document.getElementById("validationDefaultQuantity").value =
            produto.quantidade;

        if (dialog && !dialog.open) {
            dialog.showModal();
        }

    });

}


// ==========================================
// RECUPERAR HISTÓRICO DO USUÁRIO
// ==========================================

function obterHistoricoUsuario() {
    const usuarioLogado = obterUsuarioLogado();

    if (!usuarioLogado) {
        return [];
    }

    const dbusuario = new UsuariosDB();

    return dbusuario.obterCarrinhos(usuarioLogado.usuario);
}

function atualizarHistorico() {
    const listaHistorico = document.querySelector(".history-card-list");
    if (!listaHistorico) return;

    listaHistorico.replaceChildren();

    const carrinhosOrdenados = obterHistoricoUsuario()
        .slice()
        .sort((primeiro, segundo) => {
            const primeiroTimestamp = Number(primeiro.timestamp || 0);
            const segundoTimestamp = Number(segundo.timestamp || 0);

            if (primeiroTimestamp && segundoTimestamp) {
                return segundoTimestamp - primeiroTimestamp;
            }

            return Number(segundo.id || 0) - Number(primeiro.id || 0);
        });

    if (carrinhosOrdenados.length === 0) {
        const estadoVazio = document.createElement("div");
        estadoVazio.className = "empty-state historico-empty-state";
        estadoVazio.textContent = "Histórico vazio, finalize um carrinho";
        listaHistorico.appendChild(estadoVazio);
        return;
    }

    carrinhosOrdenados.forEach(carrinho => {
        const novoHistorico = document.createElement("div");
        novoHistorico.className = "card mb-3";

        const quantidadeProdutos = carrinho.produtos.reduce(
            (total, produto) => total + Number(produto.quantidade || 0),
            0
        );

        novoHistorico.innerHTML = `
            <div class="card-body">
                <button type="button" class="btn-solid theme-danger excluir-carrinho" data-historico-id="${carrinho.id}" aria-label="Excluir">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="menu-item-icon" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
                    </svg>
                </button>
                <h4 class="card-title nome-carrinho"></h4>
                <p class="card-text quantidade-produtos"></p>
                <p class="card-text valor-total"></p>
                <p class="card-text data-carrinho"></p>
                <button type="button" class="btn-solid theme-primary history-card-action" data-historico-id="${carrinho.id}">
                    Acessar carrinho
                </button>
            </div>`;

        novoHistorico.querySelector(".nome-carrinho").textContent = carrinho.nomecarrinho;
        novoHistorico.querySelector(".quantidade-produtos").textContent =
            `Quantidade de produtos: ${quantidadeProdutos}`;
        novoHistorico.querySelector(".valor-total").textContent =
            `Valor total: R$${Number(carrinho.total || 0).toFixed(2)}`;
        novoHistorico.querySelector(".data-carrinho").textContent =
            `Data: ${carrinho.dataHora || ""}`;

        listaHistorico.appendChild(novoHistorico);
    });

    filtrarHistorico();
}

const listaHistorico = document.querySelector(".history-card-list");

if (listaHistorico) {
    listaHistorico.addEventListener("click", event => {
        const botaoExcluir = event.target.closest(".excluir-carrinho");

        if (botaoExcluir) {
            const usuarioLogado = obterUsuarioLogado();
            if (!usuarioLogado) return;

            const id = Number(botaoExcluir.dataset.historicoId);
            if (!window.confirm("Deseja excluir este carrinho?")) return;

            const dbusuario = new UsuariosDB();
            if (dbusuario.excluirCarrinho(usuarioLogado.usuario, id)) {
                atualizarHistorico();
            } else {
                alert("Não foi possível excluir o carrinho.");
            }
            return;
        }

        const botao = event.target.closest(".history-card-action");
        if (!botao) return;

        const id = Number(botao.dataset.historicoId);
        const carrinhos = obterHistoricoUsuario();
        const carrinhoSalvo = carrinhos.find(carrinho => Number(carrinho.id) === id);
        if (!carrinhoSalvo) return;

        carrinhoAtual = new Carrinho(carrinhoSalvo.nomecarrinho);
        carrinhoAtual.idHistorico = carrinhoSalvo.id;

        carrinhoSalvo.produtos.forEach(produto => {
            carrinhoAtual.adicionarProduto(new Produto(
                produto.nomeproduto,
                produto.preco,
                produto.quantidade
            ));
        });

        indiceEditando = null;
        persistirCarrinhoAtual();
        atualizarListaProdutos();

        const campoNome = document.getElementById("nomecarrinho");
        if (campoNome) {
            campoNome.value = carrinhoAtual.nomecarrinho;
        }

        sessionStorage.setItem(CHAVE_CARRINHO_HISTORICO, "true");
        atualizarBotaoCancelarCarrinho();
        window.location.hash = "carrinho";
    });
}

function atualizarBotaoCancelarCarrinho() {
    const botaoCancelar = document.querySelector(".cancelar-acesso-carrinho");
    if (!botaoCancelar) return;

    botaoCancelar.hidden =
        sessionStorage.getItem(CHAVE_CARRINHO_HISTORICO) !== "true";

    const botaoFinalizar = document.getElementById("botao-resumo-carrinho");
    if (botaoFinalizar) {
        const modoEdicaoHistorico =
            sessionStorage.getItem(CHAVE_CARRINHO_HISTORICO) === "true";
        botaoFinalizar.textContent =
            modoEdicaoHistorico ? "Salvar" : "Finalizar Carrinho";
    }
}

const botaoCancelarCarrinho = document.querySelector(".cancelar-acesso-carrinho");

if (botaoCancelarCarrinho) {
    botaoCancelarCarrinho.addEventListener("click", () => {
        carrinhoAtual = new Carrinho("Meu Carrinho");
        indiceEditando = null;
        sessionStorage.removeItem(CHAVE_CARRINHO_HISTORICO);
        sessionStorage.removeItem(CHAVE_CARRINHO_ATUAL);
        atualizarListaProdutos();
        atualizarBotaoCancelarCarrinho();

        const campoNome = document.getElementById("nomecarrinho");
        if (campoNome) campoNome.value = "";

        window.location.hash = "historico";
    });
}

atualizarBotaoCancelarCarrinho();

// FRONT-END / CARRINHO

function adicionarCardProduto(nomeproduto, quantidade, preco, subtotal, indice) {
    const listaProdutos = document.querySelector('.product-list');

    const novoCard = document.createElement('div');
    novoCard.className = 'card';

    novoCard.innerHTML = `
        <div class="card-body">
            <h4 class="card-title titulo-produto"></h4>
            <p class="card-text qtd-produto"></p>
            <p class="card-text valor-produto"></p>
            <p class="card-subtitle fg-3 subtotal-produto"></p>

            <button class="btn-solid theme-secondary" type="button" data-bs-toggle="menu" aria-expanded="false">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots" viewBox="0 0 16 16">
                    <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"/>
                </svg>
            </button>
            <div class="menu menu-translucent">
                <button class="menu-item editar-produto" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
                        <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                        <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
                    </svg>
                    Editar
                </button>
                <hr class="menu-divider">
                <button class="menu-item theme-danger remover-produto" type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="menu-item-icon" viewBox="0 0 16 16">
                        <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5"/>
                    </svg>
                    Remover
                </button>
            </div>
        </div>
    `;

    novoCard.querySelector(".titulo-produto").textContent = nomeproduto;
    novoCard.querySelector(".qtd-produto").textContent = `Quantidade: ${quantidade}`;
    novoCard.querySelector(".valor-produto").textContent = `Valor: R$${Number(preco).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    novoCard.querySelector(".subtotal-produto").textContent = `Subtotal: R$${Number(subtotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

    listaProdutos.appendChild(novoCard);

    const listaResumo = document.querySelector('.lista-resumo');

    const novoResumo = document.createElement('div');
    novoResumo.className = 'card-resumo';
    novoResumo.innerHTML = '<p class="card-text produto-resumo-nome"></p><p class="card-text produto-resumo-subtotal"></p>';
    novoResumo.querySelector(".produto-resumo-nome").textContent = nomeproduto;
    novoResumo.querySelector(".produto-resumo-subtotal").textContent =
        `Subtotal: ${Number(subtotal).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })}`;

    if (listaResumo) {
        listaResumo.appendChild(novoResumo);
    }
}

const sections = Array.from(document.querySelectorAll("section[id]"));
const navLinks = Array.from(document.querySelectorAll(".navbar .nav-link"));
const productList = document.querySelector("#carrinho .product-list");

if (productList) {
    let scrollTimeout;

    productList.addEventListener("scroll", () => {
        productList.classList.add("is-scrolling");
        window.clearTimeout(scrollTimeout);
        scrollTimeout = window.setTimeout(() => {
            productList.classList.remove("is-scrolling");
        }, 700);
    }, { passive: true });
}

document.addEventListener("click", event => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        return;
    }

    const target = event.target;
    if (!(target instanceof Element)
        || !target.closest('[data-bs-toggle="menu"]')) {
        return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
}, true);

function updateActiveSection() {
    const requestedId = window.location.hash.slice(1) || "carrinho";
    const activeSection = sections.find(section => section.id === requestedId)
        || sections.find(section => section.id === "carrinho");

    if (!activeSection) {
        return;
    }

    sections.forEach(section => {
        section.hidden = section !== activeSection;
    });

    navLinks.forEach(link => {
        const isActive = link.hash === `#${activeSection.id}`;
        link.classList.toggle("active", isActive);

        if (isActive) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

window.addEventListener("hashchange", updateActiveSection);
updateActiveSection();
atualizarHistorico();

function restaurarCarrinhoAtual() {
    try {
        const dados = sessionStorage.getItem(CHAVE_CARRINHO_ATUAL);
        if (!dados) return;

        const salvo = JSON.parse(dados);
        if (!salvo || !Array.isArray(salvo.produtos)) return;

        carrinhoAtual = new Carrinho(
            typeof salvo.nomecarrinho === "string" ? salvo.nomecarrinho : "Meu Carrinho"
        );
        carrinhoAtual.idHistorico = salvo.idHistorico;
        salvo.produtos.forEach(produto => {
            carrinhoAtual.adicionarProduto(new Produto(
                produto.nomeproduto,
                produto.preco,
                produto.quantidade
            ));
        });
        atualizarListaProdutos();
    } catch (erro) {
        console.error("Não foi possível restaurar o carrinho atual:", erro);
        sessionStorage.removeItem(CHAVE_CARRINHO_ATUAL);
    }
}

restaurarCarrinhoAtual();

// ==========================================
// FILTRO DE PESQUISA EM TEMPO REAL
// ==========================================

function normalizarTexto(texto) {
    return (texto || "")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function gerenciarEstadoVazioBusca(container, temItensOriginais, temResultados, mensagem) {
    let avisoBusca = container.querySelector(".busca-empty-state");

    if (!temItensOriginais || temResultados) {
        if (avisoBusca) avisoBusca.remove();
        return;
    }

    if (!avisoBusca) {
        avisoBusca = document.createElement("div");
        avisoBusca.className = "empty-state busca-empty-state";
        avisoBusca.textContent = mensagem;
        container.appendChild(avisoBusca);
    }
}

function filtrarProdutosCarrinho() {
    const inputBuscaCarrinho = document.querySelector('#carrinho form[role="search"] input[type="search"]');
    const containerProdutos = document.querySelector("#carrinho .product-list");
    if (!inputBuscaCarrinho || !containerProdutos) return;

    const termo = normalizarTexto(inputBuscaCarrinho.value);
    const cards = Array.from(containerProdutos.querySelectorAll(".card"));
    let visiveis = 0;

    cards.forEach(card => {
        const titulo = normalizarTexto(card.querySelector(".titulo-produto")?.textContent);
        const corresponde = titulo.includes(termo);
        card.hidden = !corresponde;
        if (corresponde) visiveis++;
    });

    gerenciarEstadoVazioBusca(
        containerProdutos,
        cards.length > 0,
        visiveis > 0,
        "Nenhum produto encontrado para essa busca."
    );
}

function filtrarHistorico() {
    const inputBuscaHistorico = document.querySelector('#historico form[role="search"] input[type="search"]');
    const containerHistorico = document.querySelector("#historico .history-card-list");
    if (!inputBuscaHistorico || !containerHistorico) return;

    const termo = normalizarTexto(inputBuscaHistorico.value);
    const cards = Array.from(containerHistorico.querySelectorAll(".card"));
    let visiveis = 0;

    cards.forEach(card => {
        const nomeCarrinho = normalizarTexto(card.querySelector(".nome-carrinho")?.textContent);
        const dataCarrinho = normalizarTexto(card.querySelector(".data-carrinho")?.textContent);
        const corresponde = nomeCarrinho.includes(termo) || dataCarrinho.includes(termo);

        card.hidden = !corresponde;
        if (corresponde) visiveis++;
    });

    gerenciarEstadoVazioBusca(
        containerHistorico,
        cards.length > 0,
        visiveis > 0,
        "Nenhum carrinho encontrado no histórico."
    );
}

function configurarBarrasDePesquisa() {
    const formCarrinho = document.querySelector('#carrinho form[role="search"]');
    const inputCarrinho = formCarrinho?.querySelector('input[type="search"]');

    if (formCarrinho && inputCarrinho) {
        formCarrinho.addEventListener("submit", event => event.preventDefault());
        inputCarrinho.addEventListener("input", filtrarProdutosCarrinho);
    }

    const formHistorico = document.querySelector('#historico form[role="search"]');
    const inputHistorico = formHistorico?.querySelector('input[type="search"]');

    if (formHistorico && inputHistorico) {
        formHistorico.addEventListener("submit", event => event.preventDefault());
        inputHistorico.addEventListener("input", filtrarHistorico);
    }
}

configurarBarrasDePesquisa();

// ==========================================
// GERENCIAMENTO DA SEÇÃO DE PERFIL
// ==========================================

function carregarDadosPerfil() {
    const usuarioLogado = obterUsuarioLogado();
    if (!usuarioLogado) return;

    const db = new UsuariosDB();
    const usuarioCompleto = db.usuarios.find(u => u.usuario === usuarioLogado.usuario);
    if (!usuarioCompleto) return;

    const inputNome = document.getElementById("perfilName");
    const inputUsuario = document.getElementById("perfilUsername");
    const inputSenha = document.getElementById("perfilPassword");

    if (inputNome) inputNome.value = usuarioCompleto.nomeusuario || "";
    if (inputUsuario) inputUsuario.value = usuarioCompleto.usuario || "";
    if (inputSenha) inputSenha.value = ""; // Mantém o campo de senha limpo por segurança
}

const perfilForm = document.getElementById("perfilForm");

if (perfilForm) {
    perfilForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const usuarioLogado = obterUsuarioLogado();
        if (!usuarioLogado) {
            alert("Nenhum usuário logado!");
            return;
        }

        const novoNome = document.getElementById("perfilName").value.trim();
        const novoUsuario = document.getElementById("perfilUsername").value.trim();
        const novaSenha = document.getElementById("perfilPassword").value.trim();

        if (!novoNome || !novoUsuario) {
            alert("Nome e usuário são obrigatórios!");
            return;
        }

        const db = new UsuariosDB();
        const indiceUsuario = db.usuarios.findIndex(u => u.usuario === usuarioLogado.usuario);

        if (indiceUsuario === -1) {
            alert("Erro ao localizar usuário.");
            return;
        }

        // Se alterou o nome de usuário, verifica se já não existe outro igual
        if (novoUsuario !== usuarioLogado.usuario && db.usuarioExiste(novoUsuario)) {
            alert("Este nome de usuário já está em uso!");
            return;
        }

        const usuarioObj = db.usuarios[indiceUsuario];
        usuarioObj.nomeusuario = novoNome;
        usuarioObj.usuario = novoUsuario;

        if (novaSenha) {
            usuarioObj.senha = await hashSenhaAsync(novaSenha);
        }

        if (db.persistir()) {
            // Atualiza a sessão com os novos dados
            sessionStorage.setItem("usuarioLogado", JSON.stringify({
                nomeusuario: novoNome,
                usuario: novoUsuario
            }));

            alert("Perfil atualizado com sucesso!");
            document.getElementById("perfilPassword").value = "";
        } else {
            alert("Não foi possível salvar as alterações.");
        }
    });
}

// Hook para carregar os dados sempre que a seção de perfil for exibida ou a página carregar
window.addEventListener("hashchange", () => {
    if (window.location.hash === "#perfil") {
        carregarDadosPerfil();
    }
});

// Executa na carga inicial caso já abra direto no perfil
if (window.location.hash === "#perfil") {
    carregarDadosPerfil();
}

// ==========================================
// BOTÃO SAIR (LOGOUT) NA SEÇÃO DE PERFIL
// ==========================================

const botaoSairPerfil = document.getElementById("botaoSairPerfil");

if (botaoSairPerfil) {
    botaoSairPerfil.addEventListener("click", () => {
        if (confirm("Deseja realmente sair da sua conta?")) {
            sessionStorage.removeItem("usuarioLogado");
            sessionStorage.removeItem(CHAVE_CARRINHO_ATUAL);
            sessionStorage.removeItem("carrinhoAbertoHistorico");
            window.location.href = "indexlogin.html";
        }
    });
}