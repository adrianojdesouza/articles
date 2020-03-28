module.exports = function test(description, callback) {
  console.log(description);

  try {
    callback();
    console.log(`[✓] ${description}`)
  } catch (error) {
    console.log(`[×] ${description}`)
    console.log(`Expect ${error.expected} but received ${error.actual}`)
  }
}
