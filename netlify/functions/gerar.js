// Função Netlify — PlanoBNCC
// Ações:
//   { "action": "validar-senha", "senha": "..." }  → valida a senha que protege o System Prompt Permanente
//   { "action": "gerar", ... }                     → gera o planejamento mensal via API do Google Gemini
// As credenciais ficam SOMENTE nas variáveis de ambiente do Netlify
// (GEMINI_API_KEY e SENHA_PROMPT). Nada sensível fica no código ou no navegador.

const crypto = require("crypto");

const MODELOS_PERMITIDOS = new Set([
  "gemini-flash-latest",
  "gemini-flash-lite-latest",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
  "gemini-4-hydrogen",
]);

// Limite total dos anexos em base64 (~4 MB de arquivos reais), para caber
// no limite de corpo das funções Netlify (6 MB) e no limite inline da API.
const LIMITE_BASE64_TOTAL = 5300000;
const MIMES_OK = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

function resposta(statusCode, corpo) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(corpo),
  };
}

function confereSenha(informada, correta) {
  const a = crypto.createHash("sha256").update(String(informada ?? ""), "utf8").digest();
  const b = crypto.createHash("sha256").update(String(correta ?? ""), "utf8").digest();
  return crypto.timingSafeEqual(a, b);
}

function validarAnexos(anexos) {
  if (!Array.isArray(anexos)) return null;
  if (anexos.length > 10) return "No máximo 10 arquivos anexados por vez.";
  let total = 0;
  for (const a of anexos) {
    const mime = String(a && a.mime || "");
    const dados = String(a && a.dados || "");
    if (!MIMES_OK.has(mime) || !/^[A-Za-z0-9+/=\s]+$/.test(dados)) {
      return "Um dos anexos está em formato inválido.";
    }
    total += dados.length;
    if (dados.length > LIMITE_BASE64_TOTAL) {
      return "Um dos arquivos é grande demais (máx. 4 MB por arquivo).";
    }
  }
  if (total > LIMITE_BASE64_TOTAL) {
    return "Conjunto de arquivos grande demais (máx. 4 MB no total). Remova algum anexo e tente novamente.";
  }
  return null;
}

async function gerar(dados) {
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) {
    return resposta(500, {
      error: "A variável de ambiente GEMINI_API_KEY não está configurada neste ambiente (Netlify → Environment variables).",
    });
  }

  const modelo = String(dados.model || "");
  if (!MODELOS_PERMITIDOS.has(modelo)) {
    return resposta(400, { error: "Modelo não reconhecido pelo aplicativo." });
  }

  const systemPrompt = String(dados.systemPrompt || "").slice(0, 150000);
  const pedido = String(dados.pedido || "").slice(0, 40000);
  const erroAnexos = validarAnexos(dados.anexos);
  if (erroAnexos) return resposta(400, { error: erroAnexos });

  const partes = [{ text: pedido }];
  for (const a of dados.anexos || []) {
    partes.push({ inlineData: { mimeType: a.mime, data: a.dados } });
  }

  const payload = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: partes }],
    generationConfig: { temperature: 0.9, maxOutputTokens: 8192 },
  };

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(modelo) +
    ":generateContent";

  let resp;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": chave },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return resposta(504, {
      error: "Não foi possível conectar à API do Gemini (rede ou tempo limite). Tente novamente.",
    });
  }

  if (!resp.ok) {
    let mensagem = "A API do Gemini respondeu com o status " + resp.status + ".";
    try {
      const j = await resp.json();
      if (j && j.error && j.error.message) mensagem = j.error.message;
    } catch (e) { /* mantém a mensagem padrão */ }
    if (resp.status === 429) mensagem = "Limite de uso da API atingido. Aguarde um instante e tente novamente.";
    if (resp.status === 403 || resp.status === 401) mensagem = "Chave da API inválida ou sem permissão. Confira a variável GEMINI_API_KEY.";
    if (resp.status === 404) mensagem = "Modelo indisponível para esta chave da API. Escolha outro modelo no menu.";
    return resposta(resp.status === 429 ? 429 : 502, { error: mensagem });
  }

  let j;
  try {
    j = await resp.json();
  } catch (e) {
    return resposta(502, { error: "Resposta ilegível da API do Gemini." });
  }

  const candidato = (j.candidates && j.candidates[0]) || {};
  const texto = (((candidato.content || {}).parts) || [])
    .map((p) => (typeof p.text === "string" ? p.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!texto) {
    const motivo =
      (candidato.finishReason && "finishReason: " + candidato.finishReason) ||
      (j.promptFeedback && j.promptFeedback.blockReason && "bloqueio: " + j.promptFeedback.blockReason) ||
      "sem detalhes";
    return resposta(502, {
      error: "O modelo não retornou texto (" + motivo + "). Tente novamente ou escolha outro modelo.",
    });
  }

  return resposta(200, { texto });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return resposta(405, { error: "Método não permitido." });
  }

  let dados;
  try {
    dados = JSON.parse(event.body || "{}");
  } catch (e) {
    return resposta(400, { error: "Corpo da requisição inválido." });
  }

  if (dados.action === "validar-senha") {
    const correta = process.env.SENHA_PROMPT;
    if (!correta) {
      return resposta(500, {
        error: "A variável de ambiente SENHA_PROMPT não está configurada neste ambiente (Netlify → Environment variables).",
      });
    }
    const ok = confereSenha(dados.senha, correta);
    if (!ok) {
      // Pequena pausa para desencorajar tentativas automatizadas.
      await new Promise((r) => setTimeout(r, 700));
      return resposta(401, { error: "Senha incorreta." });
    }
    return resposta(200, { ok: true });
  }

  if (dados.action === "gerar") {
    return gerar(dados);
  }

  return resposta(400, { error: "Ação desconhecida." });
};
