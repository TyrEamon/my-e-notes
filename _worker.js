export default {
  async fetch(req, env, ctx) {
    try {
      const url = new URL(req.url);
      
      if (req.method === "GET" && url.pathname === "/") {
        return renderPublicPage(env, req);
      }
      if (req.method === "GET" && url.pathname === "/admin") {
        return renderAdminPage(env, req);
      }
      if (req.method === "POST" && url.pathname === "/api/login") {
        return handleLogin(env, req);
      }
      if (req.method === "POST" && url.pathname === "/api/logout") {
        return handleLogout();
      }
      if (req.method === "POST" && url.pathname === "/api/save") {
        return handleSave(env, req);
      }
      if (req.method === "GET" && url.pathname === "/api/pages") {
        return handleGetPages(env);
      }
      if (req.method === "POST" && url.pathname === "/api/pages") {
        return handleCreatePage(env, req);
      }
      if (req.method === "GET" && url.pathname.startsWith("/api/page/")) {
        const pageId = url.pathname.split("/").pop();
        return handleGetPage(env, pageId);
      }
      if (req.method === "POST" && url.pathname.startsWith("/api/delete/")) {
        const pageId = url.pathname.split("/").pop();
        return handleDeletePage(env, req, pageId);
      }
      if (req.method === "GET" && url.pathname === "/api/bg") {
        return handleGetBg(env);
      }
      if (req.method === "POST" && url.pathname === "/api/save-bg") {
        return handleSaveBg(env, req);
      }
      return withSecurityHeaders(new Response("Not Found", { status: 404 }));
    } catch (e) {
      return withSecurityHeaders(new Response("Internal Error", { status: 500 }));
    }
  },
};

function withSecurityHeaders(res) {
  const headers = new Headers(res.headers);
  headers.set("Content-Type", headers.get("Content-Type") || "text/html; charset=utf-8");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Cache-Control", "no-store");
  return new Response(res.body, { status: res.status, headers });
}

function textResponse(text, contentType = "text/plain;charset=utf-8", status = 200) {
  return withSecurityHeaders(new Response(text, { status, headers: { "Content-Type": contentType } }));
}

async function getPagesList(env) {
  const data = (await env.NOTES.get("pages:list")) || "page1";
  return data.split(",").filter(p => p.trim());
}

async function savePagesList(env, pages) {
  await env.NOTES.put("pages:list", pages.join(","));
}

async function getBackgroundImages(env) {
  const pc = (await env.NOTES.get("bg:pc")) || "";
  const mobile = (await env.NOTES.get("bg:mobile")) || "";
  return { pc, mobile };
}

