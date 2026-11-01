# Interface do Manda Chuva BOT

Painel no navegador pra configurar o [Manda Chuva BOT](https://github.com/PedroA07/Manda-Chuva-BOT): cores (nome, cor, emoji, estilo do botão e cargo), textos do embed, campos, imagens, botões e respostas, com prévia ao vivo. Daqui também dá pra enviar o painel num canal e ver se a hierarquia de cargos está certa.

É um site estático (HTML + JavaScript, sem build). Ele não guarda nada: tudo fica no bot, e a interface conversa com a API dele.

**Endereço:** https://pedroa07.github.io/Interface-Manda-Chuva-Bot/

## Como entrar

Na primeira vez, a interface pede:

- **Endereço do bot**: o endereço do serviço na Render (ex.: `https://manda-chuva-bot.onrender.com`), ou `http://localhost:3000` se o bot está rodando no seu PC.
- **Senha**: a `PAINEL_SENHA` configurada no bot. Se o bot roda no seu PC sem senha, deixe vazio.

Marcando "Lembrar neste navegador", ela não pergunta de novo. O botão **Sair** apaga a senha guardada.

## Configuração

- `config.js` tem o endereço padrão do bot, que já aparece preenchido na entrada. Troque pelo endereço que a Render mostrar.
- O site precisa estar liberado no `PAINEL_ORIGENS` do bot. O padrão do bot já libera `https://pedroa07.github.io`. Se você hospedar a interface em outro lugar (Vercel, Netlify...), coloque o endereço novo lá.

## Testar no PC

Abrindo o `index.html` direto (dando dois cliques) não funciona: precisa de um servidor. Por exemplo:

```
npx serve -l 5500
```

e abra http://localhost:5500. Aberta assim, ela usa `http://localhost:3000` como endereço padrão do bot.

## Publicar

O GitHub Pages publica sozinho a cada `git push` na branch `main` (Settings → Pages → Deploy from a branch → `main` / raiz).
