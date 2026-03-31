/* --- VARIÁVEIS GLOBAIS --- */
let totalJogadores = 0;
let cartasAbertas = 0;
let tempoDebate = 2;
let jogoFinalizado = false;
let nomesJogadores = {};

/* --- FUNÇÃO 1: BOTÕES DE + E - (NOVA) --- */
function alterarValor(idInput, valor) {
    const input = document.getElementById(idInput);
    
    // Converte o texto para número e soma (ou subtrai)
    let novoValor = parseInt(input.value) + valor;
    
    // Pega os limites do HTML (min e max)
    const min = parseInt(input.min);
    const max = parseInt(input.max);

    // Só aplica se estiver dentro do limite
    if (novoValor >= min && novoValor <= max) {
        input.value = novoValor;
    }
}

/* --- FUNÇÃO 2: INICIAR O JOGO --- */
async function iniciarJogo() {

    jogoFinalizado = false;
    nomesJogadores = {};
    const qtdInput = document.getElementById('qtd-jogadores').value;
    const tempoInput = document.getElementById('tempo-jogo').value;
    
    totalJogadores = parseInt(qtdInput);
    tempoDebate = parseInt(tempoInput);
    cartasAbertas = 0;

    try {
        const resposta = await fetch('https://oimpostor-g5fh.onrender.com/api/iniciar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numJogadores: totalJogadores })
        });
        
        if (resposta.ok) {
            gerarCartasNaTela(totalJogadores);
        }
    } catch (erro) {
        console.error("Erro ao iniciar:", erro);
        alert("Erro: O servidor está desligado! Abra o terminal e digite 'node server.js'");
    }
}

/* --- VARIÁVEL GLOBAL PARA SABER QUAL CARTA ESTÁ SENDO EDITADA --- */
let cartaAtualId = null;

/* --- FUNÇÃO 3: GERAR AS CARTAS (ATUALIZADA) --- */
function gerarCartasNaTela(quantidade) {
    document.getElementById('setup-jogo').style.display = 'none';
    document.getElementById('mesa-jogo').style.display = 'flex';
    document.getElementById('relogio-container').style.display = 'none';
    
    const status = document.getElementById('status-jogo');
    status.innerText = "Clique na sua carta para ver o segredo!";

    const grid = document.getElementById('grid-cartas');
    grid.style.display = 'flex';
    grid.innerHTML = '';

    for (let i = 1; i <= quantidade; i++) {
        let numImagem = i + 1; 
        if(numImagem > 10) numImagem = 2; 

        /* MUDANÇAS AQUI:
           1. Adicionamos id="legenda-jogador-${i}" no figcaption para poder mudar o texto depois.
           2. Mudamos o onclick para "abrirModalNome(${i})" em vez de verificarPapel direto.
        */
        const html = `
            <figure id="carta-${i}" class="card" onclick="abrirModalNome(${i})">
                <img src="imagens/${numImagem}.jpg" alt="Jogador ${i}">
                <figcaption id="legenda-jogador-${i}">Jogador ${i}</figcaption>
            </figure>
        `;
        grid.innerHTML += html;
    }
}

/* --- FUNÇÃO: ABRIR O MODAL DE NOME --- */
function abrirModalNome(idJogador) {
    // Guarda qual carta foi clicada para usarmos depois
    cartaAtualId = idJogador;
    
    // Limpa o input para não vir com nome antigo
    document.getElementById('input-nome-jogador').value = '';
    
    // Mostra a janelinha de digitar nome
    document.getElementById('modal-nome').style.display = 'flex';
    
    // Já coloca o cursor no campo de texto para facilitar (Opcional)
    document.getElementById('input-nome-jogador').focus();
}

/* --- FUNÇÃO: CONFIRMAR NOME E REVELAR --- */
function confirmarNome() {
    const input = document.getElementById('input-nome-jogador');
    const novoNome = input.value.trim();

    if (novoNome === "") {
        alert("Por favor, digite um nome!");
        return;
    }

    // 1. Salva o nome na memória do navegador
    nomesJogadores[cartaAtualId] = novoNome; // <--- O PULO DO GATO ESTÁ AQUI!

    // 2. Fecha o modal
    document.getElementById('modal-nome').style.display = 'none';

    // 3. Atualiza o visual da carta
    const legenda = document.getElementById(`legenda-jogador-${cartaAtualId}`);
    if (legenda) {
        legenda.innerText = novoNome;
        legenda.style.color = "#00ff00";
        legenda.style.fontWeight = "bold";
    }

    // 4. Revela o papel
    verificarPapel(cartaAtualId);
}

