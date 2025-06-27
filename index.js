const http = require("http");
const sistemaArquivos = require("fs");
const { URL } = require("url");
const { randomUUID } = require("crypto");

const lerDados = (nomeArquivo) => {
  try {
    const dados = sistemaArquivos.readFileSync(
      `./data/${nomeArquivo}.json`,
      "utf8"
    );
    return JSON.parse(dados);
  } catch (error) {
    console.error(`Erro ao ler o arquivo ${nomeArquivo}.json:`, error);
    return [];
  }
};

const escreverDados = (nomeArquivo, dados) => {
  try {
    sistemaArquivos.writeFileSync(
      `./data/${nomeArquivo}.json`,
      JSON.stringify(dados, null, 2)
    );
  } catch (error) {
    console.error(`Erro ao escrever no arquivo ${nomeArquivo}.json:`, error);
  }
};

const servidor = http.createServer((requisicao, resposta) => {
  const URLParseada = new URL(
    requisicao.url,
    `http://${requisicao.headers.host}`
  );
  const { pathname } = URLParseada;
  const metodo = requisicao.method;

  resposta.setHeader("Content-Type", "application/json");
  resposta.setHeader("Access-Control-Allow-Origin", "*");
  resposta.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  resposta.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (metodo === "OPTIONS") {
    resposta.writeHead(204);
    resposta.end();
    return;
  }

  if (pathname.startsWith("/insumos")) {
    const insumos = lerDados("insumos");
    const partesURL = pathname.split("/");
    const insumoID = partesURL[2];

    if (metodo === "GET" && !insumoID) {
      resposta.writeHead(200);
      resposta.end(JSON.stringify(insumos));
      return;
    }

    if (metodo === "GET" && insumoID) {
      const insumo = insumos.find((i) => i.id === insumoID);
      if (insumo) {
        resposta.writeHead(200);
        resposta.end(JSON.stringify(insumo));
      } else {
        resposta.writeHead(404);
        resposta.end(JSON.stringify({ mensagem: "Insumo não encontrado." }));
      }
      return;
    }

    if (metodo === "POST") {
      let corpo = "";
      requisicao.on("data", (chunk) => {
        corpo += chunk.toString();
      });
      requisicao.on("end", () => {
        const { nome, categoria, quantidadeEstoque, unidade } = JSON.parse(corpo);
        if (!nome || !categoria || quantidadeEstoque == null || !unidade) {
          resposta.writeHead(400);
          resposta.end(
            JSON.stringify({
              mensagem: "Nome, categoria, quantidadeEstoque e unidade são obrigatórios.",
            })
          );
          return;
        }

        const novoInsumo = {
          id: randomUUID().slice(0, 8),
          nome,
          categoria,
          quantidadeEstoque,
          unidade,
        };

        insumos.push(novoInsumo);
        escreverDados("insumos", insumos);

        resposta.writeHead(201);
        resposta.end(JSON.stringify(novoInsumo));
      });
      return;
    }

    if (metodo === "PUT" && insumoID) {
      let corpo = "";
      requisicao.on("data", (chunk) => {
        corpo += chunk.toString();
      });
      requisicao.on("end", () => {
        const { nome, categoria, quantidadeEstoque, unidade } = JSON.parse(corpo);
        const indiceInsumo = insumos.findIndex((i) => i.id === insumoID);

        if (indiceInsumo === -1) {
          resposta.writeHead(404);
          resposta.end(JSON.stringify({ mensagem: "Insumo não encontrado." }));
          return;
        }

        const insumoAtualizado = {
          ...insumos[indiceInsumo],
          nome: nome || insumos[indiceInsumo].nome,
          categoria: categoria || insumos[indiceInsumo].categoria,
          quantidadeEstoque:
            quantidadeEstoque != null ? quantidadeEstoque : insumos[indiceInsumo].quantidadeEstoque,
          unidade: unidade || insumos[indiceInsumo].unidade,
        };

        insumos[indiceInsumo] = insumoAtualizado;
        escreverDados("insumos", insumos);

        resposta.writeHead(200);
        resposta.end(JSON.stringify(insumoAtualizado));
      });
      return;
    }

    if (metodo === "DELETE" && insumoID) {
      const indiceInsumo = insumos.findIndex((i) => i.id === insumoID);
      if (indiceInsumo === -1) {
        resposta.writeHead(404);
        resposta.end(JSON.stringify({ mensagem: "Insumo não encontrado." }));
        return;
      }
      insumos.splice(indiceInsumo, 1);
      escreverDados("insumos", insumos);

      resposta.writeHead(200);
      resposta.end(
        JSON.stringify({ mensagem: "Insumo deletado com sucesso." })
      );
      return;
    }

    resposta.writeHead(404);
    resposta.end(JSON.stringify({ mensagem: "Rota não encontrada." }));
    return;
  }
});

const PORTA = 7000;
servidor.listen(PORTA, () => {
  console.log(`Servidor de Insumos Agrícolas rodando: http://localhost:${PORTA}/insumos`);
});
