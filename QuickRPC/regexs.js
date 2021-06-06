const symver =
  '^(0|[1-9]d*).(0|[1-9]d*).(0|[1-9]d*)(?:-((?:0|[1-9]d*|d*[a-zA-Z-][0-9a-zA-Z-]*)(?:.(?:0|[1-9]d*|d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:+([0-9a-zA-Z-]+(?:.[0-9a-zA-Z-]+)*))?$';
const gitCommit = '[0-z][0-z][0-z][0-z][0-z][0-z][0-z]';

module.exports = {
  symver,
  gitCommit,
};
