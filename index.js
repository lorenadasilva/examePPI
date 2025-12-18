import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";

const app = express();
const porta = 3000;

// LISTAS DO SISTEMA
let listaInteressados = [];
let listaPets = [];
let listaAdocoes = [];

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: "petshop-secreto",
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 30 } // 30 minutos
}));

// MIDDLEWARE DE AUTENTICAÇÃO
function autenticar(req, res, next) {
  if (req.session?.usuario?.logado) return next();
  res.redirect("/login");
}

// CSS GLOBAL
const css = `
<style>
body { font-family: Arial; background:#f2eefc; padding:20px; }
.container { max-width:900px; margin:auto; }
.menu a { margin-right:15px; font-weight:bold; }
.card { background:white; padding:20px; border-radius:8px; }
input, select { width:100%; padding:8px; margin-bottom:10px; }
button { padding:10px; background:#5a2ea6; color:white; border:none; cursor:pointer; }
table { width:100%; border-collapse:collapse; margin-top:15px; }
th, td { border:1px solid #ddd; padding:8px; }
th { background:#5a2ea6; color:white; }
a { color:#5a2ea6; text-decoration:none; }
</style>
`;

// LOGIN
app.get("/login", (req, res) => {
  res.send(`
  ${css}
  <div class="container card">
    <h2>Login – Sistema de Adoção de Pets </h2>
    <p><strong>Pet Shop</strong> – Controle de adoção de filhotes</p>
    <form method="POST">
      <input name="usuario" placeholder="Usuário" required>
      <input type="password" name="senha" placeholder="Senha" required>
      <button type="submit">Entrar</button>
    </form>
  </div>
  `);
});

app.post("/login", (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario === "admin" && senha === "123") {
    req.session.usuario = { logado: true, nome: usuario };
    res.cookie("ultimoAcesso", new Date().toLocaleString());
    res.redirect("/");
  } else {
    res.send(`
      ${css}
      <div class="container card">
        <p>Usuário ou senha inválidos.</p>
        <a href="/login">Voltar</a>
      </div>
    `);
  }
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// MENU PRINCIPAL
app.get("/", autenticar, (req, res) => {
  const ultimo = req.cookies.ultimoAcesso || "Primeiro acesso";
  res.cookie("ultimoAcesso", new Date().toLocaleString());

  res.send(`
  ${css}
  <div class="container card">
    <h2>Sistema de Adoção de Pets </h2>
    <p><strong>Pet Shop</strong> – Controle de interessados e adoções</p>
    <p><strong>Último acesso:</strong> ${ultimo}</p>

    <div class="menu">
      <a href="/interessados">Cadastro de Interessados</a>
      <a href="/pets">Cadastro de Pets</a>
      <a href="/adocao">Adotar um Pet</a>
      <a href="/logout">Sair</a>
    </div>
  </div>
  `);
});

// CADASTRO DE INTERESSADOS
app.get("/interessados", autenticar, (req, res) => {
  res.send(`
  ${css}
  <div class="container card">
    <h2>Cadastro de Interessados em Adoção</h2>

    <form method="POST">
      <input name="nome" placeholder="Nome" required>
      <input name="email" placeholder="E-mail" required>
      <input name="telefone" placeholder="Telefone" required>
      <button type="submit">Cadastrar</button>
    </form>

    <h3>Interessados cadastrados</h3>
    <ul>
      ${listaInteressados.map(i => `<li>${i.nome} - ${i.email}</li>`).join("")}
    </ul>

    <a href="/">Voltar ao menu</a>
  </div>
  `);
});

app.post("/interessados", autenticar, (req, res) => {
  const { nome, email, telefone } = req.body;

  if (!nome || !email || !telefone) {
    return res.send("Todos os campos são obrigatórios.");
  }

  listaInteressados.push({ nome, email, telefone });
  res.redirect("/interessados");
});

// CADASTRO DE PETS
app.get("/pets", autenticar, (req, res) => {
  res.send(`
  ${css}
  <div class="container card">
    <h2>Cadastro de Pets Disponíveis para Adoção</h2>

    <form method="POST">
      <input name="nome" placeholder="Nome do pet" required>
      <input name="raca" placeholder="Raça" required>
      <input type="number" name="idade" placeholder="Idade (anos)" required>
      <button type="submit">Cadastrar</button>
    </form>

    <h3>Pets cadastrados</h3>
    <ul>
      ${listaPets.map(p => `<li>${p.nome} - ${p.raca}</li>`).join("")}
    </ul>

    <a href="/">Voltar ao menu</a>
  </div>
  `);
});

app.post("/pets", autenticar, (req, res) => {
  const { nome, raca, idade } = req.body;

  if (!nome || !raca || !idade) {
    return res.send("Todos os campos são obrigatórios.");
  }

  listaPets.push({ nome, raca, idade });
  res.redirect("/pets");
});

// ADOÇÃO (GET)
app.get("/adocao", autenticar, (req, res) => {

  if (listaInteressados.length === 0 || listaPets.length === 0) {
    return res.send(`
      ${css}
      <div class="container card">
        <h2>Adotar um Pet </h2>
        <p style="color:red;">
          É necessário cadastrar ao menos um interessado e um pet.
        </p>
        <a href="/interessados">Cadastrar Interessado</a><br><br>
        <a href="/pets">Cadastrar Pet</a><br><br>
        <a href="/">Voltar ao menu</a>
      </div>
    `);
  }

  res.send(`
  ${css}
  <div class="container card">
    <h2>Manifestação de Interesse em Adoção </h2>

    <form method="POST" action="/adocao">
      <label>Interessado</label>
      <select name="interessado" required>
        <option value="">Selecione</option>
        ${listaInteressados.map((i, idx) =>
          `<option value="${idx}">${i.nome}</option>`
        ).join("")}
      </select>

      <label>Pet</label>
      <select name="pet" required>
        <option value="">Selecione</option>
        ${listaPets.map((p, idx) =>
          `<option value="${idx}">${p.nome}</option>`
        ).join("")}
      </select>

      <button type="submit">Registrar desejo de adoção</button>
    </form>

    <h3>Desejos de adoção registrados</h3>
    <ul>
      ${listaAdocoes.map(a =>
        `<li>${a.interessado} deseja adotar ${a.pet} em ${a.data}</li>`
      ).join("")}
    </ul>

    <a href="/">Voltar ao menu</a>
  </div>
  `);
});

// ADOÇÃO (POST)
app.post("/adocao", autenticar, (req, res) => {
  const { interessado, pet } = req.body;

  if (
    interessado === undefined ||
    pet === undefined ||
    interessado === "" ||
    pet === ""
  ) {
    return res.send("Erro: selecione um interessado e um pet válidos.");
  }

  listaAdocoes.push({
    interessado: listaInteressados[interessado].nome,
    pet: listaPets[pet].nome,
    data: new Date().toLocaleString()
  });

  res.redirect("/adocao");
});

// SERVIDOR
app.listen(porta, () => {
  console.log(`Servidor rodando em http://localhost:${porta}`);
});
