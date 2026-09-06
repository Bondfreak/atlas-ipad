import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const calls = [];

const context = {
  console,
  URLSearchParams,
  localStorage: {
    _data: Object.create(null),
    getItem(key){ return key in this._data ? this._data[key] : null; },
    setItem(key, value){ this._data[key] = String(value); },
    removeItem(key){ delete this._data[key]; }
  },
  location: { search: '' },
  fetch: async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const body = JSON.parse(init.body || '{}');
    if (!body.query || !String(body.query).trim()) {
      return {
        ok: false,
        status: 400,
        async json(){
          return { error: { code: 'invalid_request', message: 'Non-empty query string is required' } };
        }
      };
    }
    return {
      ok: true,
      status: 200,
      async json(){
        return {
          query: body.query,
          conclusion: 'Impeller exchange is invoiced; install on both sides is not proven.',
          basis: ['Invoice KO-...', 'Policy: INVOICE_NE_INSTALL'],
          uncertainty_conflict: ['Invoice is not proof of install'],
          sources: ['SRC-INVOICE-1'],
          epistemic_status: 'invoiced_without_action',
          policy_results: [{ verdict: 'downgrade', code: 'INVOICE_NE_INSTALL', message: 'not proof of install' }],
          snapshot_id: 'f1-freeze-test'
        };
      }
    };
  }
};
context.window = context;
context.globalThis = context;
context.self = context;

function load(name){
  const code = readFileSync(join(root, name), 'utf8');
  vm.runInNewContext(code, context, { filename: name });
}

load('server-origin.js');
load('shaka-core-client.js');

assert.equal(context.AtlasServer.DEFAULT_SERVER_ORIGIN, 'https://shaka-server.onrender.com');
assert.equal(context.AtlasServer.resolveServerOrigin(), 'https://shaka-server.onrender.com');

context.location.search = '?server=http://127.0.0.1:8000';
assert.equal(context.AtlasServer.resolveServerOrigin(), 'http://127.0.0.1:8000');
context.location.search = '';

context.localStorage.setItem('ATLAS_SERVER_ORIGIN', 'http://127.0.0.1:8000/');
assert.equal(context.AtlasServer.resolveServerOrigin(), 'http://127.0.0.1:8000');
context.localStorage.removeItem('ATLAS_SERVER_ORIGIN');

const answer = await context.ShakaCore.postF1Answer('Hvornår blev impellerne sidst skiftet?', {
  baseUrl: 'http://127.0.0.1:8000'
});
assert.equal(calls.length, 1);
assert.equal(calls[0].url, 'http://127.0.0.1:8000/api/v1/f1/answer');
assert.equal(calls[0].init.method, 'POST');
assert.match(calls[0].init.body, /impellerne/i);
assert.equal(answer.epistemic_status, 'invoiced_without_action');
assert.ok(Array.isArray(answer.basis));
assert.ok(Array.isArray(answer.sources));
assert.match(answer.conclusion, /invoiced/i);

await assert.rejects(
  () => context.ShakaCore.postF1Answer('   ', { baseUrl: 'http://127.0.0.1:8000' }),
  /query is required/
);

console.log('f1_answer_mock_fetch: ok');
