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

        // 👉 REDIRECIONAMENTO CORRETO
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
    } else {
      const usuario = JSON.parse(usuarioSalvo);

      const nomeSpan = document.getElementById("usuario-nome");
      if (nomeSpan) {
        nomeSpan.textContent = usuario.nome;
      }
    }

    const btnLogout = document.getElementById("logout");
    if (btnLogout) {
      btnLogout.addEventListener("click", () => {
        sessionStorage.removeItem("usuario");
        window.location.href = "login.html";
      });
    }
  }

});