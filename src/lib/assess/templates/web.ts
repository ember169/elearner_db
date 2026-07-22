import type { QuestionTemplate } from "../types";

export const WEB_TEMPLATES: QuestionTemplate[] = [
// --- web-fundamentals (Web development) ---

// WF-1: HTTP methods/status codes (difficulty 1, predict_output)
{
  competencyId: "web-fundamentals",
  subTopic: "http-methods-status-codes",
  questionType: "predict_output",
  difficulty: 1,
  questionText: `A client sends the following HTTP request to a REST API:

\`\`\`
PUT /api/users/42 HTTP/1.1
Host: example.com
Content-Type: application/json
If-Match: "e0023aa4e"

{"name": "Alice", "email": "alice@example.com"}
\`\`\`

The server finds user 42, but the ETag stored on the server is "f1a2b3c4d". The server implements proper conditional request handling.

What HTTP status code will the server return, and what response headers should it include? Explain why this mechanism exists and what would happen if the ETag matched.`,
  rubric: {
    maxScore: 6,
    criteria: [
      { id: "status_code", description: "Correctly identifies 412 Precondition Failed", points: 2, keywords: ["412", "precondition failed"], check: "Student names HTTP 412 as the response status code" },
      { id: "etag_mismatch", description: "Explains that the If-Match ETag does not match the server's current ETag", points: 1, keywords: ["etag", "mismatch", "does not match", "different", "If-Match"], check: "Student explains the comparison between client-supplied and server-stored ETag values" },
      { id: "concurrency_purpose", description: "Explains optimistic concurrency control / lost update prevention", points: 2, keywords: ["concurrency", "lost update", "race condition", "optimistic", "concurrent", "overwrite"], check: "Student describes the purpose as preventing concurrent modifications from overwriting each other" },
      { id: "match_scenario", description: "Describes the success path: 200 OK with updated resource if ETag matched", points: 1, keywords: ["200", "success", "update", "matched", "proceed"], check: "Student explains that a matching ETag would allow the PUT to proceed and return 200 OK" }
    ],
    gaps: [
      { if_missing: "status_code", gap: "Does not know HTTP conditional request status codes (412 Precondition Failed)" },
      { if_missing: "etag_mismatch", gap: "Does not understand If-Match header semantics and ETag comparison" },
      { if_missing: "concurrency_purpose", gap: "Does not understand why conditional requests exist (optimistic concurrency control)" },
      { if_missing: "match_scenario", gap: "Cannot trace through the success path of conditional PUT requests" }
    ]
  }
},

// WF-2: Cookies/sessions (difficulty 2, predict_output)
{
  competencyId: "web-fundamentals",
  subTopic: "cookies-sessions",
  questionType: "predict_output",
  difficulty: 2,
  questionText: `A Flask application sets cookies as follows:

\`\`\`python
from flask import Flask, make_response

app = Flask(__name__)

@app.route('/login')
def login():
    resp = make_response("Logged in")
    resp.set_cookie('session_id', 'abc123',
                     httponly=True,
                     secure=True,
                     samesite='Strict',
                     max_age=3600,
                     domain='.example.com',
                     path='/dashboard')
    return resp
\`\`\`

A user visits https://example.com/login and receives the cookie. For each scenario below, predict whether the browser will send the \`session_id\` cookie and explain why:

1. The user navigates to https://example.com/dashboard/settings
2. The user navigates to https://example.com/profile
3. A page on https://evil.com has a link to https://example.com/dashboard that the user clicks
4. JavaScript on the dashboard page runs \`document.cookie\` to read the cookie
5. The user navigates to http://example.com/dashboard (note: HTTP, not HTTPS)`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "scenario_1", description: "Cookie IS sent: path /dashboard/settings is under /dashboard", points: 1, keywords: ["sent", "path matches", "subdirectory", "prefix", "/dashboard"], check: "Student correctly says cookie is sent because path /dashboard/settings falls under the /dashboard path scope" },
      { id: "scenario_2", description: "Cookie NOT sent: /profile is outside the /dashboard path", points: 1, keywords: ["not sent", "path", "outside", "/profile", "does not match"], check: "Student correctly says cookie is not sent because /profile is not under /dashboard" },
      { id: "scenario_3", description: "Cookie NOT sent: SameSite=Strict blocks cross-site navigation", points: 2, keywords: ["not sent", "samesite", "strict", "cross-site", "cross-origin", "evil.com"], check: "Student correctly identifies that SameSite=Strict prevents the cookie from being sent on cross-site top-level navigation" },
      { id: "scenario_4", description: "Cookie NOT accessible: HttpOnly prevents JavaScript access", points: 2, keywords: ["not accessible", "httponly", "javascript", "document.cookie", "cannot read"], check: "Student correctly says HttpOnly flag prevents document.cookie from reading the cookie" },
      { id: "scenario_5", description: "Cookie NOT sent: Secure flag requires HTTPS", points: 2, keywords: ["not sent", "secure", "https", "http", "plaintext", "unencrypted"], check: "Student correctly says the Secure flag prevents the cookie from being sent over plain HTTP" }
    ],
    gaps: [
      { if_missing: "scenario_1", gap: "Does not understand cookie path scoping rules (prefix matching)" },
      { if_missing: "scenario_2", gap: "Does not understand cookie path scoping rules (paths outside scope)" },
      { if_missing: "scenario_3", gap: "Does not understand SameSite=Strict behavior on cross-site navigation" },
      { if_missing: "scenario_4", gap: "Does not understand the HttpOnly flag and its protection against JavaScript access" },
      { if_missing: "scenario_5", gap: "Does not understand the Secure flag and its requirement for HTTPS transport" }
    ]
  }
},

// WF-3: SQL basics (difficulty 1, spot_vuln)
{
  competencyId: "web-fundamentals",
  subTopic: "database-queries-sql",
  questionType: "spot_vuln",
  difficulty: 1,
  questionText: `A developer writes the following SQL queries for a blog application. Identify any issues with each query (functional bugs, performance problems, or logical errors):

\`\`\`sql
-- Query 1: Get all posts by a user with their comments count
SELECT p.*, COUNT(c.id) as comment_count
FROM posts p, comments c
WHERE p.user_id = 5 AND c.post_id = p.id;

-- Query 2: Get the 10 most recent posts
SELECT * FROM posts ORDER BY created_at DESC LIMIT 10;

-- Query 3: Delete a user and their data
DELETE FROM users WHERE id = 5;
DELETE FROM posts WHERE user_id = 5;
DELETE FROM comments WHERE user_id = 5;
\`\`\`

For each query, explain what will go wrong and how to fix it.`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "q1_group_by", description: "Identifies missing GROUP BY clause in Query 1", points: 2, keywords: ["GROUP BY", "group by", "aggregate", "grouping", "single row"], check: "Student identifies that COUNT without GROUP BY will collapse all rows into a single result instead of per-post counts" },
      { id: "q1_join_syntax", description: "Notes the implicit join (comma syntax) should be explicit JOIN", points: 1, keywords: ["implicit join", "explicit join", "JOIN", "INNER JOIN", "comma", "cartesian"], check: "Student notes the old-style comma join should be an explicit JOIN for clarity and safety" },
      { id: "q2_index", description: "Notes potential performance issue without index on created_at", points: 1, keywords: ["index", "full table scan", "performance", "created_at", "ORDER BY"], check: "Student identifies that ORDER BY created_at without an index causes a full table scan on large tables" },
      { id: "q3_order", description: "Identifies wrong deletion order: users deleted before dependent records, or missing CASCADE/transaction", points: 2, keywords: ["foreign key", "cascade", "order", "constraint", "transaction", "referential integrity", "dependent"], check: "Student explains that deleting from users first may violate foreign key constraints, or that this should be in a transaction / use CASCADE" },
      { id: "q1_left_join", description: "Notes that INNER JOIN would miss posts with zero comments; LEFT JOIN needed", points: 1, keywords: ["LEFT JOIN", "left join", "zero comments", "no comments", "missing posts", "NULL"], check: "Student identifies that posts with no comments would be excluded and suggests LEFT JOIN" }
    ],
    gaps: [
      { if_missing: "q1_group_by", gap: "Does not understand SQL aggregate functions and GROUP BY requirements" },
      { if_missing: "q1_join_syntax", gap: "Not familiar with modern explicit JOIN syntax vs implicit comma joins" },
      { if_missing: "q2_index", gap: "Does not consider database indexing for query performance" },
      { if_missing: "q3_order", gap: "Does not understand referential integrity and foreign key constraints in deletion operations" },
      { if_missing: "q1_left_join", gap: "Does not understand the difference between INNER JOIN and LEFT JOIN for optional relationships" }
    ]
  }
},

// WF-4: CORS (difficulty 2, spot_vuln)
{
  competencyId: "web-fundamentals",
  subTopic: "cors",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `A developer configures CORS on their Express.js API like this:

\`\`\`javascript
const express = require('express');
const app = express();

app.use((req, res, next) => {
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.get('/api/user/profile', (req, res) => {
    // Returns authenticated user's profile based on session cookie
    res.json({ name: 'Alice', email: 'alice@corp.com', role: 'admin' });
});
\`\`\`

Identify the security issue in this CORS configuration. Explain how an attacker could exploit it and what the correct configuration should be.`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "reflect_origin", description: "Identifies that the server reflects any Origin header back as allowed", points: 2, keywords: ["reflects", "any origin", "dynamic", "mirrors", "echoes", "wildcard", "req.headers.origin"], check: "Student identifies the pattern of reflecting the request Origin header directly into Access-Control-Allow-Origin" },
      { id: "credentials_issue", description: "Explains the danger of Allow-Credentials with reflected origin", points: 2, keywords: ["credentials", "cookies", "session", "authenticated", "Allow-Credentials"], check: "Student explains that combining reflected origin with Allow-Credentials means any site can make authenticated requests" },
      { id: "attack_scenario", description: "Describes a realistic cross-origin attack exploiting this misconfiguration", points: 2, keywords: ["attacker", "evil", "malicious", "fetch", "XMLHttpRequest", "steal", "exfiltrate", "read response"], check: "Student describes an attack where a malicious site makes authenticated API requests and reads the response containing user data" },
      { id: "fix", description: "Proposes correct fix: whitelist of allowed origins", points: 1, keywords: ["whitelist", "allowlist", "specific origins", "check against", "list", "validate"], check: "Student proposes checking the Origin against an explicit allowlist of trusted domains" }
    ],
    gaps: [
      { if_missing: "reflect_origin", gap: "Cannot identify insecure CORS origin reflection patterns" },
      { if_missing: "credentials_issue", gap: "Does not understand the security implications of Access-Control-Allow-Credentials with permissive origins" },
      { if_missing: "attack_scenario", gap: "Cannot construct a realistic CORS exploitation scenario" },
      { if_missing: "fix", gap: "Does not know the correct approach to CORS origin validation (allowlisting)" }
    ]
  }
},

