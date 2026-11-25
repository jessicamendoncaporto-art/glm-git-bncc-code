# PlanoBNCC — Planejamento mensal para a Educação Infantil

Aplicativo web para gerar **planejamentos mensais** para a Educação Infantil com base na **BNCC**, usando a API do **Google Gemini**. Basta escolher o grupo (1, 2 ou 3), o mês e o ano — e, se quiser, anexar um **calendário estudantil** em PDF, imagem, TXT ou MD (o anexo é **opcional**: sem ele, o planejamento considera os dias letivos habituais).

## Funcionalidades

- Geração do planejamento mensal em tabela Markdown, exibida em **modo renderizado** (padrão após gerar) ou em Markdown puro;
- Seleção de **grupo**: Grupo 1 → códigos `EI01...`, Grupo 2 → `EI02...`, Grupo 3 → `EI03...`;
- Anexo opcional de calendário estudantil: **PDF, imagem (PNG/JPG/WEBP), TXT ou MD** (imagens são otimizadas automaticamente);
- **Menu de seleção de modelos** do Gemini, com `gemini-flash-lite-latest` como padrão;
- **System Prompt Permanente** editável dentro do app, protegido por senha (a senha é definida por você nas variáveis de ambiente e **nunca aparece na interface, no código ou nos textos de dica**);
- **Tema Claro / Escuro / Sistema**, layout organizado, botões para copiar, baixar em `.md`, baixar em HTML e imprimir;
- 100% HTML standalone no frontend (sem build) + função serverless do Netlify no backend.

## Estrutura

```
glm-git-bncc-code/
├── index.html                  # Aplicativo (HTML standalone, CSS e JS inline)
├── favicon.svg
├── netlify.toml                # Configuração de build/functions do Netlify
├── netlify/
│   └── functions/
│       └── gerar.js            # Backend: validação de senha + chamada à API do Gemini
├── .env                        # Variáveis para desenvolvimento local (valores vazios)
├── .env.example                # Modelo de variáveis de ambiente
└── .gitignore
```

## Modelos disponíveis no menu

- `gemini-flash-latest`
- `gemini-flash-lite-latest` **(padrão)**
- `gemini-3-flash-preview`
- `gemini-3.1-flash-lite`
- `gemini-3.5-flash`
- `gemini-3.6-flash`
- `gemini-3.7-flash`
- `gemini-3.8-flash`
- `gemini-4-hydrogen`

## Configuração das variáveis de ambiente

O backend não guarda chaves no código: tudo vem de variáveis de ambiente.

| Variável         | Para que serve                                                          |
| :--------------- | :---------------------------------------------------------------------- |
| `GEMINI_API_KEY` | Chave da API do Google Gemini (obtida no Google AI Studio)              |
| `SENHA_PROMPT`   | Senha que desbloqueia a edição do System Prompt Permanente dentro do app |

### No Netlify (produção)

1. No painel do projeto, abra **Site configuration → Environment variables**;
2. Crie `GEMINI_API_KEY` e `SENHA_PROMPT` com os valores desejados;
3. Faça o deploy (ver "Deploy no Netlify" abaixo).

> A senha do System Prompt Permanente não pode ficar gravada no frontend — por isso ela é validada **no servidor** e não existe dica ou valor dela em nenhum arquivo.

### Em desenvolvimento local

Copie `.env.example` para `.env`, preencha os valores e rode com a CLI do Netlify (ela carrega o `.env` automaticamente):

```bash
npm install -g netlify-cli
netlify dev
```

O app ficará disponível em `http://localhost:8888`, com as functions em `/.netlify/functions/gerar`.

> Importante: não coloque valores reais no `.env` que será commitado. Use-o apenas localmente e mantenha as credenciais de produção nas variáveis do Netlify.

## Deploy no Netlify

1. Envie este repositório para o GitHub (ver "Como enviar para o GitHub");
2. No Netlify: **Add new site → Import an existing project → GitHub** e escolha o repositório;
3. Confirme as configurações detectadas do `netlify.toml` (publish `.` e functions em `netlify/functions`);
4. Em **Environment variables**, cadastre `GEMINI_API_KEY` e `SENHA_PROMPT`;
5. Clique em **Deploy**.

Não há etapa de build: o `index.html` é servido como está.

## Como enviar para o GitHub

```bash
git init
git add .
git commit -m "Aplicativo de planejamento BNCC"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/glm-git-bncc-code.git
git push -u origin main
```

## Solução de problemas

- **"GEMINI_API_KEY não configurada"** — a variável não existe no ambiente (Netlify ou `.env` local);
- **"Limite de uso da API" (429)** — aguarde alguns instantes e gere novamente;
- **Geração lenta ou interrupção** — modelos mais pesados podem demorar; aumente o tempo limite em *Site configuration → Functions* (até 26 s) ou use um modelo "lite";
- **Arquivo grande demais** — PDFs têm limite de 4 MB (no total dos anexos); imagens são compactadas automaticamente;
- **Senha não aceita** — confira o valor cadastrado em `SENHA_PROMPT` no Netlify (não existe recuperação pela interface, justamente para proteger o conteúdo).

## Privacidade

Os arquivos anexados (calendário) são enviados apenas para o backend serverless e para o modelo de IA no momento da geração — nada é armazenado em servidor próprio. As preferências de tema, grupo e o System Prompt Permanente editado ficam somente no navegador (localStorage).