/* --- FUNÇÃO 4: VERIFICAR PAPEL --- */
async function verificarPapel(idJogador) {
    const cartaClicada = document.getElementById(`carta-${idJogador}`);
    if (cartaClicada) {
        cartaClicada.style.display = 'none'; 
        cartasAbertas++;
    }

    const modal = document.getElementById('modal-secreto');
    const titulo = document.getElementById('titulo-revelacao');
    const palavra = document.getElementById('palavra-revelacao');
    const dica = document.getElementById('dica-revelacao');
    const img = document.getElementById('img-revelacao');

    modal.style.display = 'flex'; 
    titulo.innerText = "Consultando...";
    palavra.innerText = "???";
    img.style.display = 'none';

    const resposta = await fetch(`https://oimpostor-g5fh.onrender.com/api/virar-carta/${idJogador}`);
    const dados = await resposta.json();

    if (dados.papel === 'impostor') {
        titulo.innerText = "SHHH! SILÊNCIO!";
        palavra.innerText = "VOCÊ É O IMPOSTOR";
        palavra.style.color = "red";
        dica.innerText = dados.dica;
        img.src = dados.imagem; 
        img.style.display = 'block';
    } else {
        titulo.innerText = "VOCÊ É INOCENTE";
        palavra.innerText = dados.texto; 
        palavra.style.color = "#00ff00";
        dica.innerText = dados.dica;
        img.style.display = 'none';
    }
}

/* --- FUNÇÃO 5: FECHAR MODAL --- */
function fecharModal() {
    document.getElementById('modal-secreto').style.display = 'none';

    if (cartasAbertas >= totalJogadores && !jogoFinalizado) {
        iniciarCronometro();
    }
}

/* --- ATUALIZAÇÃO NO CRONÔMETRO --- */
function iniciarCronometro() {
    const grid = document.getElementById('grid-cartas');
    const relogioContainer = document.getElementById('relogio-container');
    const status = document.getElementById('status-jogo');
    const display = document.getElementById('timer-display');
    const botoesFinal = document.getElementById('botoes-final'); // Pegamos a div nova

    grid.style.display = 'none'; 
    relogioContainer.style.display = 'block'; 
    botoesFinal.style.display = 'none'; // Garante que começa escondido
    
    status.innerText = "HORA DO DEBATE!";
    status.style.color = "#00ff00"; 

    let tempoRestante = tempoDebate * 60;
    
    // Reseta cor verde
    display.style.color = "#00ff00";
    display.style.borderColor = "#00ff00";
    display.style.textShadow = "0 0 20px #00ff00";

    const intervalo = setInterval(() => {
        const minutos = Math.floor(tempoRestante / 60);
        const segundos = tempoRestante % 60;
        
        display.innerText = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

        if (tempoRestante <= 10) {
            display.style.color = "red";
            display.style.borderColor = "red";
            display.style.textShadow = "0 0 30px red";
        }

        /* --- QUANDO O TEMPO ACABA --- */
        if (tempoRestante <= 0) {
            clearInterval(intervalo);
            display.innerText = "VOTEM!";
            
            jogoFinalizado = true;
            // Mostra o botão de revelar
            botoesFinal.style.display = 'block'; 
            
            // Toca um som ou alerta (opcional)
            // alert("O TEMPO ACABOU! Quem é o impostor?");
        }
        
        tempoRestante--;
    }, 1000);
}

/* --- NOVA FUNÇÃO: REVELAR QUEM ERA (CORRIGIDA E BLINDADA) --- */
async function revelarImpostor() {
    try {
        const resposta = await fetch('https://oimpostor-g5fh.onrender.com/api/revelar');
        const dados = await resposta.json();

        const modal = document.getElementById('modal-secreto');
        const titulo = document.getElementById('titulo-revelacao');
        const palavra = document.getElementById('palavra-revelacao');
        const dica = document.getElementById('dica-revelacao');

        modal.style.display = 'flex';
        titulo.innerText = "A VERDADE FOI REVELADA!";
        titulo.style.color = "#8a2be2"; 

        // --- CORREÇÃO AQUI ---
        // 1. Forçamos o ID do servidor a virar texto (String) para evitar erro de tipo
        const idImpostor = String(dados.idImpostor);
        
        // 2. Procuramos na lista. Se não achar, usa o padrão.
        const nomeEncontrado = nomesJogadores[idImpostor];
        
        // 3. Debug para você ver no F12 se o nome estava salvo
        console.log("ID do Impostor (Servidor):", idImpostor);
        console.log("Lista de Nomes Salvos:", nomesJogadores);
        console.log("Nome achado na lista:", nomeEncontrado);

        // Se 'nomeEncontrado' existir, usa ele. Se não, usa "JOGADOR X"
        const textoFinal = nomeEncontrado || `JOGADOR ${idImpostor}`;
        
        palavra.innerText = textoFinal.toUpperCase(); 
        // ---------------------

        palavra.style.color = "red";
        dica.innerText = "ERA O IMPOSTOR!";

    } catch (erro) {
        console.error("Erro ao revelar:", erro);
    }
}

/* --- VERIFICAÇÃO DE STATUS (Health Check) --- */
async function verificarStatusServidor() {
    console.log("Tentando conectar ao servidor..."); 

    try {
        const res = await fetch('https://oimpostor-g5fh.onrender.com/api/status');
        const dados = await res.json();
        console.log("Dados recebidos:", dados); 

        const footer = document.querySelector('footer p');
        if (footer) {
            // Adiciona o status visualmente
            footer.innerHTML += ` | <span style="color: #00ff00;">● Sistema ${dados.status} v${dados.versao}</span>`;
        }
    } catch (erro) {
        console.error("ERRO DE CONEXÃO:", erro);
    }
}

// Executa ao carregar
document.addEventListener('DOMContentLoaded', verificarStatusServidor);