// WF-5: REST API design (difficulty 3, trace_explain)
{
  competencyId: "web-fundamentals",
  subTopic: "rest-api-design",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Examine this Node.js/Express REST API for a task management system:

\`\`\`javascript
const express = require('express');
const app = express();
app.use(express.json());

// Get all tasks
app.get('/getTasks', (req, res) => {
    const status = req.body.status;  // filter by status
    db.query('SELECT * FROM tasks WHERE status = ?', [status], (err, results) => {
        res.json(results);
    });
});

// Create task
app.get('/createTask', (req, res) => {
    const { title, description } = req.query;
    db.query('INSERT INTO tasks SET ?', { title, description }, (err, result) => {
        res.json({ message: 'Task created', id: result.insertId });
    });
});

// Update task
app.post('/api/tasks/update', (req, res) => {
    db.query('UPDATE tasks SET ? WHERE id = ?', [req.body, req.body.id], (err) => {
        res.json({ message: 'Updated' });
    });
});

// Delete task
app.post('/deleteTask', (req, res) => {
    db.query('DELETE FROM tasks WHERE id = ?', [req.body.id], (err) => {
        res.status(200).json({ message: 'Deleted successfully' });
    });
});
\`\`\`

Identify all REST design violations and explain how to restructure this API following REST conventions. Cover HTTP methods, URL structure, status codes, request body usage, and error handling.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "verb_urls", description: "Identifies that URLs contain verbs (getTasks, createTask, deleteTask) instead of nouns", points: 1, keywords: ["verbs in URL", "noun", "resource", "/tasks", "/api/tasks", "RESTful", "action in URL"], check: "Student identifies that REST URLs should be nouns (resources) not verbs, e.g., /api/tasks instead of /getTasks" },
      { id: "wrong_methods", description: "Identifies incorrect HTTP methods: GET for create, POST for delete", points: 2, keywords: ["GET for create", "POST for delete", "POST", "PUT", "PATCH", "DELETE", "idempotent", "safe method"], check: "Student identifies that createTask uses GET (should be POST) and deleteTask uses POST (should be DELETE)" },
      { id: "body_in_get", description: "Identifies that GET /getTasks reads from request body (non-standard)", points: 1, keywords: ["body in GET", "query parameters", "GET request body", "ignored", "query string"], check: "Student notes that GET requests should use query parameters, not request body, for filtering" },
      { id: "status_codes", description: "Suggests proper status codes: 201 Created, 204 No Content, 404 Not Found", points: 2, keywords: ["201", "204", "404", "status code", "Created", "No Content", "Not Found"], check: "Student suggests appropriate HTTP status codes: 201 for creation, 204 for deletion, 404 for missing resources" },
      { id: "error_handling", description: "Notes missing error handling for database errors and not-found cases", points: 1, keywords: ["error handling", "err", "try catch", "500", "not found", "null check", "database error"], check: "Student identifies that database errors are silently ignored and no error responses are sent" },
      { id: "url_params", description: "Suggests using URL parameters for resource identifiers (e.g., /api/tasks/:id)", points: 1, keywords: ["URL parameter", "path parameter", ":id", "/tasks/:id", "resource identifier"], check: "Student suggests using path parameters like /api/tasks/:id instead of passing ID in request body for updates and deletes" }
    ],
    gaps: [
      { if_missing: "verb_urls", gap: "Does not understand REST resource naming conventions (nouns, not verbs)" },
      { if_missing: "wrong_methods", gap: "Does not understand the semantic meaning of HTTP methods (GET=read, POST=create, PUT/PATCH=update, DELETE=delete)" },
      { if_missing: "body_in_get", gap: "Does not know that GET request bodies are non-standard and typically ignored" },
      { if_missing: "status_codes", gap: "Does not know standard HTTP status codes for CRUD operations" },
      { if_missing: "error_handling", gap: "Does not consider error handling in API design" },
      { if_missing: "url_params", gap: "Does not understand REST URL structure with path parameters for resource identifiers" }
    ]
  }
},

// WF-6: Authentication mechanisms - JWT (difficulty 3, trace_explain)
{
  competencyId: "web-fundamentals",
  subTopic: "authentication-jwt",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `A developer implements JWT authentication in a Flask application:

\`\`\`python
import jwt
import datetime
from flask import Flask, request, jsonify

app = Flask(__name__)
SECRET_KEY = "mysecretkey123"

@app.route('/login', methods=['POST'])
def login():
    username = request.json['username']
    password = request.json['password']
    user = db.find_user(username, password)
    if user:
        token = jwt.encode({
            'user_id': user.id,
            'role': user.role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
        }, SECRET_KEY, algorithm='HS256')
        return jsonify({'token': token})
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/admin', methods=['GET'])
def admin_panel():
    token = request.headers.get('Authorization')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        if payload['role'] == 'admin':
            return jsonify({'data': 'secret admin stuff'})
        return jsonify({'error': 'Forbidden'}), 403
    except:
        return jsonify({'error': 'Invalid token'}), 401
\`\`\`

Trace through the following scenario: A regular user logs in, receives a JWT, then tries to access /api/admin. Explain what happens at each step, what information is stored in the JWT, and identify all issues with this implementation (security, design, and operational).`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "jwt_structure", description: "Explains JWT structure (header.payload.signature) and that payload is base64-encoded, not encrypted", points: 1, keywords: ["header", "payload", "signature", "base64", "not encrypted", "three parts", "encoded"], check: "Student explains that JWT consists of header, payload, and signature, and that the payload is merely encoded, not encrypted" },
      { id: "trace_flow", description: "Correctly traces the login flow and the 403 response for non-admin user", points: 2, keywords: ["login", "403", "role", "forbidden", "payload", "decode", "check role"], check: "Student traces: user logs in, gets JWT with role in payload, sends to /api/admin, server decodes and checks role, returns 403 because role is not admin" },
      { id: "long_expiry", description: "Identifies 30-day expiry as too long with no refresh/revocation mechanism", points: 1, keywords: ["30 days", "expiry", "expiration", "too long", "revocation", "refresh token", "revoke"], check: "Student identifies that 30-day token lifetime is excessive and there is no way to revoke compromised tokens" },
      { id: "weak_secret", description: "Identifies the hardcoded weak secret key", points: 1, keywords: ["weak secret", "hardcoded", "mysecretkey123", "brute force", "environment variable", "strong key"], check: "Student identifies the secret key is weak, hardcoded, and should be a strong random value from environment variables" },
      { id: "role_in_jwt", description: "Explains risk of storing role in JWT (role escalation if token is tampered and secret is weak)", points: 2, keywords: ["role", "tamper", "escalation", "modify", "privilege", "claim", "server-side check"], check: "Student explains that storing the role in the JWT means a cracked secret allows role escalation, and that role should ideally be checked against the database" },
      { id: "bearer_prefix", description: "Notes missing 'Bearer ' prefix parsing from Authorization header", points: 1, keywords: ["Bearer", "prefix", "Authorization", "split", "strip", "parsing"], check: "Student notes the code reads the full Authorization header without stripping the standard 'Bearer ' prefix" },
      { id: "bare_except", description: "Notes the bare except clause hides different error types", points: 1, keywords: ["bare except", "exception", "expired", "invalid", "different errors", "specific exception"], check: "Student identifies the bare except catches all exceptions, masking the difference between expired tokens, invalid signatures, and other errors" }
    ],
    gaps: [
      { if_missing: "jwt_structure", gap: "Does not understand JWT internal structure and encoding vs encryption" },
      { if_missing: "trace_flow", gap: "Cannot trace through JWT authentication flow step by step" },
      { if_missing: "long_expiry", gap: "Does not consider token lifetime and revocation as security factors" },
      { if_missing: "weak_secret", gap: "Does not recognize hardcoded weak secrets as a security issue" },
      { if_missing: "role_in_jwt", gap: "Does not understand the risks of storing authorization claims in JWTs" },
      { if_missing: "bearer_prefix", gap: "Not familiar with the Authorization: Bearer <token> standard" },
      { if_missing: "bare_except", gap: "Does not understand the importance of specific exception handling" }
    ]
  }
},

