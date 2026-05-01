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
      try {
        const res = await fetch(API_BASE + "/medicoes");
        const dados = await res.json();

        const tabela = document.getElementById("tabela-medicoes");
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
      if (!confirm("Deseja realmente excluir?")) return;

      await fetch(API_BASE + "/medicoes/" + id, {
        method: "DELETE"
      });

      alert("Excluído com sucesso!");
      carregarMedicoes();
    }

    window.editar = async function (id, leituraAtual) {
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
  }

});