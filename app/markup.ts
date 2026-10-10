// Estructura HTML de la app (login + panel). La lógica vive en public/dyc-app.js
export const MARKUP = String.raw`<div id="login" style="min-height:100vh;display:grid;place-items:center;padding-inline:16px;padding-block:24px">
  <form id="fLogin" class="card" style="width:min(100%,400px);display:flex;flex-direction:column;gap:12px">
    <div class="brand" style="padding:0">CORPO<span>TEX</span></div>
    <div class="muted" style="font-size:13px;margin-top:-8px">Grupo DYC · Unicrack School Athletic · Corpotex</div>
    <label for="lUser" style="display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--muted)">Usuario<input id="lUser" autocomplete="username" required placeholder="maria.ventas"></label>
    <label for="lPin" style="display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--muted)">Clave<input id="lPin" type="password" autocomplete="current-password" required></label>
    <div id="lErr" style="color:var(--bad);font-size:13px" hidden></div>
    <button class="pri" type="submit">Ingresar</button>
    <details style="font-size:12px" class="muted"><summary>Usuarios de demostración</summary>
      <div id="demoUsers" style="margin-top:6px;display:flex;flex-direction:column;gap:4px"></div></details>
  </form>
</div>
<div class="app" id="appMain" hidden>
  <aside id="side"></aside>
  <main>
    <header>
      <div><div class="muted" style="font-size:12px">Grupo DYC · Unicrack School Athletic · Corpotex</div><h1 id="ttl">Inicio</h1></div>
      <div class="role" id="who"></div>
    </header>
    <div id="view" style="display:flex;flex-direction:column;gap:16px"></div>
  </main>
</div>
<div id="toast" role="status"></div>
`;