// WF-7: Server configuration - Nginx (difficulty 3, fix_code)
{
  competencyId: "web-fundamentals",
  subTopic: "server-configuration",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `A junior admin sets up an Nginx reverse proxy for an internal Flask application. Users report that the application shows the wrong client IP in logs, WebSocket connections fail, and large file uploads are rejected. Here is the configuration:

\`\`\`nginx
server {
    listen 80;
    server_name app.internal.corp;

    location / {
        proxy_pass http://127.0.0.1:5000;
    }

    location /static/ {
        alias /var/www/app/static;
    }
}
\`\`\`

Fix all the issues in this configuration: correct client IP forwarding, WebSocket support, file upload size limits, and the static file serving bug. Explain each change you make.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "proxy_headers", description: "Adds proxy headers: X-Forwarded-For, X-Real-IP, X-Forwarded-Proto, Host", points: 2, keywords: ["X-Forwarded-For", "X-Real-IP", "proxy_set_header", "Host", "X-Forwarded-Proto", "$remote_addr", "$proxy_add_x_forwarded_for"], check: "Student adds proxy_set_header directives for Host, X-Real-IP, X-Forwarded-For, and X-Forwarded-Proto" },
      { id: "websocket", description: "Adds WebSocket upgrade support with Upgrade and Connection headers", points: 2, keywords: ["Upgrade", "Connection", "websocket", "$http_upgrade", "proxy_http_version 1.1", "upgrade"], check: "Student adds proxy_http_version 1.1, proxy_set_header Upgrade $http_upgrade, and proxy_set_header Connection 'upgrade' for WebSocket" },
      { id: "upload_size", description: "Sets client_max_body_size to allow large uploads", points: 1, keywords: ["client_max_body_size", "upload", "413", "body size"], check: "Student adds client_max_body_size directive with an appropriate value to allow file uploads" },
      { id: "static_trailing_slash", description: "Fixes the alias missing trailing slash: alias /var/www/app/static/", points: 2, keywords: ["trailing slash", "alias", "/static/", "slash at end", "path mapping"], check: "Student identifies that alias directive needs a trailing slash to properly map the path (alias /var/www/app/static/)" },
      { id: "https_redirect", description: "Suggests adding HTTPS or redirect from HTTP to HTTPS", points: 1, keywords: ["HTTPS", "SSL", "TLS", "redirect", "443", "ssl_certificate", "certbot"], check: "Student suggests the server should use HTTPS, not plain HTTP on port 80" }
    ],
    gaps: [
      { if_missing: "proxy_headers", gap: "Does not understand reverse proxy header forwarding for client IP preservation" },
      { if_missing: "websocket", gap: "Does not know how to configure Nginx for WebSocket proxy support" },
      { if_missing: "upload_size", gap: "Does not know about Nginx client_max_body_size for upload limits" },
      { if_missing: "static_trailing_slash", gap: "Does not understand Nginx alias directive path mapping rules (trailing slash requirement)" },
      { if_missing: "https_redirect", gap: "Does not consider HTTPS as a baseline requirement for web applications" }
    ]
  }
},

// WF-8: Caching - ETags/Cache-Control (difficulty 3, trace_explain)
{
  competencyId: "web-fundamentals",
  subTopic: "caching-etags",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Trace through the following sequence of HTTP requests and responses for a web application that serves a JavaScript bundle. Explain what happens at each step, including what the browser cache does.

**Step 1 - First visit:**
\`\`\`
GET /app.js HTTP/1.1
Host: cdn.example.com

HTTP/1.1 200 OK
Content-Type: application/javascript
Cache-Control: public, max-age=31536000, immutable
ETag: "v2.5.1-a1b2c3"
Content-Length: 245000

(245KB of JavaScript)
\`\`\`

**Step 2 - User visits the same page 10 minutes later:**
The browser needs /app.js again.

**Step 3 - Developer deploys a new version. The HTML now references /app.js?v=2.6.0. User visits the updated page:**
\`\`\`
GET /app.js?v=2.6.0 HTTP/1.1
Host: cdn.example.com

HTTP/1.1 200 OK
Cache-Control: public, max-age=31536000, immutable
ETag: "v2.6.0-d4e5f6"
Content-Length: 251000

(251KB of JavaScript)
\`\`\`

Explain: (1) Why does the browser not make a network request in Step 2? (2) Why does cache busting with a query parameter work even though the file is cached for a year? (3) What does "immutable" do? (4) What would happen differently if the Cache-Control were "no-cache" instead?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "step2_cache_hit", description: "Explains that max-age has not expired so browser serves from cache without any network request", points: 2, keywords: ["cache hit", "max-age", "not expired", "fresh", "no request", "no network", "local cache"], check: "Student explains that 10 minutes is well within the 31536000-second (1 year) max-age, so the browser serves the file directly from local cache" },
      { id: "cache_busting", description: "Explains that the query parameter changes the URL, so it is a different cache key", points: 2, keywords: ["query parameter", "cache key", "different URL", "cache bust", "v=2.6.0", "new resource", "new entry"], check: "Student explains that the browser treats /app.js?v=2.6.0 as a completely different resource from /app.js, so it has no cached version" },
      { id: "immutable_meaning", description: "Explains that immutable tells the browser to never revalidate during max-age, even on hard refresh", points: 2, keywords: ["immutable", "revalidate", "hard refresh", "conditional request", "If-None-Match", "never changes"], check: "Student explains that 'immutable' tells the browser that the resource will not change during its freshness lifetime, skipping revalidation even on user-initiated refreshes" },
      { id: "no_cache_contrast", description: "Explains that no-cache forces revalidation on every request (conditional GET with ETag)", points: 2, keywords: ["no-cache", "revalidate", "every request", "conditional", "304", "If-None-Match", "Not Modified", "always checks"], check: "Student explains that no-cache would force the browser to revalidate with the server on every request, sending If-None-Match with the ETag, and getting either 304 or a new 200" }
    ],
    gaps: [
      { if_missing: "step2_cache_hit", gap: "Does not understand Cache-Control max-age freshness and how browsers avoid network requests for cached resources" },
      { if_missing: "cache_busting", gap: "Does not understand cache busting via query parameters (URL = cache key)" },
      { if_missing: "immutable_meaning", gap: "Does not know the meaning of the immutable Cache-Control directive" },
      { if_missing: "no_cache_contrast", gap: "Does not understand the difference between max-age caching and no-cache (always revalidate)" }
    ]
  }
},

// WF-9: TLS/HTTPS (difficulty 3, trace_explain)
{
  competencyId: "web-fundamentals",
  subTopic: "tls-https",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `During a penetration test, you capture the following with Wireshark while a user accesses https://secure.corp.com:

\`\`\`
1. Client -> Server: ClientHello (TLS 1.3, supported cipher suites, SNI: secure.corp.com)
2. Server -> Client: ServerHello (selected cipher: TLS_AES_256_GCM_SHA384)
3. Server -> Client: Certificate (CN=*.corp.com, issued by Let's Encrypt R3)
4. Server -> Client: CertificateVerify
5. Client -> Server: Finished
6. Server -> Client: Finished
7. [Encrypted Application Data]
\`\`\`

Explain the purpose of each step in this TLS 1.3 handshake. Specifically address:
1. What is SNI and why is it sent in plaintext? What privacy issue does this create?
2. How does the client verify the server's certificate is legitimate?
3. Why does TLS 1.3 have fewer round trips than TLS 1.2?
4. After the handshake, can a network observer see which specific pages the user visits?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "sni_explained", description: "Explains SNI sends hostname in plaintext for virtual hosting, creating a privacy leak", points: 2, keywords: ["SNI", "Server Name Indication", "plaintext", "hostname", "virtual host", "privacy", "observer", "see which site", "ECH", "Encrypted Client Hello"], check: "Student explains that SNI is needed so the server knows which certificate to present (for shared hosting), but it leaks the target hostname to any network observer" },
      { id: "cert_verification", description: "Explains certificate chain validation: CA signature, chain of trust, root store", points: 2, keywords: ["certificate chain", "CA", "certificate authority", "root", "trust", "signature", "verify", "Let's Encrypt", "chain of trust", "root store"], check: "Student explains that the client verifies the certificate by checking the CA signature chain up to a trusted root CA in the local trust store" },
      { id: "tls13_fewer_rtt", description: "Explains TLS 1.3 uses 1-RTT handshake (vs 2-RTT in TLS 1.2) by combining steps", points: 2, keywords: ["1-RTT", "round trip", "fewer", "TLS 1.2", "combined", "0-RTT", "key share", "ServerHello", "one round trip"], check: "Student explains that TLS 1.3 achieves a 1-RTT handshake by sending key shares in ClientHello, compared to TLS 1.2 which required a separate key exchange step" },
      { id: "encrypted_urls", description: "Explains that after handshake, URLs, paths, and content are encrypted, but IP address and SNI remain visible", points: 2, keywords: ["encrypted", "URL", "path", "content", "IP address", "visible", "cannot see", "pages", "observer"], check: "Student explains that HTTP request/response data (including URLs and paths) is encrypted, but the IP address and SNI hostname remain visible to observers" }
    ],
    gaps: [
      { if_missing: "sni_explained", gap: "Does not understand SNI, its purpose, and its privacy implications in TLS" },
      { if_missing: "cert_verification", gap: "Does not understand the TLS certificate chain of trust and verification process" },
      { if_missing: "tls13_fewer_rtt", gap: "Does not understand the performance improvements in TLS 1.3 vs 1.2 handshakes" },
      { if_missing: "encrypted_urls", gap: "Does not understand what metadata remains visible vs encrypted after TLS handshake" }
    ]
  }
},

// WF-10: WebSockets (difficulty 3, fix_code)
{
  competencyId: "web-fundamentals",
  subTopic: "websockets",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `A developer builds a real-time chat application using WebSockets with Node.js. Users report that messages sometimes go to the wrong chatroom, disconnections are not handled, and the server crashes under load. Review and fix the code:

\`\`\`javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let clients = [];

wss.on('connection', (ws) => {
    clients.push(ws);

    ws.on('message', (data) => {
        const msg = JSON.parse(data);
        // Broadcast to everyone
        clients.forEach(client => {
            client.send(JSON.stringify(msg));
        });
    });
});
\`\`\`

Fix the following issues:
1. No room/channel separation (messages go to all users)
2. No disconnection cleanup (dead sockets stay in the array)
3. No error handling for malformed JSON
4. No check if client connection is still open before sending
5. Broadcasting sends the message back to the sender

Show the corrected code and explain each fix.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "room_separation", description: "Implements room/channel concept so messages only go to same-room clients", points: 2, keywords: ["room", "channel", "Map", "group", "room_id", "filter", "separate", "namespace"], check: "Student implements a room system (e.g., Map of room -> clients) so messages are only broadcast within the same room" },
      { id: "disconnect_cleanup", description: "Adds 'close' event handler to remove disconnected clients", points: 2, keywords: ["close", "disconnect", "remove", "cleanup", "splice", "delete", "filter", "on('close')"], check: "Student adds a ws.on('close') handler that removes the client from the room/client list" },
      { id: "json_error", description: "Wraps JSON.parse in try-catch to handle malformed messages", points: 1, keywords: ["try", "catch", "JSON.parse", "malformed", "invalid", "error handling", "SyntaxError"], check: "Student wraps the JSON.parse call in a try-catch block to handle malformed JSON without crashing" },
      { id: "ready_state", description: "Checks ws.readyState === WebSocket.OPEN before sending", points: 2, keywords: ["readyState", "OPEN", "WebSocket.OPEN", "connected", "check", "before sending"], check: "Student adds a readyState check before calling client.send() to avoid sending to closed connections" },
      { id: "skip_sender", description: "Filters out the sender when broadcasting", points: 1, keywords: ["sender", "skip", "exclude", "client !== ws", "not self", "filter sender"], check: "Student adds a check to skip the sending client during broadcast (client !== ws)" }
    ],
    gaps: [
      { if_missing: "room_separation", gap: "Does not understand how to implement channel-based message routing in WebSocket applications" },
      { if_missing: "disconnect_cleanup", gap: "Does not handle WebSocket connection lifecycle (cleanup on disconnect)" },
      { if_missing: "json_error", gap: "Does not handle malformed input in WebSocket message handlers" },
      { if_missing: "ready_state", gap: "Does not check WebSocket readyState before sending messages" },
      { if_missing: "skip_sender", gap: "Does not consider echo prevention in broadcast messaging" }
    ]
  }
},

// WF-11: Content types/MIME (difficulty 4, design_solution)
{
  competencyId: "web-fundamentals",
  subTopic: "content-types-mime",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `You are building a file-sharing API endpoint that accepts file uploads and serves them back to users. The system must handle images, PDFs, text files, and Office documents.

Design the complete upload and download flow, addressing these concerns:

1. How do you validate the actual file type (not just the extension or Content-Type header sent by the client)?
2. What Content-Type and Content-Disposition headers should you set when serving files back?
3. How do you prevent a user from uploading a .html or .svg file that contains JavaScript and serving it from your domain (where it could steal cookies)?
4. What MIME type pitfalls exist when a browser does "content sniffing"?

Provide code snippets for the critical security checks.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "magic_bytes", description: "Validates file type using magic bytes/file signatures, not just extensions or headers", points: 2, keywords: ["magic bytes", "file signature", "header bytes", "magic number", "libmagic", "python-magic", "file-type", "first bytes"], check: "Student describes reading the file's magic bytes/header to verify actual file type, noting that extensions and client-sent Content-Type are untrusted" },
      { id: "content_disposition", description: "Sets Content-Disposition: attachment for untrusted files to force download", points: 2, keywords: ["Content-Disposition", "attachment", "inline", "download", "force download", "filename"], check: "Student explains using Content-Disposition: attachment to force browser download rather than inline rendering for potentially dangerous file types" },
      { id: "nosniff", description: "Sets X-Content-Type-Options: nosniff to prevent MIME sniffing", points: 1, keywords: ["nosniff", "X-Content-Type-Options", "MIME sniffing", "content sniffing", "sniff"], check: "Student includes X-Content-Type-Options: nosniff header to prevent browsers from overriding the declared Content-Type" },
      { id: "svg_html_danger", description: "Explains SVG/HTML files can contain JavaScript and describes mitigation (separate domain or CSP)", points: 2, keywords: ["SVG", "HTML", "JavaScript", "script", "XSS", "separate domain", "sandbox", "CSP", "different origin", "cookie"], check: "Student explains that SVG and HTML files can contain JavaScript, and that serving them from the main domain enables XSS and cookie theft, suggesting mitigations like a separate domain or CSP" },
      { id: "allowlist", description: "Uses an allowlist of permitted MIME types rather than a blocklist", points: 1, keywords: ["allowlist", "whitelist", "permitted", "allowed types", "deny by default", "blocklist"], check: "Student proposes an allowlist of accepted MIME types rather than trying to block known-bad types" }
    ],
    gaps: [
      { if_missing: "magic_bytes", gap: "Does not know how to validate file types using magic bytes/file signatures" },
      { if_missing: "content_disposition", gap: "Does not understand Content-Disposition header for controlling browser file handling" },
      { if_missing: "nosniff", gap: "Does not know about X-Content-Type-Options: nosniff and MIME sniffing attacks" },
      { if_missing: "svg_html_danger", gap: "Does not understand the XSS risk of serving user-uploaded SVG/HTML from the application domain" },
      { if_missing: "allowlist", gap: "Uses blocklist instead of allowlist approach for file type validation" }
    ]
  }
},

// WF-12: URL routing and form handling (difficulty 4, design_solution)
{
  competencyId: "web-fundamentals",
  subTopic: "url-routing-form-handling",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `You need to design the URL structure and form handling for an e-commerce checkout flow that supports:

1. Multi-step checkout: cart review -> shipping address -> payment -> confirmation
2. Users can go back and forth between steps without losing data
3. Each step validates its data before allowing progress
4. The payment form must protect against double-submission
5. Users who refresh the confirmation page should not be charged again (the PRG pattern)

Design the URL scheme, HTTP methods for each step, and the server-side flow. Explain how the Post-Redirect-Get pattern works and why it matters here. Include how you would handle validation errors (show them on the same page without losing form data).`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "prg_pattern", description: "Correctly explains Post-Redirect-Get: POST processes data, 303 redirects to GET confirmation page", points: 2, keywords: ["Post-Redirect-Get", "PRG", "303", "redirect", "GET after POST", "refresh", "resubmission", "See Other"], check: "Student explains the PRG pattern: form POSTs to server, server processes and responds with a 303 redirect to a GET page, preventing resubmission on refresh" },
      { id: "idempotency", description: "Addresses double-submission with idempotency key or token", points: 2, keywords: ["idempotency", "idempotent", "token", "nonce", "unique key", "double submit", "duplicate", "once"], check: "Student describes using an idempotency key, unique token, or similar mechanism to prevent duplicate payment processing" },
      { id: "session_state", description: "Uses server-side session to preserve form data across steps", points: 1, keywords: ["session", "server-side", "store", "persist", "step data", "multi-step"], check: "Student describes storing checkout data in a server-side session so users can navigate between steps without data loss" },
      { id: "validation_redisplay", description: "On validation failure, re-renders the form with errors and the user's input preserved", points: 2, keywords: ["validation error", "re-render", "redisplay", "preserve input", "error messages", "repopulate", "flash", "same page"], check: "Student describes re-rendering the form with validation errors displayed and previously-entered values pre-filled" },
      { id: "url_design", description: "Uses logical URL structure: GET for displaying forms, POST for processing, clear step names", points: 1, keywords: ["GET", "POST", "/checkout/shipping", "/checkout/payment", "step", "URL", "route"], check: "Student designs a clear URL scheme with separate routes per step, GET to display forms and POST to process them" }
    ],
    gaps: [
      { if_missing: "prg_pattern", gap: "Does not understand the Post-Redirect-Get pattern and its importance for preventing form resubmission" },
      { if_missing: "idempotency", gap: "Does not understand idempotency in payment processing to prevent double charges" },
      { if_missing: "session_state", gap: "Does not know how to maintain state across multi-step form flows" },
      { if_missing: "validation_redisplay", gap: "Does not understand server-side form validation with error redisplay" },
      { if_missing: "url_design", gap: "Cannot design RESTful URL structures for multi-step workflows" }
    ]
  }
},

