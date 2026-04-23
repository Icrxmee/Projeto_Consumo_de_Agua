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
    const sql = `
        SELECT 
            i.imovel_id,
            i.endereco,
            i.valor,
            i.area,
            p.nome AS proprietario,
            t.descricao AS tipo
        FROM TbImovel i
        LEFT JOIN TbPessoas p ON i.proprietario_id = p.pessoa_id
        LEFT JOIN TbImovelTipo t ON i.imovel_tipo_id = t.imovel_tipo_id
    `

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Erro ao buscar imóveis:", err)
            return res.status(500).json({ erro: "Erro ao buscar imóveis" })
        }

        res.json(result)
    })
})

app.post("/imoveis", (req, res) => {
    const { endereco, valor, area, proprietario_id, imovel_tipo_id } = req.body

    if (!endereco || !valor || !area || !proprietario_id || !imovel_tipo_id) {
        return res.status(400).json({ erro: "Preencha todos os campos" })
    }

    const sql = `
        INSERT INTO TbImovel 
        (endereco, valor, area, proprietario_id, imovel_tipo_id)
        VALUES (?, ?, ?, ?, ?)
    `

    db.query(sql, [endereco, valor, area, proprietario_id, imovel_tipo_id], (err, result) => {
        if (err) {
            console.error("Erro ao cadastrar imóvel:", err)
            return res.status(500).json({ 
                erro: "Erro ao cadastrar imóvel",
                detalhe: err.message
            })
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

app.get("/medicoes", (req, res) => {
    const sql = `
        SELECT 
            m.medicao_id,
            m.leitura,
            m.datahora,
            i.endereco,
            p.nome AS proprietario,
            t.descricao AS tipo
        FROM TbMedicao m
        JOIN TbImovel i ON m.imovel_id = i.imovel_id
        JOIN TbPessoas p ON i.proprietario_id = p.pessoa_id
        JOIN TbImovelTipo t ON i.imovel_tipo_id = t.imovel_tipo_id
        ORDER BY m.datahora DESC
    `

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Erro ao buscar medições:", err)
            return res.status(500).json({ erro: "Erro ao buscar medições" })
        }

        res.json(result)
    })
})

app.post("/medicoes", (req, res) => {
    const { leitura, imovel_id } = req.body

    if (!leitura || !imovel_id) {
        return res.status(400).json({ erro: "Preencha todos os campos" })
    }

    const sql = `
        INSERT INTO TbMedicao (leitura, datahora, imovel_id)
        VALUES (?, NOW(), ?)
    `

    db.query(sql, [leitura, imovel_id], (err, result) => {
        if (err) {
            console.error("Erro ao cadastrar medição:", err)
            return res.status(500).json({
                erro: "Erro ao cadastrar medição",
                detalhe: err.message
            })
        }

        res.status(201).json({
            mensagem: "Medição cadastrada com sucesso",
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
            "SELECT usuario_id FROM TbUsuarios WHERE login = ?",
            [email]
        )

        if (usuarioExistente.length > 0) {
            return res.status(400).json({ erro: "Email já cadastrado" })
        }

        const senhaHash = await bcrypt.hash(senha, 10)

        const [result] = await db.promise().query(
            `INSERT INTO TbUsuarios 
            (nome, login, senha, atualizado_em) 
            VALUES (?, ?, ?, NOW())`,
            [nome, email, senhaHash]
        )

        res.status(201).json({
            mensagem: "Usuário cadastrado com sucesso",
            id: result.insertId
        })

    } catch (err) {
        console.error("ERRO REAL DO MYSQL:", err) 
        res.status(500).json({ 
            erro: "Erro ao cadastrar usuário",
            detalhe: err.message 
        })
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
            "SELECT * FROM TbUsuarios WHERE login = ?",
            [email] // email vira login
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
                email: usuario.login // retorna como email pro front
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