# aquIAgora

Transcrição ao vivo para estudantes neurodivergentes acompanharem a aula no próprio ritmo.

Feito para o Hackathon USP-Alana: IA na Educação Inclusiva.

## Por que fizemos isso

Quem tem TDAH, dislexia ou outras diferenças de processamento muitas vezes perde o fio de uma aula falada. A fala passa uma vez e não volta. Se a atenção escapa por 30 segundos, o resto da explicação fica difícil de acompanhar.

A ideia aqui é simples: transformar a fala em texto enquanto ela acontece, para que dê para ler, voltar e retomar sem precisar interromper o professor.

## O que o app faz

- Transcreve a fala em tempo real
- Deixa o texto visível e ajustável
- Permite reler o que já foi dito

## Rodando localmente

```bash
git clone https://github.com/juan-tomba/aquIAgora.git
cd aquIAgora/live-transcription-for-neurodivergent
npm install
npm run dev
```

Abra `http://localhost:3000` e libere o acesso ao microfone quando o navegador pedir.


## Stack

Protótipo feito com o v0.

## O que ainda falta

Isso é um protótipo de hackathon, então tem limitações. Algumas coisas que gostaríamos de fazer:

- Testar com estudantes neurodivergentes e professores de verdade
- Mais opções de personalização (fonte para dislexia, modo foco)
- Mais idiomas
- Definir o que acontece com o áudio e as transcrições, em termos de privacidade