// WF-13: DOM/JavaScript frontend (difficulty 4, compare_contrast)
{
  competencyId: "web-fundamentals",
  subTopic: "frontend-dom-js",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText: `Compare these three approaches to rendering a dynamic list of 10,000 user search results on a web page:

**Approach A: innerHTML**
\`\`\`javascript
function renderResults(users) {
    let html = '';
    users.forEach(user => {
        html += \`<div class="user-card">
            <h3>\${user.name}</h3>
            <p>\${user.email}</p>
            <button onclick="deleteUser(\${user.id})">Delete</button>
        </div>\`;
    });
    document.getElementById('results').innerHTML = html;
}
\`\`\`

**Approach B: DOM API with individual appends**
\`\`\`javascript
function renderResults(users) {
    const container = document.getElementById('results');
    container.innerHTML = '';
    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card';
        const h3 = document.createElement('h3');
        h3.textContent = user.name;
        const p = document.createElement('p');
        p.textContent = user.email;
        const btn = document.createElement('button');
        btn.textContent = 'Delete';
        btn.addEventListener('click', () => deleteUser(user.id));
        card.append(h3, p, btn);
        container.appendChild(card);
    });
}
\`\`\`

**Approach C: DocumentFragment with event delegation**
\`\`\`javascript
function renderResults(users) {
    const container = document.getElementById('results');
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.dataset.userId = user.id;
        card.innerHTML = \`<h3>\${user.name}</h3><p>\${user.email}</p><button>Delete</button>\`;
        fragment.appendChild(card);
    });
    container.appendChild(fragment);
    container.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            deleteUser(e.target.closest('.user-card').dataset.userId);
        }
    });
}
\`\`\`

Compare all three approaches on: performance (reflows/repaints), memory usage, security (XSS), and maintainability. Which would you choose for this use case and why?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "reflow_analysis", description: "Explains that Approach B causes 10,000 reflows vs one reflow for A and C", points: 2, keywords: ["reflow", "repaint", "layout", "DOM update", "batch", "single reflow", "individual append", "performance"], check: "Student identifies that Approach B triggers a reflow on each appendChild (10K reflows), while A and C batch into a single DOM update" },
      { id: "xss_risk", description: "Identifies XSS risk in Approach A (and C's innerHTML) from unescaped user.name/email", points: 2, keywords: ["XSS", "innerHTML", "escape", "sanitize", "injection", "script", "textContent", "unescaped"], check: "Student identifies that Approach A and C use innerHTML with potentially unescaped user data, creating an XSS vulnerability, while B uses textContent which is safe" },
      { id: "event_delegation", description: "Explains event delegation in C: one listener vs 10K, better memory, works with dynamic content", points: 2, keywords: ["event delegation", "single listener", "one listener", "10000 listeners", "memory", "bubbling", "delegation", "dynamic"], check: "Student explains that C uses event delegation (one listener on container via event bubbling) vs B which creates 10,000 individual listeners, saving memory" },
      { id: "fragment_benefit", description: "Explains DocumentFragment avoids intermediate reflows during construction", points: 1, keywords: ["DocumentFragment", "fragment", "off-DOM", "intermediate", "not attached", "batch"], check: "Student explains that DocumentFragment builds the tree off-DOM so no intermediate reflows occur during construction" },
      { id: "recommendation", description: "Makes a justified recommendation considering the tradeoffs", points: 1, keywords: ["recommend", "choose", "best", "tradeoff", "combination", "depends"], check: "Student makes a reasoned recommendation, ideally suggesting a combination of C's performance pattern with B's XSS safety (textContent instead of innerHTML in the fragment)" }
    ],
    gaps: [
      { if_missing: "reflow_analysis", gap: "Does not understand browser reflow/repaint performance implications of DOM manipulation patterns" },
      { if_missing: "xss_risk", gap: "Does not recognize innerHTML with user data as an XSS vector" },
      { if_missing: "event_delegation", gap: "Does not understand event delegation pattern and its memory/performance benefits" },
      { if_missing: "fragment_benefit", gap: "Does not understand DocumentFragment and its role in batch DOM operations" },
      { if_missing: "recommendation", gap: "Cannot synthesize tradeoff analysis into an engineering recommendation" }
    ]
  }
},

// WF-14: Session management vs JWT (difficulty 5, compare_contrast)
{
  competencyId: "web-fundamentals",
  subTopic: "session-management",
  questionType: "compare_contrast",
  difficulty: 5,
  questionText: `Your company is building a new web application and must choose between server-side sessions (stored in Redis) and JWTs (stored in localStorage) for authentication.

The application has these requirements:
- Must support immediate account revocation (e.g., fired employee loses access instantly)
- Will be accessed from multiple subdomains (app.corp.com, api.corp.com, admin.corp.com)
- Must work with a mobile app and third-party API consumers
- The backend is a microservices architecture with 5 services behind a gateway
- Must comply with GDPR (users can request full data deletion)

Compare server-side sessions and JWTs for this scenario. For each requirement, explain which approach handles it better and why. Discuss the tradeoffs in terms of: immediate revocation, cross-subdomain auth, stateless scalability, security risks (XSS/CSRF), and microservice token validation.

Propose a hybrid architecture if neither approach alone satisfies all requirements, and explain your design.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "revocation", description: "Explains sessions enable immediate revocation; JWTs require blocklist or short expiry", points: 2, keywords: ["revocation", "revoke", "blocklist", "blacklist", "short expiry", "immediate", "delete session", "Redis", "invalidate"], check: "Student explains that server-side sessions allow immediate revocation by deleting the session from Redis, while JWTs remain valid until expiry unless a server-side blocklist is maintained" },
      { id: "cross_subdomain", description: "Compares cookie domain scoping (.corp.com) vs JWT in Authorization header for cross-subdomain", points: 2, keywords: ["subdomain", "domain", ".corp.com", "cookie domain", "Authorization header", "cross-subdomain", "shared cookie"], check: "Student compares cookie domain attribute (set to .corp.com for all subdomains) vs JWTs sent as Authorization headers" },
      { id: "microservice_stateless", description: "Explains JWTs let microservices verify tokens without calling auth service; sessions require centralized store", points: 2, keywords: ["stateless", "microservice", "verify locally", "shared secret", "public key", "centralized", "Redis lookup", "auth service"], check: "Student explains that JWTs allow each microservice to verify tokens independently using a shared secret or public key, while sessions require a centralized Redis lookup" },
      { id: "storage_security", description: "Compares security: localStorage vulnerable to XSS, cookies vulnerable to CSRF, HttpOnly cookies as middle ground", points: 2, keywords: ["localStorage", "XSS", "CSRF", "HttpOnly", "cookie", "stolen", "script access", "SameSite"], check: "Student compares the security implications: localStorage JWTs are vulnerable to XSS, cookies are vulnerable to CSRF but can be HttpOnly, and discusses mitigations" },
      { id: "hybrid_design", description: "Proposes a coherent hybrid approach (e.g., short-lived JWT + refresh token in HttpOnly cookie, or gateway session + internal JWTs)", points: 2, keywords: ["hybrid", "refresh token", "short-lived", "gateway", "access token", "best of both", "combined"], check: "Student proposes a hybrid architecture that addresses the tradeoffs, such as short-lived JWTs for microservices with a refresh token or gateway session for revocation" }
    ],
    gaps: [
      { if_missing: "revocation", gap: "Does not understand the revocation limitations of JWTs vs server-side sessions" },
      { if_missing: "cross_subdomain", gap: "Does not understand cross-subdomain authentication strategies" },
      { if_missing: "microservice_stateless", gap: "Does not understand stateless token validation benefits in microservice architectures" },
      { if_missing: "storage_security", gap: "Does not understand the security tradeoffs of different token/session storage mechanisms" },
      { if_missing: "hybrid_design", gap: "Cannot synthesize a hybrid authentication architecture to address competing requirements" }
    ]
  }
},

// WF-15: HTTP/2 and performance (difficulty 5, design_solution)
{
  competencyId: "web-fundamentals",
  subTopic: "http2-performance",
  questionType: "design_solution",
  difficulty: 5,
  questionText: `You are optimizing a web application that currently loads 47 JavaScript files, 12 CSS files, and 200+ images. The site uses HTTP/1.1 and the team has implemented these "optimizations":

1. All JS files are concatenated into one 2MB bundle.js
2. All CSS files are concatenated into one 500KB styles.css
3. Images are served from 4 different subdomains (img1.cdn.com through img4.cdn.com) for "domain sharding"
4. Small icons are inlined as data: URIs in the CSS
5. The HTML includes \`<link rel="prefetch">\` for every page on the site

The team wants to migrate to HTTP/2. Which of these "optimizations" become counterproductive under HTTP/2 and why? Design a new asset-loading strategy that leverages HTTP/2 features (multiplexing, server push, header compression, stream prioritization).

Also explain: How does HTTP/2 multiplexing work at the TCP level? Why does HTTP/2 still suffer from head-of-line blocking, and how does HTTP/3 (QUIC) solve this?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "concat_anti", description: "Explains concatenation is counterproductive: wastes cache on any change, blocks rendering, prevents granular caching", points: 2, keywords: ["concatenation", "cache invalidation", "granular", "module", "split", "code splitting", "one change", "entire bundle", "parallel"], check: "Student explains that HTTP/2 multiplexing eliminates the need for concatenation, and that splitting files enables granular caching (one changed module does not invalidate the whole bundle)" },
      { id: "domain_sharding", description: "Explains domain sharding is harmful with HTTP/2: defeats connection coalescing, increases DNS/TLS overhead", points: 2, keywords: ["domain sharding", "connection coalescing", "single connection", "multiple connections", "DNS", "TLS overhead", "unnecessary"], check: "Student explains that HTTP/2 multiplexes all requests over a single connection, making domain sharding unnecessary and counterproductive (extra DNS lookups and TLS handshakes)" },
      { id: "multiplexing", description: "Explains HTTP/2 multiplexing: interleaved frames on a single TCP connection via stream IDs", points: 2, keywords: ["multiplexing", "stream", "frame", "interleaved", "single connection", "stream ID", "concurrent", "binary framing"], check: "Student explains that HTTP/2 uses binary framing to interleave multiple request/response streams over a single TCP connection using stream IDs" },
      { id: "hol_blocking", description: "Explains TCP-level head-of-line blocking: one lost packet blocks all streams", points: 2, keywords: ["head-of-line", "HOL", "TCP", "packet loss", "blocks all", "retransmission", "ordered delivery"], check: "Student explains that HTTP/2 multiplexing over TCP means a single lost packet blocks all streams due to TCP's ordered delivery guarantee" },
      { id: "quic_solution", description: "Explains HTTP/3/QUIC uses independent UDP streams to eliminate HOL blocking", points: 2, keywords: ["QUIC", "HTTP/3", "UDP", "independent streams", "no HOL", "per-stream", "loss isolation"], check: "Student explains that HTTP/3 runs over QUIC (UDP-based) where each stream is independent, so packet loss on one stream does not block others" }
    ],
    gaps: [
      { if_missing: "concat_anti", gap: "Does not understand why asset concatenation is counterproductive under HTTP/2" },
      { if_missing: "domain_sharding", gap: "Does not understand why domain sharding harms HTTP/2 performance" },
      { if_missing: "multiplexing", gap: "Does not understand how HTTP/2 multiplexing works at the binary framing level" },
      { if_missing: "hol_blocking", gap: "Does not understand TCP-level head-of-line blocking in HTTP/2" },
      { if_missing: "quic_solution", gap: "Does not understand how HTTP/3/QUIC solves head-of-line blocking" }
    ]
  }
},

// --- web-security (Web application security) ---

// WS-1: SQL injection - union-based (difficulty 1, spot_vuln)
{
  competencyId: "web-security",
  subTopic: "sql-injection-union",
  questionType: "spot_vuln",
  difficulty: 1,
  questionText: `A PHP e-commerce site has this product search feature:

\`\`\`php
<?php
$category = $_GET['category'];
$sort = $_GET['sort'] ?? 'name';

$query = "SELECT id, name, price, description FROM products WHERE category = '$category' ORDER BY $sort";
$result = mysqli_query($conn, $query);

while ($row = mysqli_fetch_assoc($result)) {
    echo "<div class='product'>";
    echo "<h3>" . $row['name'] . "</h3>";
    echo "<p>Price: $" . $row['price'] . "</p>";
    echo "<p>" . $row['description'] . "</p>";
    echo "</div>";
}
?>
\`\`\`

1. Identify both injection points in this code.
2. Craft a UNION-based SQL injection payload for the \`category\` parameter to extract all usernames and passwords from a \`users\` table.
3. Explain why the ORDER BY injection in the \`sort\` parameter is harder to exploit and what technique you would use.`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "both_injection_points", description: "Identifies both $category (string injection) and $sort (ORDER BY injection) as vulnerable", points: 1, keywords: ["category", "sort", "two injection", "both", "ORDER BY", "WHERE"], check: "Student identifies both the category parameter (injected into WHERE clause) and the sort parameter (injected into ORDER BY clause) as injection points" },
      { id: "union_payload", description: "Constructs a valid UNION SELECT payload matching 4 columns", points: 2, keywords: ["UNION", "SELECT", "username", "password", "4 columns", "NULL", "' UNION SELECT"], check: "Student crafts a payload like: ' UNION SELECT 1, username, password, 4 FROM users -- matching the 4 columns of the original query" },
      { id: "column_matching", description: "Explains that UNION requires matching the number and compatible types of columns", points: 1, keywords: ["column count", "number of columns", "match", "same number", "compatible types", "4 columns"], check: "Student explains that UNION SELECT must have the same number of columns as the original query (4 in this case)" },
      { id: "order_by_technique", description: "Explains ORDER BY injection is blind (no direct output) and suggests error-based or boolean/time-based technique", points: 2, keywords: ["ORDER BY", "blind", "no output", "boolean", "time-based", "error-based", "IF", "CASE", "SLEEP", "conditional"], check: "Student explains that ORDER BY injection cannot use UNION and must rely on blind techniques like conditional expressions (CASE WHEN), error-based, or time-based inference" },
      { id: "fix", description: "Proposes parameterized queries and allowlist for ORDER BY", points: 1, keywords: ["parameterized", "prepared statement", "bind", "placeholder", "allowlist", "whitelist", "PDO"], check: "Student suggests using parameterized queries for the WHERE clause and an allowlist of column names for ORDER BY" }
    ],
    gaps: [
      { if_missing: "both_injection_points", gap: "Cannot identify multiple SQL injection points in a single code block" },
      { if_missing: "union_payload", gap: "Cannot construct a UNION-based SQL injection payload" },
      { if_missing: "column_matching", gap: "Does not understand the column-matching requirement for UNION-based SQL injection" },
      { if_missing: "order_by_technique", gap: "Does not know exploitation techniques for ORDER BY SQL injection" },
      { if_missing: "fix", gap: "Does not know how to remediate SQL injection (parameterized queries)" }
    ]
  }
},

