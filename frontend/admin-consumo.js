/**
 * CRUD de consumo de água (medições) — somente Administrador.
 * Arquivo isolado: remova este script e a seção #painel-consumo para reverter.
 */
(function () {
  "use strict";

  const API_BASE = window.API_BASE || "https://api-consumo-agua.onrender.com";

  function isAdministrador(usuario) {
    return usuario && usuario.perfil === "Administrador";
  }

  function formatarData(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString("pt-BR");
  }

  function paraInputDatetimeLocal(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return (
      d.getFullYear() +
      "-" +
      pad(d.getMonth() + 1) +
      "-" +
      pad(d.getDate()) +
      "T" +
      pad(d.getHours()) +
      ":" +
      pad(d.getMinutes())
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!window.location.pathname.includes("dashboard.html")) return;

    const usuarioRaw = sessionStorage.getItem("usuario");
    if (!usuarioRaw) return;

    let usuario;
    try {
      usuario = JSON.parse(usuarioRaw);
    } catch {
      return;
    }

    if (!isAdministrador(usuario)) return;

    const navConsumo = document.getElementById("nav-aba-consumo");
    if (navConsumo) navConsumo.hidden = false;

    const painelConsumo = document.getElementById("painel-consumo");
    const painelUsuarios = document.getElementById("painel-usuarios");
    const tbody = document.getElementById("tabela-consumo-body");
    const form = document.getElementById("form-consumo");
    const inputId = document.getElementById("consumo-id");
    const selectImovel = document.getElementById("consumo-imovel");
    const inputLeitura = document.getElementById("consumo-leitura");
    const inputDatahora = document.getElementById("consumo-datahora");
    const mensagem = document.getElementById("consumo-mensagem");

    if (!painelConsumo || !tbody || !form) return;

    let registros = [];
    let imoveis = [];

    function setMensagem(texto, tipo) {
      if (!mensagem) return;
      mensagem.textContent = texto || "";
      mensagem.className = "form-acesso__mensagem";
      if (tipo) mensagem.classList.add(tipo);
    }

    function linhaSelecionada() {
      const radio = tbody.querySelector('input[name="consumo-selecao"]:checked');
      if (!radio) return null;
      const id = Number(radio.value);
      return registros.find((r) => r.medicao_id === id) || null;
    }

    function limparSelecao() {
      tbody.querySelectorAll('input[name="consumo-selecao"]').forEach((el) => {
        el.checked = false;
      });
    }

    function esconderFormulario() {
      form.hidden = true;
      inputId.value = "";
      inputLeitura.value = "";
      inputDatahora.value = "";
    }

    function mostrarFormulario(modoEdicao) {
      form.hidden = false;
      form.scrollIntoView({ behavior: "smooth", block: "nearest" });
      if (!modoEdicao) {
        inputId.value = "";
        inputLeitura.value = "";
        inputDatahora.value = "";
        if (selectImovel.options.length > 1) selectImovel.selectedIndex = 1;
      }
    }

    async function carregarImoveis() {
      try {
        const res = await fetch(API_BASE + "/imoveis");
        imoveis = await res.json().catch(() => []);
        if (!res.ok) imoveis = [];

        selectImovel.innerHTML = '<option value="">Selecione o imóvel</option>';
        imoveis.forEach((im) => {
          const opt = document.createElement("option");
          opt.value = im.imovel_id;
          opt.textContent = (im.endereco || "Imóvel") + " — " + (im.proprietario || "");
          selectImovel.appendChild(opt);
        });
      } catch {
        setMensagem("Não foi possível carregar imóveis.", "erro");
      }
    }

    function renderTabela() {
      tbody.innerHTML = "";

      registros.forEach((m) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="col-selecao">
            <input type="radio" name="consumo-selecao" value="${m.medicao_id}" aria-label="Selecionar registro ${m.medicao_id}">
          </td>
          <td>${m.medicao_id}</td>
          <td>${m.leitura}</td>
          <td>${m.endereco || "—"}</td>
          <td>${m.proprietario || "—"}</td>
          <td>${formatarData(m.datahora)}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    async function carregarRegistros() {
      try {
        const res = await fetch(API_BASE + "/medicoes");
        registros = await res.json().catch(() => []);

        if (!res.ok) {
          setMensagem("Erro ao listar registros de consumo.", "erro");
          return;
        }

        renderTabela();
        setMensagem(registros.length ? "" : "Nenhum registro de consumo cadastrado.", "");
      } catch {
        setMensagem("Erro ao conectar com a API.", "erro");
      }
    }

    document.querySelectorAll("[data-aba]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const aba = btn.getAttribute("data-aba");
        document.querySelectorAll("[data-aba]").forEach((b) => {
          b.classList.toggle("dashboard-topo__link--ativo", b === btn);
        });
        const usuarios = aba === "usuarios";
        painelUsuarios.hidden = !usuarios;
        painelConsumo.hidden = usuarios;
        esconderFormulario();
        limparSelecao();
      });
    });

    document.getElementById("consumo-btn-incluir")?.addEventListener("click", () => {
      limparSelecao();
      mostrarFormulario(false);
      setMensagem("Preencha os dados e clique em Salvar registro.", "");
    });

    document.getElementById("consumo-btn-editar")?.addEventListener("click", () => {
      const reg = linhaSelecionada();
      if (!reg) {
        alert("Selecione um registro na tabela para editar.");
        return;
      }
      inputId.value = reg.medicao_id;
      inputLeitura.value = reg.leitura;
      selectImovel.value = String(reg.imovel_id || "");
      inputDatahora.value = paraInputDatetimeLocal(reg.datahora);
      mostrarFormulario(true);
      setMensagem("Editando registro #" + reg.medicao_id, "");
    });

    document.getElementById("consumo-btn-excluir")?.addEventListener("click", async () => {
      const reg = linhaSelecionada();
      if (!reg) {
        alert("Selecione um registro na tabela para excluir.");
        return;
      }
      if (!confirm("Deseja realmente excluir o registro #" + reg.medicao_id + "?")) return;

      try {
        const res = await fetch(API_BASE + "/medicoes/" + reg.medicao_id, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMensagem(data.erro || "Erro ao excluir.", "erro");
          return;
        }
        setMensagem("Registro excluído com sucesso.", "sucesso");
        esconderFormulario();
        limparSelecao();
        carregarRegistros();
      } catch {
        setMensagem("Erro ao conectar com a API.", "erro");
      }
    });

    document.getElementById("consumo-btn-imprimir")?.addEventListener("click", () => {
      const area = document.getElementById("area-impressao-consumo");
      if (!area) return;
      const janela = window.open("", "_blank", "width=900,height=700");
      if (!janela) {
        window.print();
        return;
      }
      janela.document.write(
        "<html><head><title>Consumo de Água</title>" +
          "<style>body{font-family:sans-serif;padding:1rem}table{width:100%;border-collapse:collapse}" +
          "th,td{border:1px solid #333;padding:.4rem;text-align:left}.col-selecao{display:none}</style></head><body>" +
          "<h1>Consumo de Água</h1>" +
          area.innerHTML +
          "</body></html>"
      );
      janela.document.close();
      janela.focus();
      janela.print();
    });

    document.getElementById("consumo-cancelar")?.addEventListener("click", () => {
      esconderFormulario();
      limparSelecao();
      setMensagem("", "");
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = inputId.value.trim();
      const leitura = Number(inputLeitura.value);
      const imovel_id = Number(selectImovel.value);
      const datahora = inputDatahora.value;

      if (!leitura || !imovel_id) {
        setMensagem("Informe leitura e imóvel.", "erro");
        return;
      }

      const body = { leitura, imovel_id };
      if (datahora) body.datahora = datahora;

      const criando = !id;
      const url = criando ? API_BASE + "/medicoes" : API_BASE + "/medicoes/" + id;
      const method = criando ? "POST" : "PUT";

      try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setMensagem(data.erro || "Erro ao salvar registro.", "erro");
          return;
        }

        setMensagem(criando ? "Registro incluído com sucesso." : "Registro atualizado com sucesso.", "sucesso");
        esconderFormulario();
        limparSelecao();
        carregarRegistros();
      } catch {
        setMensagem("Erro ao conectar com a API.", "erro");
      }
    });

    carregarImoveis().then(carregarRegistros);
  });
})();
