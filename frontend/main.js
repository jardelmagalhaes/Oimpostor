/* --- VARIÁVEIS GLOBAIS --- */
let totalJogadores = 0;
let cartasAbertas = 0;
let tempoDebate = 2;
let jogoFinalizado = false;

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
    const qtdInput = document.getElementById('qtd-jogadores').value;
    const tempoInput = document.getElementById('tempo-jogo').value;
    
    totalJogadores = parseInt(qtdInput);
    tempoDebate = parseInt(tempoInput);
    cartasAbertas = 0;

    try {
        const resposta = await fetch('http://localhost:3000/api/iniciar', {
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

/* --- FUNÇÃO 3: GERAR AS CARTAS --- */
function gerarCartasNaTela(quantidade) {
    document.getElementById('setup-jogo').style.display = 'none';
    document.getElementById('mesa-jogo').style.display = 'flex';
    document.getElementById('relogio-container').style.display = 'none';
    
    const status = document.getElementById('status-jogo');
    status.innerText = "Clique na sua carta secretamente!";
    status.style.color = "white";

    const grid = document.getElementById('grid-cartas');
    grid.style.display = 'flex';
    grid.innerHTML = '';

    for (let i = 1; i <= quantidade; i++) {
        let numImagem = i + 1; 
        if(numImagem > 10) numImagem = 2; 

        const html = `
            <figure id="carta-${i}" class="card" onclick="verificarPapel(${i})">
                <img src="imagens/${numImagem}.jpg" alt="Jogador ${i}">
                <figcaption>Jogador ${i}</figcaption>
            </figure>
        `;
        grid.innerHTML += html;
    }
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

    const resposta = await fetch(`http://localhost:3000/api/virar-carta/${idJogador}`);
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

/* --- NOVA FUNÇÃO: REVELAR QUEM ERA --- */
async function revelarImpostor() {
    try {
        const resposta = await fetch('http://localhost:3000/api/revelar');
        const dados = await resposta.json();

        const modal = document.getElementById('modal-secreto');
        const titulo = document.getElementById('titulo-revelacao');
        const palavra = document.getElementById('palavra-revelacao');
        const dica = document.getElementById('dica-revelacao');
        const img = document.getElementById('img-revelacao');

        modal.style.display = 'flex';
        
        titulo.innerText = "A VERDADE FOI REVELADA!";
        titulo.style.color = "#8a2be2"; // Roxo
        
        palavra.innerText = `JOGADOR ${dados.idImpostor}`;
        palavra.style.color = "red";
        
        dica.innerText = "ERA O IMPOSTOR!";

    } catch (erro) {
        console.error(erro);
    }
} // <--- ESSA CHAVE AQUI ESTAVA FALTANDO/NO LUGAR ERRADO!

/* --- VERIFICAÇÃO DE STATUS (Health Check) --- */
async function verificarStatusServidor() {
    console.log("Tentando conectar ao servidor..."); 

    try {
        const res = await fetch('http://localhost:3000/api/status');
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