async function handleGetBg(env) {
  const bg = await getBackgroundImages(env);
  return new Response(JSON.stringify(bg), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function handleGetPages(env) {
  const pages = await getPagesList(env);
  return new Response(JSON.stringify({ pages }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function handleGetPage(env, pageId) {
  const content = (await env.NOTES.get(`note:${pageId}`)) ?? "";
  return new Response(JSON.stringify({ content }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function handleCreatePage(env, req) {
  const authed = await isAuthed(env, req);
  if (!authed) return withSecurityHeaders(new Response("Forbidden", { status: 403 }));
  
  const ct = req.headers.get("Content-Type") || "";
  let pageName = "";
  if (ct.includes("application/json")) {
    const data = await req.json().catch(() => ({}));
    pageName = data?.name ?? "";
  } else {
    const form = await req.formData();
    pageName = form.get("name") || "";
  }
  
  pageName = pageName.trim().slice(0, 20);
  if (!pageName) return withSecurityHeaders(new Response("Bad Request", { status: 400 }));
  
  const pageId = "page_" + Date.now();
  const pages = await getPagesList(env);
  pages.push(pageId);
  await savePagesList(env, pages);
  await env.NOTES.put(`note:${pageId}`, "");
  await env.NOTES.put(`title:${pageId}`, pageName);
  
  return new Response(null, { status: 201, headers: { "Cache-Control": "no-store" } });
}

async function handleDeletePage(env, req, pageId) {
  const authed = await isAuthed(env, req);
  if (!authed) return withSecurityHeaders(new Response("Forbidden", { status: 403 }));
  if (pageId === "page1") return withSecurityHeaders(new Response("Cannot delete default page", { status: 400 }));
  
  const pages = await getPagesList(env);
  const idx = pages.indexOf(pageId);
  if (idx > -1) {
    pages.splice(idx, 1);
    await savePagesList(env, pages);
  }
  
  await env.NOTES.delete(`note:${pageId}`);
  await env.NOTES.delete(`title:${pageId}`);
  
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

async function handleSaveBg(env, req) {
  const authed = await isAuthed(env, req);
  if (!authed) return withSecurityHeaders(new Response("Forbidden", { status: 403 }));

  const data = await req.json().catch(() => ({}));
  const { key, url } = data;
  if (key !== "bg:pc" && key !== "bg:mobile") return withSecurityHeaders(new Response("Bad Request", { status: 400 }));

  await env.NOTES.put(key, url || "");
  return new Response(null, { status: 204 });
}

async function renderPublicPage(env, req) {
  const pages = await getPagesList(env);
  const firstPage = pages[0] || "page1";
  const content = (await env.NOTES.get(`note:${firstPage}`)) ?? "欢迎使用 Edge Notes！在 /admin 登录后开始编辑。";
  const bg = await getBackgroundImages(env);
  
  let pageTabs = "";
  for (const page of pages) {
    const title = (await env.NOTES.get(`title:${page}`)) || page;
    pageTabs += `<button class="tab" onclick="switchPage('${page}', '/');">${escapeHTML(title)}</button>`;
  }
  
  const html = baseHTML({
    title: "Edge Notes",
    bgPc: bg.pc,
    bgMobile: bg.mobile,
    body: `
      <main class="container read">
        <header>
          <h1>Edge Notes</h1>
          <nav><a class="btn" href="/admin">管理</a></nav>
        </header>
        <div class="tabs">${pageTabs}</div>
        <article id="note">${escapeHTML(content).replace(/\n/g, "<br>")}</article>
        <footer>Powered by Cloudflare Worker · 极简备忘录</footer>
      </main>
      <script>
        async function switchPage(pageId, mode) {
          const res = await fetch(\`/api/page/\${pageId}\`);
          if (res.ok) {
            const data = await res.json();
            document.getElementById('note').innerHTML = data.content.split('\\n').map(l => escapeHTML(l)).join('<br>');
            document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
          }
        }
        function escapeHTML(s) {
          return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;"}[c]));
        }
        document.querySelectorAll('.tab')[0]?.classList.add('active');
      </script>
    `,
  });
  return textResponse(html, "text/html; charset=utf-8");
}

async function renderAdminPage(env, req) {
  const authed = await isAuthed(env, req);
  if (!authed) {
    const html = baseHTML({
      title: "登录 · Edge Notes",
      bgPc: "",
      bgMobile: "",
      body: `
      <main class="container narrow">
        <h1>管理员登录</h1>
        <form method="post" action="/api/login" class="card">
          <label>密码</label>
          <input type="password" name="password" placeholder="输入管理员密码" required />
          <button class="btn primary" type="submit">登录</button>
        </form>
      </main>
      `,
    });
    return textResponse(html, "text/html; charset=utf-8");
  }
  
  const pages = await getPagesList(env);
  const firstPage = pages[0] || "page1";
  const content = (await env.NOTES.get(`note:${firstPage}`)) ?? "";
  const bg = await getBackgroundImages(env);
  
  let pageList = "";
  for (const page of pages) {
    const title = (await env.NOTES.get(`title:${page}`)) || page;
    const delBtn = page !== "page1" ? `<button type="button" class="btn-del" onclick="deletePage('${page}');">删</button>` : "";
    pageList += `<div class="page-item"><span onclick="switchEditPage('${page}');" style="cursor:pointer;flex:1;">${escapeHTML(title)}</span>${delBtn}</div>`;
  }
  
  const html = baseHTML({
    title: "编辑 · Edge Notes",
    bgPc: bg.pc,
    bgMobile: bg.mobile,
    body: `
      <main class="container edit">
        <header>
          <h1>编辑笔记</h1>
          <form method="post" action="/api/logout">
            <button class="btn" type="submit">退出</button>
          </form>
        </header>

        <div class="edit-layout">
          <aside class="sidebar">
            <h3>页面列表</h3>
            <div class="page-list">${pageList}</div>
            <div class="page-new">
              <input type="text" id="newPageName" placeholder="新页面名称" maxlength="20" />
              <button onclick="createPage();" class="btn small">新建</button>
            </div>

            <div class="bg-settings">
              <h3>背景图设置</h3>
              <label>PC背景图URL</label>
              <input type="text" id="bgPc" value="${escapeHTML(bg.pc)}" placeholder="PC端背景图片URL" />
              <label>手机背景图URL</label>
              <input type="text" id="bgMobile" value="${escapeHTML(bg.mobile)}" placeholder="手机端背景图片URL" />
              <button onclick="saveBackgroundUrls();" class="btn small">保存背景图</button>
              <span id="bgStatus" class="muted"></span>
            </div>
          </aside>

          <section class="card editor">
            <textarea id="editor" placeholder="开始记录...">${escapeHTML(content)}</textarea>
            <div class="row">
              <button id="save" class="btn primary">保存 (Ctrl/Cmd+S)</button>
              <span id="status" class="muted"></span>
            </div>
          </section>
        </div>
      </main>

      <script>
        let currentPage = '${firstPage}';
        const $ = (s) => document.querySelector(s);
        const statusEl = $("#status");

        async function save(content) {
          statusEl.textContent = "保存中…";
          const res = await fetch("/api/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pageId: currentPage, content }),
          });
          if (res.ok) {
            statusEl.textContent = "已保存";
          } else {
            statusEl.textContent = "保存失败";
          }
          setTimeout(() => (statusEl.textContent = ""), 1500);
        }

        async function switchEditPage(pageId) {
          const res = await fetch(\`/api/page/\${pageId}\`);
          if (res.ok) {
            currentPage = pageId;
            const data = await res.json();
            $("#editor").value = data.content;
            document.querySelectorAll(".page-item").forEach(el => el.classList.remove("active"));
            event.target.closest(".page-item")?.classList.add("active");
            statusEl.textContent = "";
          }
        }

        async function createPage() {
          const name = $("#newPageName").value.trim();
          if (!name) return alert("请输入页面名称");
          const res = await fetch("/api/pages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          });
          if (res.ok) {
            location.reload();
          } else {
            alert("创建失败");
          }
        }

        async function deletePage(pageId) {
          if (!confirm("确定删除此页面？")) return;
          const res = await fetch(\`/api/delete/\${pageId}\`, { method: "POST" });
          if (res.ok) {
            location.reload();
          } else {
            alert("删除失败");
          }
        }

        async function saveBackgroundUrls() {
          const pcUrl = $("#bgPc").value.trim();
          const mobileUrl = $("#bgMobile").value.trim();
          const bgStatusEl = $("#bgStatus");

          const resPc = await fetch("/api/save-bg", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "bg:pc", url: pcUrl }),
          });
          const resMobile = await fetch("/api/save-bg", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "bg:mobile", url: mobileUrl }),
          });

          if (resPc.ok && resMobile.ok) {
            bgStatusEl.textContent = "保存成功，刷新页面查看效果";
            setTimeout(() => { location.reload(); }, 1000);
          } else {
            bgStatusEl.textContent = "保存失败";
          }
          setTimeout(() => { if (bgStatusEl.textContent !== "保存成功，刷新页面查看效果") bgStatusEl.textContent = ""; }, 2000);
        }

        $("#save").addEventListener("click", () => save($("#editor").value));
        document.addEventListener("keydown", (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            e.preventDefault();
            save($("#editor").value);
          }
        });

        function escapeHTML(s) {
          return s.replace(/[&<>"']/g, (c) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          }[c]));
        }

        document.querySelector(".page-item")?.classList.add("active");
      </script>
    `,
  });
  return textResponse(html, "text/html; charset=utf-8");
}

async function handleLogin(env, req) {
  const ct = req.headers.get("Content-Type") || "";
  let password = "";
  if (ct.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    password = form.get("password") || "";
  } else if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    password = body?.password ?? "";
  } else {
    const form = await req.formData();
    password = form.get("password") || "";
  }
  
  if (!password || password !== env.ADMIN_PASSWORD) {
    return withSecurityHeaders(new Response("Unauthorized", { status: 401 }));
  }
  
  const token = await sign("ok", env.SECRET_KEY);
  const headers = new Headers({
    "Set-Cookie": cookieSet("edgenote", token, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    }),
  });
  headers.set("Location", "/admin");
  return withSecurityHeaders(new Response(null, { status: 302, headers }));
}

function handleLogout() {
  const headers = new Headers({ "Set-Cookie": cookieClear("edgenote", { path: "/" }) });
  headers.set("Location", "/admin");
  return withSecurityHeaders(new Response(null, { status: 302, headers }));
}

async function handleSave(env, req) {
  const authed = await isAuthed(env, req);
  if (!authed) return withSecurityHeaders(new Response("Forbidden", { status: 403 }));
  
  const ct = req.headers.get("Content-Type") || "";
  let pageId = "page1";
  let content = "";
  
  if (ct.includes("application/json")) {
    const data = await req.json().catch(() => ({}));
    pageId = data?.pageId ?? "page1";
    content = data?.content ?? "";
  } else if (ct.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    pageId = form.get("pageId") || "page1";
    content = form.get("content") || "";
  } else {
    content = await req.text();
  }
  
  await env.NOTES.put(`note:${pageId}`, content || "");
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

async function isAuthed(env, req) {
  const cookies = parseCookies(req.headers.get("Cookie") || "");
  const token = cookies["edgenote"];
  if (!token) return false;
  const expected = await sign("ok", env.SECRET_KEY);
  return safeCompare(token, expected);
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return toHex(new Uint8Array(sig));
}

function toHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeCompare(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function parseCookies(cookie) {
  const out = {};
  cookie.split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function cookieSet(name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  return parts.join("; ");
}

function cookieClear(name, opts = {}) {
  const base = [`${name}=`, "Expires=Thu, 01 Jan 1970 00:00:00 GMT", "Max-Age=0"];
  if (opts.path) base.push(`Path=${opts.path}`);
  base.push("HttpOnly", "Secure", "SameSite=Strict");
  return base.join("; ");
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function baseHTML({ title, bgPc, bgMobile, body }) {
  const bgStyle = bgPc || bgMobile ? `
    <style>
      @media (min-aspect-ratio: 4/3) {
        body {
          background-image: url("${bgPc}");
        }
      }
      @media (max-aspect-ratio: 3/4) {
        body {
          background-image: url("${bgMobile}");
        }
      }
    </style>
  ` : "";

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHTML(title)}</title>
<style>
:root{
  --bg:#0b0c10; --card:#151821; --text:#e6e8ee; --muted:#9aa3b2; --primary:#5b8cff; --primary-2:#4676ea; --border:#242838;
  --radius:14px; --shadow:0 10px 30px rgba(0,0,0,.25);
}
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:#0b0c10;color:var(--text);font:16px/1.6 system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial;background-position:center center;background-repeat:no-repeat;background-size:cover;background-attachment:fixed}
a{color:var(--primary);text-decoration:none}
.container{max-width:860px;margin:40px auto;padding:0 16px}
.container.narrow{max-width:420px}
header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
h1{font-size:22px;margin:0}
.card{background:rgba(21,24,33,0.12);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);padding:18px;border:1px solid rgba(255,255,255,0.1);border-radius:var(--radius);box-shadow:var(--shadow)}
.read article{background:rgba(21,24,33,0.28);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);padding:22px;border:1px solid rgba(255,255,255,0.1);border-radius:var(--radius);box-shadow:var(--shadow);min-height:200px;margin:0}
.tabs{display:flex;gap:8px;margin:12px 0;flex-wrap:wrap}
.tab{background:rgba(17,21,35,0.8);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.1);color:var(--text);padding:8px 12px;border-radius:8px;cursor:pointer;font-size:12px;transition:all 0.3s}
.tab:hover{background:rgba(91,140,255,0.3)}
.tab.active{background:var(--primary);color:white;border-color:transparent}
.edit-layout{display:flex;gap:20px;margin-top:20px}
.sidebar{flex:0 0 200px;background:rgba(21,24,33,0.22);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);padding:16px;border:1px solid rgba(255,255,255,0.1);border-radius:var(--radius);max-height:70vh;overflow-y:auto}
.sidebar h3{margin:0 0 12px;font-size:14px;color:var(--text)}
.page-list{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
.page-item{display:flex;align-items:center;gap:8px;padding:8px;background:rgba(15,18,26,0.7);border-radius:6px;border:1px solid transparent;transition:all 0.2s}
.page-item:hover{background:rgba(15,18,26,0.9)}
.page-item.active{border-color:var(--primary);background:rgba(91,140,255,0.2)}
.btn-del{background:#ff4444;border:0;color:white;padding:2px 6px;border-radius:4px;font-size:10px;cursor:pointer;transition:all 0.2s}
.btn-del:hover{background:#ff2222}
.page-new{display:flex;gap:6px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1)}
#newPageName{flex:1;height:32px;background:rgba(15,18,26,0.7);border:1px solid rgba(255,255,255,0.15);color:var(--text);padding:0 8px;border-radius:6px;font-size:12px}
.bg-settings{margin-top:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1)}
.bg-settings h3{margin:0 0 10px;font-size:12px}
.bg-settings label{display:block;font-size:11px;color:var(--muted);margin:8px 0 4px}
.bg-settings input{width:100%;height:28px;background:rgba(15,18,26,0.7);border:1px solid rgba(255,255,255,0.15);color:var(--text);padding:0 6px;border-radius:6px;font-size:11px;margin-bottom:4px}
.btn.small{height:32px;padding:0 10px;font-size:12px}
.editor{flex:1;display:flex;flex-direction:column;gap:12px;background:rgba(21,24,33,0.25);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
textarea{width:100%;min-height:55vh;resize:vertical;background:rgba(15,18,26,0.8);border:1px solid rgba(255,255,255,0.15);color:var(--text);padding:12px;border-radius:10px;font:14px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace}
textarea::placeholder{color:rgba(230,232,238,0.4)}
input[type=password]{width:100%;height:40px;background:rgba(15,18,26,0.8);border:1px solid rgba(255,255,255,0.15);border-radius:10px;color:var(--text);padding:0 12px;margin:6px 0 12px;font-size:14px}
input[type=password]::placeholder{color:rgba(230,232,238,0.4)}
.btn{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(17,21,35,0.8);color:var(--text);cursor:pointer;font-size:14px;transition:all 0.2s;backdrop-filter:blur(5px)}
.btn:hover{background:rgba(17,21,35,0.95)}
.btn.primary{background:var(--primary);border-color:transparent;color:white}
.btn.primary:hover{background:var(--primary-2)}
.row{display:flex;gap:12px;align-items:center;justify-content:flex-start}
.muted{color:var(--muted);font-size:12px}
footer{margin:24px 0;color:var(--muted);text-align:center;font-size:12px}
label{font-size:13px;color:var(--text);display:block;margin:10px 0 6px}
@media (max-width:768px) {
  .edit-layout{flex-direction:column}
  .sidebar{flex:1;max-height:auto}
  textarea{min-height:40vh}
}
</style>
${bgStyle}
</head>
<body>
${body}
</body>
</html>`;
}
