
(function () {
  const API_BASE = window.API_BASE || "http://localhost:3000";

  const telaLogin = document.getElementById("tela-login");
  const telaCadastro = document.getElementById("tela-cadastro");
  const btnLogin = document.getElementById("conteiner-1");
  const btnCadastrar = document.getElementById("btn-cadastrar");
  const formLogin = document.getElementById("form-login");
  const formCadastro = document.getElementById("form-cadastro");
  const msgLogin = document.getElementById("login-mensagem");
  const msgCadastro = document.getElementById("cadastro-mensagem");

  function abrirOverlay(el) {
    el.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function fecharOverlay(el) {
    el.hidden = true;
    document.body.style.overflow = "";
  }

  function fecharTodos() {
    fecharOverlay(telaLogin);
    fecharOverlay(telaCadastro);
  }

  function definirMensagem(el, texto, tipo) {
    el.textContent = texto || "";
    el.classList.remove("erro", "sucesso");
    if (tipo) el.classList.add(tipo);
  }

  btnLogin.addEventListener("click", function () {
    definirMensagem(msgLogin, "");
    abrirOverlay(telaLogin);
    const primeiro = formLogin.querySelector("input");
    if (primeiro) primeiro.focus();
  });

  btnCadastrar.addEventListener("click", function () {
    definirMensagem(msgCadastro, "");
    fecharOverlay(telaLogin);
    abrirOverlay(telaCadastro);
    const primeiro = formCadastro.querySelector("input");
    if (primeiro) primeiro.focus();
  });

  document.querySelectorAll("[data-fechar-overlay]").forEach(function (node) {
    node.addEventListener("click", function (e) {
      const root = e.target.closest(".tela-sobreposta");
      if (root) fecharOverlay(root);
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!telaLogin.hidden) fecharOverlay(telaLogin);
    if (!telaCadastro.hidden) fecharOverlay(telaCadastro);
  });

  formLogin.addEventListener("submit", async function (e) {
    e.preventDefault();
    definirMensagem(msgLogin, "");

    const nome = document.getElementById("login-nome").value.trim();
    const email = document.getElementById("login-email").value.trim();
    const senha = document.getElementById("login-senha").value;

    if (!nome || !email || !senha) {
      definirMensagem(msgLogin, "Preencha nome, e-mail e senha.", "erro");
      return;
    }

    try {
      const res = await fetch(API_BASE + "/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json().catch(function () {
        return {};
      });

      if (!res.ok) {
        definirMensagem(msgLogin, data.erro || "Não foi possível entrar.", "erro");
        return;
      }

      definirMensagem(msgLogin, data.mensagem || "Login realizado com sucesso.", "sucesso");
      if (data.usuario) {
        try {
          sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
        } catch (_) {}
      }
    } catch (err) {
      definirMensagem(
        msgLogin,
        "Não foi possível conectar ao servidor. Verifique se a API está em execução.",
        "erro"
      );
    }
  });

  formCadastro.addEventListener("submit", async function (e) {
    e.preventDefault();
    definirMensagem(msgCadastro, "");

    const nome = document.getElementById("cadastro-nome").value.trim();
    const email = document.getElementById("cadastro-email").value.trim();
    const senha = document.getElementById("cadastro-senha").value;

    if (!nome || !email || !senha) {
      definirMensagem(msgCadastro, "Preencha todos os campos.", "erro");
      return;
    }

    try {
      const res = await fetch(API_BASE + "/usuarios/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });
      const data = await res.json().catch(function () {
        return {};
      });

      if (!res.ok) {
        definirMensagem(msgCadastro, data.erro || "Não foi possível cadastrar.", "erro");
        return;
      }

      definirMensagem(msgCadastro, data.mensagem || "Cadastro realizado com sucesso.", "sucesso");
      formCadastro.reset();
    } catch (err) {
      definirMensagem(
        msgCadastro,
        "Não foi possível conectar ao servidor. Verifique se a API está em execução.",
        "erro"
      );
    }
  });
})();
