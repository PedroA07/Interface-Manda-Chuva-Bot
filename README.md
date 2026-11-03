# Interface do Manda Chuva BOT

Painel no navegador pra configurar o [Manda Chuva BOT](https://github.com/PedroA07/Manda-Chuva-BOT), no visual "college" (papel de caderno, adesivos, sombras duras):

- **Cores**: os cargos de cor como cartões de matrícula. Cor sólida ou degradê, emoji por categoria, cor do botão (padrão do Discord, cor do cargo ou cor própria) e o boletim da hierarquia.
- **Painel**: texto, campos, imagens (banner em cima, miniatura, imagem grande e até 4 no final: modelos da galeria, link ou arquivo enviado), botões e respostas, com prévia ao vivo. Daqui também dá pra enviar o painel num canal.
- **Portaria**: mensagem quando alguém entra (com card de boas-vindas), sai, é expulso, banido ou silenciado: canal, modelos prontos, variáveis, texto dentro/fora, imagens, cargo automático, DM e "Testar comigo".
- **Temas**: as datas festivas (Natal, Ano Novo, Carnaval e Páscoa calculados, Junina, Halloween...), calendário, avisos personalizados, imagem do tema pra cada mensagem e "Simular uma data" pra ver as outras abas naquele dia.
- **Aniversários** (dentro de Temas): canal, horário, modelos, card do aniversariante, cargo de 24 h, DM, botão de cadastro no painel de cores, próximos aniversários e a lista completa (buscar, filtrar por mês, adicionar e tirar).
- **Tickets**: categoria, canal do menu e de transcrições (escolher ou mandar o bot criar), motivos, regras, fila de abertos e prévia em 3 etapas.
- **Meu perfil** e **Membros** (com login do Discord): banner, bio e medalhas fixadas; a turma toda com os cartões de perfil.
- **Notícias**: o Jornal do Campus com tudo que mudou no bot (filtros, não lidas) e onde o bot anuncia cada versão nova no Discord (canal, menção, imagens, "só as grandes").

É um site estático (HTML + JavaScript com [Preact](https://preactjs.com) embutido em `vendor/`, sem build). Ele não guarda nada: tudo fica no bot, e a interface conversa com a API dele.

**Endereço:** https://pedroa07.github.io/Interface-Manda-Chuva-Bot/ (o painel fica em `painel.html`)


## Páginas

| Arquivo | O que é |
|---|---|
| `index.html` | Página inicial: hero com 48 quadros que andam com o scroll, recursos com o mascote em 3D (three.js), comandos, medalhas e convite. |
| `painel.html` | O painel: login com Discord (ou a senha do painel), abas da staff e, pra membros, Notícias, Membros e Meu perfil. |
| `central.html` | Central do Bot: Apresentação, Termos de Uso (`#termos`), Política de Privacidade (`#privacidade`), Suporte e checklist de verificação. Os links de Termos e Privacidade vão no Developer Portal do Discord. |

## Como entrar

Na primeira vez, a interface pede:

- **Endereço do bot**: o endereço do serviço na Render (ex.: `https://manda-chuva-bot.onrender.com`), ou `http://localhost:3000` se o bot está rodando no seu PC.
- **Senha**: a `PAINEL_SENHA` configurada no bot. Se o bot roda no seu PC sem senha, deixe vazio.

Marcando "Lembrar neste navegador", ela não pergunta de novo. O botão **Sair** apaga a senha guardada.

## Configuração

- `config.js` tem o endereço padrão do bot, que já aparece preenchido na entrada. Troque pelo endereço que a Render mostrar.
- O site precisa estar liberado no `PAINEL_ORIGENS` do bot. O padrão do bot já libera `https://pedroa07.github.io`. Se você hospedar a interface em outro lugar (Vercel, Netlify...), coloque o endereço novo lá.

## Testar no PC

Abrindo o `painel.html` direto (dando dois cliques) não funciona: precisa de um servidor. Por exemplo:

```
npx serve -l 5500
```

e abra http://localhost:5500. Aberta assim, ela usa `http://localhost:3000` como endereço padrão do bot.

Pra mexer no visual sem o bot, tem uma API falsa com dados de exemplo (serve o site junto):

```
node dev/api-falsa.mjs
```

e abra http://localhost:3000. Os testes das regras (paginação, cores, imagens, prévia) rodam com `npm test`.

## Publicar

O GitHub Pages publica sozinho a cada `git push` na branch `main` (Settings → Pages → Deploy from a branch → `main` / raiz).

## Imagens

A pasta `banners/` tem a galeria de modelos (banners animados das datas festivas, miniaturas, fundos de card e os clássicos). O bot usa essas imagens direto deste site, então elas precisam estar publicadas aqui.
