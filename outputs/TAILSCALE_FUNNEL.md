# Publicar a Soneca PWA com Tailscale Funnel

## Pré-requisitos

- Tailscale instalado e logado na máquina que ficará ligada.
- Tailscale versão 1.38.3 ou mais recente.
- MagicDNS e HTTPS habilitados no tailnet.
- Funnel permitido na política/admin do Tailscale.

## Como iniciar

Execute:

```bat
outputs\INICIAR_SONECA_FUNNEL.bat
```

Esse arquivo:

1. inicia o servidor local da PWA em `http://127.0.0.1:5179`;
2. executa `tailscale funnel 5179`;
3. mostra no terminal a URL HTTPS pública gerada pelo Tailscale.

Use essa URL HTTPS no iPhone, abra pelo Safari e adicione à Tela de Início.

## Observações

- O Funnel deixa a PWA acessível publicamente pela URL HTTPS gerada.
- Para acesso só dentro do seu Tailnet, use Tailscale Serve em vez de Funnel.
- Para notificações PWA no iPhone, abra a URL HTTPS, instale na Tela de Início e depois ative os avisos no app.