// WS-2: XSS - reflected (difficulty 1, spot_vuln)
{
  competencyId: "web-security",
  subTopic: "xss-reflected",
  questionType: "spot_vuln",
  difficulty: 1,
  questionText: `A Flask application has an error page:

\`\`\`python
from flask import Flask, request

app = Flask(__name__)

@app.route('/search')
def search():
    query = request.args.get('q', '')
    results = perform_search(query)
    if not results:
        return f"""
        <html>
        <body>
            <h1>Search Results</h1>
            <p>No results found for: {query}</p>
            <p>Try a different search term.</p>
            <form action="/search" method="GET">
                <input type="text" name="q" value="{query}">
                <button type="submit">Search</button>
            </form>
        </body>
        </html>
        """, 200
    # ... render results ...
\`\`\`

1. Identify the XSS vulnerability and explain why it exists.
2. Show two different XSS payloads: one that uses the reflected text in the paragraph, and one that escapes the input value attribute.
3. What HTTP header could provide defense-in-depth even if the developer forgets to escape output?`,
  rubric: {
    maxScore: 7,
    criteria: [
      { id: "vuln_identified", description: "Identifies that user input is reflected into HTML without escaping in two locations", points: 1, keywords: ["reflected", "unescaped", "unsanitized", "f-string", "no escaping", "raw", "two locations", "paragraph", "input value"], check: "Student identifies that the query variable is inserted raw into HTML via f-string in both the paragraph text and the input value attribute" },
      { id: "payload_text", description: "Crafts a payload for the paragraph context: e.g., <script>alert(1)</script>", points: 2, keywords: ["<script>", "alert", "payload", "paragraph", "tag injection"], check: "Student provides a payload like <script>alert(document.cookie)</script> that would execute in the paragraph context" },
      { id: "payload_attr", description: "Crafts a payload for the input value context: e.g., \" onfocus=\"alert(1)\" autofocus=\"", points: 2, keywords: ["onfocus", "onmouseover", "autofocus", "attribute", "escape", "value", "quote", "event handler", "\" "], check: "Student provides a payload that breaks out of the value attribute, e.g., \" onfocus=\"alert(1)\" autofocus=\" or similar attribute injection" },
      { id: "csp_header", description: "Recommends Content-Security-Policy header as defense in depth", points: 2, keywords: ["CSP", "Content-Security-Policy", "script-src", "nonce", "hash", "defense in depth", "header"], check: "Student recommends Content-Security-Policy header (particularly script-src directive with nonce or hash) as a defense-in-depth measure" }
    ],
    gaps: [
      { if_missing: "vuln_identified", gap: "Cannot identify reflected XSS from unescaped user input in HTML templates" },
      { if_missing: "payload_text", gap: "Cannot craft XSS payloads for HTML text context" },
      { if_missing: "payload_attr", gap: "Cannot craft XSS payloads that break out of HTML attribute context" },
      { if_missing: "csp_header", gap: "Does not know about Content-Security-Policy as an XSS defense layer" }
    ]
  }
},

// WS-3: CSRF (difficulty 2, predict_output)
{
  competencyId: "web-security",
  subTopic: "csrf",
  questionType: "predict_output",
  difficulty: 2,
  questionText: `A banking application uses this form to transfer money:

\`\`\`html
<!-- https://bank.com/transfer -->
<form action="/api/transfer" method="POST">
    <input name="to_account" type="text">
    <input name="amount" type="number">
    <button type="submit">Transfer</button>
</form>
\`\`\`

The server endpoint:
\`\`\`python
@app.route('/api/transfer', methods=['POST'])
def transfer():
    if not session.get('authenticated'):
        return redirect('/login')
    to_account = request.form['to_account']
    amount = request.form['amount']
    execute_transfer(session['user_id'], to_account, amount)
    return jsonify({'status': 'success'})
\`\`\`

An attacker hosts this page on https://evil.com/prize.html:
\`\`\`html
<html>
<body>
    <h1>Congratulations! Claim your prize!</h1>
    <iframe style="display:none" name="csrf-frame"></iframe>
    <form id="csrf-form" action="https://bank.com/api/transfer" method="POST" target="csrf-frame">
        <input type="hidden" name="to_account" value="ATTACKER-ACCT-999">
        <input type="hidden" name="amount" value="5000">
    </form>
    <script>document.getElementById('csrf-form').submit();</script>
</body>
</html>
\`\`\`

If a logged-in bank.com user visits evil.com/prize.html, what happens? Walk through each step including what the browser does with cookies. Then explain three different defenses against this attack.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "attack_trace", description: "Correctly traces the attack: auto-submit, browser attaches bank.com cookies, transfer executes", points: 2, keywords: ["auto-submit", "cookies", "session cookie", "authenticated", "browser sends", "cross-origin", "transfer executes"], check: "Student traces: the form auto-submits via JS, the browser automatically attaches bank.com session cookies to the cross-origin POST, the server sees a valid session and executes the transfer" },
      { id: "why_cookies_sent", description: "Explains that browsers attach cookies based on the destination domain, not the origin page", points: 2, keywords: ["destination domain", "cookie policy", "origin", "automatically attached", "third-party cookie", "bank.com cookie"], check: "Student explains that browsers send cookies based on the request's destination (bank.com), regardless of which page (evil.com) initiated the request" },
      { id: "csrf_token", description: "Describes CSRF token defense: server generates random token, embeds in form, validates on POST", points: 2, keywords: ["CSRF token", "anti-CSRF", "random token", "hidden field", "validate", "synchronizer token", "server-generated"], check: "Student describes synchronizer token pattern: server embeds a random token in the form, validates it on submission, attacker cannot guess it" },
      { id: "samesite_cookie", description: "Describes SameSite cookie attribute as a defense", points: 1, keywords: ["SameSite", "Lax", "Strict", "cookie attribute", "cross-site", "not sent"], check: "Student describes setting SameSite=Lax or Strict on session cookies to prevent them from being sent on cross-site form submissions" },
      { id: "additional_defense", description: "Describes at least one more defense: Origin/Referer checking, custom headers, or double-submit cookie", points: 1, keywords: ["Origin header", "Referer", "custom header", "X-Requested-With", "double submit", "double-submit cookie"], check: "Student describes an additional defense such as checking Origin/Referer headers, requiring custom headers, or using the double-submit cookie pattern" }
    ],
    gaps: [
      { if_missing: "attack_trace", gap: "Cannot trace through a CSRF attack step by step" },
      { if_missing: "why_cookies_sent", gap: "Does not understand browser cookie attachment behavior for cross-origin requests" },
      { if_missing: "csrf_token", gap: "Does not know the synchronizer token pattern for CSRF defense" },
      { if_missing: "samesite_cookie", gap: "Does not know about SameSite cookies as a CSRF defense" },
      { if_missing: "additional_defense", gap: "Knows only one CSRF defense; cannot discuss defense-in-depth" }
    ]
  }
},

// WS-4: Command injection (difficulty 2, spot_vuln)
{
  competencyId: "web-security",
  subTopic: "command-injection",
  questionType: "spot_vuln",
  difficulty: 2,
  questionText: `A Node.js application provides a network diagnostic tool:

\`\`\`javascript
const express = require('express');
const { exec } = require('child_process');
const app = express();

app.get('/api/ping', (req, res) => {
    const host = req.query.host;
    if (!host) {
        return res.status(400).json({ error: 'Host parameter required' });
    }

    // Basic validation
    if (host.length > 255) {
        return res.status(400).json({ error: 'Host too long' });
    }

    exec(\`ping -c 4 \${host}\`, (error, stdout, stderr) => {
        res.json({
            output: stdout,
            error: stderr
        });
    });
});
\`\`\`

1. Craft three different command injection payloads that would work here (using different shell metacharacters).
2. Explain why the length check does not prevent exploitation.
3. Show how to fix this properly -- explain why input validation alone is insufficient and what the correct approach is.`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "payloads", description: "Provides at least 2 valid payloads using different metacharacters (;, |, $(), &&, backticks, newline)", points: 2, keywords: [";", "|", "$(", "&&", "backtick", "\\n", "pipe", "semicolon", "command substitution", "newline"], check: "Student provides at least two payloads using different shell metacharacters, e.g., 'google.com; cat /etc/passwd', 'google.com | id', '$(whoami)'" },
      { id: "length_bypass", description: "Explains that 255 chars is more than enough for a destructive payload", points: 1, keywords: ["255", "enough", "short payload", "rm", "reverse shell", "length", "insufficient"], check: "Student explains that the 255-character limit is far more than needed for dangerous commands like 'x; rm -rf /' or a reverse shell" },
      { id: "why_validation_insufficient", description: "Explains that blocklisting shell chars is fragile due to encoding, alternate chars, platform differences", points: 2, keywords: ["blocklist", "bypass", "encoding", "alternate", "fragile", "whitelist not enough", "escape", "always ways around"], check: "Student explains that trying to filter shell metacharacters is fragile because of encoding tricks, alternate syntax, and platform differences" },
      { id: "execfile_fix", description: "Proposes using execFile or spawn with array arguments instead of exec with string interpolation", points: 2, keywords: ["execFile", "spawn", "array", "no shell", "arguments", "separate", "not interpreted"], check: "Student proposes using execFile or spawn which pass arguments as an array without shell interpretation, eliminating injection" },
      { id: "allowlist_validation", description: "Additionally suggests input validation: allowlist of hostname characters (alphanumeric, dots, hyphens)", points: 1, keywords: ["allowlist", "regex", "alphanumeric", "dots", "hyphens", "hostname", "validate", "pattern"], check: "Student additionally suggests validating the host parameter against a strict hostname pattern as defense in depth" }
    ],
    gaps: [
      { if_missing: "payloads", gap: "Cannot construct command injection payloads using shell metacharacters" },
      { if_missing: "length_bypass", gap: "Overestimates the effectiveness of length-based input validation" },
      { if_missing: "why_validation_insufficient", gap: "Does not understand why blocklist-based input validation is insufficient for command injection" },
      { if_missing: "execfile_fix", gap: "Does not know the correct fix for command injection (execFile/spawn with array arguments)" },
      { if_missing: "allowlist_validation", gap: "Does not apply defense-in-depth with input validation in addition to safe API usage" }
    ]
  }
},

// WS-5: XSS - DOM-based (difficulty 3, trace_explain)
{
  competencyId: "web-security",
  subTopic: "xss-dom-based",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `Examine this client-side JavaScript on a single-page application:

\`\`\`javascript
// URL: https://app.example.com/dashboard#tab=settings&msg=Welcome+back

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.hash.substring(1));

    // Display notification message
    const msg = params.get('msg');
    if (msg) {
        document.getElementById('notification').innerHTML = decodeURIComponent(msg);
    }

    // Load tab content
    const tab = params.get('tab');
    if (tab) {
        fetch('/api/tab/' + tab)
            .then(r => r.json())
            .then(data => {
                document.getElementById('content').innerHTML = data.html;
            });
    }

    // Update page title from API response
    fetch('/api/user/profile')
        .then(r => r.json())
        .then(user => {
            document.title = \`Dashboard - \${user.display_name}\`;
        });
});
\`\`\`

1. Identify all DOM-based XSS sinks in this code and trace the data flow from source to sink for each.
2. Explain why DOM-based XSS is harder to detect with server-side security tools (WAFs, server logs).
3. One of these sinks (document.title) is actually safe -- explain why.
4. How would you fix each vulnerable sink?`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "hash_innerHTML", description: "Identifies hash fragment -> msg parameter -> innerHTML as DOM XSS (source: location.hash, sink: innerHTML)", points: 2, keywords: ["hash", "location.hash", "innerHTML", "msg", "notification", "source", "sink", "fragment"], check: "Student traces the data flow: location.hash -> URLSearchParams -> msg -> innerHTML on notification element as a DOM XSS vulnerability" },
      { id: "api_innerHTML", description: "Identifies fetch response -> data.html -> innerHTML as stored/reflected XSS via API", points: 2, keywords: ["fetch", "data.html", "innerHTML", "API response", "content", "tab", "server response"], check: "Student identifies that the API response's html field is injected via innerHTML, which is dangerous if the API returns unsanitized content (potentially stored XSS)" },
      { id: "server_invisible", description: "Explains DOM XSS does not appear in server logs because hash fragments are not sent to the server", points: 2, keywords: ["hash", "not sent", "server", "fragment", "client-side", "WAF", "invisible", "logs", "never reaches"], check: "Student explains that the hash fragment is never sent to the server, so server-side WAFs, logging, and security tools cannot detect or block the attack" },
      { id: "title_safe", description: "Explains document.title is a text-only property, not an HTML rendering context", points: 1, keywords: ["document.title", "text", "not HTML", "no rendering", "safe", "text property", "not parsed"], check: "Student explains that document.title is a text-only property -- assigning HTML to it does not cause parsing or script execution" },
      { id: "fixes", description: "Proposes textContent instead of innerHTML, or DOMPurify/sanitization for HTML content", points: 2, keywords: ["textContent", "innerText", "DOMPurify", "sanitize", "escape", "createTextNode", "safe sink"], check: "Student proposes using textContent instead of innerHTML for the notification, and sanitization (e.g., DOMPurify) for the API HTML content" }
    ],
    gaps: [
      { if_missing: "hash_innerHTML", gap: "Cannot trace DOM-based XSS from source (location.hash) to sink (innerHTML)" },
      { if_missing: "api_innerHTML", gap: "Does not recognize API response content injected via innerHTML as a potential XSS vector" },
      { if_missing: "server_invisible", gap: "Does not understand why DOM-based XSS is invisible to server-side security tools" },
      { if_missing: "title_safe", gap: "Does not distinguish between HTML rendering contexts and text-only DOM properties" },
      { if_missing: "fixes", gap: "Does not know how to fix DOM XSS (safe sinks like textContent, or sanitization libraries)" }
    ]
  }
},

