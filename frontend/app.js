document.addEventListener("DOMContentLoaded", function () {

  const API_BASE = "https://api-consumo-agua.onrender.com";

  // =========================
  // LOGIN
  // =========================
  const formLogin = document.getElementById("form-login");

  if (formLogin) {
    formLogin.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("login-email").value.trim();
      const senha = document.getElementById("login-senha").value;

      if (!email || !senha) {
        alert("Preencha email e senha.");
        return;
      }

      try {
        const res = await fetch(API_BASE + "/usuarios/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          alert(data.erro || "Erro ao fazer login.");
          return;
        }

        sessionStorage.setItem("usuario", JSON.stringify(data.usuario));

        window.location.href = "dashboard.html";

      } catch (err) {
        alert("Erro ao conectar com o servidor.");
      }
    });
  }

  // =========================
  // CADASTRO
  // =========================
  const formCadastro = document.getElementById("form-cadastro");

  if (formCadastro) {
    formCadastro.addEventListener("submit", async function (e) {
      e.preventDefault();

      const nome = document.getElementById("cadastro-nome").value.trim();
      const email = document.getElementById("cadastro-email").value.trim();
      const senha = document.getElementById("cadastro-senha").value;

      const msg = document.getElementById("cadastro-mensagem");

      if (!nome || !email || !senha) {
        msg.textContent = "Preencha todos os campos.";
        msg.className = "form-acesso__mensagem erro";
        return;
      }

      try {
        const res = await fetch(API_BASE + "/usuarios/cadastro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, email, senha }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          msg.textContent = data.erro || "Erro ao cadastrar.";
          msg.className = "form-acesso__mensagem erro";
          return;
        }

        msg.textContent = "Cadastro realizado com sucesso!";
        msg.className = "form-acesso__mensagem sucesso";

        formCadastro.reset();

        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);

      } catch (err) {
        msg.textContent = "Erro ao conectar com o servidor.";
        msg.className = "form-acesso__mensagem erro";
      }
    });
  }

  // ================= DASHBOARD =================

  const usuarioSalvo = sessionStorage.getItem("usuario");

  if (window.location.pathname.includes("dashboard.html")) {

    if (!usuarioSalvo) {
      alert("Você precisa estar logado.");
      window.location.href = "login.html";
      return;
    }

    const usuario = JSON.parse(usuarioSalvo);
    const nomeCompleto = (usuario.nome || "").trim();
    const primeiroNome = nomeCompleto ? nomeCompleto.split(/\s+/)[0] : "Usuário";

    const nomeSpan = document.getElementById("usuario-nome");
    if (nomeSpan) nomeSpan.textContent = nomeCompleto || "Usuário";

    const nomeTopo = document.getElementById("usuario-primeiro-nome");
    if (nomeTopo) nomeTopo.textContent = primeiroNome;

    


    // MENU USUÁRIO
    const btnMenuUsuario = document.getElementById("usuario-menu-btn");
    const menuDropdown = document.getElementById("usuario-menu-dropdown");

    if (btnMenuUsuario && menuDropdown) {
      btnMenuUsuario.addEventListener("click", (e) => {
        e.stopPropagation();
        const aberto = !menuDropdown.hidden;
        menuDropdown.hidden = aberto;
        btnMenuUsuario.setAttribute("aria-expanded", String(!aberto));
      });

      document.addEventListener("click", (e) => {
        if (!menuDropdown.contains(e.target) && !btnMenuUsuario.contains(e.target)) {
          menuDropdown.hidden = true;
          btnMenuUsuario.setAttribute("aria-expanded", "false");
        }
      });
    }

    // LOGOUT
    const btnLogout = document.getElementById("logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        sessionStorage.removeItem("usuario");
        window.location.href = "login.html";
      });
    }

    // ================= MEDIÇÕES =================

    async function carregarMedicoes() {
      const tabela = document.getElementById("tabela-medicoes");
      if (!tabela) return;

      try {
        const res = await fetch(API_BASE + "/medicoes");
        const dados = await res.json();

        tabela.innerHTML = "";

        dados.forEach(m => {
          const tr = document.createElement("tr");

          tr.innerHTML = `
            <td>${m.medicao_id}</td>
            <td>${m.leitura}</td>
            <td>${m.endereco}</td>
            <td>${new Date(m.datahora).toLocaleDateString()}</td>
            <td>
              <button onclick="editar(${m.medicao_id}, ${m.leitura})">Editar</button>
              <button onclick="excluir(${m.medicao_id})">Excluir</button>
            </td>
          `;

          tabela.appendChild(tr);
        });

      } catch (err) {
        console.error("Erro ao carregar medições", err);
      }
    }

    // DISPONIBILIZA GLOBAL (pro botão funcionar)
    window.excluir = async function (id) {
      const tabela = document.getElementById("tabela-medicoes");
      if (!tabela) return;

      if (!confirm("Deseja realmente excluir?")) return;

      await fetch(API_BASE + "/medicoes/" + id, {
        method: "DELETE"
      });

      alert("Excluído com sucesso!");
      carregarMedicoes();
    }

    window.editar = async function (id, leituraAtual) {
      const tabela = document.getElementById("tabela-medicoes");
      if (!tabela) return;

      const novaLeitura = prompt("Nova leitura:", leituraAtual);

      if (!novaLeitura) return;

      await fetch(API_BASE + "/medicoes/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leitura: Number(novaLeitura),
          imovel_id: 1 // temporário
        })
      });

      alert("Atualizado com sucesso!");
      carregarMedicoes();
    }

    // FORMULÁRIO
    const formMedicao = document.getElementById("form-medicao");

    if (formMedicao) {
      formMedicao.addEventListener("submit", async (e) => {
        e.preventDefault();

        const leitura = document.getElementById("leitura").value;
        const imovel_id = document.getElementById("imovel_id").value;

        if (!leitura || !imovel_id) {
          alert("Preencha todos os campos!");
          return;
        }

        try {
          const res = await fetch(API_BASE + "/medicoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              leitura: Number(leitura),
              imovel_id: Number(imovel_id)
            })
          });

          const data = await res.json();

          if (!res.ok) {
            alert(data.erro || "Erro ao cadastrar");
            return;
          }

          alert("Medição cadastrada com sucesso!");
          formMedicao.reset();
          carregarMedicoes();

        } catch (err) {
          alert("Erro ao conectar com a API");
        }
      });
    }

    // CHAMA AQUI (CORRETO AGORA)
    carregarMedicoes();

    // ================= USUÁRIOS (CRUD) =================

    const tabelaUsuarios = document.getElementById("tabela-usuarios");
    const formUsuario = document.getElementById("form-usuario");

    if (tabelaUsuarios && formUsuario) {
      const inputId = document.getElementById("usuario-id");
      const inputNome = document.getElementById("usuario-nome-input");
      const inputEmail = document.getElementById("usuario-email-input");
      const inputSenha = document.getElementById("usuario-senha-input");
      const mensagem = document.getElementById("usuario-mensagem");
      const btnCancelar = document.getElementById("cancelar-edicao");

      function setMensagem(texto, tipo) {
        if (!mensagem) return;
        mensagem.textContent = texto || "";
        mensagem.className = "form-acesso__mensagem";
        if (tipo) mensagem.classList.add(tipo);
      }

      function limparFormularioUsuario() {
        inputId.value = "";
        inputNome.value = "";
        inputEmail.value = "";
        inputSenha.value = "";
      }

      async function carregarUsuarios() {
        try {
          const res = await fetch(API_BASE + "/usuarios");
          const usuarios = await res.json().catch(() => []);

          if (!res.ok) {
            setMensagem("Erro ao listar usuários.", "erro");
            return;
          }

          tabelaUsuarios.innerHTML = "";

          usuarios.forEach((u) => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
              <td>${u.usuario_id}</td>
              <td>${u.nome}</td>
              <td>${u.email}</td>
              <td>
                <button class="btn-principal" data-editar-id="${u.usuario_id}">Editar</button>
                <button class="btn-principal" data-excluir-id="${u.usuario_id}">Excluir</button>
              </td>
            `;

            tabelaUsuarios.appendChild(tr);
          });
        } catch (err) {
          setMensagem("Erro ao conectar com a API.", "erro");
        }
      }

      tabelaUsuarios.addEventListener("click", async (e) => {
        const botao = e.target.closest("button");
        if (!botao) return;

        const editarId = botao.getAttribute("data-editar-id");
        const excluirId = botao.getAttribute("data-excluir-id");

        if (editarId) {
          const linha = botao.closest("tr");
          if (!linha) return;

          inputId.value = editarId;
          inputNome.value = linha.children[1]?.textContent || "";
          inputEmail.value = linha.children[2]?.textContent || "";
          inputSenha.value = "";
          setMensagem("Modo edição: informe nova senha apenas se quiser alterar.", "");
        }

        if (excluirId) {
          if (!confirm("Deseja realmente excluir este usuário?")) return;

          try {
            const res = await fetch(API_BASE + "/usuarios/" + excluirId, {
              method: "DELETE"
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
              setMensagem(data.erro || "Erro ao excluir usuário.", "erro");
              return;
            }

            setMensagem("Usuário excluído com sucesso.", "sucesso");
            if (inputId.value === excluirId) limparFormularioUsuario();
            carregarUsuarios();
          } catch (err) {
            setMensagem("Erro ao conectar com a API.", "erro");
          }
        }
      });

      formUsuario.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id = inputId.value.trim();
        const nome = inputNome.value.trim();
        const email = inputEmail.value.trim();
        const senha = inputSenha.value;

        if (!nome || !email) {
          setMensagem("Nome e e-mail são obrigatórios.", "erro");
          return;
        }

        const criando = !id;
        if (criando && !senha) {
          setMensagem("A senha é obrigatória ao incluir usuário.", "erro");
          return;
        }

        const endpoint = criando ? "/usuarios/cadastro" : "/usuarios/" + id;
        const method = criando ? "POST" : "PUT";
        const body = criando ? { nome, email, senha } : { nome, email, senha };

        try {
          const res = await fetch(API_BASE + endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setMensagem(data.erro || "Erro ao salvar usuário.", "erro");
            return;
          }

          setMensagem(criando ? "Usuário cadastrado com sucesso." : "Usuário atualizado com sucesso.", "sucesso");
          limparFormularioUsuario();
          carregarUsuarios();
        } catch (err) {
          setMensagem("Erro ao conectar com a API.", "erro");
        }
      });

      if (btnCancelar) {
        btnCancelar.addEventListener("click", () => {
          limparFormularioUsuario();
          setMensagem("", "");
        });
      }

      carregarUsuarios();
    }
  }

});