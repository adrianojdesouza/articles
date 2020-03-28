# O parentêses mais caro na história da Arquivei

Vocês conhecem a história do [Mariner 1 Spacecraft](https://en.wikipedia.org/wiki/Mariner_1) que devido a um erro de programação causou um prejuízo de milhões de dólares?

É claro que o título do artigo é sensacionalista e o Arquivei não perdeu milhões de dólares devido ao bug que irei descrever. Como todo bug em produção, esse também gerou prejuízo.

## O problema
Estava trabalhando normalmente quando um colega de trabalho enviou uma mensagem no slack dizendo que estava desde ontem procurando um bug e descobriu que o bug foi causado por uma nova política de lint que resolvemos adotar.

Fui revisar a PR e encontrei a explicação muito bem detalhada do problema e qual foi a solução, mas vamos entender melhor o problema.

Basicamente um botão para baixar relatório deveria estar sendo exibido e não estava.

## O Legado
Assim como em todo lugar nós temos um sistema legado onde fazer alterações é no minímo complicado. Para que o código não ficasse tão distante dos novos padrões que estamos adotando resolvemos colocar várias regras de lint no nosso monstrolito de frontend.

Obs: Os exemplos abaixo são apenas uma representação simples do código real.

O problema começou quando refatoramos esse código:
```javascript
// ...imagine mais código aqui
{true || (1 && 1) > 0 ? (
  `<Button>
    <Icon />
    Baixar Relatório
  </Button>`
) : (
  false
)}
// <Button>Baixar Relatório</Button>
```
pra esse:
```javascript
{true || ((1 && 1) > 0 && (
  `<Button>
    <Icon />
    Baixar Relatório
  </Button>`
))}
// true
```
Aproveitando as alterações da regra de lint, resolvemos alterar um trecho do código e trocar por um [inline if com operador lógico &&](https://reactjs.org/docs/conditional-rendering.html#inline-if-with-logical--operator), o lint alertou um erro de syntax e para corrigir colocamos o parênteses no lugar errado:
```javascript
//        Adicionamos esse parênteses para corrigir o erro de syntax
//       |
{true || ((1 && 1) > 0 && (
    `<Button>
      <Icon />
      Baixar Relatório
    </Button>`
  ))}
// |
// |_ esqueceu de remover esse parênteses

// true
```
Esse trecho de código escrito da forma correta ficaria assim:
```javascript
//  Agora sim está no lugar certo
// |                    Fechando no lugar certo também
// |                    |     
// |                    |    
  {(true || (1 && 1) > 0) && (
  `<Button>
    <Icon />
    Baixar Relatório
  </Button>`)}
// <Button><Icon />Baixar Relatório</Button>
```

Essa primeira condição definia se o usuário poderia baixar o relatório na hora ou se o relatório seria gerado em background. Para todos os clientes que tinham que gerar o relatório em background devido ao tamanho do relatório, foram afetados.

É claro que o componente não é tão simples dessa forma e devido a grande quantidade de arquivos (136 para ser mais preciso) que a pull request alterou por causa das novas regras de lint, isso passou despercebido na revisão da pull request.

Será que teríamos como evitar um problema desses? Hmm... sabe quando te falam que testes são realmente importantes? Pois é, eles realmente são. 

Nós usávamos muito [snapshot](https://jestjs.io/docs/en/snapshot-testing), esse componente por exemplo tem um teste bem simples dando assert em um snapshot. 

Um teste ruim é pior do que não ter um teste, pois ele te dá uma falsa confiança para refatorar e dar aquele merge monstro na master sem medo.

Vamos ver como alguns testes poderiam ter evitado esse bug:
```javascript
const assert = require("assert");
const test = require("./test");

// Simplificando a implementação do componente que basicamente tem três condições para ser renderizado
const BUTTON = `<Button>
<Icon />
Baixar Relatório
</Button>`;

function renderComponent(c1, c2, c3) {
  return (c1 || (c2 && c3) > 0) ? (BUTTON) : false;
}

test("should not show button when c1 is false and c2, c3 are 0", function() {
  const component = renderComponent(false, 0, 0);
  assert.equal(component, false);
});

test("should not show button when c2 it's 0", function() {
  const component = renderComponent(false, 0, 1);
  assert.equal(component, false);
});

test("should show button when condition two is true", function() {
  const component = renderComponent(false, 1, 1);
  assert.equal(component, BUTTON);
});

test("should show button when condition one it's true", function() {
  const component = renderComponent(true, 0, 0);
  assert.equal(component, BUTTON);
});
```
Você pode baixar o código no github para testar. O comando:
```bash
node ./src/beforeRefactor.js
```
Terá como resultado:
```text
should not show button when c1 is false and c2, c3 are 0
[✓] should not show button when c1 is false and c2, c3 are 0
should not show button when c2 it's 0
[✓] should not show button when c2 it's 0
should show button when condition two is true
[✓] should show button when condition two is true
should show button when condition one it's true
[✓] should show button when condition one it's true
```
O componente alterado removendo o ternário fica assim:
```javascript
function renderComponent(c1, c2, c3) {
  // Alteramos o ternario por um short-circuit e o parenteses foi colocado
  // no lugar errado
  return c1 || ((c2 && c3) > 0 && (BUTTON));
}
```
Agora o momento mais aguardado do artigo, veja só que acontece quando rodamos os mesmos testes:
```bash
node ./src/afterRefactor.js
```
O resultado será:
```text
should not show button when c1 is false and c2, c3 are 0
[✓] should not show button when c1 is false and c2, c3 are 0
should not show button when c2 it's 0
[✓] should not show button when c2 it's 0
should show button when condition two is true
[✓] should show button when condition two is true
should show button when condition one it's true
[×] should show button when condition one it's true
Expect <Button>
<Icon />
Baixar Relatório
</Button> but received true
```
Repare bem nesse teste `should show button when condition one it's true` esse é justamente o caso em que causava um bug para o usuário.

Se esse **simples** teste fosse escrito quanto tempo e por que não dizer dinheiro nós teríamos poupado?

## Considerações
Eu removi um trecho muito pequeno do código real e isolei ele em um contexto totalmente reduzido. Quem lida com sistemas legados sabe o quão difícil é evoluir um código legado. Isso não quer dizer que você não deva evoluir o legado, mais desafiante do que começar tudo do zero é evoluir um sistema legado de forma continua e incremental.

## Conclusão
Nós ouvimos o tempo todo que testes são importantes, mas acho que faltam exemplos reais de como um teste poderia evitar um bug em produção. Espero que esse exemplo sirva para você querer passar mais tempo escrevendo testes e menos tempo investigando bugs. 