// WS-6: IDOR/broken access control (difficulty 3, trace_explain)
{
  competencyId: "web-security",
  subTopic: "idor-access-control",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `A Node.js/Express application manages medical records. Review these API endpoints:

\`\`\`javascript
const express = require('express');
const app = express();

// Middleware: authenticate user via JWT
app.use(authenticateJWT);

// Get patient record
app.get('/api/patients/:id/records', (req, res) => {
    const records = db.query('SELECT * FROM medical_records WHERE patient_id = ?', [req.params.id]);
    res.json(records);
});

// Download lab results PDF
app.get('/api/documents/:docId', (req, res) => {
    const doc = db.query('SELECT file_path FROM documents WHERE id = ?', [req.params.docId]);
    if (doc) {
        res.sendFile(doc.file_path);
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// Update patient notes (doctors only)
app.put('/api/patients/:id/notes', (req, res) => {
    if (req.user.role === 'doctor') {
        db.query('UPDATE medical_records SET notes = ? WHERE patient_id = ?',
            [req.body.notes, req.params.id]);
        res.json({ status: 'updated' });
    } else {
        res.status(403).json({ error: 'Forbidden' });
    }
});

// List all patients (for search)
app.get('/api/patients', (req, res) => {
    const patients = db.query('SELECT id, name, dob FROM patients');
    res.json(patients);
});
\`\`\`

Identify all access control vulnerabilities. For each one, explain: (1) what the vulnerability is, (2) how an attacker would exploit it, and (3) what the correct authorization check should be. Consider: who should see patient records? What role-based and resource-based checks are missing?`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "records_idor", description: "Identifies that any authenticated user can view any patient's records by changing the patient ID", points: 2, keywords: ["IDOR", "patient_id", "any user", "change ID", "no ownership check", "horizontal", "enumeration"], check: "Student identifies that GET /api/patients/:id/records has no authorization check -- any authenticated user can access any patient's records by changing the ID parameter" },
      { id: "document_idor", description: "Identifies that document download has no access control -- any user can download any document by guessing/enumerating docId", points: 2, keywords: ["document", "docId", "download", "no authorization", "guess", "enumerate", "sequential"], check: "Student identifies that GET /api/documents/:docId performs no authorization check to verify the requesting user should have access to that document" },
      { id: "doctor_any_patient", description: "Notes that any doctor can modify any patient's notes (no doctor-patient relationship check)", points: 2, keywords: ["any doctor", "doctor-patient", "relationship", "not their patient", "assigned", "treating"], check: "Student notes that the PUT endpoint only checks if the user is a doctor, not whether they are the treating doctor for that specific patient" },
      { id: "patient_listing", description: "Notes that the patient listing endpoint returns all patients to any authenticated user", points: 1, keywords: ["all patients", "list", "enumeration", "role check", "no filtering", "PHI", "everyone"], check: "Student identifies that the patient listing returns all patients to any authenticated user without role-based filtering" },
      { id: "proper_authz", description: "Proposes proper authorization: ownership/relationship checks, role-based access, principle of least privilege", points: 2, keywords: ["ownership check", "relationship", "resource-based", "least privilege", "policy", "check user_id", "belongs to"], check: "Student proposes specific authorization fixes: check that the requesting user owns or is assigned to the patient, enforce doctor-patient relationships, filter listings by role" }
    ],
    gaps: [
      { if_missing: "records_idor", gap: "Cannot identify IDOR vulnerabilities in API endpoints with user-controlled resource identifiers" },
      { if_missing: "document_idor", gap: "Does not check for authorization on file download endpoints" },
      { if_missing: "doctor_any_patient", gap: "Does not consider resource-level authorization beyond basic role checks (RBAC vs ABAC)" },
      { if_missing: "patient_listing", gap: "Does not consider over-exposure of sensitive data in listing/search endpoints" },
      { if_missing: "proper_authz", gap: "Cannot design proper authorization checks combining role-based and resource-based access control" }
    ]
  }
},

// WS-7: File upload vulnerabilities (difficulty 3, fix_code)
{
  competencyId: "web-security",
  subTopic: "file-upload-vuln",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `A PHP application allows users to upload profile pictures:

\`\`\`php
<?php
$upload_dir = '/var/www/html/uploads/';

if ($_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
    $filename = $_FILES['avatar']['name'];
    $extension = pathinfo($filename, PATHINFO_EXTENSION);

    // Check file extension
    $allowed = ['jpg', 'jpeg', 'png', 'gif'];
    if (!in_array($extension, $allowed)) {
        die("Invalid file type");
    }

    // Check file size (max 2MB)
    if ($_FILES['avatar']['size'] > 2 * 1024 * 1024) {
        die("File too large");
    }

    // Save the file
    $destination = $upload_dir . $filename;
    move_uploaded_file($_FILES['avatar']['tmp_name'], $destination);

    echo "Upload successful: <a href='/uploads/$filename'>View your avatar</a>";
}
?>
\`\`\`

This code has at least 5 security vulnerabilities. Identify each one, explain how an attacker would exploit it, and provide the fixed code. Think about: path traversal, double extensions, MIME type validation, web shells, and the upload directory configuration.`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "double_extension", description: "Identifies double extension bypass: shell.php.jpg may be executed by misconfigured Apache", points: 2, keywords: ["double extension", "php.jpg", "AddHandler", "Apache", "multiple extensions", ".php.", "bypass"], check: "Student identifies that filenames like shell.php.jpg or shell.php%00.jpg can bypass the extension check and be executed as PHP on misconfigured servers" },
      { id: "path_traversal", description: "Identifies path traversal via filename: ../../../etc/cron.d/evil overwrites server files", points: 2, keywords: ["path traversal", "directory traversal", "../", "overwrite", "basename", "filename"], check: "Student identifies that the original filename is used directly, allowing path traversal (../../file) to write files outside the upload directory" },
      { id: "mime_check", description: "Notes missing MIME type / magic byte validation -- extension-only check is insufficient", points: 1, keywords: ["MIME", "Content-Type", "magic bytes", "file signature", "finfo", "getimagesize", "actual content"], check: "Student notes that only the extension is checked, not the actual file content, so a PHP file renamed to .jpg would pass validation" },
      { id: "no_rename", description: "Notes the file keeps its original user-supplied name, enabling overwrites and name collisions", points: 2, keywords: ["rename", "random name", "unique", "UUID", "hash", "overwrite", "original name", "collision"], check: "Student identifies that using the original filename allows overwriting other users' files and suggests generating a random filename" },
      { id: "webroot_serving", description: "Notes upload directory is inside webroot and directly accessible -- PHP files could be executed", points: 2, keywords: ["webroot", "web-accessible", "directly accessible", "execute", "outside webroot", "X-Sendfile", "nginx", "no-exec"], check: "Student identifies that the upload directory is inside the web root, so uploaded files (especially PHP) can be directly accessed and executed by the web server" }
    ],
    gaps: [
      { if_missing: "double_extension", gap: "Does not know about double extension bypass attacks against file upload validation" },
      { if_missing: "path_traversal", gap: "Does not recognize path traversal via user-controlled filenames in file upload" },
      { if_missing: "mime_check", gap: "Does not understand the need for content-based file type validation (magic bytes) beyond extension checks" },
      { if_missing: "no_rename", gap: "Does not consider file name collision and overwrite attacks in file upload" },
      { if_missing: "webroot_serving", gap: "Does not understand the danger of serving uploaded files from within the web root" }
    ]
  }
},

// WS-8: Path traversal (difficulty 3, fix_code)
{
  competencyId: "web-security",
  subTopic: "path-traversal",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `A Python Flask application serves user-uploaded documents:

\`\`\`python
import os
from flask import Flask, request, send_file, abort

app = Flask(__name__)
DOCS_DIR = '/var/app/documents'

@app.route('/api/docs/<username>/<filename>')
def get_document(username, filename):
    # Attempt at path traversal prevention
    if '..' in filename:
        abort(403)

    filepath = os.path.join(DOCS_DIR, username, filename)

    if not os.path.exists(filepath):
        abort(404)

    return send_file(filepath)

@app.route('/api/docs/<username>/delete/<filename>', methods=['DELETE'])
def delete_document(username, filename):
    filepath = DOCS_DIR + '/' + username + '/' + filename
    os.remove(filepath)
    return {'status': 'deleted'}
\`\`\`

1. Explain why the \`..\` check is insufficient (show at least two bypasses).
2. Identify the path traversal vulnerability in the delete endpoint that the developer missed entirely.
3. Show the correct approach to prevent path traversal in both endpoints.
4. What additional vulnerability exists in the delete endpoint besides path traversal?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "dot_dot_bypass", description: "Shows bypasses for the .. check: URL encoding (%2e%2e), double encoding, or username parameter injection", points: 2, keywords: ["%2e%2e", "URL encoding", "double encoding", "username", "..%2f", "URL decode", "bypass"], check: "Student shows at least one bypass: URL-encoded dots (%2e%2e/%2f), or injecting traversal via the username parameter which has no check at all" },
      { id: "username_no_check", description: "Identifies that username parameter has no path traversal protection at all", points: 2, keywords: ["username", "no check", "no validation", "unprotected", "first parameter", "both parameters"], check: "Student identifies that the username parameter is not validated for path traversal characters, so ../../etc/passwd could be passed as the username" },
      { id: "delete_no_check", description: "Identifies that the delete endpoint has zero path traversal protection", points: 1, keywords: ["delete", "no protection", "no check", "remove", "arbitrary", "string concatenation"], check: "Student identifies that the delete endpoint uses raw string concatenation with no path traversal check whatsoever" },
      { id: "correct_fix", description: "Proposes realpath check: resolve the path and verify it starts with the base directory", points: 2, keywords: ["realpath", "os.path.realpath", "os.path.abspath", "startswith", "resolve", "canonical", "begins with"], check: "Student proposes resolving the full path with os.path.realpath() and checking it starts with the expected base directory" },
      { id: "delete_no_authz", description: "Identifies missing authorization check: any user can delete any other user's documents", points: 1, keywords: ["authorization", "any user", "other user", "no auth check", "ownership", "access control"], check: "Student identifies that the delete endpoint has no authorization check -- any authenticated user can delete any user's documents" }
    ],
    gaps: [
      { if_missing: "dot_dot_bypass", gap: "Does not know techniques to bypass basic path traversal filters (encoding, alternate representations)" },
      { if_missing: "username_no_check", gap: "Does not check all user-controlled path components for traversal, only the obvious one" },
      { if_missing: "delete_no_check", gap: "Misses path traversal vulnerabilities when no check is present (only looks for flawed checks)" },
      { if_missing: "correct_fix", gap: "Does not know the canonical path resolution approach for preventing path traversal" },
      { if_missing: "delete_no_authz", gap: "Does not identify missing authorization alongside path traversal vulnerabilities" }
    ]
  }
},

// WS-9: SQL injection - blind/second-order (difficulty 3, trace_explain)
{
  competencyId: "web-security",
  subTopic: "sql-injection-blind",
  questionType: "trace_explain",
  difficulty: 3,
  questionText: `A Flask application has a registration and profile page:

\`\`\`python
# Registration endpoint
@app.route('/register', methods=['POST'])
def register():
    username = request.form['username']
    email = request.form['email']
    password = hash_password(request.form['password'])
    # Uses parameterized query -- safe!
    db.execute("INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
               (username, email, password))
    return redirect('/login')

# Profile page
@app.route('/profile')
def profile():
    user_id = session['user_id']
    user = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    # Display user's articles using the stored username
    articles = db.execute(
        f"SELECT * FROM articles WHERE author = '{user['username']}' ORDER BY created_at DESC"
    )
    return render_template('profile.html', user=user, articles=articles)
\`\`\`

1. The registration uses parameterized queries. Explain why the application is still vulnerable to SQL injection.
2. What specific username would an attacker register with to exploit the profile page?
3. This is called "second-order" SQL injection. Explain why it is particularly dangerous and harder to detect than regular injection.
4. Why might automated scanning tools miss this vulnerability?`,
  rubric: {
    maxScore: 8,
    criteria: [
      { id: "second_order_concept", description: "Explains that second-order injection stores malicious input safely, then uses it unsafely later", points: 2, keywords: ["second-order", "stored", "later", "safe insert", "unsafe use", "two stages", "stored then used", "deferred"], check: "Student explains that the malicious payload is safely stored via parameterized INSERT, but later retrieved and unsafely interpolated into another query" },
      { id: "payload", description: "Crafts a username payload: e.g., ' OR '1'='1' -- or ' UNION SELECT password FROM users --", points: 2, keywords: ["' OR", "UNION", "username payload", "' --", "register with", "inject", "malicious username"], check: "Student provides a concrete malicious username that would exploit the f-string SQL in the profile endpoint" },
      { id: "safe_insert_unsafe_read", description: "Traces the data flow: parameterized INSERT saves the payload as-is, f-string SELECT interpolates it as SQL", points: 2, keywords: ["parameterized", "f-string", "interpolate", "stored as-is", "later query", "format string", "data flow"], check: "Student traces the full data flow: safe parameterized INSERT stores the payload literally, then the profile query uses an f-string to build SQL, interpolating the stored payload as code" },
      { id: "detection_difficulty", description: "Explains why it is hard to detect: injection point and trigger point are different endpoints/times", points: 2, keywords: ["different endpoint", "different time", "two requests", "scanner", "automated", "cannot correlate", "separate", "hard to detect"], check: "Student explains that automated scanners test input and output at the same endpoint, but second-order injection has the input point (registration) and trigger point (profile) at different endpoints, making correlation difficult" }
    ],
    gaps: [
      { if_missing: "second_order_concept", gap: "Does not understand second-order SQL injection (safe storage, unsafe retrieval)" },
      { if_missing: "payload", gap: "Cannot craft a second-order SQL injection payload" },
      { if_missing: "safe_insert_unsafe_read", gap: "Cannot trace data flow across multiple code paths to identify deferred injection" },
      { if_missing: "detection_difficulty", gap: "Does not understand why second-order vulnerabilities evade automated scanning" }
    ]
  }
},

