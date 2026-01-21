const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json()); // Permite receber dados do frontend

// DADOS DO JOGO
const dados = {
    temas: ['Alimentos', 'Animais', 'Objetos', 'Lugares'],
    palavras: {
        'Alimentos': ['Pizza', 'Lasanha', 'Sushi', 'Chocolate'],
        'Animais': ['Leão', 'Elefante', 'Cachorro', 'Pinguim'],
        'Objetos': ['Celular', 'Cadeira', 'Relógio', 'Garrafa'],
        'Lugares': ['Praia', 'Cinema', 'Escola', 'Hospital']
    }
};

// ESTADO DO JOGO (Memória da rodada atual)
let jogoAtual = {
    iniciado: false,
    impostorIndex: -1, 
    palavraSecreta: "",
    tema: ""
};

//  INICIAR NOVA PARTIDA
app.post('/api/iniciar', (req, res) => {
    const { numJogadores } = req.body; // Recebe quantos vão jogar
    
    // 1. Escolhe um tema e uma palavra aleatória
    const temasKeys = Object.keys(dados.palavras);
    const temaSorteado = temasKeys[Math.floor(Math.random() * temasKeys.length)];
    const listaPalavras = dados.palavras[temaSorteado];
    const palavraSorteada = listaPalavras[Math.floor(Math.random() * listaPalavras.length)];

    // 2. Define quem é o impostor (ex: se são 5 jogadores, sorteia entre 1 e 5)
    // O array começa em 1 para facilitar para você
    const impostor = Math.floor(Math.random() * numJogadores) + 1;

    // 3. Salva na memória do servidor
    jogoAtual = {
        iniciado: true,
        impostorIndex: impostor,
        palavraSecreta: palavraSorteada,
        tema: temaSorteado
    };

    console.log(`NOVO JOGO: Impostor é o ${impostor}, Palavra: ${palavraSorteada}`);
    
    res.json({ mensagem: "Jogo iniciado!", totalJogadores: numJogadores });
});

// REVELAR CARTA SECRETA
app.get('/api/virar-carta/:idJogador', (req, res) => {
    const idJogador = parseInt(req.params.idJogador);

    if (!jogoAtual.iniciado) {
        return res.json({ erro: "O jogo não começou!" });
    }

    if (idJogador === jogoAtual.impostorIndex) {
        // É O IMPOSTOR!
        res.json({
            papel: "impostor",
            imagem: "imagens/IMPOSTOR.png",
            texto: "VOCÊ É O IMPOSTOR!",
            dica: `Dica para fingir: O tema é ${jogoAtual.tema}`
        });
    } else {
        // É INOCENTE
        res.json({
            papel: "inocente",
            imagem: null, 
            texto: `A PALAVRA É: ${jogoAtual.palavraSecreta}`,
            dica: "Não deixe o impostor saber!"
        });
    }
});

/* Endpoint para revelar quem era o impostor */
app.get('/api/revelar', (req, res) => {
    if (!jogoAtual) {
        return res.json({ erro: "Jogo não iniciado" });
    }
    // O ID do jogador é o índice + 1 (ex: índice 0 = Jogador 1)
    res.json({ 
        idImpostor: jogoAtual.impostorIndex + 1,
        imagem: `imagens/${(jogoAtual.impostorIndex + 1) > 10 ? 2 : (jogoAtual.impostorIndex + 1) + 1}.jpg`
    });
});

/*  STATUS DO SISTEMA  */
app.get('/api/status', (req, res) => {
    res.json({
        status: "Online",
        versao: "1.0.0",
        mensagem: "Servidor operando normalmente"
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});