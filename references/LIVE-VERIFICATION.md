# Live submission checks

Date: 2026-11-09 (Asia/Manila). Target: https://lead-inbox-crm.vercel.app.

API: 52 passed, 0 failed. Owner: 10 passed, 0 failed. Commands used BASE_URL and values loaded from the ignored .env.local. No application code was changed.

## API smoke: pass/fail per check

- PASS OPTIONS public CORS 204
- PASS POST 201 exact shape, raw text, defaults, ISO UTC, CORS
- PASS POST malformed JSON 400
- PASS POST null body 400
- PASS POST array body 400
- PASS POST missing fields 400
- PASS POST wrong types 400
- PASS POST blank name 400
- PASS POST invalid email 400
- PASS POST invalid service 400
- PASS POST long name 400
- PASS POST long phone 400
- PASS POST long message 400
- PASS GET list missing token 401
- PASS GET list wrong token 401
- PASS GET /abc missing token 401
- PASS GET /abc wrong token 401
- PASS GET /2147483647 missing token 401
- PASS GET /2147483647 wrong token 401
- PASS PATCH /abc missing token 401
- PASS PATCH /abc wrong token 401
- PASS PATCH /2147483647 missing token 401
- PASS PATCH /2147483647 wrong token 401
- PASS GET list  200, filters/order/cap
- PASS GET list ?status=new 200, filters/order/cap
- PASS GET list ?category=booking 200, filters/order/cap
- PASS GET list ?status=new&category=booking 200, filters/order/cap
- PASS GET ?status=bad 400
- PASS GET ?category=bad 400
- PASS GET ?status= 400
- PASS GET ?status=new&category=bad 400
- PASS GET id 200
- PASS GET /abc 404
- PASS GET /2147483647 404
- PASS GET /99999999999999999999 404
- PASS PATCH /abc 404
- PASS PATCH /2147483647 404
- PASS PATCH /99999999999999999999 404
- PASS PATCH {"status":"contacted"} 200
- PASS PATCH {"status":"won"} 200
- PASS PATCH {"status":"lost"} 200
- PASS PATCH {"status":"new","note":" raw note "} 200
- PASS PATCH {"note":"replacement"} 200
- PASS PATCH {"note":""} 200
- PASS PATCH invalid { 400
- PASS PATCH invalid null 400
- PASS PATCH invalid [] 400
- PASS PATCH invalid {} 400
- PASS PATCH invalid {"status":"bad"} 400
- PASS PATCH invalid {"status":3} 400
- PASS PATCH invalid {"note":null} 400
- PASS PATCH invalid {"note":"xxxxxxxxxxxxxxxxxxxxxxx 400

## Owner smoke: pass/fail per check

- PASS public page and form fields 200
- PASS dashboard redirects unauthenticated owner
- PASS forged session cannot read dashboard
- PASS wrong owner credentials show error
- PASS correct owner login issues httpOnly SameSite signed session
- PASS signed session reads dashboard without browser API token
- PASS owner saves existing lead through shared validation/query
- PASS owner mutation rejects missing session
- PASS dashboard filters render for authenticated owner
- PASS logout clears owner cookie

One verification lead remains from the API run. Owner changes were restored. Webhook.site receipt confirmation and the absence of live AI keys were supplied by Melvyn; the smoke runner itself cannot inspect the receiver inbox or Vercel secrets.
