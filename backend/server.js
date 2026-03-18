const express = require("express")
const cors = require("cors")
const db = require("./db")

const app = express()

app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
    console.log(`Rota acessada: ${req.method} ${req.url}`)
    next()
})

app.get("/", (req, res) => {
    res.send("API de Consumo de Água Funcionando")
})

app.get("/imoveis", (req, res) => {
    console.log("Entrou na rota /imoveis")

    const sql = "SELECT * FROM imovel"

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Erro ao Buscar Imóveis:", err)
            res.status(500).json({ erro: "Erro ao Buscar Imóveis" })
            return
        }

        res.json(result)
    })
})

app.get("/medidores", (req, res) => {
    const sql = "SELECT * FROM medidor"

    db.query(sql,(err, result)=>{

        if(err){
            console.error("Erro ao Buscar Medidores", err)
            res.status(500).json({erro: "Erro ao Buscar Medidores"})
            return
       }

       res.json(result)
    })
})

app.get("/leituras", (req, res) => {
    const sql = "SELECT * FROM leitura"

    db.query(sql, (err, result) => {
        if (err) {
            console.error("Erro so Buscar Leituras:", err)
            res.status(500).json({erro:"Erro ao Buscar Leitura"})
            return
        }

        res.json(result)
    })
})

app.post("/imoveis", (req, res) => {
    const { nome, endereco} =req.body

    const sql = "INSERT INTO imovel (nome, endereco) VALUES (?, ?)"

    db.query(sql, [nome, endereco], (err, result) => {
        if (err) {
            console.error(err)
            res.status(500).json({erro: "Erro ao Cadastrar Imóvel"})
            return
        }

        res.status(201).json({
            mensagem: "Imóvel Cadastrado com Sucesso",
            id: result.insertId
        })
    })
})

app.post("/medidores", (req, res) => {
    const {imovel_id, codigo, local_instalacao, data_instalacao} = req.body

    const sql = ' INSERT INTO medidor (imovel_id, codigo, local_instalacao, data_instalacao) VALUES (?, ?, ?, ?)'

    db.query(sql, [imovel_id, codigo, local_instalacao, data_instalacao], (err,result) => {
        if (err) {
            console.error("Erro ao Cadastrar Medidor:", err)
            res.status(500).json({erro: "Erro ao Cadastrar Medidor"})
            return
        }

        res.status(201).json({
            mensagem: "Medidor Cadastrado com Sucesso",
            id: result.insertId
        })       
    })
})

app.post("/leituras", (req, res) => {
    const {medidor_id, valor, data_leitura} = req.body

    const sql = "INSERT INTO leitura (medidor_id, valor, data_leitura) VALUES (?, ?, ?)"

    db.query(sql, [medidor_id, valor, data_leitura], (err, result) => {
        if(err) {
            console.error("Erro ao Cadastrar Leitura:", err)
            res.status(500).json({
                erro:"Erro ao Cadastrar Leitura",
                detalhe: err.message
            })

            return
        }

        res.status(201).json({
            mensagem: "Leitura Cadastrada com Sucesso",
            id: result.insertId
        })
    })
})

app.get("/consumo", (req, res) => {
    const sql = `
        SELECT i.nome AS imovel, 
            m.codigo AS medidor, 
            l.valor, 
            l.data_leitura 
        FROM leitura l
        JOIN medidor m ON l.medidor_id = m.medidor_id
        JOIN imovel i ON m.imovel_id = i.imovel_id
    `
db.query(sql, (err, result) => {
    if (err) {
        console.error("Erro ao Buscar Consumo:", err)
        res.status(500).json({
            erro: "Erro ao Buscar Consumo",
            detalhe: err.message
        })

        return
    }

        res.json(result)
    
    })

})


app.listen(3000, () => {
    console.log("Servidor Rodando na Porta 3000")
})

