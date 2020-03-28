const assert = require("assert");
const test = require("./test");

const BUTTON = `<Button>
<Icon />
Baixar Relatório
</Button>`;

function renderComponent(c1, c2, c3) {
  // Alteramos o ternario por um short-circuit e o parenteses foi colocado
  // no lugar errado
  return c1 || ((c2 && c3) > 0 && (BUTTON));
}

// function renderComponent(c1, c2, c3) {
//   // Corrige o problema de parênteses no lugar errado
//   return (c1 || (c2 && c3) > 0) && (BUTTON);
// }


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