// WS-10: SSRF (difficulty 3, fix_code)
{
  competencyId: "web-security",
  subTopic: "ssrf",
  questionType: "fix_code",
  difficulty: 3,
  questionText: `A Node.js application lets users provide a URL to fetch a preview (title, description, image) for link sharing:

\`\`\`javascript
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

app.post('/api/link-preview', async (req, res) => {
    const { url } = req.body;

    // Basic URL validation
    if (!url || !url.startsWith('http')) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    try {
        const response = await axios.get(url, { timeout: 5000 });
        const $ = cheerio.load(response.data);

        const preview = {
            title: $('meta[property="og:title"]').attr('content') || $('title').text(),
            description: $('meta[property="og:description"]').attr('content'),
            image: $('meta[property="og:image"]').attr('content')
        };

        res.json(preview);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch URL' });
    }
});
\`\`\`

1. Explain how this is vulnerable to SSRF. What internal resources could an attacker access?
2. Provide three specific payloads an attacker might use (targeting different internal services).
3. Fix the code to prevent SSRF while still allowing the feature to work. Explain each defense layer.`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "ssrf_explained", description: "Explains that the server fetches user-supplied URLs, allowing requests to internal network", points: 2, keywords: ["SSRF", "server-side", "internal", "localhost", "private network", "127.0.0.1", "metadata", "internal network"], check: "Student explains that the server makes HTTP requests on behalf of the user, allowing access to internal resources that are not directly reachable from the internet" },
      { id: "payloads", description: "Provides at least 2 payloads: cloud metadata, internal services, localhost, file://", points: 2, keywords: ["169.254.169.254", "metadata", "localhost:6379", "file://", "internal", "127.0.0.1", "10.", "172.16", "192.168", "redis", "elasticsearch"], check: "Student provides concrete payloads such as http://169.254.169.254/latest/meta-data/ (cloud metadata), http://localhost:6379/ (Redis), file:///etc/passwd, or internal service URLs" },
      { id: "dns_rebinding", description: "Mentions DNS rebinding or redirect-based bypass as an advanced SSRF technique", points: 1, keywords: ["DNS rebinding", "redirect", "302", "follow redirect", "resolve", "TOCTOU", "time of check"], check: "Student mentions that attackers can bypass URL validation using DNS rebinding (domain resolves to internal IP after validation) or HTTP redirects" },
      { id: "ip_validation", description: "Proposes resolving the hostname and checking against private/reserved IP ranges before fetching", points: 2, keywords: ["resolve", "DNS", "private IP", "reserved", "blocklist", "10.", "172.16", "192.168", "127.", "169.254", "check IP"], check: "Student proposes resolving the URL's hostname to an IP address and rejecting private/reserved ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16)" },
      { id: "protocol_restrict", description: "Restricts allowed protocols to http/https only (no file://, gopher://, etc.)", points: 1, keywords: ["protocol", "scheme", "http", "https", "file://", "gopher", "allowlist", "restrict"], check: "Student restricts allowed URL schemes to http and https only, blocking file://, gopher://, and other dangerous protocols" },
      { id: "redirect_prevention", description: "Disables or limits HTTP redirects to prevent redirect-based SSRF bypass", points: 1, keywords: ["redirect", "follow", "maxRedirects", "disable redirect", "no redirect", "0 redirects"], check: "Student configures the HTTP client to not follow redirects, or to re-validate the target after each redirect" }
    ],
    gaps: [
      { if_missing: "ssrf_explained", gap: "Does not understand Server-Side Request Forgery and what it enables" },
      { if_missing: "payloads", gap: "Cannot identify high-value SSRF targets (cloud metadata, internal services)" },
      { if_missing: "dns_rebinding", gap: "Does not know about advanced SSRF bypass techniques (DNS rebinding, redirects)" },
      { if_missing: "ip_validation", gap: "Does not know how to validate resolved IP addresses against private ranges for SSRF prevention" },
      { if_missing: "protocol_restrict", gap: "Does not restrict URL schemes to prevent file://, gopher://, and other protocol-based SSRF" },
      { if_missing: "redirect_prevention", gap: "Does not consider HTTP redirect following as an SSRF bypass vector" }
    ]
  }
},

// WS-11: JWT attacks (difficulty 4, design_solution)
{
  competencyId: "web-security",
  subTopic: "jwt-attacks",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `During a penetration test, you intercept the following JWT from the target application:

\`\`\`
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0xIn0.eyJ1c2VyX2lkIjo3NDIsInJvbGUiOiJ1c2VyIiwiZXhwIjoxNzE5MDAwMDAwfQ.SIGNATURE_HERE
\`\`\`

Decoded header: \`{"alg": "RS256", "typ": "JWT", "kid": "key-1"}\`
Decoded payload: \`{"user_id": 742, "role": "user", "exp": 1719000000}\`

The application's /api/admin endpoint checks \`role === "admin"\` from the JWT payload.

Describe at least four different JWT attack techniques you would try against this target:
1. The algorithm confusion attack (alg: none and RS256->HS256)
2. The kid injection attack
3. JWK header injection
4. Exploiting weak key material

For each attack, explain: the technical mechanism, what the forged JWT would look like, what server-side misconfiguration enables it, and how to defend against it.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "alg_none", description: "Explains alg:none attack: set algorithm to none, remove signature, some libraries accept it", points: 2, keywords: ["alg", "none", "no signature", "remove", "algorithm none", "unsigned", "empty signature"], check: "Student explains setting the header algorithm to 'none' and removing the signature, exploiting libraries that do not enforce algorithm verification" },
      { id: "alg_confusion", description: "Explains RS256->HS256 confusion: sign with public key as HMAC secret, server verifies with same public key", points: 3, keywords: ["RS256", "HS256", "confusion", "public key", "HMAC", "asymmetric", "symmetric", "sign with public key"], check: "Student explains changing alg from RS256 to HS256 and signing with the server's public key (which may be publicly available), exploiting servers that use the same key for both algorithms" },
      { id: "kid_injection", description: "Explains kid injection: SQL injection or path traversal via the kid header parameter", points: 2, keywords: ["kid", "key ID", "injection", "SQL injection", "path traversal", "directory traversal", "/dev/null", "../../../../", "database"], check: "Student explains that the kid (key ID) value may be used in a file path or database query, enabling path traversal (e.g., kid: ../../../../dev/null) or SQL injection" },
      { id: "jwk_injection", description: "Explains JWK header injection: embedding attacker's public key in the token header", points: 1, keywords: ["jwk", "JWK", "header", "embed", "public key", "self-signed", "attacker key", "key in header"], check: "Student explains that some libraries accept a JWK parameter in the header, allowing the attacker to embed their own public key and sign with their private key" },
      { id: "defenses", description: "Describes proper defenses: enforce algorithm allowlist, never trust header-specified algorithms/keys", points: 2, keywords: ["allowlist", "algorithm", "enforce", "server-side", "ignore header", "hardcode", "explicit algorithm", "never trust"], check: "Student describes defenses: explicitly specify the allowed algorithm on the server side (never use the header's alg), validate kid against an allowlist, reject JWK/jku headers" }
    ],
    gaps: [
      { if_missing: "alg_none", gap: "Does not know the JWT algorithm:none attack" },
      { if_missing: "alg_confusion", gap: "Does not understand the JWT RS256/HS256 algorithm confusion attack" },
      { if_missing: "kid_injection", gap: "Does not know about JWT kid parameter injection (SQL injection or path traversal)" },
      { if_missing: "jwk_injection", gap: "Does not know about JWK header injection attacks" },
      { if_missing: "defenses", gap: "Does not know proper JWT security configuration (algorithm enforcement, key management)" }
    ]
  }
},

// WS-12: Deserialization attacks (difficulty 4, design_solution)
{
  competencyId: "web-security",
  subTopic: "deserialization-attacks",
  questionType: "design_solution",
  difficulty: 4,
  questionText: `A Python Flask application uses pickle for session management:

\`\`\`python
import pickle
import base64
from flask import Flask, request, make_response

app = Flask(__name__)

@app.route('/login', methods=['POST'])
def login():
    user = authenticate(request.form['username'], request.form['password'])
    if user:
        session_data = {'user_id': user.id, 'role': user.role, 'login_time': time.time()}
        encoded = base64.b64encode(pickle.dumps(session_data)).decode()
        resp = make_response(redirect('/dashboard'))
        resp.set_cookie('session', encoded)
        return resp
    return 'Login failed', 401

@app.route('/dashboard')
def dashboard():
    session_cookie = request.cookies.get('session')
    if not session_cookie:
        return redirect('/login')
    session_data = pickle.loads(base64.b64decode(session_cookie))
    return render_template('dashboard.html', user_id=session_data['user_id'])
\`\`\`

1. Explain why pickle deserialization of untrusted data leads to Remote Code Execution (RCE). What Python mechanism does pickle exploit?
2. Write a Python script that generates a malicious session cookie to execute \`id\` (or any OS command) on the server.
3. The developer proposes adding an HMAC signature to the cookie to prevent tampering. Is this sufficient? What other approach should they use instead?
4. Compare this vulnerability class across languages: Python pickle, Java ObjectInputStream, PHP unserialize, Node.js node-serialize. What is the common pattern?`,
  rubric: {
    maxScore: 9,
    criteria: [
      { id: "reduce_mechanism", description: "Explains that pickle uses __reduce__ to execute arbitrary code during deserialization", points: 2, keywords: ["__reduce__", "reduce", "arbitrary code", "object instantiation", "callable", "os.system", "subprocess", "magic method"], check: "Student explains that pickle's __reduce__ method allows an object to specify a callable and arguments to be invoked during deserialization, enabling arbitrary code execution" },
      { id: "exploit_code", description: "Provides a working exploit: class with __reduce__ returning (os.system, ('command',)) serialized and base64-encoded", points: 3, keywords: ["class", "__reduce__", "os.system", "pickle.dumps", "base64", "b64encode", "exploit", "payload"], check: "Student provides a Python script that creates a class with __reduce__ returning a tuple like (os.system, ('id',)), serializes it, base64-encodes it, and sets it as the session cookie" },
      { id: "hmac_analysis", description: "Explains HMAC helps prevent tampering but the real fix is not deserializing untrusted data at all", points: 2, keywords: ["HMAC", "signing", "not sufficient", "defense in depth", "JSON", "do not deserialize", "avoid pickle", "safe format"], check: "Student explains that HMAC signing adds integrity but the fundamental fix is to use a safe serialization format (JSON) rather than pickle for untrusted data" },
      { id: "cross_language", description: "Identifies the common deserialization pattern across at least 2 other languages", points: 2, keywords: ["Java", "ObjectInputStream", "PHP", "unserialize", "node-serialize", "gadget chain", "common pattern", "magic methods", "untrusted data"], check: "Student identifies that all languages share the pattern of deserializers invoking methods on reconstructed objects, enabling code execution (Java gadget chains, PHP magic methods, etc.)" }
    ],
    gaps: [
      { if_missing: "reduce_mechanism", gap: "Does not understand Python pickle's __reduce__ mechanism for arbitrary code execution" },
      { if_missing: "exploit_code", gap: "Cannot construct a working pickle deserialization exploit" },
      { if_missing: "hmac_analysis", gap: "Does not understand the limits of HMAC signing when the underlying format is inherently dangerous" },
      { if_missing: "cross_language", gap: "Does not understand insecure deserialization as a cross-language vulnerability class" }
    ]
  }
},

