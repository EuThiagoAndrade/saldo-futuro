// Preload exclusivo do servidor Playwright. A aplicação não tem opção de trocar a fonte.
// Redireciona qualquer chamada ao SGS para o servidor falso local do arquivo serial.
const original = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (url.hostname === "api.bcb.gov.br") {
    url.protocol = "http:";
    url.hostname = "127.0.0.1";
    url.port = "43141";
    return original(url, init);
  }
  return original(input, init);
};
