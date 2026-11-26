# SAPO MALUCO — Corrida no Pantanal

Jogo runner infinito estilo Subway Surfers, estrelado por um **sapo engraçado de boné vermelho** correndo pela trilha do Pantanal, desviando de capivaras e devorando moscas com a língua.

> Este projeto substituiu o antigo gerador de planos de aula (PlanoBNCC) neste repositório. O histórico anterior continua acessível no git.

## Como jogar

| Ação | Teclado | Celular |
|---|---|---|
| Trocar de pista | `←` `→` (ou `A`/`D`) | deslize o dedo para os lados |
| Pular | `↑` / `W` / `Espaço` | deslize o dedo para cima (ou toque) |
| Deslizar | `↓` / `S` | deslize o dedo para baixo |
| Pausar | `P` / `Esc` | botão PAUSA |
| Som liga/desliga | `M` | botão SOM |

## Objetos da trilha

| Objeto | O que fazer | Pontos |
|---|---|---|
| Mosca | pegue com a língua | +10 |
| Mosca de ouro | corra atrás dela! | +50 |
| Tronco / pedra | **pule** | — |
| Cobra pendurada | **deslize** por baixo | — |
| Capivara de laranja na cabeça | **troque de pista** | — |

A velocidade aumenta a cada 400 m (níveis). A pontuação é a distância percorrida (m) + bônus das moscas. O recorde fica salvo no navegador.

## Tecnologia

- **HTML5 Canvas 2D puro** — projeção pseudo-3D feita à mão, sem engines nem bibliotecas
- Arquivo único `index.html` (CSS e JS inline), **zero dependências e zero build**
- Sons sintetizados na hora com WebAudio (sem arquivos de áudio)
- Recorde e preferência de som guardados em `localStorage`

## Rodar localmente

Basta abrir o `index.html` no navegador, ou servir a pasta:

```bash
npx serve .
```

## Deploy (Netlify)

O site é 100% estático: funciona sem comando de build e sem funções.

- Build command: *(nenhum)*
- Publish directory: `.`

## Estrutura

```
index.html     # o jogo inteiro (HTML + CSS + JS)
favicon.svg    # sapinho do ícone
netlify.toml   # configuração mínima de publicação
```