// WS-13: XXE (difficulty 4, compare_contrast)
{
  competencyId: "web-security",
  subTopic: "xxe",
  questionType: "compare_contrast",
  difficulty: 4,
  questionText: `An application accepts XML input in three different contexts. Compare the XXE attack potential and mitigation for each:

**Context A: PHP SOAP endpoint**
\`\`\`php
<?php
$xml = file_get_contents('php://input');
$dom = new DOMDocument();
$dom->loadXML($xml);
$data = simplexml_import_dom($dom);
// Process SOAP request
\`\`\`

**Context B: Python Flask with defusedxml**
\`\`\`python
import defusedxml.ElementTree as ET

@app.route('/api/import', methods=['POST'])
def import_data():
    tree = ET.fromstring(request.data)
    # Process XML data
\`\`\`

**Context C: Java Spring endpoint**
\`\`\`java
@PostMapping("/api/parse")
public ResponseEntity<String> parseXml(@RequestBody String xmlInput) {
    DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
    DocumentBuilder db = dbf.newDocumentBuilder();
    Document doc = db.parse(new InputSource(new StringReader(xmlInput)));
    // Process document
}
\`\`\`

For each context:
1. Is it vulnerable to XXE? Why or why not?
2. What specific XXE payloads would work (file read, SSRF, billion laughs)?
3. What is the correct mitigation in that language/framework?

Also explain: What is a blind XXE attack and how does out-of-band data exfiltration work with external DTDs?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "php_vuln", description: "Identifies PHP DOMDocument as vulnerable by default (external entities enabled)", points: 2, keywords: ["PHP", "DOMDocument", "vulnerable", "enabled by default", "external entities", "libxml", "LIBXML_NOENT"], check: "Student identifies that PHP's DOMDocument loads external entities by default (depending on PHP/libxml version), making Context A vulnerable to XXE" },
      { id: "python_safe", description: "Identifies defusedxml as safe: it blocks external entities, DTDs, and entity expansion", points: 1, keywords: ["defusedxml", "safe", "blocked", "disabled", "prevents", "secure parser"], check: "Student correctly identifies that Python's defusedxml library is specifically designed to prevent XXE by disabling external entities, DTDs, and entity expansion" },
      { id: "java_vuln", description: "Identifies Java DocumentBuilderFactory as vulnerable by default and requires explicit feature disabling", points: 2, keywords: ["Java", "DocumentBuilderFactory", "vulnerable", "default", "feature", "disallow-doctype-decl", "external-general-entities"], check: "Student identifies that Java's DocumentBuilderFactory processes external entities by default and requires explicit feature flags to disable them" },
      { id: "xxe_payloads", description: "Provides valid XXE payloads: file read (<!ENTITY xxe SYSTEM 'file:///etc/passwd'>) and SSRF", points: 2, keywords: ["ENTITY", "SYSTEM", "file:///", "DOCTYPE", "http://", "external entity", "payload", "/etc/passwd"], check: "Student provides concrete XXE payloads including file read (<!DOCTYPE foo [<!ENTITY xxe SYSTEM 'file:///etc/passwd'>]>) and SSRF via http:// entities" },
      { id: "blind_xxe", description: "Explains blind XXE with out-of-band exfiltration via parameter entities and external DTD", points: 2, keywords: ["blind", "out-of-band", "OOB", "parameter entity", "external DTD", "exfiltrate", "attacker server", "% entity"], check: "Student explains blind XXE: when output is not reflected, the attacker uses parameter entities to load an external DTD from their server, which reads local files and sends them to the attacker via a secondary HTTP request" },
      { id: "mitigations", description: "Provides correct mitigations per language: disable DTD processing, disable external entities", points: 1, keywords: ["disable DTD", "disable external entities", "FEATURE", "defusedxml", "factory.setFeature", "libxml_disable_entity_loader"], check: "Student provides language-specific mitigations: PHP (libxml_disable_entity_loader or LIBXML_NONET), Java (factory.setFeature with disallow-doctype-decl), and notes defusedxml as the Python solution" }
    ],
    gaps: [
      { if_missing: "php_vuln", gap: "Does not know PHP XML parser's default XXE vulnerability status" },
      { if_missing: "python_safe", gap: "Does not know about defusedxml as a safe XML parsing library in Python" },
      { if_missing: "java_vuln", gap: "Does not know about Java DocumentBuilderFactory XXE defaults" },
      { if_missing: "xxe_payloads", gap: "Cannot construct XXE payloads for file read or SSRF" },
      { if_missing: "blind_xxe", gap: "Does not understand blind XXE and out-of-band data exfiltration techniques" },
      { if_missing: "mitigations", gap: "Does not know language-specific XXE mitigations" }
    ]
  }
},

// WS-14: Security headers CSP/HSTS (difficulty 5, design_solution)
{
  competencyId: "web-security",
  subTopic: "security-headers-csp",
  questionType: "design_solution",
  difficulty: 5,
  questionText: `You are the security engineer for a web application with these requirements:

- The app serves from app.example.com
- It loads scripts from its own origin and from a trusted analytics provider (analytics.trusted.com)
- It uses inline styles generated by a CSS-in-JS framework (styled-components)
- Users can submit content with images hosted on an image CDN (images.usercdn.com)
- The app uses WebSockets for real-time updates (wss://ws.example.com)
- It embeds a payment iframe from pay.stripe.com
- The app must never be framed by third-party sites
- All connections must use HTTPS with no downgrade

Design a complete Content-Security-Policy header and HSTS configuration for this application. For each CSP directive, explain:
1. What it controls
2. Why you chose those specific sources
3. What attack it prevents

Also address: How would you deploy CSP safely using report-only mode? What are the risks of using 'unsafe-inline' for styles, and what is the alternative? How does CSP interact with nonce-based script loading?`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "script_src", description: "Configures script-src with self and analytics domain, using nonce or hash instead of unsafe-inline", points: 2, keywords: ["script-src", "'self'", "analytics.trusted.com", "nonce", "hash", "strict-dynamic", "no unsafe-inline"], check: "Student configures script-src with 'self' and analytics.trusted.com, ideally using nonces or hashes rather than 'unsafe-inline'" },
      { id: "style_handling", description: "Addresses CSS-in-JS with either nonce-based styles or 'unsafe-inline' with explanation of tradeoff", points: 2, keywords: ["style-src", "unsafe-inline", "nonce", "CSS-in-JS", "styled-components", "tradeoff", "hash"], check: "Student addresses the CSS-in-JS requirement, explaining the tradeoff of 'unsafe-inline' for style-src or proposing nonce-based style injection" },
      { id: "frame_directives", description: "Sets frame-src for Stripe payment iframe and frame-ancestors to prevent clickjacking", points: 2, keywords: ["frame-src", "frame-ancestors", "pay.stripe.com", "'none'", "'self'", "clickjacking", "child-src"], check: "Student configures frame-src to allow pay.stripe.com for the payment iframe and frame-ancestors to 'self' or 'none' to prevent third-party framing" },
      { id: "hsts", description: "Configures HSTS with max-age, includeSubDomains, and preload, explaining HTTPS enforcement", points: 2, keywords: ["HSTS", "Strict-Transport-Security", "max-age", "includeSubDomains", "preload", "HTTPS", "downgrade"], check: "Student configures Strict-Transport-Security with appropriate max-age (at least 1 year), includeSubDomains, and preload, explaining it prevents SSL stripping/downgrade attacks" },
      { id: "report_only", description: "Explains CSP report-only deployment strategy: deploy in report mode first, analyze violations, then enforce", points: 2, keywords: ["report-only", "Content-Security-Policy-Report-Only", "report-uri", "report-to", "violations", "monitor", "gradual", "enforce"], check: "Student describes deploying CSP in report-only mode first to collect violation reports without breaking functionality, then transitioning to enforcement after addressing legitimate violations" }
    ],
    gaps: [
      { if_missing: "script_src", gap: "Cannot configure CSP script-src directive with appropriate sources and nonce/hash usage" },
      { if_missing: "style_handling", gap: "Does not understand the CSP challenges of CSS-in-JS frameworks and style-src configuration" },
      { if_missing: "frame_directives", gap: "Does not understand CSP frame-src and frame-ancestors for iframe and clickjacking control" },
      { if_missing: "hsts", gap: "Does not understand HSTS configuration and its role in preventing HTTPS downgrade attacks" },
      { if_missing: "report_only", gap: "Does not know the safe deployment strategy for CSP using report-only mode" }
    ]
  }
},

// WS-15: Auth bypass and rate limiting (difficulty 5, compare_contrast)
{
  competencyId: "web-security",
  subTopic: "auth-bypass-brute-force",
  questionType: "compare_contrast",
  difficulty: 5,
  questionText: `Compare these three authentication implementations and their brute force protections. For each one, identify vulnerabilities and describe how an attacker would bypass the protections:

**Implementation A: Account lockout**
\`\`\`python
@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    user = db.find_user(username)
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401

    if user.failed_attempts >= 5:
        return jsonify({'error': 'Account locked. Contact support.'}), 423

    if not check_password(password, user.password_hash):
        db.increment_failed_attempts(username)
        return jsonify({'error': 'Invalid credentials'}), 401

    db.reset_failed_attempts(username)
    return jsonify({'token': generate_token(user)})
\`\`\`

**Implementation B: IP-based rate limiting**
\`\`\`python
from flask_limiter import Limiter
limiter = Limiter(app, key_func=get_remote_address)

@app.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    # ... standard login logic ...
\`\`\`

**Implementation C: CAPTCHA after failures**
\`\`\`python
@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    ip = request.remote_addr
    recent_failures = get_recent_failures(ip, minutes=15)

    if recent_failures >= 3:
        captcha_response = request.form.get('captcha')
        if not verify_captcha(captcha_response):
            return jsonify({'error': 'CAPTCHA required'}), 429

    # ... standard login logic ...
\`\`\`

For each implementation:
1. Describe the specific bypass technique(s)
2. Identify what each approach protects against and what it fails to protect against
3. What user experience issues does each approach create?

Then design a defense-in-depth authentication system that combines the best elements and addresses the weaknesses of all three.`,
  rubric: {
    maxScore: 10,
    criteria: [
      { id: "lockout_bypass", description: "Identifies account lockout bypass: user enumeration, DoS by locking others, credential stuffing with 4 attempts per account", points: 2, keywords: ["user enumeration", "DoS", "lock other", "denial of service", "credential stuffing", "4 attempts", "reverse brute force", "password spraying"], check: "Student identifies multiple issues: lockout reveals valid usernames, attackers can lock legitimate users out (DoS), and credential stuffing can try 4 passwords per account across many accounts (password spraying)" },
      { id: "ip_bypass", description: "Identifies IP rate limit bypass: distributed attack from many IPs, proxy rotation, IPv6 rotation, X-Forwarded-For spoofing", points: 2, keywords: ["distributed", "botnet", "proxy", "IP rotation", "X-Forwarded-For", "IPv6", "multiple IPs", "cloud", "VPN"], check: "Student identifies that IP-based limiting is bypassed with distributed attacks (botnets, proxy rotation, cloud IPs), and that X-Forwarded-For header spoofing may work if the app trusts proxied headers" },
      { id: "captcha_bypass", description: "Identifies CAPTCHA bypass: IP-only tracking allows per-IP fresh start, CAPTCHA solving services, keep failures under threshold", points: 2, keywords: ["CAPTCHA solving", "service", "2captcha", "per-IP", "rotate IP", "under threshold", "3 attempts", "automated solving"], check: "Student identifies that CAPTCHA tracking by IP alone allows reset by changing IP, and commercial CAPTCHA solving services (2captcha, anti-captcha) can automate bypass" },
      { id: "user_experience", description: "Discusses UX tradeoffs: lockout frustrates legitimate users, rate limits block shared IPs, CAPTCHAs add friction", points: 2, keywords: ["user experience", "UX", "frustrate", "shared IP", "office", "NAT", "friction", "legitimate user", "accessibility"], check: "Student discusses UX problems: lockout blocks legitimate users who forgot passwords, IP limiting affects shared IPs (offices, NAT), CAPTCHAs add friction and accessibility issues" },
      { id: "defense_in_depth", description: "Designs a layered system: progressive delays, multi-factor tracking (IP+account+device), anomaly detection, MFA", points: 2, keywords: ["progressive", "exponential backoff", "multi-factor", "IP and account", "device fingerprint", "anomaly", "MFA", "2FA", "defense in depth", "combined"], check: "Student designs a layered approach combining multiple signals (IP, account, device fingerprint), progressive delays or exponential backoff, anomaly detection, and MFA/2FA as the ultimate protection" }
    ],
    gaps: [
      { if_missing: "lockout_bypass", gap: "Does not understand the weaknesses of account lockout (enumeration, DoS, password spraying)" },
      { if_missing: "ip_bypass", gap: "Does not understand how IP-based rate limiting is bypassed with distributed attacks" },
      { if_missing: "captcha_bypass", gap: "Does not understand CAPTCHA bypass techniques (solving services, IP rotation)" },
      { if_missing: "user_experience", gap: "Does not consider user experience impact when evaluating authentication security controls" },
      { if_missing: "defense_in_depth", gap: "Cannot design a defense-in-depth authentication system combining multiple protection layers" }
    ]
  }
}
,
];
