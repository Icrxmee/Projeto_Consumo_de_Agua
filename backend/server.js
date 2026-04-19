const express = require("express")
const cors = require("cors")
const bcrypt = require("bcrypt")
const db = require("./db")

const app = express()

// CONFIGURAÇÕES
app.use(cors({
  origin: "*"
}))

app.use(express.json())

// LOG DE ROTAS
app.use((req, res, next) => {
    console.log(`Rota acessada: ${req.method} ${req.url}`)
    next()
})

// TESTE API
app.get("/", (req, res) => {
    res.send("API de Consumo de Água Funcionando")
})

// ==================== IMÓVEIS ====================

app.get("/imoveis", (req, res) => {
    const sql = "SELECT * FROM imovel"

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Erro ao Buscar Imóveis:", err)
            return res.status(500).json({ erro: "Erro ao Buscar Imóveis" })
        }

        res.json(result)
    })
})

app.post("/imoveis", (req, res) => {
    const { nome, endereco } = req.body

    const sql = "INSERT INTO imovel (nome, endereco) VALUES (?, ?)"

    db.query(sql, [nome, endereco], (err, result) => {
        if (err) {
            console.error("Erro ao cadastrar imóvel:", err)
            return res.status(500).json({ erro: "Erro ao cadastrar imóvel" })
        }

        res.status(201).json({
            mensagem: "Imóvel cadastrado com sucesso",
            id: result.insertId
        })
    })
})

// ==================== MEDIDORES ====================

app.get("/medidores", (req, res) => {
    const sql = "SELECT * FROM medidor"

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Erro ao buscar medidores:", err)
            return res.status(500).json({ erro: "Erro ao buscar medidores" })
        }

        res.json(result)
    })
})

app.post("/medidores", (req, res) => {
    const { imovel_id, codigo, local_instalacao, data_instalacao } = req.body

    const sql = `
        INSERT INTO medidor (imovel_id, codigo, local_instalacao, data_instalacao)
        VALUES (?, ?, ?, ?)
    `

    db.query(sql, [imovel_id, codigo, local_instalacao, data_instalacao], (err, result) => {
        if (err) {
            console.error("Erro ao cadastrar medidor:", err)
            return res.status(500).json({ erro: "Erro ao cadastrar medidor" })
        }

        res.status(201).json({
            mensagem: "Medidor cadastrado com sucesso",
            id: result.insertId
        })
    })
})

// ==================== LEITURAS ====================

app.get("/leituras", (req, res) => {
    const sql = "SELECT * FROM leitura"

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Erro ao buscar leituras:", err)
            return res.status(500).json({ erro: "Erro ao buscar leituras" })
        }

        res.json(result)
    })
})

app.post("/leituras", (req, res) => {
    const { medidor_id, valor, data_leitura } = req.body

    const sql = "INSERT INTO leitura (medidor_id, valor, data_leitura) VALUES (?, ?, ?)"

    db.query(sql, [medidor_id, valor, data_leitura], (err, result) => {
        if (err) {
            console.error("Erro ao cadastrar leitura:", err)
            return res.status(500).json({
                erro: "Erro ao cadastrar leitura",
                detalhe: err.message
            })
        }

        res.status(201).json({
            mensagem: "Leitura cadastrada com sucesso",
            id: result.insertId
        })
    })
})

// ==================== CONSUMO (JOIN) ====================

app.get("/consumo", (req, res) => {
    const sql = `
        SELECT 
            i.nome AS imovel,
            m.codigo AS medidor,
            l.valor,
            l.data_leitura
        FROM leitura l
        JOIN medidor m ON l.medidor_id = m.medidor_id
        JOIN imovel i ON m.imovel_id = i.imovel_id
    `

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Erro ao buscar consumo:", err)
            return res.status(500).json({
                erro: "Erro ao buscar consumo",
                detalhe: err.message
            })
        }

        res.json(result)
    })
})

// ==================== USUÁRIOS ====================

// CADASTRO
app.post("/usuarios/cadastro", async (req, res) => {
    const { nome, email, senha } = req.body

    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: "Preencha todos os campos" })
    }

    try {
        const [usuarioExistente] = await db.promise().query(
            "SELECT * FROM usuario WHERE email = ?",
            [email]
        )

        if (usuarioExistente.length > 0) {
            return res.status(400).json({ erro: "Email já cadastrado" })
        }

        const senhaHash = await bcrypt.hash(senha, 10)

        const [result] = await db.promise().query(
            "INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)",
            [nome, email, senhaHash]
        )

        res.status(201).json({
            mensagem: "Usuário cadastrado com sucesso",
            id: result.insertId
        })

    } catch (err) {
        console.error("Erro ao cadastrar usuário:", err)
        res.status(500).json({ erro: "Erro ao cadastrar usuário" })
    }
})

// LOGIN
app.post("/usuarios/login", async (req, res) => {
    const { email, senha } = req.body

    if (!email || !senha) {
        return res.status(400).json({ erro: "Preencha todos os campos" })
    }

    try {
        const [usuarios] = await db.promise().query(
            "SELECT * FROM usuario WHERE email = ?",
            [email]
        )

        if (usuarios.length === 0) {
            return res.status(404).json({ erro: "Usuário não encontrado" })
        }

        const usuario = usuarios[0]

        const senhaValida = await bcrypt.compare(senha, usuario.senha)

        if (!senhaValida) {
            return res.status(401).json({ erro: "Senha inválida" })
        }

        res.json({
            mensagem: "Login realizado com sucesso",
            usuario: {
                id: usuario.usuario_id,
                nome: usuario.nome,
                email: usuario.email
            }
        })

    } catch (err) {
        console.error("Erro no login:", err)
        res.status(500).json({ erro: "Erro ao realizar login" })
    }
})

// ==================== SERVIDOR ====================

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`)
})


app.get("/test-db", async (req, res) => {
    try {
        const [rows] = await db.promise().query("SELECT 1 + 1 AS result");
        res.json(rows);
    } catch (err) {
        res.status(500).json(err);
    }
});