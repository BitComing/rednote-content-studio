const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(id, parent, ...args) {
  if (id.startsWith('@/')) id = path.join(__dirname, '..', 'src', id.slice(2));
  return resolve.call(this, id, parent, ...args);
};
require.extensions['.ts'] = (mod, file) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } });
  mod._compile(outputText, file);
};
