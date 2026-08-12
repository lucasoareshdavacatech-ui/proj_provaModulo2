# Prompt de IA - Estrutura COSTAR

**Context:** Estou desenvolvendo uma aplicação de controle financeiro utilizando Firebase Firestore e JavaScript moderno (ES6+). Os dados das transações já estão sendo recuperados em tempo real através do método `onSnapshot` do Firestore e retornam um array de objetos contendo `{ description: string, value: number }`. Valores positivos representam receitas e valores negativos representam despesas.

**Objective:** Criar uma função em JavaScript puro que filtre e processe esse array de transações para calcular três métricas: o total de receitas (soma de valores positivos), o total de despesas (soma de valores negativos) e o saldo final (receitas + despesas).

**Style:** Código limpo, legível, sem o uso de dependências ou bibliotecas externas. Deve utilizar métodos modernos de array do JavaScript como `reduce` ou `filter`.

**Tone:** Técnico, objetivo e direto ao ponto.

**Audience:** Desenvolvedor JavaScript Júnior que entende conceitos básicos de manipulação de arrays mas precisa aprender a aplicar agregadores de forma performática.

**Response:** Uma breve explicação da lógica matemática aplicada com métodos de array e o código JavaScript pronto no formato Arrow Function para ser integrado dentro do listener `onSnapshot`.