(function () {
  const API_BASE = window.API_BASE || "http://localhost:3000";

  const formLogin = document.getElementById("form-login");

  if (formLogin) {
    formLogin.addEventListener("submit", async function (e) {
      e.preventDefault();

      const nome = document.getElementById("login-nome").value.trim();
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

        window.location.href = "index.html";

      } catch (err) {
        alert("Erro ao conectar com o servidor.");
      }
    });
  }

  // =========================
  // CADASTRO (SÓ RODA NA INDEX)
  // =========================
  const formCadastro = document.getElementById("form-cadastro");

  if (formCadastro) {
    formCadastro.addEventListener("submit", async function (e) {
      e.preventDefault();

      const nome = document.getElementById("cadastro-nome").value.trim();
      const email = document.getElementById("cadastro-email").value.trim();
      const senha = document.getElementById("cadastro-senha").value;

      if (!nome || !email || !senha) {
        alert("Preencha todos os campos.");
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
          alert(data.erro || "Erro ao cadastrar.");
          return;
        }

        alert("Cadastro realizado com sucesso!");

        formCadastro.reset();

      } catch (err) {
        alert("Erro ao conectar com o servidor.");
      }
    });
  }

})();