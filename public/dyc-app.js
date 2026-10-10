
const DAY=864e5, today=new Date(); today.setHours(0,0,0,0);
const addD=n=>new Date(today.getTime()+n*DAY).toISOString().slice(0,10);
const fmtD=s=>{const d=new Date(s+'T00:00');return d.toLocaleDateString('es-PE',{weekday:'short',day:'2-digit',month:'short'})};
const daysTo=s=>Math.round((new Date(s+'T00:00')-today)/DAY);
const S=n=>'S/ '+Number(n).toLocaleString('es-PE',{minimumFractionDigits:0,maximumFractionDigits:0});
const r1=n=>Math.round(n*10)/10;
let RATE=0.25; /* S/ por minuto de mano de obra directa (lo edita gerencia) */
/* "tela" se reemplaza por el material que elige el cliente */
const PROD={
  polo:{n:'Polo piqué corte regular',bom:{tela:1.1,hil:15},mat:'pq',mats:['pq','jer','dry'],min:12,base:32,fit:'Corte regular: hombro en su sitio, ajuste al cuerpo. Elige tu talla habitual.',
    tallas:['S','M','L','XL','XXL'],med:{pecho:[48,51,54,57,60],largo:[68,71,74,76,78],manga:[20,21,22,23,24]}},
  oversize:{n:'Polo oversize',bom:{tela:1.35,hil:10},mat:'jer',mats:['jer','ft'],min:14,base:38,fit:'Oversize: hombro caído, unos 7 cm más de pecho y manga más larga. Elige tu talla habitual para un efecto holgado, o una menos si lo quieres más ajustado.',
    tallas:['S','M','L','XL','XXL'],med:{pecho:[55,58,61,64,67],largo:[70,72,74,76,78],manga:[23,24,25,26,27]}},
  buzo:{n:'Buzo escolar',bom:{tela:1.4,rib:0.2,cie:1,hil:12},mat:'ft',mats:['ft','micro'],min:23,base:62,fit:'Buzo escolar: casaca con cierre y puños de rib. Incluye tallas de niño (8 a 14).',
    tallas:['8','10','12','14','S','M','L'],med:{pecho:[40,43,46,49,52,55,58],largo:[50,54,58,62,66,69,72],manga:[44,48,52,56,60,62,64]}},
  casaca:{n:'Casaca corporativa',bom:{tela:1.6,cie:1,hil:20},mat:'tafe',mats:['tafe','soft'],min:30,base:95,fit:'Casaca corporativa: corte recto con espacio para usar encima de un polo o camisa.',
    tallas:['S','M','L','XL','XXL'],med:{pecho:[54,57,60,63,66],largo:[68,71,73,75,77],manga:[62,64,65,66,67]}},
  camisa:{n:'Camisa Oxford manga larga',bom:{tela:1.7,hil:6},mat:'oxf',mats:['oxf','dril'],min:35,base:58,marca:'Corpotex',fit:'Camisa corporativa: corte clásico con cuello y botonadura completa. Elige tu talla habitual.',
    tallas:['S','M','L','XL','XXL'],med:{pecho:[52,55,58,61,64],largo:[72,74,76,78,80],manga:[60,62,63,64,65]}},
  chaleco:{n:'Chaleco con cintas reflectivas',bom:{tela:0.9,hil:4},mat:'dril',mats:['dril','soft'],min:18,base:45,marca:'Corpotex',fit:'Chaleco de seguridad (EPP): holgado para usar sobre la ropa de trabajo, con cintas reflectivas.',
    tallas:['S','M','L','XL','XXL'],med:{pecho:[54,57,60,63,66],largo:[64,66,68,70,72],manga:[0,0,0,0,0]}},
  ambo:{n:'Ambo médico (chaqueta)',bom:{tela:1.2,hil:5},mat:'anti',mats:['anti'],min:16,base:48,marca:'Corpotex',fit:'Ambo de salud: cuello en V y tela antifluido. Corte recto y cómodo para jornadas largas.',
    tallas:['S','M','L','XL','XXL'],med:{pecho:[50,53,56,59,62],largo:[68,70,72,74,76],manga:[22,23,24,25,26]}},
  chef:{n:'Chaqueta de chef',bom:{tela:1.8,hil:6},mat:'dril',mats:['dril','anti'],min:40,base:85,marca:'Corpotex',fit:'Chaqueta de cocina: cuello mao y doble botonadura. Algo holgada para trabajar con libertad.',
    tallas:['S','M','L','XL','XXL'],med:{pecho:[54,57,60,63,66],largo:[72,74,76,78,80],manga:[60,62,63,64,65]}}};
const MATP={pq:0,jer:-2,dry:4,ft:0,micro:6,tafe:0,soft:18,oxf:4,dril:2,anti:6};
const MATLOOK={oxf:{r:0.8,m:0,b:0.01},dril:{r:0.88,m:0,b:0.01},anti:{r:0.6,m:0,b:0.005},pq:{r:0.95,m:0,b:0.03},jer:{r:0.85,m:0,b:0.01},dry:{r:0.35,m:0.05,b:0.01},ft:{r:1,m:0,b:0.02},micro:{r:1,m:0,b:0.04},tafe:{r:0.3,m:0.15,b:0.005},soft:{r:0.55,m:0.05,b:0.01}};
const PERSP={'Ninguna':0,'Bordado de nombres':4,'Bordado de logo':3,'Sublimado':6,'DTF':5,'Vinil':3};
const ETAPAS=['Pendiente VB','VB aprobado','Confirmado','En producción','Calidad','Listo despacho','Entregado'];
const ROLN={ventas:'Asesora de ventas',produccion:'Producción',almacen:'Almacén y compras',gerencia:'Gerencia',cliente:'Cliente'};
/* Qué secciones ve cada rol */
const ACCESS={
  ventas:['inicio','pedidos','plan','cambios','cliente'],
  produccion:['inicio','pedidos','abast','plan','planta','talleres','cambios','calidad'],
  almacen:['inicio','pedidos','abast','talleres','cambios','calidad'],
  gerencia:['inicio','pedidos','abast','plan','planta','talleres','cambios','calidad','costos','cliente','portal','config','usuarios'],
  cliente:['cliente','portal']};
/* Quién ve montos de dinero (costos de MP, pagos a talleres, márgenes) */
const VEDINERO=r=>r==='gerencia'||r==='almacen';

function seed(){return{
  mp:[
    {id:'ft',n:'Tela french terry azul marino',u:'m',stock:260,cons:40,lead:2,seg:30,prov:'Textil Sur',costo:14},
    {id:'pq',n:'Tela piqué blanca',u:'m',stock:95,cons:35,lead:2,seg:30,prov:'Textil Sur',costo:12},
    {id:'rib',n:'Rib para puños',u:'m',stock:60,cons:8,lead:3,seg:10,prov:'Tejidos Lima',costo:9},
    {id:'cie',n:'Cierre 50 cm',u:'u',stock:140,cons:25,lead:4,seg:40,prov:'Avíos Perú',costo:1.5},
    {id:'hil',n:'Hilo de bordado',u:'m',stock:5200,cons:900,lead:2,seg:1000,prov:'Avíos Perú',costo:0.02},
    {id:'tafe',n:'Tela taffeta para casaca',u:'m',stock:40,cons:15,lead:5,seg:20,prov:'Importex',costo:18},
    {id:'jer',n:'Tela jersey 20/1 algodón',u:'m',stock:300,cons:30,lead:2,seg:40,prov:'Textil Sur',costo:10},
    {id:'dry',n:'Tela dry-fit deportiva',u:'m',stock:120,cons:10,lead:3,seg:20,prov:'Tejidos Lima',costo:13},
    {id:'micro',n:'Tela micropolar',u:'m',stock:80,cons:8,lead:4,seg:15,prov:'Tejidos Lima',costo:15},
    {id:'soft',n:'Tela softshell',u:'m',stock:50,cons:6,lead:7,seg:15,prov:'Importex',costo:24},
    {id:'oxf',n:'Tela Oxford para camisa',u:'m',stock:220,cons:25,lead:3,seg:40,prov:'Textil Sur',costo:13},
    {id:'dril',n:'Drill industrial',u:'m',stock:180,cons:30,lead:3,seg:50,prov:'Tejidos Lima',costo:11},
    {id:'anti',n:'Tela antifluido',u:'m',stock:70,cons:12,lead:5,seg:25,prov:'Importex',costo:16}],
  orders:[
    {id:1041,cli:'Colegio Pamer',marca:'Unicrack',p:'buzo',cant:90,fecha:addD(2),precio:72,pers:'Bordado de nombres',dis:'Aprobado',est:'Listo despacho',taller:0,urg:'',vb:{by:'Producción',nota:'OK',fecha:addD(-14)}},
    {id:1042,cli:'Colegio San Martín',marca:'Unicrack',p:'buzo',cant:120,fecha:addD(12),precio:75,pers:'Bordado de nombres',dis:'Aprobado',est:'En producción',taller:1230,urg:'',vb:{by:'Producción',nota:'Entrega viable',fecha:addD(-5)}},
    {id:1043,cli:'Minera Andes',marca:'Corpotex',p:'polo',cant:300,fecha:addD(9),precio:38,pers:'Bordado de logo',dis:'Aprobado',est:'Pendiente VB',taller:0,urg:'',vb:null},
    {id:1044,cli:'I.E. Santa Rosa',marca:'Unicrack',p:'casaca',cant:80,fecha:addD(20),precio:120,pers:'Sublimado',dis:'Pendiente',est:'VB aprobado',taller:0,urg:'',vb:{by:'Producción',nota:'Requiere compra de taffeta',fecha:addD(-1)}},
    {id:1045,cli:'Clínica Vida',marca:'Corpotex',p:'polo',cant:60,fecha:addD(6),precio:40,pers:'DTF',dis:'Aprobado',est:'Observado',taller:0,urg:'',vb:{by:'Producción',nota:'Falta tabla de tallas por persona',fecha:addD(0)}}],
  req:[{id:301,mp:'tafe',cant:120,est:'Aprobado',origen:'Pedido #1044',limite:addD(0)}],
  cambios:[{id:1,cli:'Ana R.',det:'Polo M a L',paso:3},{id:2,cli:'Luis T.',det:'Basta de pantalón',paso:5},{id:3,cli:'Sofía M.',det:'Disminuir talla',paso:9}],
  users:[
    {u:'maria.ventas',n:'María Quispe',rol:'ventas',pin:'ventas123',activo:true},
    {u:'carlos.produccion',n:'Carlos Huamán',rol:'produccion',pin:'prod123',activo:true},
    {u:'carla.almacen',n:'Carla Rojas',rol:'almacen',pin:'alma123',activo:true},
    {u:'gerencia',n:'Gerencia DYC',rol:'gerencia',pin:'gere123',activo:true},
    {u:'sanmartin',n:'Colegio San Martín',rol:'cliente',cli:'Colegio San Martín',pin:'cli123',activo:true},
    {u:'minera.andes',n:'Minera Andes',rol:'cliente',cli:'Minera Andes',pin:'cli123',activo:true}],
  cfg:null,
  log:[{t:'Sistema',m:'App iniciada con datos de ejemplo'}],seq:1046,rseq:302,order:[]}}
let D; try{D=JSON.parse(localStorage.getItem('dycflow-v4'))}catch(e){} if(!D)D=seed();
let role=null, user=null, view='inicio', sel=null;
const save=()=>{try{localStorage.setItem('dycflow-v4',JSON.stringify(D))}catch(e){}};
/* Parámetros que solo gerencia puede editar */
if(!D.cfg)D.cfg={base:Object.fromEntries(Object.entries(PROD).map(([k,p])=>[k,p.base])),matp:{...MATP},persp:{...PERSP},rate:RATE,dtoMin:100,dtoPct:8,merma:3,minPedido:12,aprobCompra:1000};
function applyCfg(){const c=D.cfg;Object.entries(c.base).forEach(([k,v])=>PROD[k].base=+v);Object.assign(MATP,c.matp);Object.assign(PERSP,c.persp);RATE=+c.rate}
applyCfg();
const mp=id=>D.mp.find(m=>m.id===id);
const log=m=>{D.log.unshift({t:user?user.n+' · '+ROLN[role]:'Sistema',m,h:new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})});save()};
const toast=m=>{const t=document.getElementById('toast');t.textContent=m;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),3200)};

/* Abastecimiento */
const PR=m=>m.cons*m.lead+m.seg;
const coverDays=m=>Math.floor((m.stock-m.seg)/m.cons);
const buyBy=m=>coverDays(m)-m.lead; /* días desde hoy */
const incoming=id=>D.req.filter(r=>r.mp===id&&r.est!=='Recibido').reduce((a,r)=>a+r.cant,0);
const need=o=>Object.entries(PROD[o.p].bom).map(([k,q])=>({m:mp(k==='tela'?(o.mat||PROD[o.p].mat):k),q:r1(q*o.cant)}));
const short=o=>need(o).filter(x=>x.q>x.m.stock).map(x=>({...x,falta:r1(x.q-x.m.stock)}));
function costo(o){const mpC=need(o).reduce((a,x)=>a+x.q*x.m.costo,0),mo=PROD[o.p].min*o.cant*RATE,merma=mpC*D.cfg.merma/100;
  return{mpC,mo,ter:o.taller,merma,tot:mpC+mo+o.taller+merma,venta:o.precio*o.cant}}
function score(o){const d=daysTo(o.fecha),c=costo(o),mg=(c.venta-c.tot)/c.venta;
  const f=Math.max(0,Math.min(1,1-d/30)),m=Math.max(0,Math.min(1,mg/0.4)),st=short(o).length?0:1,ds=o.dis==='Aprobado'?1:0;
  return Math.round(40*f+25*m+20*st+15*ds)}
function newReq(id,cant,origen){const m=mp(id);const r={id:D.rseq++,mp:id,cant:Math.ceil(cant),est:Math.ceil(cant)*m.costo>=D.cfg.aprobCompra?'Solicitado':'Aprobado',origen,limite:addD(Math.max(0,buyBy(m)))};D.req.push(r);return r}

const pillEst=e=>{const c={'Pendiente VB':'or','Observado':'bad','VB aprobado':'nv','Confirmado':'nv','En producción':'wa','Calidad':'wa','Listo despacho':'ok','Entregado':'ok'}[e]||'nv';return`<span class="pill ${c}">${e}</span>`};

const VIEWS=[['inicio','Inicio'],['pedidos','Pedidos y visto bueno'],['abast','Abastecimiento de MP'],['plan','Planificación'],['planta','Planta en vivo'],['talleres','Talleres externos'],['cambios','Cambios y tallas'],['calidad','Calidad y trazabilidad'],['costos','Costos'],['cliente','Arma tu pedido'],['portal','Seguimiento de pedido'],['config','Precios y parámetros'],['usuarios','Usuarios y accesos']];
function badge(v){
  if(v==='pedidos'){const n=D.orders.filter(o=>role==='produccion'?o.est==='Pendiente VB':role==='ventas'?['VB aprobado','Observado'].includes(o.est):false).length;return n}
  if(v==='abast'){return D.mp.filter(m=>m.stock+incoming(m.id)<=PR(m)).length+D.req.filter(r=>(role==='gerencia'&&r.est==='Solicitado')||(role==='almacen'&&['Aprobado','Enviado'].includes(r.est))).length}
  if(v==='plan'&&role==='gerencia')return D.orders.filter(o=>o.urg==='solicitada').length;
  return 0}
function side(){document.getElementById('side').innerHTML=`<div class="brand">CORPO<span>TEX</span></div><div class="sub">Producción y abastecimiento</div>`+
  VIEWS.filter(([k])=>ACCESS[role].includes(k)).map(([k,n])=>{const b=badge(k);return`<button class="nav ${view===k?'on':''}" data-go="${k}">${n}${b?`<span class="cnt">${b}</span>`:''}</button>`}).join('')}

/* ---------- Vistas ---------- */
const V={};
V.inicio=()=>{const act=D.orders.filter(o=>!['Entregado'].includes(o.est));
  const alertMP=D.mp.filter(m=>m.stock+incoming(m.id)<=PR(m));
  const pend=D.orders.filter(o=>o.est==='Pendiente VB');
  return`<div class="kpis">
  <div class="kpi"><small>Pedidos activos</small><b>${act.length}</b></div>
  <div class="kpi"><small>Esperan visto bueno</small><b style="color:var(--orange)">${pend.length}</b></div>
  <div class="kpi"><small>Insumos bajo reorden</small><b style="color:${alertMP.length?'var(--bad)':'var(--ok)'}">${alertMP.length}</b></div>
  <div class="kpi"><small>Prendas en proceso</small><b>${D.orders.filter(o=>['Confirmado','En producción','Calidad'].includes(o.est)).reduce((a,o)=>a+o.cant,0).toLocaleString('es-PE')}</b></div></div>
  <div class="grid">
  <div class="card"><h2>Qué necesita atención</h2><div class="log">
   ${pend.map(o=>`<div>Pedido #${o.id} · ${o.cli}: producción debe dar el visto bueno</div>`).join('')}
   ${alertMP.map(m=>`<div style="border-color:var(--bad)">${m.n}: ${buyBy(m)<=0?'comprar hoy':'comprar antes del '+fmtD(addD(buyBy(m)))}</div>`).join('')}
   ${D.req.filter(r=>r.est==='Solicitado').map(r=>`<div style="border-color:var(--orange)">Pedido de MP #${r.id} (${mp(r.mp).n}) espera aprobación de gerencia</div>`).join('')}
   ${D.orders.filter(o=>o.urg==='solicitada').map(o=>`<div style="border-color:var(--orange)">Urgencia solicitada para #${o.id}</div>`).join('')}
  </div></div>
  <div class="card"><h2>Actividad reciente</h2><div class="log">${D.log.slice(0,12).map(l=>`<div><b>${l.t}</b> ${l.h?'· '+l.h:''}<br>${l.m}</div>`).join('')}</div></div></div>`};

V.pedidos=()=>{const o=sel&&D.orders.find(x=>x.id===sel);
  return`<div class="gate"><b>Regla de la app:</b> ventas registra el pedido, pero solo puede confirmarlo al cliente cuando producción da el visto bueno (capacidad, fecha e insumos). Al confirmar, la app descuenta los insumos del almacén.</div>
  ${role==='ventas'||role==='gerencia'?`<div class="card"><h2>Registrar pedido</h2><form id="fNew" class="form">
   <label for="nCli">Cliente<input id="nCli" required placeholder="Colegio Los Álamos"></label>
   <label for="nMarca">Marca<select id="nMarca"><option>Unicrack</option><option>Corpotex</option></select></label>
   <label for="nP">Producto<select id="nP">${Object.entries(PROD).map(([k,p])=>`<option value="${k}">${p.n}</option>`).join('')}</select></label>
   <label for="nCant">Cantidad<input id="nCant" type="number" min="1" value="100" required></label>
   <label for="nFecha">Fecha que pide el cliente<input id="nFecha" type="date" value="${addD(14)}" required></label>
   ${role==='gerencia'?`<label for="nPrecio">Precio por prenda (S/)<input id="nPrecio" type="number" min="1" value="70" required></label>`:`<label>Precio por prenda<span style="padding:7px 0;color:var(--ink)">Lista de precios de gerencia</span></label>`}
   <label for="nPers">Personalización<select id="nPers"><option>Ninguna</option><option>Bordado de nombres</option><option>Bordado de logo</option><option>Sublimado</option><option>DTF</option><option>Vinil</option></select></label>
   <label style="justify-content:flex-end"><button class="pri" type="submit">Enviar a producción</button></label></form></div>`:''}
  <div class="card"><h2>Pedidos</h2><div class="tw"><table><thead><tr><th>#</th><th>Cliente</th><th>Producto</th><th>Cant.</th><th>Entrega</th><th>Estado</th><th></th></tr></thead><tbody>
  ${D.orders.slice().sort((a,b)=>b.id-a.id).map(x=>`<tr><td class="num">${x.id}</td><td>${x.cli}<br><span class="muted" style="font-size:12px">${x.marca}</span></td><td>${PROD[x.p].n}</td><td class="num">${x.cant}</td><td class="num">${fmtD(x.fecha)}</td><td>${pillEst(x.est)}${short(x).length&&['Pendiente VB','VB aprobado'].includes(x.est)?' <span class="pill bad">Falta MP</span>':''}</td><td><button class="sm" data-sel="${x.id}">${sel===x.id?'Abierto':'Ver'}</button></td></tr>`).join('')}
  </tbody></table></div></div>
  ${o?detalle(o):''}`};

function detalle(o){const sh=short(o);
  const vbBox=o.vb?`<div class="muted" style="font-size:13px">Visto bueno de ${o.vb.by} · ${fmtD(o.vb.fecha)}: “${o.vb.nota}”</div>`:'';
  let acc='';
  if(o.est==='Pendiente VB'){
    acc= role==='produccion'||role==='gerencia'?`<div class="form"><label for="vbNota">Comentario para ventas<input id="vbNota" placeholder="Entrega viable con 2 días de compra de tela"></label></div>
      <div class="row"><button class="pri" data-act="vb" data-id="${o.id}">Dar visto bueno${sh.length?' y pedir MP faltante':''}</button><button data-act="obs" data-id="${o.id}">Observar y devolver a ventas</button></div>`
    :`<div class="row"><button class="acc" data-act="confirm" data-id="${o.id}">Confirmar al cliente</button><span class="muted">Esperando visto bueno de producción</span></div>`}
  else if(o.est==='Observado'){
    acc= role==='ventas'||role==='gerencia'?`<div class="row"><button class="pri" data-act="reenviar" data-id="${o.id}">Corregí lo observado, reenviar a producción</button></div>`:'<span class="muted">Ventas debe corregir lo observado.</span>'}
  else if(o.est==='VB aprobado'){
    acc= role==='ventas'||role==='gerencia'?`<div class="row"><button class="acc" data-act="confirm" data-id="${o.id}">Confirmar al cliente</button></div>`:'<span class="muted">Ventas ya puede confirmar este pedido al cliente.</span>'}
  else if(['Confirmado','En producción','Calidad'].includes(o.est)){
    acc= role==='produccion'||role==='gerencia'?`<div class="row"><button class="pri" data-act="avanzar" data-id="${o.id}">Pasar a ${ETAPAS[ETAPAS.indexOf(o.est)+1]}</button></div>`:''}
  else if(o.est==='Listo despacho'){
    acc= role==='almacen'||role==='gerencia'?`<div class="row"><button class="pri" data-act="avanzar" data-id="${o.id}">Marcar como entregado</button></div>`:''}
  return`<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Pedido #${o.id} · ${o.cli}</h2>${pillEst(o.est)}</div>
  <p class="muted" style="margin:6px 0 12px">${o.cant} × ${PROD[o.p].n} · ${mp(o.mat||PROD[o.p].mat).n}${o.color?' · color '+o.color:''}${o.tallas?' · '+Object.entries(o.tallas).filter(t=>t[1]).map(t=>t[0]+': '+t[1]).join(', '):''} · ${o.pers} · Mockup: ${o.dis} · Entrega ${fmtD(o.fecha)} (${daysTo(o.fecha)} días)</p>
  <div class="grid"><div><h2>Insumos que necesita (BOM)</h2><table><tbody>${need(o).map(x=>`<tr><td>${x.m.n}</td><td class="num">${x.q} ${x.m.u}</td><td>${x.q>x.m.stock?`<span class="pill bad">Faltan ${r1(x.q-x.m.stock)}</span>`:'<span class="pill ok">Hay stock</span>'}</td></tr>`).join('')}</tbody></table></div>
  <div style="display:flex;flex-direction:column;gap:10px">${vbBox}${acc}</div></div></div>`}

V.abast=()=>{
  return`<div class="card"><h2>Punto de reorden por insumo</h2><div class="formula">Punto de reorden = consumo promedio diario × tiempo de entrega + stock de seguridad</div>
  <div class="tw" style="margin-top:10px"><table><thead><tr><th>Insumo</th><th>Stock</th><th>Por llegar</th><th>Punto de reorden</th><th>Proveedor · días</th><th>Comprar</th><th></th></tr></thead><tbody>
  ${D.mp.map(m=>{const inc=incoming(m.id),alerta=m.stock+inc<=PR(m),b=buyBy(m);
   return`<tr><td>${m.n}</td><td class="num" style="color:${m.stock<m.seg?'var(--bad)':'inherit'}">${r1(m.stock)} ${m.u}</td><td class="num">${inc?inc+' '+m.u:'—'}</td><td class="num">${r1(PR(m))} ${m.u}<br><span class="muted" style="font-size:11px">${m.cons}×${m.lead}+${m.seg}</span></td><td>${m.prov} · ${m.lead} d</td>
   <td>${alerta?`<span class="pill ${b<=0?'bad':'wa'}">${b<=0?'Hoy':'Antes del '+fmtD(addD(b))}</span>`:'<span class="pill ok">Cubierto</span>'}</td>
   <td>${alerta&&(role!=='ventas')?`<button class="sm acc" data-act="req" data-mp="${m.id}">Generar pedido de MP</button>`:''}</td></tr>`}).join('')}
  </tbody></table></div><p class="muted" style="font-size:12px;margin:8px 0 0">Ejemplo: si la tela tarda 2 días en llegar y el stock cubre hasta el lunes, la app pide comprar el viernes.</p></div>
  ${role!=='ventas'?`<div class="card"><h2>Nuevo pedido de materia prima</h2><form id="fReq" class="form">
   <label for="rMp">Insumo<select id="rMp">${D.mp.map(m=>`<option value="${m.id}">${m.n}</option>`).join('')}</select></label>
   <label for="rCant">Cantidad<input id="rCant" type="number" min="1" value="100" required></label>
   <label for="rOri">Motivo<input id="rOri" value="Reposición de stock"></label>
   <label style="justify-content:flex-end"><button class="pri" type="submit">Solicitar compra</button></label></form></div>`:''}
  <div class="card"><h2>Pedidos de materia prima</h2><p class="muted" style="margin:0 0 8px;font-size:13px">Solicitado → aprobado por gerencia → enviado al proveedor → recibido en almacén (suma al stock).</p>
  <div class="tw"><table><thead><tr><th>#</th><th>Insumo</th><th>Cant.</th>${VEDINERO(role)?'<th>Costo</th>':''}<th>Motivo</th><th>Comprar antes de</th><th>Estado</th><th></th></tr></thead><tbody>
  ${D.req.slice().reverse().map(r=>{const m=mp(r.mp);let b='';
   if(r.est==='Solicitado'&&role==='gerencia')b=`<button class="sm pri" data-act="rq" data-id="${r.id}" data-to="Aprobado">Aprobar</button>`;
   if(r.est==='Aprobado'&&(role==='almacen'||role==='gerencia'))b=`<button class="sm pri" data-act="rq" data-id="${r.id}" data-to="Enviado">Enviar a ${m.prov}</button>`;
   if(r.est==='Enviado'&&(role==='almacen'||role==='gerencia'))b=`<button class="sm pri" data-act="rq" data-id="${r.id}" data-to="Recibido">Registrar ingreso</button>`;
   const c={Solicitado:'or',Aprobado:'nv',Enviado:'wa',Recibido:'ok'}[r.est];
   return`<tr><td class="num">${r.id}</td><td>${m.n}</td><td class="num">${r.cant} ${m.u}</td>${VEDINERO(role)?`<td class="num">${S(r.cant*m.costo)}</td>`:''}<td>${r.origen}</td><td class="num">${fmtD(r.limite)}</td><td><span class="pill ${c}">${r.est}</span></td><td>${b}</td></tr>`}).join('')}
  </tbody></table></div></div>`};

V.plan=()=>{const q=D.orders.filter(o=>['VB aprobado','Confirmado','En producción'].includes(o.est));
  const ord=q.map(o=>({o,s:score(o)})).sort((a,b)=>(b.o.urg==='aprobada')-(a.o.urg==='aprobada')||(D.order.indexOf(a.o.id)+1&&D.order.indexOf(b.o.id)+1?D.order.indexOf(a.o.id)-D.order.indexOf(b.o.id):b.s-a.s));
  return`<div class="gate"><b>Puntaje:</b> fecha pactada 40 % · margen 25 % · insumos disponibles 20 % · mockup aprobado 15 %. Solo gerencia puede mover la cola a mano o aprobar urgencias. Una urgencia aprobada congela el lote activo y queda registrada.</div>
  <div class="card"><h2>Cola de producción</h2><div class="tw"><table><thead><tr><th>Pos.</th><th>Pedido</th><th>Entrega</th><th>Insumos</th><th>Mockup</th><th>Puntaje</th><th></th></tr></thead><tbody>
  ${ord.map(({o,s},i)=>`<tr><td class="num">${i+1}</td><td>#${o.id} ${o.cli}<br><span class="muted" style="font-size:12px">${o.cant} ${PROD[o.p].n}</span> ${o.urg==='aprobada'?'<span class="pill bad">Urgente</span>':o.urg==='solicitada'?'<span class="pill or">Urgencia solicitada</span>':''}</td>
  <td class="num">${daysTo(o.fecha)} d</td><td>${short(o).length?'<span class="pill bad">Falta</span>':'<span class="pill ok">OK</span>'}</td><td>${o.dis==='Aprobado'?'<span class="pill ok">Aprobado</span>':'<span class="pill wa">Pendiente</span>'}</td>
  <td><div class="bar" style="width:70px"><i style="width:${s}%"></i></div><span class="num">${s}</span></td>
  <td class="row"><button class="sm" data-act="up" data-id="${o.id}" aria-label="Subir">↑</button><button class="sm" data-act="down" data-id="${o.id}" aria-label="Bajar">↓</button>
  ${o.urg===''?`<button class="sm" data-act="urg" data-id="${o.id}">Solicitar urgencia</button>`:o.urg==='solicitada'&&role==='gerencia'?`<button class="sm acc" data-act="urgok" data-id="${o.id}">Aprobar urgencia</button>`:''}</td></tr>`).join('')}
  </tbody></table></div></div>`};

V.planta=()=>{const st=[['Corte',96],['Costura línea 1',74],['Costura línea 2',81],['Bordado',52],['Sublimado / DTF',67],['Acabado y empaque',88]];
  return`<div class="kpis">${st.map(([n,v])=>`<div class="kpi"><small>${n}</small><b style="color:${v<60?'var(--bad)':v<80?'var(--warn)':'var(--ok)'}">${v}%</b><div class="bar"><i style="width:${v}%;background:${v<60?'var(--bad)':v<80?'var(--warn)':'var(--ok)'}"></i></div></div>`).join('')}</div>
  <div class="card"><h2>Cuello de botella</h2><div class="row" style="justify-content:space-between"><span>Bordado trabaja al 52 % de su meta (2 máquinas para 420 nombres pendientes).</span><button class="acc" data-go="talleres">Derivar a taller externo</button></div></div>
  <div class="card"><h2>Paquetes en planta</h2><p class="muted" style="margin:0 0 8px;font-size:13px">Cada paquete se escanea con QR al entrar y salir de una estación.</p><div class="tw"><table><thead><tr><th>Paquete</th><th>Pedido</th><th>Estación</th><th>Operario</th><th>Entró</th></tr></thead><tbody>
  <tr><td class="num">PQ-1042-07</td><td>#1042</td><td>Bordado</td><td>Pedro</td><td class="num">09:40</td></tr>
  <tr><td class="num">PQ-1042-08</td><td>#1042</td><td>Costura línea 1</td><td>Rosa</td><td class="num">10:15</td></tr>
  <tr><td class="num">PQ-1042-09</td><td>#1042</td><td>Corte</td><td>Juan</td><td class="num">10:32</td></tr></tbody></table></div></div>
  <div class="card"><h2>Personal y destajo</h2><table><tbody>
  <tr><td>Rosa · costurera</td><td class="num">412 prendas</td><td><span class="pill ok">92 %</span></td></tr>
  <tr><td>Juan · cortador</td><td class="num">38 capas</td><td><span class="pill ok">88 %</span></td></tr>
  <tr><td>Pedro · bordador</td><td class="num">96 piezas</td><td><span class="pill wa">64 %</span></td></tr></tbody></table></div>`};

V.talleres=()=>{const $=VEDINERO(role);return`<div class="card"><h2>Lotes en talleres externos</h2><div class="tw"><table><thead><tr><th>Taller</th><th>Lote</th><th>Proceso</th><th>Avance</th><th>Fecha límite</th>${$?'<th>Tarifa</th><th>Por pagar</th>':''}</tr></thead><tbody>
  <tr><td>Taller Lima Norte</td><td>45 · #1042</td><td>Costura</td><td><div class="bar" style="width:90px"><i style="width:70%"></i></div>70 %</td><td class="num">${fmtD(addD(2))}</td>${$?`<td class="num">300 × S/ 4.10</td><td class="num">${S(1230)}</td>`:''}</tr>
  <tr><td>Taller Comas</td><td>47 · #1042</td><td>Bordado</td><td><div class="bar" style="width:90px"><i style="width:30%;background:var(--warn)"></i></div>30 %</td><td class="num">${fmtD(addD(1))} <span class="pill bad">Riesgo</span></td>${$?`<td class="num">200 × S/ 1.60</td><td class="num">${S(320)}</td>`:''}</tr>
  </tbody></table></div>${$?`<p style="margin:10px 0 0"><b>Total por pagar: ${S(1550)}</b> · el lote se paga al pasar control de calidad en almacén.</p>`:''}</div>`};

V.cambios=()=>{const P=['Recepción de la prenda','Entrega a jefa de tienda','Consolidación diaria','Entrega a coordinadora de almacén','Ejecución en taller','Revisión de calidad','Retorno a almacén','Entrega a jefa de tienda','Entrega al cliente'];
  return`<div class="gate">Las prendas del día se consolidan y se entregan a la coordinadora de almacén hasta las 6:00 p.m.</div>
  <div class="card"><h2>Cambios, tallas y mejoras</h2><div class="tw"><table><thead><tr><th>Cliente</th><th>Cambio</th><th>Paso actual</th><th>Avance</th><th></th></tr></thead><tbody>
  ${D.cambios.map(c=>`<tr><td>${c.cli}</td><td>${c.det}</td><td>${c.paso}/9 · ${P[c.paso-1]}</td><td style="min-width:140px"><div class="steps">${P.map((_,i)=>`<i class="${i<c.paso-1?'d':i===c.paso-1?'c':''}"></i>`).join('')}</div></td><td>${c.paso<9?`<button class="sm" data-act="cmb" data-id="${c.id}">Siguiente paso</button>`:'<span class="pill ok">Entregado</span>'}</td></tr>`).join('')}
  </tbody></table></div></div>`};

V.calidad=()=>{const q=D.orders.filter(o=>o.est==='Calidad');const C=['Costuras','Medidas','Tallas','Bordados / estampado','Limpieza','Hilos','Manchas','Calidad general'];
  return`<div class="card"><h2>Pedidos en control de calidad</h2>${q.length?q.map(o=>`<p><b>#${o.id} ${o.cli}</b></p><div class="row">${C.map((c,i)=>`<label class="row" for="qc${o.id}${i}" style="gap:4px"><input type="checkbox" id="qc${o.id}${i}" checked> ${c}</label>`).join('')}</div><div class="row" style="margin-top:8px"><button class="pri" data-act="avanzar" data-id="${o.id}">Aprobar y pasar a despacho</button></div>`).join(''):'<p class="muted">Ningún pedido está en calidad ahora. Producción los envía desde Pedidos con “Pasar a Calidad”.</p>'}</div>
  <div class="card"><h2>Trazabilidad de una prenda · BZ-1042-M-017</h2><table><tbody>
  <tr><td>Tela</td><td>Rollo R-889 · Textil Sur</td><td><span class="pill ok">OK</span></td></tr>
  <tr><td>Corte</td><td>Lote 45 · Juan</td><td><span class="pill ok">OK</span></td></tr>
  <tr><td>Costura</td><td>Taller Lima Norte</td><td><span class="pill ok">OK</span></td></tr>
  <tr><td>Bordado “ANA P.”</td><td>Máquina B2 · Pedro</td><td><span class="pill bad">Rehacer</span></td></tr></tbody></table></div>`};

V.costos=()=>`<div class="formula">Costo total = materia prima + mano de obra (minutos cronometrados × S/ ${RATE} por minuto) + tercerización + mermas (3 %)</div>
  <div class="card"><h2>Costo real por pedido</h2><div class="tw"><table><thead><tr><th>Pedido</th><th>Materia prima</th><th>Mano de obra</th><th>Tercerización</th><th>Mermas</th><th>Total</th><th>Venta</th><th>Margen</th></tr></thead><tbody>
  ${D.orders.map(o=>{const c=costo(o),m=(c.venta-c.tot)/c.venta*100;return`<tr><td>#${o.id} ${o.cli}</td><td class="num">${S(c.mpC)}</td><td class="num">${S(c.mo)}</td><td class="num">${S(c.ter)}</td><td class="num">${S(c.merma)}</td><td class="num"><b>${S(c.tot)}</b></td><td class="num">${S(c.venta)}</td><td><span class="pill ${m<15?'bad':m<25?'wa':'ok'}">${Math.round(m)} %</span></td></tr>`}).join('')}
  </tbody></table></div></div>`;

V.portal=()=>{const vis=role==='cliente'?D.orders.filter(x=>x.cli===user.cli):D.orders;
  if(!vis.length)return`<div class="card"><h2>Aún no tienes pedidos</h2><p class="muted">Arma tu primer pedido y aquí verás cómo avanza.</p><button class="acc" data-go="cliente">Armar pedido</button></div>`;
  const o=vis.find(x=>x.id===sel)||vis[vis.length-1];
  const F=['Registro','Diseño','Corte','Personalización','Calidad','Despacho'];
  const idx={'Pendiente VB':0,'Observado':0,'VB aprobado':1,'Confirmado':2,'En producción':3,'Calidad':4,'Listo despacho':5,'Entregado':6}[o.est];
  return`<div class="row"><label for="pSel" class="muted">Vista de cliente para</label><select id="pSel">${vis.map(x=>`<option value="${x.id}" ${x.id===o.id?'selected':''}>#${x.id} ${x.cli}</option>`).join('')}</select></div>
  <div class="card" style="max-width:520px"><div class="muted" style="font-size:12px">${o.marca==='Unicrack'?'Unicrack School Athletic':'Corpotex · Vestimos a todas las industrias'}</div><h2 style="margin-top:4px">Tu pedido #${o.id}</h2>
  <div class="steps">${F.map((_,i)=>`<i class="${i<idx?'d':i===idx?'c':''}"></i>`).join('')}</div>
  <div class="row muted" style="justify-content:space-between;font-size:11px;margin-top:4px">${F.map(f=>`<span>${f}</span>`).join('')}</div>
  <table><tbody><tr><td>Modelo</td><td>${PROD[o.p].n}</td></tr><tr><td>Material</td><td>${mp(o.mat||PROD[o.p].mat).n}</td></tr>${o.color?`<tr><td>Color</td><td>${o.color}</td></tr>`:''}
  <tr><td>Unidades</td><td class="num"><b>${o.cant}</b>${o.tallas?' · '+Object.entries(o.tallas).filter(t=>t[1]).map(t=>t[0]+': '+t[1]).join(', '):''}</td></tr>
  <tr><td>Personalización</td><td>${o.pers}</td></tr><tr><td>Entrega estimada</td><td><b>${['Pendiente VB','Observado'].includes(o.est)?'Por confirmar (producción está revisando)':fmtD(o.fecha)}</b></td></tr></tbody></table>
  ${o.dis==='Pendiente'?`<div class="gate">Revisa tu diseño antes de que pase a corte o sublimado.<div class="row" style="margin-top:8px"><button class="pri" data-act="mock" data-id="${o.id}">Aprobar mockup</button><button>Pedir un cambio</button></div></div>`:'<span class="pill ok">Mockup aprobado</span>'}
  <p class="muted" style="font-size:12px">Te avisaremos cuando tu pedido llegue a tienda. Recojo en tienda, delivery o encomienda.</p></div>`};

/* ---------- Vista del cliente: configurador 3D ---------- */
const COLORS=[['Blanco','#f4f4f2'],['Negro','#1b1b1d'],['Azul marino','#1d2b5a'],['Rojo','#b3262e'],['Verde','#1f6b45'],['Gris jaspe','#9a9ca3'],['Celeste','#7fb3dd'],['Mostaza','#d9a521'],['Vino','#5e1a2a']];
const TECS=['DTF','Sublimado','Vinil','Serigrafía','Bordado'];
/* Quita el fondo blanco (o liso) que toca los bordes de la imagen; los blancos dentro del diseño se conservan */
function tieneFondoBlanco(im){const c=document.createElement('canvas'),w=c.width=Math.min(200,im.naturalWidth||im.width),h=c.height=Math.max(1,Math.round(w*(im.naturalHeight||im.height)/(im.naturalWidth||im.width)));
  const x=c.getContext('2d');x.drawImage(im,0,0,w,h);const d=x.getImageData(0,0,w,h).data;let n=0,b=0;
  const chk=(i,j)=>{const k=(j*w+i)*4;n++;if(d[k+3]>200&&d[k]>225&&d[k+1]>225&&d[k+2]>225)b++};
  for(let i=0;i<w;i++){chk(i,0);chk(i,h-1)}for(let j=0;j<h;j++){chk(0,j);chk(w-1,j)}return b/n>0.7}
function quitarFondo(im,tol){const sw=im.naturalWidth||im.width,sh=im.naturalHeight||im.height,s=Math.min(1,1800/Math.max(sw,sh)),w=Math.round(sw*s),h=Math.round(sh*s);
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(im,0,0,w,h);const id=x.getImageData(0,0,w,h),d=id.data;
  let br=0,bgc=0,bb=0,cn=0;[[0,0],[w-1,0],[0,h-1],[w-1,h-1]].forEach(([i,j])=>{const k=(j*w+i)*4;br+=d[k];bgc+=d[k+1];bb+=d[k+2];cn++});br/=cn;bgc/=cn;bb/=cn;
  const dist=k=>Math.max(Math.abs(d[k]-br),Math.abs(d[k+1]-bgc),Math.abs(d[k+2]-bb)),seen=new Uint8Array(w*h),st=[];
  const push=(i,j)=>{const p=j*w+i;if(seen[p])return;seen[p]=1;if(dist(p*4)<=tol)st.push(p)};
  for(let i=0;i<w;i++){push(i,0);push(i,h-1)}for(let j=0;j<h;j++){push(0,j);push(w-1,j)}
  while(st.length){const p=st.pop(),i=p%w,j=(p-i)/w;d[p*4+3]=0;if(i>0)push(i-1,j);if(i<w-1)push(i+1,j);if(j>0)push(i,j-1);if(j<h-1)push(i,j+1)}
  /* borde suave: los píxeles junto al fondo quitado se vuelven semitransparentes según cuánto se parecen al fondo */
  for(let j=1;j<h-1;j++)for(let i=1;i<w-1;i++){const p=j*w+i,k=p*4;if(!d[k+3])continue;
    if(!d[k-1]||!d[k+7]||!d[k-w*4+3]||!d[k+w*4+3]){const df=dist(k);if(df<tol*2.2)d[k+3]=Math.round(255*Math.max(0.15,(df-tol)/(tol*1.2)))}}
  x.putImageData(id,0,0);return c}
const ZONAS={toda:{n:'Toda la prenda'},frente:{n:'Frente'},pecho:{n:'Pecho izquierdo'},espalda:{n:'Espalda'},manga_izq:{n:'Manga izquierda'},manga_der:{n:'Manga derecha'}};
const largoDefault=m=>SH[m].len==null&&!SH[m].nosleeve; /* true si el modelo trae manga larga */
function mangaEfectiva(){if(SH[CF.model].nosleeve)return'sin';return CF.manga==='corta'?'corta':CF.manga==='larga'?'larga':(largoDefault(CF.model)?'larga':'corta')}
function medManga(p){const ef=mangaEfectiva();if(ef==='sin')return p.med.manga.map(()=>0);if(ef==='larga'&&!largoDefault(CF.model))return[60,62,63,64,65,66,67].slice(0,p.tallas.length);
  if(ef==='corta'&&largoDefault(CF.model))return[20,21,22,23,24,25,26].slice(0,p.tallas.length);return p.med.manga}
const mangaAjuste=()=>{const ef=mangaEfectiva();if(ef==='sin')return 0;if(ef==='larga'&&!largoDefault(CF.model))return 4;if(ef==='corta'&&largoDefault(CF.model))return-3;return 0};
const FONTS={Archivo:'700 {s}px Archivo, sans-serif',Anton:'400 {s}px Anton, Impact, sans-serif',Pacifico:'400 {s}px Pacifico, cursive','Clásica':'700 {s}px Georgia, serif'};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let LID=1;
const CF={cli:'',model:'oversize',mat:'jer',color:'#f4f4f2',manga:'auto',tallas:{S:10,M:20,L:15,XL:5,XXL:0},auto:true,bg:'dark',ref:null,refFile:null,ia:'',
  layers:[{id:LID++,kind:'text',text:'UNICRACK',font:'Anton',tcolor:'#1d2b5a',zona:'frente',tec:'DTF',ancho:24,dy:8,dx:0},
          {id:LID++,kind:'text',text:'PROMO 2026',font:'Archivo',tcolor:'#e8771b',zona:'espalda',tec:'Vinil',ancho:22,dy:6,dx:0}]};
const cfTotal=()=>Object.values(CF.tallas).reduce((a,b)=>a+(+b||0),0);
const tecPrecio=t=>t==='Bordado'?PERSP['Bordado de logo']:t==='Serigrafía'?3:(PERSP[t]??4);
const tamFactor=a=>a<=10?1:a<=20?1.5:a<=28?2:2.6;
const layerPrecio=l=>{const f=l.formato||'libre',b=tecPrecio(l.tec);if(l.zona==='toda')return b*11;if(f==='completa')return b*(4+(l.mangas?1.5:0));
  if(f==='a4')return b*Math.max(1,2.2*(l.escala||100)/100);
  if(f==='rect'){const a=(l.ancho||0)*(l.alto||0);return b*(a<=100?1:a<=400?1.5:a<=624?2.2:2.2+(a-624)/624*1.5)}
  return b*tamFactor(l.ancho)};
const fmtDesc=l=>{const f=l.formato||'libre';if(l.zona==='toda')return`estampado completo (delantero, espalda y mangas)${l.margen?', margen '+l.margen+' cm':''}`;return f==='a4'?`hoja A4 ${l.orient==='h'?'horizontal':'vertical'} al ${l.escala||100} %`:f==='rect'?`${l.ancho} × ${l.alto} cm`:f==='completa'?`pieza completa${l.mangas?' con mangas':''}, margen ${l.margen} cm`:`${l.ancho} cm de ancho`};
const FORMATOS={libre:'Libre (por ancho)',a4:'Dentro de una hoja A4',rect:'Rectángulo a medida',completa:'Pieza completa hasta la costura'};
const LDEF={formato:'libre',alto:20,escala:100,orient:'v',fit:'contain',margen:1.5,mangas:false,guia:true};
function formatoHTML(l){for(const k in LDEF)if(l[k]===undefined)l[k]=LDEF[k];const f=l.formato,id=l.id;
  const num=(k,lab,min,max,step)=>`<label for="l${k}_${id}">${lab}<input type="number" id="l${k}_${id}" data-l="${id}" data-k="${k}" min="${min}" max="${max}" step="${step||0.5}" value="${l[k]}"></label>`;
  const sel=(k,lab,opts)=>`<label for="l${k}_${id}">${lab}<select id="l${k}_${id}" data-l="${id}" data-k="${k}">${opts.map(([v,n])=>`<option value="${v}" ${String(l[k])===v?'selected':''}>${n}</option>`).join('')}</select></label>`;
  const chk=(k,lab)=>`<label for="l${k}_${id}" style="display:flex;flex-direction:row;gap:6px;align-items:center;font-size:12px;color:var(--muted)"><input type="checkbox" id="l${k}_${id}" data-l="${id}" data-k="${k}" ${l[k]?'checked':''}> ${lab}</label>`;
  let h=`<div class="form">${sel('formato','Formato del diseño',Object.entries(FORMATOS))}`;
  if(f==='libre')h+=`</div><label for="la_${id}" class="muted" style="font-size:12px">Ancho: <b id="lav_${id}">${l.ancho} cm</b><input type="range" id="la_${id}" data-l="${id}" data-k="ancho" min="5" max="34" step="1" value="${l.ancho}" style="width:100%"></label>`;
  if(f==='a4')h+=`${sel('orient','Orientación',[['v','Vertical (21 × 29.7 cm)'],['h','Horizontal (29.7 × 21 cm)']])}${num('escala','Escala dentro del A4 (%)',30,100,5)}</div>${chk('guia','Mostrar contorno de la hoja A4 en la prenda')}`;
  if(f==='rect')h+=`${num('ancho','Ancho (cm)',3,60)}${num('alto','Alto (cm)',3,75)}${sel('fit','Ajuste de la imagen',[['contain','Completa dentro del rectángulo'],['cover','Llenar y recortar'],['fill','Estirar a la medida']])}</div>${chk('guia','Mostrar contorno del rectángulo en la prenda')}`;
  if(f==='completa')h+=`${num('margen','Margen a la costura (cm)',0,8)}${sel('fit','Ajuste de la imagen',[['cover','Cubrir toda la pieza'],['contain','Mostrar la imagen completa']])}</div>${chk('mangas','Incluir mangas')}<p class="muted" style="font-size:12px;margin:0">Para pieza completa se recomienda sublimado sobre dry-fit: la tela se estampa antes de coser.</p>`;
  return h}
function cfPrecio(){const p=PROD[CF.model],est=CF.layers.reduce((a,l)=>a+layerPrecio(l),0),u0=p.base+(MATP[CF.mat]||0)+mangaAjuste()+est,n=cfTotal(),dto=n>=D.cfg.dtoMin?D.cfg.dtoPct/100:0;
  return{base:p.base,mat:MATP[CF.mat]||0,est,u:u0*(1-dto),dto,tot:u0*(1-dto)*n}}
const colorName=h=>(COLORS.find(c=>c[1].toLowerCase()===h.toLowerCase())||['Personalizado '+h])[0];

function guiaHTML(){const p=PROD[CF.model];
  return`<p class="muted" style="font-size:13px;margin:0 0 8px">${p.fit}</p><div class="tw"><table><thead><tr><th>Medida (cm)</th>${p.tallas.map(t=>`<th>${t}</th>`).join('')}</tr></thead><tbody>
  <tr><td>Ancho de pecho</td>${p.med.pecho.map(v=>`<td class="num">${v}</td>`).join('')}</tr>
  <tr><td>Largo total</td>${p.med.largo.map(v=>`<td class="num">${v}</td>`).join('')}</tr>
  <tr><td>Largo de manga</td>${medManga(p).map(v=>`<td class="num">${v}</td>`).join('')}</tr>
  <tr><td><b>Unidades</b></td>${p.tallas.map(t=>`<td><input type="number" min="0" id="tl_${t}" data-talla="${t}" value="${CF.tallas[t]||0}" style="width:58px;padding:4px 6px" aria-label="Unidades talla ${t}"></td>`).join('')}</tr>
  </tbody></table></div><p class="muted" style="font-size:12px;margin:6px 0 0">Ancho de pecho: prenda extendida, de axila a axila. Largo: desde el hombro junto al cuello hasta el borde inferior.</p>`}
function resumenHTML(){const p=PROD[CF.model],pr=cfPrecio(),n=cfTotal();
  return`<table><tbody><tr><td>Modelo</td><td>${p.n}</td><td class="num">${S(pr.base)}</td></tr>
  <tr><td>Material</td><td>${mp(CF.mat).n}</td><td class="num">${pr.mat?(pr.mat>0?'+ ':'− ')+S(Math.abs(pr.mat)):'—'}</td></tr>
  <tr><td>Color</td><td>${colorName(CF.color)}</td><td></td></tr>
  ${mangaEfectiva()!=='sin'?`<tr><td>Manga</td><td>${mangaEfectiva()}</td><td class="num">${mangaAjuste()?(mangaAjuste()>0?'+ ':'− ')+S(Math.abs(mangaAjuste())):'—'}</td></tr>`:''}
  ${CF.layers.map(l=>`<tr><td>${l.tec}</td><td>${ZONAS[l.zona].n} · ${fmtDesc(l)}</td><td class="num">+ S/ ${layerPrecio(l).toFixed(2)}</td></tr>`).join('')}
  <tr><td>Precio por prenda</td><td>${pr.dto?`<span class="pill ok">−${D.cfg.dtoPct} % por volumen</span>`:''}</td><td class="num"><b>S/ ${pr.u.toFixed(2)}</b></td></tr>
  <tr><td>Unidades</td><td>${n<D.cfg.minPedido?`<span class="pill bad">Mínimo ${D.cfg.minPedido}</span>`:''}</td><td class="num"><b>${n}</b></td></tr>
  <tr><td><b>Total estimado</b></td><td></td><td class="num" style="font-size:18px"><b>${S(pr.tot)}</b></td></tr></tbody></table>`}
function warnHTML(){return CF.layers.some(l=>l.tec==='Sublimado')&&CF.mat!=='dry'?'<div class="gate" style="margin-top:8px">El sublimado solo se fija en telas de poliéster. Elige dry-fit o cambia la técnica a DTF.</div>':''}
function layersHTML(){if(!CF.layers.length)return'<p class="muted" style="font-size:13px">Sin estampados. Sube una imagen o agrega un texto.</p>';
  return CF.layers.map(l=>`<div class="box" style="display:flex;flex-direction:column;gap:6px;border:1px solid var(--line);border-radius:10px;padding:10px">
   <div class="row" style="justify-content:space-between"><b>${l.kind==='img'?'Imagen · '+esc(l.name):'Texto'}</b><button class="sm" data-ldel="${l.id}">Quitar</button></div>
   ${l.kind==='img'?`<div class="row" style="gap:10px;align-items:center"><img src="${(l.img.toDataURL?l.img.toDataURL('image/png'):l.img.src)}" alt="Vista del diseño" style="width:64px;height:64px;object-fit:contain;border-radius:6px;background:repeating-conic-gradient(#ccc 0 25%,#fff 0 50%) 0 0/12px 12px">
     <div style="flex:1;min-width:160px;display:flex;flex-direction:column;gap:4px"><label for="lq_${l.id}" style="display:flex;gap:6px;align-items:center;font-size:12px;color:var(--muted)"><input type="checkbox" id="lq_${l.id}" data-l="${l.id}" data-k="quitar" ${l.quitar?'checked':''}> Quitar fondo blanco y copiar solo el diseño</label>
     ${l.quitar?`<label for="ltol_${l.id}" class="muted" style="font-size:12px">Sensibilidad: <b id="ltolv_${l.id}">${l.tol}</b><input type="range" id="ltol_${l.id}" data-l="${l.id}" data-k="tol" min="5" max="120" step="5" value="${l.tol}" style="width:100%"></label>`:''}</div></div>`:''}
   ${l.kind==='text'?`<div class="form"><label for="lt_${l.id}">Texto<input id="lt_${l.id}" data-l="${l.id}" data-k="text" value="${esc(l.text)}" maxlength="24"></label>
     <label for="lf_${l.id}">Letra<select id="lf_${l.id}" data-l="${l.id}" data-k="font">${Object.keys(FONTS).map(f=>`<option ${f===l.font?'selected':''}>${f}</option>`).join('')}</select></label>
     <label for="lc_${l.id}">Color del texto<input type="color" id="lc_${l.id}" data-l="${l.id}" data-k="tcolor" value="${l.tcolor}" style="height:36px;padding:2px"></label></div>`:''}
   <div class="form"><label for="lz_${l.id}">Ubicación<select id="lz_${l.id}" data-l="${l.id}" data-k="zona">${Object.entries(ZONAS).map(([k,z])=>`<option value="${k}" ${k===l.zona?'selected':''}>${z.n}</option>`).join('')}</select></label>
     <label for="le_${l.id}">Técnica<select id="le_${l.id}" data-l="${l.id}" data-k="tec">${TECS.map(t=>`<option ${t===l.tec?'selected':''}>${t}</option>`).join('')}</select></label></div>
   ${formatoHTML(l)}
   <label for="ly_${l.id}" class="muted" style="font-size:12px">${(l.formato||'libre')==='completa'?'Mover arriba/abajo':'Distancia desde el cuello'}: <b id="lyv_${l.id}">${l.dy} cm</b><input type="range" id="ly_${l.id}" data-l="${l.id}" data-k="dy" min="0" max="40" step="1" value="${l.dy}" style="width:100%"></label>
   <label for="lx_${l.id}" class="muted" style="font-size:12px">Mover a los lados: <b id="lxv_${l.id}">${l.dx} cm</b><input type="range" id="lx_${l.id}" data-l="${l.id}" data-k="dx" min="-15" max="15" step="1" value="${l.dx}" style="width:100%"></label>
  </div>`).join('')}

V.cliente=()=>{const p=PROD[CF.model];
  return`<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));align-items:start">
  <div class="card" style="padding:12px;position:sticky;top:12px">
   <div id="v3d" style="height:min(70vh,560px);border-radius:10px;position:relative;touch-action:none;cursor:grab;overflow:hidden;background:${CF.bg==='dark'?'radial-gradient(circle at 50% 40%,#3b3b40,#111114 75%)':'radial-gradient(circle at 50% 40%,#ffffff,#d8d9de 80%)'}"></div>
   <div class="row" style="margin-top:8px;justify-content:center">
    ${[['Frente',0],['3/4',-0.7],['Lado',-Math.PI/2],['Espalda',Math.PI],['Otro lado',Math.PI/2]].map(([n,a])=>`<button class="sm" data-view="${a}">${n}</button>`).join('')}
    <button class="sm" data-zoom="-1" aria-label="Acercar">+</button><button class="sm" data-zoom="1" aria-label="Alejar">−</button>
    <button class="sm" id="cAuto">${CF.auto?'Detener giro':'Girar sola'}</button><button class="sm" id="cBg">Fondo ${CF.bg==='dark'?'claro':'oscuro'}</button></div>
   <p class="muted" style="font-size:12px;margin:6px 0 0;text-align:center">Arrastra para girar, rueda del mouse para acercar. Vista referencial: diseño valida el mockup final.</p></div>
  <div style="display:flex;flex-direction:column;gap:12px;min-width:0">
  <div class="card"><h2>1. Elige tu prenda</h2><div class="form">
   <label for="cCli">Institución o empresa<input id="cCli" placeholder="Colegio Los Álamos" value="${esc(role==='cliente'?user.cli:CF.cli)}" ${role==='cliente'?'readonly':''}></label>
   <label for="cModel">Modelo<select id="cModel">${Object.entries(PROD).map(([k,x])=>`<option value="${k}" ${k===CF.model?'selected':''}>${x.n}</option>`).join('')}</select></label>
   <label for="cMat">Material<select id="cMat">${p.mats.map(m=>`<option value="${m}" ${m===CF.mat?'selected':''}>${mp(m).n}${MATP[m]?` (${MATP[m]>0?'+':''}S/ ${MATP[m]})`:''}</option>`).join('')}</select></label>
   <label for="cManga" ${SH[CF.model].nosleeve?'hidden':''}>Largo de manga<select id="cManga">${[['auto','Según el modelo ('+(largoDefault(CF.model)?'larga':'corta')+')'],['corta','Manga corta'],['larga','Manga larga']].map(([v,n])=>`<option value="${v}" ${v===CF.manga?'selected':''}>${n}</option>`).join('')}</select></label></div>
   <div style="margin-top:10px"><div class="muted" style="font-size:12px;margin-bottom:4px">Color de la prenda</div><div class="row">${COLORS.map(([n,h])=>`<button class="sm" data-color="${h}" aria-label="${n}" title="${n}" style="width:30px;height:30px;padding:0;border-radius:50%;background:${h};border:${h===CF.color?'3px solid var(--orange)':'1px solid var(--line)'}"></button>`).join('')}
   <label for="cColorCustom" class="muted" style="font-size:12px;display:flex;align-items:center;gap:4px">Otro<input type="color" id="cColorCustom" value="${CF.color}" style="width:36px;height:30px;padding:1px"></label></div></div></div>
  <div class="card"><h2>2. Personaliza el estampado</h2>
   <div class="row"><label class="sm" for="cImg" style="border:1px solid var(--navy);color:var(--navy);border-radius:8px;padding:6px 12px;cursor:pointer;font-weight:600">Subir imagen del estampado</label><input type="file" id="cImg" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden>
   <label for="cImgFull" style="background:var(--orange);color:#fff;border-radius:8px;padding:6px 12px;cursor:pointer;font-weight:600">Estampado completo (toda la camiseta)</label><input type="file" id="cImgFull" accept="image/png,image/jpeg,image/webp" hidden>
   <button id="cAddText">Agregar texto</button><button id="cAddBack">Agregar diseño trasero</button><button id="cAddSleeve" ${SH[CF.model].nosleeve?'hidden':''}>Agregar diseño en manga</button></div>
   <p class="muted" style="font-size:12px;margin:6px 0 10px">Usa PNG con fondo transparente para que solo se vea tu diseño.</p>
   <div id="cLayers" style="display:flex;flex-direction:column;gap:10px">${layersHTML()}</div><div id="cWarn">${warnHTML()}</div></div>
  <div class="card"><h2>¿Tienes una foto del estilo que quieres?</h2>
   <p class="muted" style="font-size:13px;margin:0 0 8px">Sube la foto de una prenda que te guste. La IA propone el modelo, material, color y estampados más parecidos de nuestro catálogo, con su precio.</p>
   <div class="row"><label for="cRef" style="border:1px solid var(--navy);color:var(--navy);border-radius:8px;padding:6px 12px;cursor:pointer;font-weight:600;font-size:13px">Elegir foto</label><input type="file" id="cRef" accept="image/png,image/jpeg,image/webp" hidden>
   <button class="acc" id="cAnalizar" ${CF.ref?'':'hidden'}>Armar modelo con IA</button></div>
   ${CF.ref?`<img src="${CF.ref}" alt="Foto de referencia del cliente" style="margin-top:8px;max-height:180px;border-radius:8px">`:''}
   <div id="cIA" style="font-size:13px;margin-top:8px">${CF.ia}</div></div>
  <div class="card"><h2>3. Precio</h2><div id="cRes">${resumenHTML()}</div></div>
  </div></div>
  <div class="card"><h2 id="cGuiaT">Guía de tallas · ${p.n}</h2><div id="cGuia">${guiaHTML()}</div></div>
  <div class="row"><button class="acc" data-act="cfEnviar">Enviar pedido</button><span class="muted" style="font-size:13px">Tu asesora lo recibe y producción confirma la fecha de entrega.</span></div>`};

/* ---------- Motor 3D ----------
   La prenda se arma como en confección: un panel delantero y uno trasero con la silueta real
   (hombros, sisa, mangas, cuello), inflados con volumen, con pliegues, costuras y tejido. */
let T=null;
const SH={ /* ws: hombro (x ancho), sy: caída de hombro, ang: ángulo de manga, open: boca de manga, arm: profundidad de sisa, D: medio espesor */
  polo:{ws:0.86,sy:0.075,ang:0.98,len:0.42,open:0.34,arm:0.5,nx:0.15,dipF:0.11,dipB:0.035,D:0.17,collar:'polo'},
  oversize:{ws:1.02,sy:0.12,ang:0.8,len:0.46,open:0.42,arm:0.6,nx:0.165,dipF:0.115,dipB:0.035,D:0.19,collar:'rib'},
  buzo:{ws:0.88,sy:0.08,ang:1.28,len:null,open:0.19,arm:0.52,nx:0.16,dipF:0.05,dipB:0.03,D:0.18,collar:'stand',rib:true},
  casaca:{ws:0.9,sy:0.08,ang:1.28,len:null,open:0.21,arm:0.54,nx:0.17,dipF:0.05,dipB:0.03,D:0.19,collar:'stand'},
  camisa:{ws:0.9,sy:0.08,ang:1.28,len:null,open:0.2,arm:0.52,nx:0.15,dipF:0.07,dipB:0.03,D:0.18,collar:'shirt'},
  chaleco:{ws:0.74,sy:0.07,nosleeve:true,ang:1,len:0,open:0,arm:0.46,nx:0.17,dipF:0.22,dipB:0.04,D:0.2,collar:'none',reflect:true},
  ambo:{ws:0.9,sy:0.08,ang:0.98,len:0.4,open:0.36,arm:0.52,nx:0.17,dipF:0.24,dipB:0.04,D:0.18,collar:'rib'},
  chef:{ws:0.9,sy:0.08,ang:1.28,len:null,open:0.21,arm:0.54,nx:0.16,dipF:0.04,dipB:0.03,D:0.2,collar:'stand',chef:true}};
const hsh=(i,j)=>{const h=Math.sin(i*127.1+j*311.7)*43758.5453;return h-Math.floor(h)};
const vn=(x,y)=>{const i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  return(hsh(i,j)*(1-u)+hsh(i+1,j)*u)*(1-v)+(hsh(i,j+1)*(1-u)+hsh(i+1,j+1)*u)*v-0.5};
function dims(){const p=PROD[CF.model],i=Math.max(0,p.tallas.indexOf('M')),o={...SH[CF.model]},W=p.med.pecho[i]/100,L=p.med.largo[i]/50,ef=mangaEfectiva();
  if(ef==='corta'&&o.len==null){o.ang=0.98;o.len=0.42;o.open=0.34}
  if(ef==='larga'&&o.len!=null){o.ang=1.28;o.len=null;o.open=0.2}
  const top=L/2,hem=-L/2,len=o.len!=null?o.len:medManga(p)[i]/50*0.97,a=o.ang,dx=Math.cos(a),dy=-Math.sin(a);
  const S=[W*o.ws,top-o.sy],E1=[S[0]+dx*len,S[1]+dy*len],E2=[E1[0]-Math.sin(a)*o.open,E1[1]-Math.cos(a)*o.open],U=[W,top-o.arm];
  return{W,L,top,hem,o,len,a,S,E1,E2,U}}
/* silueta (mitad derecha reflejada). ext=true alarga mangas y basta para que esos bordes queden abiertos */
function shirtPath(x,d,ext,toPx){const{W,top,hem,o,a,S,E1,E2,U}=d,e=ext?0.5:0,es=o.nosleeve?0:e,dx=Math.cos(a)*es,dy=-Math.sin(a)*es;
  const P=(p)=>toPx(p[0],p[1]),side=(sg)=>{const f=(p)=>[sg*p[0],p[1]];
    return{N:f([o.nx,top]),S:f(S),E1:f([E1[0]+dx,E1[1]+dy]),E2:f([E2[0]+dx,E2[1]+dy]),U:f(U),H:f([W*1.01,hem-e]),Uc:f([U[0]+0.035,U[1]+0.05])}};
  const r=side(1),l=side(-1);x.beginPath();
  x.moveTo(...P(r.N));x.quadraticCurveTo(...P([(r.N[0]+r.S[0])/2,r.S[1]+0.035]),...P(r.S));x.lineTo(...P(r.E1));x.lineTo(...P(r.E2));
  x.quadraticCurveTo(...P(r.Uc),...P([U[0],U[1]-0.06]));x.lineTo(...P([W*1.005,hem+0.2]));x.quadraticCurveTo(...P([W*1.01,hem-e]),...P([W*0.9,hem-e]));
  x.quadraticCurveTo(...P([0,hem-e-0.02]),...P([-W*0.9,hem-e]));x.quadraticCurveTo(...P([-W*1.01,hem-e]),...P([-W*1.005,hem+0.2]));
  x.lineTo(...P([-U[0],U[1]-0.06]));x.quadraticCurveTo(...P(l.Uc),...P(l.E2));x.lineTo(...P(l.E1));x.lineTo(...P(l.S));
  x.quadraticCurveTo(...P([(l.N[0]+l.S[0])/2,l.S[1]+0.035]),...P(l.N));x.lineTo(...P(r.N));x.closePath()}
function neckPath(x,d,dip,toPx){const{top,o}=d;x.beginPath();x.moveTo(...toPx(-o.nx,top+0.3));x.lineTo(...toPx(-o.nx,top));
  x.bezierCurveTo(...toPx(-o.nx*0.95,top-dip*0.85),...toPx(-o.nx*0.55,top-dip),...toPx(0,top-dip));
  x.bezierCurveTo(...toPx(o.nx*0.55,top-dip),...toPx(o.nx*0.95,top-dip*0.85),...toPx(o.nx,top));x.lineTo(...toPx(o.nx,top+0.3));x.closePath()}
function makeGrid(d){const minX=-Math.max(d.E1[0],d.E2[0],d.W*1.03)-0.06,maxX=-minX,minY=d.hem-0.06,maxY=d.top+0.06,NX=460,h=(maxX-minX)/NX,NY=Math.ceil((maxY-minY)/h);
  const toPx=(x,y)=>[(x-minX)/h,(maxY-y)/h];
  const mask=(ext,dip)=>{const c=document.createElement('canvas');c.width=NX+1;c.height=NY+1;const x=c.getContext('2d');x.fillStyle='#fff';shirtPath(x,d,ext,toPx);x.fill();
    if(dip!=null){x.globalCompositeOperation='destination-out';neckPath(x,d,dip,toPx);x.fill()}
    const im=x.getImageData(0,0,NX+1,NY+1).data,m=new Uint8Array((NX+1)*(NY+1));for(let k=0;k<m.length;k++)m[k]=im[k*4+3]>127?1:0;return m};
  const ext=mask(true,null),mF=mask(false,d.o.dipF),mB=mask(false,d.o.dipB);
  /* distancia (chaflán) al borde cosido: hombros, costados y bajo manga */
  const C=NX+1,dist=new Float32Array(C*(NY+1));for(let k=0;k<dist.length;k++)dist[k]=ext[k]?1e9:0;
  for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++){const k=j*C+i;if(!dist[k])continue;let v=dist[k];
    if(i>0)v=Math.min(v,dist[k-1]+1);if(j>0){v=Math.min(v,dist[k-C]+1);if(i>0)v=Math.min(v,dist[k-C-1]+1.414);if(i<NX)v=Math.min(v,dist[k-C+1]+1.414)}dist[k]=v}
  for(let j=NY;j>=0;j--)for(let i=NX;i>=0;i--){const k=j*C+i;if(!dist[k])continue;let v=dist[k];
    if(i<NX)v=Math.min(v,dist[k+1]+1);if(j<NY){v=Math.min(v,dist[k+C]+1);if(i<NX)v=Math.min(v,dist[k+C+1]+1.414);if(i>0)v=Math.min(v,dist[k+C-1]+1.414)}dist[k]=v}
  return{minX,maxX,minY,maxY,NX,NY,h,C,ext,mF,mB,dist,span:Math.max(maxX-minX,maxY-minY)}}
/* profundidad de la tela en (x,y): volumen + pliegues */
function depthAt(d,G,x,y,dd,front){const{W,top,hem,o,U,a}=d,up=Math.min(1,Math.max(0,(y-(top-0.42))/0.34));
  /* hombros y mangas redondeados (radio menor), torso más plano */
  let R=0.28-0.16*up*up*(3-2*up);if(Math.abs(x)>W*0.97)R=Math.min(R,0.13);const t=Math.min(Math.max(dd-G.h,0)/R,1);let z=o.D*Math.sqrt(1-(1-t)*(1-t));
  let w=0.0065*vn(x*5+(front?0:9),y*5)+0.0035*vn(x*13,y*13+(front?0:4));
  const hf=Math.max(0,1-(y-hem)/0.55);w+=0.013*hf*hf*Math.sin(x*15+2.2*vn(x*1.7,y*1.3)+(front?0:1.3));
  [1,-1].forEach(sg=>{const rx=x-sg*U[0],ry=y-U[1],r2=rx*rx+ry*ry;if(sg*x<W*1.02)w+=0.011*Math.exp(-r2/0.05)*Math.sin(Math.atan2(ry,sg*rx)*7+1);
    if(sg*x>W*0.8){const along=(sg*x-d.S[0])*Math.cos(a)-(y-d.S[1])*Math.sin(a);w+=0.006*Math.sin(along*26+vn(x*3,y*3)*3)*Math.min(1,(sg*x-W*0.8)/0.2)}});
  if(front)z*=1+0.07*Math.exp(-(x*x)/0.12-((y-(top-0.42))**2)/0.09);else z*=1+0.05*Math.exp(-((Math.abs(x)-0.22)**2)/0.04-((y-(top-0.3))**2)/0.05);
  return(z+w*Math.min(1,t*1.6))*(front?1:-0.96)}
function panelGeo(d,G,front){const{NX,NY,C,h,minX,maxY,dist,span,minY}=G,m=front?G.mF:G.mB,id=new Int32Array(C*(NY+1)).fill(-1),pos=[],uv=[];let n=0;
  for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++){const k=j*C+i;if(!m[k])continue;id[k]=n++;const x=minX+i*h,y=maxY-j*h;pos.push(x,y,0);uv.push((x-minX)/span,(y-minY)/span)}
  /* suaviza el escalonado del borde */
  for(let it=0;it<6;it++){const np=pos.slice();for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++){const k=j*C+i,v=id[k];if(v<0)continue;
    const nb=[k-1,k+1,k-C,k+C].filter(q=>q>=0&&q<id.length&&id[q]>=0);if(nb.length===4)continue;let sx=pos[v*3],sy=pos[v*3+1];nb.forEach(q=>{sx+=pos[id[q]*3];sy+=pos[id[q]*3+1]});
    np[v*3]=sx/(nb.length+1);np[v*3+1]=sy/(nb.length+1)}for(let q=0;q<pos.length;q++)pos[q]=np[q]}
  const fixed=new Uint8Array(n);
  for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++){const k=j*C+i,v=id[k];if(v<0)continue;const bd=[k-1,k+1,k-C,k+C].some(q=>q<0||q>=id.length||!G.ext[q]);
    fixed[v]=bd?1:0;pos[v*3+2]=bd?0:depthAt(d,G,pos[v*3],pos[v*3+1],dist[k]*h,front)}
  /* alisado de la superficie: elimina facetas y escalones, manteniendo las costuras fijas */
  for(let it=0;it<5;it++){const z=new Float32Array(n);for(let q=0;q<n;q++)z[q]=pos[q*3+2];
    for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++){const k=j*C+i,v=id[k];if(v<0||fixed[v])continue;let s=z[v]*2,c=2;
      for(const q of[k-1,k+1,k-C,k+C,k-C-1,k-C+1,k+C-1,k+C+1]){if(q>=0&&q<id.length&&id[q]>=0){s+=z[id[q]];c++}}pos[v*3+2]=s/c}}
  const idx=[];for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const a=id[j*C+i],b=id[j*C+i+1],c=id[(j+1)*C+i],e=id[(j+1)*C+i+1];if(a<0||b<0||c<0||e<0)continue;
    if(front)idx.push(a,c,b,b,c,e);else idx.push(a,b,c,b,e,c)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g}
const zAt=(d,G,x,y,front)=>{const i=Math.round((x-G.minX)/G.h),j=Math.round((G.maxY-y)/G.h),k=j*G.C+i;return depthAt(d,G,x,y,(G.dist[k]||0)*G.h,front)};
/* tejido: mapa de normales según el material */
function knitNormal(mat){const N=8,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),im=x.createImageData(N,N);
  const H=(i,j)=>{i=(i+N)%N;j=(j+N)%N;switch(mat){case'pq':{const cx=(i%4)-1.5,cy=(j%4)-1.5;return 1-Math.min(1,Math.hypot(cx,cy)/2.1)}
    case'jer':return 0.5+0.5*Math.cos((i%4)/4*2*Math.PI)*(0.7+0.3*Math.cos(j/N*4*Math.PI));case'dry':return(i%3===0||j%3===0)?1:0.2;
    case'tafe':return((i+j)%4<2)?0.8:0.4;case'oxf':return((i%2)^(j%2))?0.9:0.3;case'dril':return((i+j*2)%8<4)?0.9:0.3;case'anti':return((i+j)%2)?0.55:0.45;case'ft':case'micro':return hsh(i,j);default:return 0.4+0.3*hsh(i*3,j*7)}};
  const st=mat==='tafe'?0.6:mat==='soft'?0.5:1.6;
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){let nx=(H(i-1,j)-H(i+1,j))*st,ny=(H(i,j+1)-H(i,j-1))*st,nz=1,l=Math.hypot(nx,ny,nz);const q=(j*N+i)*4;
    im.data[q]=(nx/l*0.5+0.5)*255;im.data[q+1]=(ny/l*0.5+0.5)*255;im.data[q+2]=(nz/l*0.5+0.5)*255;im.data[q+3]=255}
  x.putImageData(im,0,0);return c}
function textCanvas(l){const c=document.createElement('canvas'),x=c.getContext('2d'),f=FONTS[l.font].replace('{s}',220);x.font=f;
  const w=Math.max(40,x.measureText(l.text||' ').width);c.width=Math.ceil(w+40);c.height=280;x.font=f;x.fillStyle=l.tcolor;x.textAlign='center';x.textBaseline='middle';x.fillText(l.text||'',c.width/2,c.height/2+10);return c}
function shade(hex,f){const c=new THREE.Color(hex);c.multiplyScalar(f);return'#'+c.getHexString()}
function paintPanel(c,d,G,front){const S=c.width,x=c.getContext('2d'),px=(X,Y)=>[(X-G.minX)/G.span*S,(1-(Y-G.minY)/G.span)*S],u=S/G.span,{W,top,hem,o,a,E1,E2}=d;
  x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.globalCompositeOperation='source-over';x.shadowColor='transparent';x.fillStyle=CF.color;x.fillRect(0,0,S,S);
  /* variación natural del teñido y jaspeado */
  for(let k=0;k<900;k++){x.globalAlpha=0.025;x.fillStyle=Math.random()>0.5?'#fff':'#000';const r=Math.random()*60+20;x.beginPath();x.arc(Math.random()*S,Math.random()*S,r,0,7);x.fill()}
  if(CF.color==='#9a9ca3'){for(let k=0;k<40000;k++){x.globalAlpha=0.25;x.fillStyle=Math.random()>0.5?'#c8c9cd':'#6d6f75';x.fillRect(Math.random()*S,Math.random()*S,2+Math.random()*4,1)}}
  x.globalAlpha=1;const dark=shade(CF.color,0.62),seam=(pts,dash)=>{x.save();x.setLineDash(dash||[7,5]);x.lineWidth=2.2;x.strokeStyle=dark;x.globalAlpha=0.55;x.beginPath();pts.forEach((p,i)=>x[i?'lineTo':'moveTo'](...px(...p)));x.stroke();
    x.setLineDash([]);x.globalAlpha=0.18;x.lineWidth=5;x.beginPath();pts.forEach((p,i)=>x[i?'lineTo':'moveTo'](...px(p[0],p[1]+0.004)));x.stroke();x.restore()};
  /* basta y bocamangas con doble costura */
  const ribZone=(y0,y1,x0,x1)=>{x.save();x.fillStyle=o.rib?'#f4f4f2':shade(CF.color,0.94);const[a0,b0]=px(x0,y1),[a1,b1]=px(x1,y0);x.fillRect(a0,b0,a1-a0,b1-b0);
    x.globalAlpha=0.16;x.strokeStyle='#000';x.lineWidth=1.4;for(let X=a0;X<a1;X+=5){x.beginPath();x.moveTo(X,b0);x.lineTo(X,b1);x.stroke()}x.restore()};
  if(o.rib)ribZone(hem-0.1,hem+0.09,-W*1.2,W*1.2);
  [0.032,0.05].forEach(off=>seam([[-W*1.1,hem+off],[W*1.1,hem+off]]));
  if(o.reflect){[hem+0.22,hem+0.42].forEach(y=>{const[a0,b0]=px(-W*1.2,y+0.025),[a1,b1]=px(W*1.2,y-0.025);x.fillStyle='#c9ccd1';x.fillRect(a0,b0,a1-a0,b1-b0);
    x.globalAlpha=0.35;x.fillStyle='#fff';x.fillRect(a0,b0,a1-a0,(b1-b0)*0.35);x.globalAlpha=1;seam([[-W*1.2,y+0.022],[W*1.2,y+0.022]]);seam([[-W*1.2,y-0.022],[W*1.2,y-0.022]])})}
  if(!o.nosleeve)[1,-1].forEach(sg=>{const cx=(E1[0]+E2[0])/2,cy=(E1[1]+E2[1])/2,ux=-Math.cos(a),uy=Math.sin(a),px1=-Math.sin(a),py1=-Math.cos(a);
    if(o.rib){x.save();x.translate(...px(sg*cx+sg*ux*0.06,cy+uy*0.06));x.rotate(sg*(Math.PI/2-a));x.fillStyle='#f4f4f2';x.fillRect(-0.3*u,-0.06*u,0.6*u,0.16*u);x.restore()}
    [0.03,0.048].forEach(off=>seam([[sg*(E1[0]+ux*off-px1*0.05),E1[1]+uy*off-py1*0.05],[sg*(E2[0]+ux*off+px1*0.05),E2[1]+uy*off+py1*0.05]]));
    const sp=[];for(let t=0;t<=1.0001;t+=0.1){const sx=d.S[0]-0.01+(W-0.015-d.S[0]+0.01)*Math.pow(t,0.7)*(o.ws>1?0.4:1),sy=d.S[1]+(d.U[1]-d.S[1])*t;sp.push([sg*(o.ws>1?d.S[0]-0.02-0.03*Math.sin(t*Math.PI):sx+0.035*Math.sin(t*Math.PI)),sy])}seam(sp,[1,0])});
  /* cuello */
  const dip=front?o.dipF:o.dipB,ncol=o.collar==='stand'&&o.rib?'#f4f4f2':shade(CF.color,0.9);x.save();x.lineWidth=0.05*u;x.strokeStyle=ncol;x.beginPath();
  x.moveTo(...px(-o.nx,top));x.bezierCurveTo(...px(-o.nx*0.95,top-dip*0.85),...px(-o.nx*0.55,top-dip),...px(0,top-dip));x.bezierCurveTo(...px(o.nx*0.55,top-dip),...px(o.nx*0.95,top-dip*0.85),...px(o.nx,top));x.stroke();
  x.globalAlpha=0.2;x.strokeStyle='#000';x.lineWidth=1.3;for(let k=-1;k<=1;k+=2){x.setLineDash([6,4]);x.beginPath();x.moveTo(...px(-o.nx*1.18,top));x.bezierCurveTo(...px(-o.nx*1.1,top-dip*1.2),...px(-o.nx*0.6,top-dip-0.03),...px(0,top-dip-0.032));x.bezierCurveTo(...px(o.nx*0.6,top-dip-0.03),...px(o.nx*1.1,top-dip*1.2),...px(o.nx*1.18,top));x.stroke()}x.restore();
  if(front&&o.collar==='polo'){const[a0,b0]=px(-0.04,top-dip+0.005),[a1,b1]=px(0.04,top-dip-0.24);x.fillStyle=shade(CF.color,0.93);x.fillRect(a0,b0,a1-a0,b1-b0);x.strokeStyle=dark;x.globalAlpha=0.5;x.setLineDash([6,4]);x.lineWidth=2;x.strokeRect(a0+5,b0,a1-a0-10,b1-b0-5);x.setLineDash([]);x.globalAlpha=1}
  if(front&&o.collar==='stand'&&!o.chef){const[a0,b0]=px(-0.012,top-dip),[a1,b1]=px(0.012,hem);x.fillStyle=shade(CF.color,0.5);x.fillRect(a0,b0,a1-a0,b1-b0)}
  if(front&&(o.collar==='shirt'||o.collar==='none')){seam([[0.035,top-dip],[0.035,hem+0.01]],[1,0]);seam([[-0.035,top-dip],[-0.035,hem+0.01]],[6,4])}
  if(front&&o.chef){[[-0.13],[0.13]].forEach(([cx])=>seam([[cx,top-dip-0.02],[cx,hem+0.1]],[6,4]))}
  /* estampados: libre, dentro de una hoja A4, rectángulo a medida o pieza completa hasta la costura */
  CF.layers.forEach(l=>{const zona=l.zona,f=zona==='toda'?'completa':(l.formato||'libre'),manga=zona.startsWith('manga');if(zona!=='toda'&&(zona==='espalda')===front)return;
    if(zona==='toda')l.mangas=true;
    if(manga&&(o.nosleeve||f==='completa'))return;
    const src=l.kind==='img'?l.img:textCanvas(l);if(!src||!src.width)return;const sw=src.width,sh=src.height*(l.kind==='text'?0.72:1);
    let oc,ox=0,oy=0,box=null;
    if(f==='completa'){oc=document.createElement('canvas');oc.width=oc.height=S;const q=oc.getContext('2d');
      const bx0=l.mangas?G.minX:-W*1.02,[a0,b0]=px(bx0,top+0.02),[a1,b1]=px(-bx0,hem-0.02),bw=a1-a0,bh=b1-b0;
      q.save();shirtPath(q,d,false,px);q.clip();if(!l.mangas){q.beginPath();q.rect(a0,b0,bw,bh);q.clip()}
      const sc=(l.fit==='contain'?Math.min:Math.max)(bw/sw,bh/sh),dw=sw*sc,dh=sh*sc;
      q.translate(a0+bw/2+(l.dx/50)*u,b0+bh/2+(l.dy/50)*u);if(!front)q.scale(-1,1);q.drawImage(src,-dw/2,-dh/2,dw,dh);q.restore();
      if(l.margen>0){q.save();q.globalCompositeOperation='destination-out';q.lineWidth=2*(l.margen/50)*u;q.lineJoin='round';shirtPath(q,d,false,px);q.stroke();q.restore()}}
    else{let bwc,bhc;if(f==='a4'){const v=l.orient!=='h',e=(l.escala||100)/100;bwc=(v?21:29.7)*e;bhc=(v?29.7:21)*e}
      else if(f==='rect'){bwc=l.ancho;bhc=l.alto||20}else{bwc=l.ancho;bhc=l.ancho*sh/sw}
      const aw=bwc/50,ah=bhc/50,cx=(zona==='pecho'?W*0.42:0)+l.dx/50,yTop=zona==='pecho'?top-0.24-l.dy/50:top-(front?o.dipF:o.dipB)-(4+l.dy)/50;
      const pw=Math.max(2,aw*u),ph=Math.max(2,ah*u);oc=document.createElement('canvas');oc.width=Math.ceil(pw);oc.height=Math.ceil(ph);const q=oc.getContext('2d');
      const fit=f==='libre'?'fill':f==='a4'?'contain':(l.fit||'contain');let dw=pw,dh=ph;
      if(fit!=='fill'){const sc=(fit==='contain'?Math.min:Math.max)(pw/sw,ph/sh);dw=sw*sc;dh=sh*sc}
      q.translate(pw/2,ph/2);if(!front)q.scale(-1,1);
      if(manga){/* en la manga el diseño sigue el eje de la manga, con la parte de arriba hacia el hombro */
        const sg=zona==='manga_izq'?1:-1,ca=Math.cos(a),sa=Math.sin(a),t0=Math.min(d.len*0.55,0.12+(4+l.dy)/50),
          mx=sg*(d.S[0]+ca*t0-sa*o.open*0.5+(l.dx/50)),my=d.S[1]-sa*t0-ca*o.open*0.5,rot=-sg*(Math.PI/2-a);
        const rc=document.createElement('canvas'),R=Math.ceil(Math.hypot(pw,ph));rc.width=rc.height=R;const rq=rc.getContext('2d');
        rq.translate(R/2,R/2);rq.rotate(rot);rq.drawImage(src,-dw/2,-dh/2,dw,dh);oc=rc;const[X,Y]=px(mx,my);ox=X-R/2;oy=Y-R/2;box=null}
      else{q.drawImage(src,-dw/2,-dh/2,dw,dh);const[X,Y]=px(cx,yTop-ah/2);ox=X-pw/2;oy=Y-ph/2;box=[ox,oy,pw,ph]}}
    const q=oc.getContext('2d');q.setTransform(1,0,0,1,0,0);
    if(l.tec==='Bordado'){q.save();q.globalCompositeOperation='source-atop';q.globalAlpha=0.18;q.strokeStyle='#000';q.lineWidth=1;for(let k=-oc.height;k<oc.width;k+=4){q.beginPath();q.moveTo(k,0);q.lineTo(k+oc.height*0.4,oc.height);q.stroke()}q.restore()}
    if(l.tec==='Vinil'){q.save();q.globalCompositeOperation='source-atop';q.globalAlpha=0.12;q.fillStyle='#fff';q.fillRect(0,0,oc.width,oc.height*0.4);q.restore()}
    x.save();if(l.tec==='Bordado'){x.shadowColor='rgba(0,0,0,.5)';x.shadowBlur=5;x.shadowOffsetY=3}x.globalAlpha=l.tec==='Sublimado'?0.95:l.tec==='Serigrafía'?0.97:1;x.drawImage(oc,ox,oy);x.restore();
    if(box&&l.guia&&(f==='a4'||f==='rect')){const[gx,gy,gw,gh]=box,gc=CF.color>'#888888'?'rgba(29,58,138,.85)':'rgba(255,255,255,.9)';
      x.save();x.setLineDash([10,8]);x.lineWidth=3;x.strokeStyle=gc;x.strokeRect(gx,gy,gw,gh);x.setLineDash([]);
      if(!front){x.translate(gx+gw/2,0);x.scale(-1,1);x.translate(-(gx+gw/2),0)}
      x.font='600 26px Figtree, sans-serif';x.fillStyle=gc;x.fillText(f==='a4'?'A4':`${l.ancho} × ${l.alto} cm`,gx+8,gy+30);x.restore()}})}
function bodyTexture(d){if(!T||!T.G)return;paintPanel(T.fc,d,T.G,true);paintPanel(T.bc,d,T.G,false);T.ftex.needsUpdate=true;T.btex.needsUpdate=true}
function fabricMat(map){const L=MATLOOK[CF.mat]||MATLOOK.pq,m=new THREE.MeshPhysicalMaterial({map,normalMap:T.ntex,normalScale:new THREE.Vector2(0.55,0.55),roughness:Math.max(0.55,L.r),metalness:0,side:THREE.DoubleSide});
  if('sheen' in m)m.sheen=new THREE.Color(CF.mat==='tafe'||CF.mat==='dry'?0.05:0.22,CF.mat==='tafe'||CF.mat==='dry'?0.05:0.22,CF.mat==='tafe'||CF.mat==='dry'?0.05:0.22);
  if(CF.mat==='tafe'||CF.mat==='dry'){m.roughness=CF.mat==='tafe'?0.38:0.5;if('clearcoat' in m){m.clearcoat=CF.mat==='tafe'?0.25:0.08;m.clearcoatRoughness=0.5}}return m}
function build3D(){if(!T)return;const g=T.g;while(g.children.length){const o=g.children.pop();o.traverse(n=>{n.geometry&&n.geometry.dispose()})}
  const d=dims(),G=makeGrid(d),{top,hem,o}=d;T.d=d;T.G=G;
  const nt=new THREE.CanvasTexture(knitNormal(CF.mat));nt.wrapS=nt.wrapT=THREE.RepeatWrapping;const reps=G.span*50/0.9;nt.repeat.set(reps,reps);
  /* el mapa de normales comparte UV con el color: se pinta a 2048 px para que el tejido sea fino */
  const nc=document.createElement('canvas');nc.width=nc.height=2048;const nx=nc.getContext('2d');nx.fillStyle=nx.createPattern(knitNormal(CF.mat),'repeat');nx.save();nx.scale(0.75,0.75);nx.fillRect(0,0,2731,2731);nx.restore();
  if(T.ntex)T.ntex.dispose();T.ntex=new THREE.CanvasTexture(nc);T.ntex.anisotropy=T.r.capabilities.getMaxAnisotropy();
  bodyTexture(d);
  const F=new THREE.Mesh(panelGeo(d,G,true),fabricMat(T.ftex)),B=new THREE.Mesh(panelGeo(d,G,false),fabricMat(T.btex));[F,B].forEach(m=>{m.castShadow=m.receiveShadow=true;g.add(m)});
  const colC=new THREE.Color(o.collar==='stand'&&o.rib?'#f4f4f2':CF.color).convertSRGBToLinear().multiplyScalar(0.9),rib=new THREE.MeshPhysicalMaterial({color:colC,roughness:0.92,normalMap:T.ntex,side:THREE.DoubleSide});
  if('sheen' in rib)rib.sheen=new THREE.Color(0.2,0.2,0.2);
  const neckCurve=(dip,front,lift)=>{const pts=[];for(let t=0;t<=1.0001;t+=1/40){const s=t*2-1,xx=o.nx*s,base=Math.pow(Math.abs(s),1.6),yy=top-dip*(1-base)+lift;
    pts.push(new THREE.Vector3(xx,yy,zAt(d,G,xx,yy-0.012,front)*0.98))}return pts};
  const rad=o.collar==='polo'?0.024:o.collar==='stand'?0.032:0.012,lift=o.collar==='stand'?0.03:-0.004;
  const ring=neckCurve(o.dipF,true,lift).concat(neckCurve(o.dipB,false,lift).reverse().slice(1));
  if(o.collar!=='none'){const col=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ring,true),220,o.collar==='shirt'?0.034:rad,18,true),rib);col.castShadow=true;g.add(col)}
  const btns=(xs,y0,y1,step)=>{const bm=new THREE.MeshPhysicalMaterial({color:0xf2f2ee,roughness:0.25,clearcoat:0.6});xs.forEach(bx=>{for(let y=y0;y>=y1;y-=step){
    const b=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.007,24),bm);b.rotation.x=Math.PI/2;b.position.set(bx,y,zAt(d,G,bx,y,true)+0.006);b.castShadow=true;g.add(b)}})};
  if(o.collar==='shirt')btns([0],top-o.dipF-0.05,hem+0.1,0.16);
  if(o.chef)btns([-0.13,0.13],top-o.dipF-0.06,hem+0.25,0.14);
  if(o.collar==='stand'&&!o.chef){const ring2=neckCurve(o.dipF,true,lift+0.055).concat(neckCurve(o.dipB,false,lift+0.055).reverse().slice(1));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ring2,true),220,rad*0.9,18,true),rib));
    const zp=[];for(let y=top-o.dipF+lift+0.05;y>=hem+0.005;y-=0.02)zp.push(new THREE.Vector3(0,y,zAt(d,G,0,y,true)+0.006));
    const metal=new THREE.MeshPhysicalMaterial({color:0xc9ccd2,metalness:1,roughness:0.28});const zip=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(zp),200,0.007,8,false),metal);zip.scale.x=1.6;g.add(zip);
    const pull=new THREE.Mesh(new THREE.BoxGeometry(0.022,0.07,0.008),metal);pull.position.copy(zp[1]).add(new THREE.Vector3(0,-0.04,0.012));pull.rotation.x=-0.25;g.add(pull)}
  if(o.collar==='polo'){const bm=new THREE.MeshPhysicalMaterial({color:0xf2f2ee,roughness:0.25,clearcoat:0.6});
    [0.07,0.16].forEach(dy=>{const y=top-o.dipF-dy,b=new THREE.Mesh(new THREE.CylinderGeometry(0.013,0.013,0.007,24),bm);b.rotation.x=Math.PI/2;b.position.set(0,y,zAt(d,G,0,y,true)+0.006);b.castShadow=true;g.add(b)})}
  g.position.y=-(top+hem)/2;
  T.key.shadow.camera.left=-1.6;T.key.shadow.camera.right=1.6;T.key.shadow.camera.top=1.6;T.key.shadow.camera.bottom=-1.6;T.key.shadow.camera.updateProjectionMatrix()}
function init3D(){const box=document.getElementById('v3d');if(!box)return;
  if(!window.THREE){box.innerHTML='<p class="muted" style="padding:16px">No se pudo cargar el visor 3D.</p>';return}
  if(!T){const r=new THREE.WebGLRenderer({antialias:true,alpha:true});r.setPixelRatio(Math.min(3,Math.max(2,window.devicePixelRatio||1)));
    r.outputEncoding=THREE.sRGBEncoding;r.toneMapping=THREE.ACESFilmicToneMapping;r.toneMappingExposure=1.08;r.shadowMap.enabled=true;r.shadowMap.type=THREE.PCFSoftShadowMap;r.physicallyCorrectLights=false;
    const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(26,1,0.1,50);cam.position.set(0,0.03,4.6);
    const pm=new THREE.PMREMGenerator(r),env=new THREE.Scene();env.add(new THREE.Mesh(new THREE.SphereGeometry(10,32,16),new THREE.MeshBasicMaterial({color:0x2c2c2e,side:THREE.BackSide})));
    const panel=(w,h,x,y,z,i)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(i,i,i),side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);env.add(m)};
    panel(4,4,0,1.5,6,4.2);panel(3,6,-5.5,1,2,2.2);panel(3,6,5.5,0.5,-2,1.6);panel(8,2,0,6,0,2.2);panel(6,2,0,-5,3,0.6);
    sc.environment=pm.fromScene(env,0.03).texture;
    const key=new THREE.DirectionalLight(0xfff6ec,1.05);key.position.set(1.8,2.6,3.6);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.radius=6;key.shadow.bias=-0.0004;key.shadow.normalBias=0.025;sc.add(key);
    const fill=new THREE.DirectionalLight(0xe8eeff,0.25);fill.position.set(-3,0.5,2);sc.add(fill);const rim=new THREE.DirectionalLight(0xffffff,0.45);rim.position.set(0,2,-4);sc.add(rim);
    const mk=()=>{const c=document.createElement('canvas');c.width=c.height=2048;const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=r.capabilities.getMaxAnisotropy();return[c,t]};
    const[fc,ftex]=mk(),[bc,btex]=mk();const g=new THREE.Group();sc.add(g);
    T={r,sc,cam,g,key,fc,ftex,bc,btex,rot:-0.32,tilt:0.04,target:null,drag:false,lx:0,ly:0,idle:0,zoom:4.6};
    const c=r.domElement;c.style.display='block';
    c.addEventListener('pointerdown',e=>{T.drag=true;T.target=null;T.lx=e.clientX;T.ly=e.clientY;c.setPointerCapture(e.pointerId);c.style.cursor='grabbing'});
    c.addEventListener('pointermove',e=>{if(!T.drag)return;T.rot+=(e.clientX-T.lx)*0.011;T.tilt=Math.max(-0.5,Math.min(0.5,T.tilt+(e.clientY-T.ly)*0.006));T.lx=e.clientX;T.ly=e.clientY});
    c.addEventListener('pointerup',()=>{T.drag=false;T.idle=performance.now();c.style.cursor='grab'});
    c.addEventListener('wheel',e=>{e.preventDefault();T.zoom=Math.max(1.6,Math.min(7,T.zoom+Math.sign(e.deltaY)*0.3))},{passive:false});
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const loop=()=>{requestAnimationFrame(loop);if(!T.r.domElement.isConnected)return;
      if(T.target!==null){let df=T.target-T.rot;df=Math.atan2(Math.sin(df),Math.cos(df));T.rot+=df*0.12;if(Math.abs(df)<0.002)T.target=null}
      else if(CF.auto&&!reduce&&!T.drag&&performance.now()-T.idle>2500)T.rot+=0.0035;
      T.cam.position.z+=(T.zoom-T.cam.position.z)*0.15;T.g.rotation.y=T.rot;T.g.rotation.x=T.tilt;T.r.render(sc,cam)};loop()}
  box.appendChild(T.r.domElement);const w=box.clientWidth,h=box.clientHeight;T.r.setSize(w,h);T.cam.aspect=w/h;T.cam.updateProjectionMatrix();build3D();
  if(document.fonts)document.fonts.ready.then(()=>{if(T&&view==='cliente')bodyTexture(T.d)})}
window.addEventListener('resize',()=>{if(view==='cliente'&&T&&document.getElementById('v3d')){const b=document.getElementById('v3d'),w=b.clientWidth,h=b.clientHeight;T.r.setSize(w,h);T.cam.aspect=w/h;T.cam.updateProjectionMatrix()}});

function cfRefresh(opt){opt=opt||{};const p=PROD[CF.model];
  if(opt.model){const t={};p.tallas.forEach(x=>t[x]=CF.tallas[x]||0);CF.tallas=t;
    document.getElementById('cMat').innerHTML=p.mats.map(m=>`<option value="${m}" ${m===CF.mat?'selected':''}>${mp(m).n}${MATP[m]?` (${MATP[m]>0?'+':''}S/ ${MATP[m]})`:''}</option>`).join('');
    document.getElementById('cGuia').innerHTML=guiaHTML();document.getElementById('cGuiaT').textContent='Guía de tallas · '+p.n}
  if(opt.layers)document.getElementById('cLayers').innerHTML=layersHTML();
  document.getElementById('cWarn').innerHTML=warnHTML();document.getElementById('cRes').innerHTML=resumenHTML();
  if(opt.geo)build3D();else if(T&&T.d)bodyTexture(T.d)}
document.addEventListener('input',e=>{const t=e.target;if(view!=='cliente')return;
  if(t.dataset.talla){CF.tallas[t.dataset.talla]=Math.max(0,+t.value||0);cfRefresh();return}
  if(t.dataset.l){const l=CF.layers.find(x=>x.id===+t.dataset.l),k=t.dataset.k;if(!l)return;
    l[k]=t.type==='checkbox'?t.checked:['ancho','dy','dx','alto','escala','margen','tol'].includes(k)?Math.max(k==='dx'||k==='dy'?-99:0,+t.value||0):t.value;
    if((k==='quitar'||k==='tol')&&l.orig){l.img=l.quitar?quitarFondo(l.orig,l.tol):l.orig;if(k==='tol'){document.getElementById('ltolv_'+l.id).textContent=l.tol;clearTimeout(l._tm);l._tm=setTimeout(()=>cfRefresh({layers:true}),400);cfRefresh();return}cfRefresh({layers:true});return}
    const lab={ancho:'lav_',dy:'lyv_',dx:'lxv_'}[k],le=lab&&document.getElementById(lab+l.id);if(le)le.textContent=t.value+' cm';
    if(k==='zona'&&l.zona==='toda'){l.formato='completa';l.mangas=true;l.dy=0;cfRefresh({layers:true});return}
    if(k==='formato'){if(l.formato==='completa'&&l.zona!=='espalda'&&l.zona!=='toda')l.zona='frente';if(l.formato!=='completa'&&l.zona==='toda')l.zona='frente';if(l.formato==='completa')l.dy=0;cfRefresh({layers:true});return}
    cfRefresh();return}
  if(t.id==='cCli')CF.cli=t.value;
  if(t.id==='cColorCustom'){CF.color=t.value;document.querySelectorAll('[data-color]').forEach(x=>x.style.border='1px solid var(--line)');cfRefresh({geo:true})}});
document.addEventListener('change',e=>{const t=e.target;if(view!=='cliente')return;
  if(t.id==='cModel'){CF.model=t.value;CF.mat=PROD[t.value].mat;cfRefresh({model:true,geo:true})}
  if(t.id==='cMat'){CF.mat=t.value;cfRefresh({geo:true})}
  if(t.id==='cManga'){CF.manga=t.value;cfRefresh({model:true,geo:true})}
  if((t.id==='cImg'||t.id==='cImgFull')&&t.files[0]){const f=t.files[0],full=t.id==='cImgFull',rd=new FileReader();
    rd.onload=()=>{const im=new Image();im.onload=()=>{const bg=tieneFondoBlanco(im),l={id:LID++,kind:'img',orig:im,quitar:bg,tol:40,name:f.name,zona:'frente',tec:'DTF',ancho:22,dy:8,dx:0};
      if(full)Object.assign(l,{zona:'toda',formato:'completa',mangas:true,margen:0,fit:'cover',dy:0,tec:'Sublimado'});
      l.img=l.quitar?quitarFondo(im,l.tol):im;CF.layers.push(l);cfRefresh({layers:true});
      toast((full?'Estampado completo aplicado a toda la prenda.':'Estampado agregado.')+(bg?' Se quitó el fondo blanco para copiar solo el diseño.':''))};
      im.onerror=()=>toast('No se pudo leer esa imagen. Prueba con PNG o JPG.');im.src=rd.result};rd.readAsDataURL(f);t.value=''}
  if(t.id==='cRef'&&t.files[0]){CF.refFile=t.files[0];if(CF.ref)URL.revokeObjectURL(CF.ref);CF.ref=URL.createObjectURL(t.files[0]);CF.ia='';t.value='';render()}});
document.addEventListener('click',e=>{if(view!=='cliente')return;const t=e.target;
  const b=t.closest('[data-color]');if(b){CF.color=b.dataset.color;document.querySelectorAll('[data-color]').forEach(x=>x.style.border=x.dataset.color===CF.color?'3px solid var(--orange)':'1px solid var(--line)');cfRefresh({geo:true});return}
  const v=t.closest('[data-view]');if(v&&T){T.target=+v.dataset.view;T.tilt=0.05;CF.auto=false;document.getElementById('cAuto').textContent='Girar sola';return}
  const z=t.closest('[data-zoom]');if(z&&T){T.zoom=Math.max(3,Math.min(8,T.zoom+(+z.dataset.zoom)*0.6));return}
  const del=t.closest('[data-ldel]');if(del){CF.layers=CF.layers.filter(l=>l.id!==+del.dataset.ldel);cfRefresh({layers:true});return}
  if(t.id==='cAddText'){CF.layers.push({id:LID++,kind:'text',text:'TU TEXTO',font:'Archivo',tcolor:CF.color==='#f4f4f2'?'#1d2b5a':'#ffffff',zona:'frente',tec:'Vinil',ancho:18,dy:10,dx:0});cfRefresh({layers:true});return}
  if(t.id==='cAddBack'){CF.layers.push({id:LID++,kind:'text',text:'NOMBRE 10',font:'Anton',tcolor:CF.color>'#888888'?'#1d2b5a':'#ffffff',zona:'espalda',tec:'DTF',ancho:26,dy:6,dx:0,formato:'rect',alto:14,fit:'contain',guia:true});cfRefresh({layers:true});
    if(T){T.target=Math.PI;CF.auto=false}toast('Diseño trasero agregado. La prenda gira para mostrar la espalda.');return}
  if(t.id==='cAddSleeve'){CF.layers.push({id:LID++,kind:'text',text:'LOGO',font:'Archivo',tcolor:CF.color>'#888888'?'#1d2b5a':'#ffffff',zona:'manga_izq',tec:'Bordado',ancho:8,dy:2,dx:0});cfRefresh({layers:true});
    if(T){T.target=Math.PI/2;CF.auto=false}toast('Diseño en manga agregado. Cambia a manga derecha en “Ubicación” si lo prefieres.');return}
  if(t.id==='cAuto'){CF.auto=!CF.auto;t.textContent=CF.auto?'Detener giro':'Girar sola';return}
  if(t.id==='cBg'){CF.bg=CF.bg==='dark'?'light':'dark';const bx=document.getElementById('v3d');bx.style.background=CF.bg==='dark'?'radial-gradient(circle at 50% 40%,#3b3b40,#111114 75%)':'radial-gradient(circle at 50% 40%,#ffffff,#d8d9de 80%)';t.textContent='Fondo '+(CF.bg==='dark'?'claro':'oscuro');return}
  if(t.id==='cAnalizar')analizarIA(t)});

/* ---------- IA: de foto de referencia a modelo y precio ---------- */
let SAMPLE=null,SAMPLE_IMG=false;
if(window.claude&&claude.use)claude.use('sample').then(async s=>{SAMPLE=s;if(s){const lim=await s.limits().catch(()=>null);SAMPLE_IMG=!!(lim&&lim.images)}}).catch(()=>{});
async function analizarIA(btn){const out=document.getElementById('cIA');
  if(!CF.refFile)return;
  btn.disabled=true;out.textContent='Analizando la foto…';
  const prompt=`Eres asesor de confección de Grupo DYC (Perú), que fabrica uniformes escolares y corporativos. La imagen es una foto de referencia de la prenda que un cliente quiere mandar a hacer. Elige lo más parecido de este catálogo.
Modelos (clave: nombre): polo: Polo piqué corte regular con cuello y botones; oversize: Polo oversize de hombro caído, cuello redondo; buzo: Buzo escolar, casaca deportiva con cierre; casaca: Casaca corporativa con cierre; camisa: Camisa corporativa manga larga con cuello y botones; chaleco: Chaleco sin mangas con cintas reflectivas (seguridad); ambo: Ambo médico, chaqueta cuello en V manga corta; chef: Chaqueta de chef con cuello mao y doble botonadura.
Materiales permitidos por modelo: polo: pq (piqué), jer (jersey), dry (dry-fit); oversize: jer (jersey), ft (french terry); buzo: ft (french terry), micro (micropolar); casaca: tafe (taffeta), soft (softshell); camisa: oxf (Oxford), dril (drill); chaleco: dril, soft; ambo: anti (antifluido); chef: dril, anti.
Técnicas de estampado: DTF, Sublimado (solo en dry-fit), Vinil, Serigrafía, Bordado. Zonas: frente, pecho (pecho izquierdo, logo chico), espalda.
Responde solo con JSON en este formato:
{"modelo":"oversize","material":"jer","color_hex":"#1b1b1d","color_nombre":"Negro","estampados":[{"zona":"frente","tecnica":"DTF","ancho_cm":24,"texto":"texto legible del diseño o cadena vacía"}],"comentario":"1 o 2 frases en español para el cliente: qué reconociste y qué no se puede replicar igual"}
Usa ancho_cm entre 5 y 34. Si la foto no muestra una prenda, devuelve "estampados":[] y explícalo en comentario.`;
  try{let r;
    if(SAMPLE&&SAMPLE_IMG)r=await SAMPLE.json(prompt,{images:[CF.refFile],modelTier:'default'});
    else{/* fuera de Claude (por ejemplo en Next.js) se usa la ruta del servidor /api/analizar */
      const fd=new FormData();fd.append('image',CF.refFile);fd.append('prompt',prompt);
      const res=await fetch('/api/analizar',{method:'POST',body:fd}).catch(()=>null);
      if(!res||res.status===404)throw{code:'no_api'};const body=await res.json().catch(()=>null);if(!res.ok||!body)throw{code:(body&&body.code)||'upstream_error'};r=body}
    if(PROD[r.modelo])CF.model=r.modelo;const p=PROD[CF.model];CF.mat=p.mats.includes(r.material)?r.material:p.mat;
    if(/^#[0-9a-f]{6}$/i.test(r.color_hex||''))CF.color=r.color_hex.toLowerCase();
    const t={};p.tallas.forEach(x=>t[x]=CF.tallas[x]||0);CF.tallas=t;
    if(Array.isArray(r.estampados)){CF.layers=CF.layers.filter(l=>l.kind==='img');r.estampados.slice(0,4).forEach(es=>{
      CF.layers.push({id:LID++,kind:'text',text:String(es.texto||'LOGO').slice(0,24).toUpperCase(),font:'Archivo',tcolor:CF.color>'#888888'?'#1b1b1d':'#ffffff',
        zona:ZONAS[es.zona]?es.zona:'frente',tec:TECS.includes(es.tecnica)?es.tecnica:'DTF',ancho:Math.max(5,Math.min(34,Math.round(+es.ancho_cm||20))),dy:es.zona==='pecho'?4:8,dx:0})})}
    const pr=cfPrecio();
    CF.ia=`<div class="gate" style="border-style:solid"><b>Propuesta de la IA:</b> ${esc(p.n)} en ${esc(mp(CF.mat).n)}, color ${esc(r.color_nombre||colorName(CF.color))}. Precio estimado: <b>S/ ${pr.u.toFixed(2)} por prenda</b>.<br>${esc(r.comentario||'')}<br><span class="muted">Si subes tu logo como imagen, reemplaza el texto “LOGO”. Puedes ajustar todo antes de enviar.</span></div>`;
    render()}
  catch(e){btn.disabled=false;const m={no_api:'El análisis con IA no está disponible aquí. Arma el modelo a mano o pide ayuda a tu asesora.',not_granted:'No se dio permiso para usar la IA.',rate_limited:'Hay muchas consultas ahora. Inténtalo en un momento.',image_rejected:'No se pudo usar esa foto. Prueba con una JPG o PNG más liviana.',invalid_json:'La IA no devolvió una propuesta clara. Inténtalo de nuevo.',refused:'La IA no pudo analizar esa foto. Prueba con otra.'}[e&&e.code]||'No se pudo analizar la foto. Inténtalo de nuevo.';
    out.innerHTML=`<span style="color:var(--bad)">${m}</span>`}}

/* ---------- Solo gerencia: precios, parámetros y usuarios ---------- */
const numIn=(id,v,step)=>`<input type="number" id="${id}" value="${v}" step="${step||1}" min="0" style="width:96px">`;
V.config=()=>{const c=D.cfg;
  return`<div class="gate">Solo gerencia ve y edita esta sección. Los cambios se aplican de inmediato a cotizaciones nuevas; los pedidos ya registrados mantienen su precio.</div>
  <form id="fCfg" style="display:flex;flex-direction:column;gap:16px">
  <div class="card"><h2>Precio base por modelo (S/ por prenda)</h2><table><tbody>${Object.entries(PROD).map(([k,p])=>`<tr><td><label for="cb_${k}">${p.n}</label></td><td>${numIn('cb_'+k,c.base[k],0.5)}</td></tr>`).join('')}</tbody></table></div>
  <div class="grid">
  <div class="card"><h2>Recargo por material (S/)</h2><table><tbody>${Object.keys(c.matp).map(k=>`<tr><td><label for="cm_${k}">${mp(k).n}</label></td><td><input type="number" id="cm_${k}" value="${c.matp[k]}" step="0.5" style="width:96px"></td></tr>`).join('')}</tbody></table></div>
  <div class="card"><h2>Precio de personalización (S/)</h2><table><tbody>${Object.keys(c.persp).map((k,i)=>`<tr><td><label for="cp_${i}">${k}</label></td><td>${numIn('cp_'+i,c.persp[k],0.5)}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="card"><h2>Reglas comerciales y de costos</h2><div class="form">
   <label for="cRate">Mano de obra (S/ por minuto)${numIn('cRate',c.rate,0.01)}</label>
   <label for="cMerma">Mermas (%)${numIn('cMerma',c.merma,0.5)}</label>
   <label for="cMin">Pedido mínimo (unidades)${numIn('cMin',c.minPedido)}</label>
   <label for="cDtoMin">Descuento desde (unidades)${numIn('cDtoMin',c.dtoMin)}</label>
   <label for="cDtoPct">Descuento por volumen (%)${numIn('cDtoPct',c.dtoPct,0.5)}</label>
   <label for="cAprob">Compras de MP que requieren aprobación desde (S/)${numIn('cAprob',c.aprobCompra,50)}</label></div></div>
  <div class="card"><h2>Costos y parámetros de insumos</h2><div class="tw"><table><thead><tr><th>Insumo</th><th>Costo (S/)</th><th>Consumo diario</th><th>Días de entrega</th><th>Stock de seguridad</th><th>Proveedor</th></tr></thead><tbody>
   ${D.mp.map(m=>`<tr><td>${m.n}</td><td>${numIn('mc_'+m.id,m.costo,0.01)}</td><td>${numIn('mo_'+m.id,m.cons)}</td><td>${numIn('ml_'+m.id,m.lead)}</td><td>${numIn('ms_'+m.id,m.seg)}</td><td><input id="mpv_${m.id}" value="${m.prov}" style="width:130px"></td></tr>`).join('')}</tbody></table></div></div>
  <div class="row"><button class="pri" type="submit">Guardar cambios</button></div></form>`};
V.usuarios=()=>`<div class="gate">Cada trabajador y cada cliente entra con su propio usuario. El rol define qué secciones ve. Producción, almacén y ventas no ven precios, márgenes ni esta configuración; los clientes solo ven sus propios pedidos.</div>
  <div class="card"><h2>Qué ve cada rol</h2><div class="tw"><table><thead><tr><th>Sección</th>${Object.keys(ACCESS).map(r=>`<th>${ROLN[r]}</th>`).join('')}</tr></thead><tbody>
  ${VIEWS.map(([k,n])=>`<tr><td>${n}</td>${Object.keys(ACCESS).map(r=>`<td>${ACCESS[r].includes(k)?'<span class="pill ok">Sí</span>':'<span class="muted">—</span>'}</td>`).join('')}</tr>`).join('')}
  <tr><td>Montos de dinero</td>${Object.keys(ACCESS).map(r=>`<td>${VEDINERO(r)?'<span class="pill ok">Sí</span>':'<span class="muted">—</span>'}</td>`).join('')}</tr></tbody></table></div></div>
  <div class="card"><h2>Usuarios</h2><div class="tw"><table><thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Estado</th><th></th></tr></thead><tbody>
  ${D.users.map(x=>`<tr><td>${x.n}${x.cli&&x.cli!==x.n?`<br><span class="muted" style="font-size:12px">${x.cli}</span>`:''}</td><td class="num">${x.u}</td><td>${ROLN[x.rol]}</td><td>${x.activo?'<span class="pill ok">Activo</span>':'<span class="pill bad">Bloqueado</span>'}</td>
  <td>${x.u!==user.u?`<button class="sm" data-act="usrToggle" data-u="${x.u}">${x.activo?'Bloquear':'Activar'}</button>`:'<span class="muted">Tu usuario</span>'}</td></tr>`).join('')}</tbody></table></div></div>
  <div class="card"><h2>Crear usuario</h2><form id="fUsr" class="form">
   <label for="uN">Nombre<input id="uN" required placeholder="Rosa Mendoza"></label>
   <label for="uU">Usuario<input id="uU" required placeholder="rosa.produccion" pattern="[a-z0-9._]+" title="Minúsculas, números, punto o guion bajo"></label>
   <label for="uR">Rol<select id="uR">${Object.keys(ACCESS).map(r=>`<option value="${r}">${ROLN[r]}</option>`).join('')}</select></label>
   <label for="uC">Institución (solo clientes)<input id="uC" placeholder="Colegio Los Álamos"></label>
   <label for="uP">Clave inicial<input id="uP" type="password" required minlength="6" autocomplete="new-password"></label>
   <label style="justify-content:flex-end"><button class="pri" type="submit">Crear usuario</button></label></form></div>`;

function who(){document.getElementById('who').innerHTML=`<span style="text-align:right"><b style="color:var(--ink)">${user.n}</b><br>${ROLN[role]}</span><button class="sm" data-act="logout">Cerrar sesión</button>`}
function render(){if(!user)return;if(!ACCESS[role].includes(view))view=ACCESS[role][0];side();who();
  document.getElementById('ttl').textContent=VIEWS.find(v=>v[0]===view)[1];document.getElementById('view').innerHTML=V[view]();if(view==='cliente')init3D()}
function login(x){user=x;role=x.rol;view=ACCESS[role][0];sel=null;CF.cli=x.cli||'';
  try{sessionStorage.setItem('dycflow-user',x.u)}catch(e){}
  document.getElementById('login').hidden=true;document.getElementById('appMain').hidden=false;render()}
function logout(){user=null;role=null;try{sessionStorage.removeItem('dycflow-user')}catch(e){}
  document.getElementById('appMain').hidden=true;document.getElementById('login').hidden=false;document.getElementById('lPin').value=''}
document.getElementById('demoUsers').innerHTML=D.users.filter(x=>x.activo).map(x=>`<button type="button" class="sm" data-demo="${x.u}" style="text-align:left">${ROLN[x.rol]} · ${x.n}</button>`).join('');
document.getElementById('demoUsers').addEventListener('click',e=>{const b=e.target.closest('[data-demo]');if(!b)return;const x=D.users.find(y=>y.u===b.dataset.demo);
  document.getElementById('lUser').value=x.u;document.getElementById('lPin').value=x.pin});
document.getElementById('fLogin').addEventListener('submit',e=>{e.preventDefault();e.stopPropagation();
  const u=document.getElementById('lUser').value.trim().toLowerCase(),p=document.getElementById('lPin').value,x=D.users.find(y=>y.u===u),er=document.getElementById('lErr');
  if(!x||x.pin!==p){er.textContent='Usuario o clave incorrectos. Revisa e inténtalo de nuevo.';er.hidden=false;return}
  if(!x.activo){er.textContent='Tu usuario está bloqueado. Pide a gerencia que lo active.';er.hidden=false;return}
  er.hidden=true;login(x)});
document.getElementById('lPin').addEventListener('input',()=>document.getElementById('lErr').hidden=true);

/* ---------- Acciones ---------- */
const can=(...r)=>r.includes(role)||role==='gerencia';
document.addEventListener('click',e=>{
  if(!user)return;
  const g=e.target.closest('[data-go]');if(g){if(!ACCESS[role].includes(g.dataset.go)){toast('Tu usuario no tiene acceso a esa sección.');return}view=g.dataset.go;render();window.scrollTo(0,0);return}
  const lo=e.target.closest('[data-act="logout"]');if(lo){logout();return}
  const ut=e.target.closest('[data-act="usrToggle"]');if(ut){if(role!=='gerencia')return;const x=D.users.find(y=>y.u===ut.dataset.u);x.activo=!x.activo;log(`${x.activo?'Activó':'Bloqueó'} al usuario ${x.u}`);save();render();return}
  const s=e.target.closest('[data-sel]');if(s){sel=+s.dataset.sel;render();return}
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,id=+b.dataset.id,o=D.orders.find(x=>x.id===id);
  if(a==='confirm'){
    if(o.est!=='VB aprobado'){toast('No puedes confirmar todavía: producción aún no da el visto bueno.');return}
    if(!can('ventas')){toast('Solo ventas confirma pedidos al cliente.');return}
    need(o).forEach(x=>x.m.stock=r1(x.m.stock-x.q));o.est='Confirmado';log(`Confirmó el pedido #${o.id} al cliente. Se descontaron insumos del almacén.`);toast('Pedido confirmado. Insumos descontados del almacén.')}
  if(a==='vb'){if(!can('produccion')){toast('Solo producción da el visto bueno.');return}
    const sh=short(o);sh.forEach(x=>{const r=newReq(x.m.id,x.falta+x.m.seg,'Pedido #'+o.id);log(`Generó pedido de MP #${r.id}: ${r.cant} ${x.m.u} de ${x.m.n}`)});
    o.vb={by:'Producción',nota:document.getElementById('vbNota').value||(sh.length?'Viable con compra de MP':'Entrega viable'),fecha:addD(0)};o.est='VB aprobado';
    log(`Dio visto bueno al pedido #${o.id}`);toast(sh.length?`Visto bueno dado. Se crearon ${sh.length} pedido(s) de MP.`:'Visto bueno dado. Ventas ya puede confirmar.')}
  if(a==='obs'){if(!can('produccion')){toast('Solo producción puede observar.');return}
    o.vb={by:'Producción',nota:document.getElementById('vbNota').value||'Revisar datos del pedido',fecha:addD(0)};o.est='Observado';log(`Observó el pedido #${o.id}`);toast('Pedido devuelto a ventas.')}
  if(a==='reenviar'){o.est='Pendiente VB';log(`Reenvió el pedido #${o.id} a producción`);toast('Reenviado a producción.')}
  if(a==='avanzar'){const nx=ETAPAS[ETAPAS.indexOf(o.est)+1];o.est=nx;log(`Pedido #${o.id} pasó a ${nx}`);toast(`Pedido #${o.id}: ${nx}`)}
  if(a==='req'){const m=mp(b.dataset.mp);const r=newReq(m.id,PR(m)*2-m.stock-incoming(m.id),'Punto de reorden');log(`Generó pedido de MP #${r.id}: ${r.cant} ${m.u} de ${m.n}`);toast(r.est==='Solicitado'?`Pedido de MP #${r.id} enviado a gerencia para aprobación.`:`Pedido de MP #${r.id} aprobado automáticamente (monto bajo). Almacén ya puede enviarlo.`)}
  if(a==='rq'){const r=D.req.find(x=>x.id===id),to=b.dataset.to;r.est=to;if(to==='Recibido'){const m=mp(r.mp);m.stock=r1(m.stock+r.cant)}log(`Pedido de MP #${r.id}: ${to}`);toast(`Pedido de MP #${r.id}: ${to}`)}
  if(a==='up'||a==='down'){if(role!=='gerencia'){toast('Solo gerencia puede mover la cola. Pide una urgencia.');return}
    const cur=[...document.querySelectorAll('[data-act="up"]')].map(x=>+x.dataset.id);const i=cur.indexOf(id),j=a==='up'?i-1:i+1;if(j<0||j>=cur.length)return;[cur[i],cur[j]]=[cur[j],cur[i]];D.order=cur;log(`Movió el pedido #${id} en la cola`)}
  if(a==='urg'){o.urg='solicitada';log(`Solicitó urgencia para #${o.id}`);toast('Urgencia enviada a gerencia.')}
  if(a==='urgok'){o.urg='aprobada';log(`Aprobó urgencia #${o.id}. Lote activo congelado y registrado.`);toast('Urgencia aprobada. Lote activo congelado.')}
  if(a==='cmb'){const c=D.cambios.find(x=>x.id===id);c.paso++;log(`Cambio de ${c.cli} pasó al paso ${c.paso}`)}
  if(a==='cfEnviar'){const n=cfTotal();if(role==='cliente')CF.cli=user.cli;
    if(!CF.cli.trim()){toast('Escribe el nombre de la institución o empresa.');document.getElementById('cCli').focus();return}
    if(n<D.cfg.minPedido){toast(`El pedido mínimo es de ${D.cfg.minPedido} unidades. Completa las cantidades en la guía de tallas.`);return}
    const p=PROD[CF.model],o={id:D.seq++,cli:CF.cli.trim(),marca:PROD[CF.model].marca||(CF.model==='casaca'?'Corpotex':'Unicrack'),p:CF.model,mat:CF.mat,color:colorName(CF.color),tallas:{...CF.tallas},cant:n,fecha:addD(21),precio:Math.round(cfPrecio().u*100)/100,pers:(mangaEfectiva()!=='sin'?'Manga '+mangaEfectiva()+'. ':'')+(CF.layers.length?'':'Sin estampado')+CF.layers.map(l=>`${l.tec} ${ZONAS[l.zona].n.toLowerCase()} ${fmtDesc(l)} (${l.kind==='img'?l.name:'“'+l.text+'”'})`).join(' + '),dis:'Aprobado',est:'Pendiente VB',taller:0,urg:'',vb:null};
    D.orders.push(o);sel=o.id;log(`El cliente ${o.cli} armó el pedido #${o.id} (${n} × ${p.n}, ${mp(o.mat).n}) desde la vista 3D. Espera visto bueno de producción.`);
    save();toast(`Pedido #${o.id} enviado. Tu asesora te confirmará la fecha.`);view='portal';render();window.scrollTo(0,0);return}
  if(a==='mock'){o.dis='Aprobado';log(`Cliente aprobó el mockup del pedido #${o.id}`);toast('Mockup aprobado.')}
  save();render()});
document.addEventListener('submit',e=>{e.preventDefault();if(!user)return;
  if(e.target.id==='fCfg'){if(role!=='gerencia'){toast('Solo gerencia puede editar precios.');return}const v=id=>+document.getElementById(id).value,c=D.cfg;
    Object.keys(c.base).forEach(k=>c.base[k]=v('cb_'+k));Object.keys(c.matp).forEach(k=>c.matp[k]=v('cm_'+k));Object.keys(c.persp).forEach((k,i)=>c.persp[k]=v('cp_'+i));
    c.rate=v('cRate');c.merma=v('cMerma');c.minPedido=v('cMin');c.dtoMin=v('cDtoMin');c.dtoPct=v('cDtoPct');c.aprobCompra=v('cAprob');
    D.mp.forEach(m=>{m.costo=v('mc_'+m.id);m.cons=v('mo_'+m.id);m.lead=v('ml_'+m.id);m.seg=v('ms_'+m.id);m.prov=document.getElementById('mpv_'+m.id).value});
    applyCfg();log('Actualizó precios y parámetros');toast('Precios y parámetros guardados.')}
  if(e.target.id==='fUsr'){if(role!=='gerencia')return;const g=id=>document.getElementById(id).value.trim(),u=g('uU').toLowerCase();
    if(D.users.some(x=>x.u===u)){toast('Ese usuario ya existe. Elige otro.');return}
    if(g('uR')==='cliente'&&!g('uC')){toast('Indica la institución del cliente.');return}
    D.users.push({u,n:g('uN'),rol:g('uR'),cli:g('uR')==='cliente'?g('uC'):undefined,pin:document.getElementById('uP').value,activo:true});log(`Creó el usuario ${u} (${ROLN[g('uR')]})`);toast('Usuario creado.')}
  if(e.target.id==='fNew'){const v=k=>document.getElementById(k).value;
    const o={id:D.seq++,cli:v('nCli'),marca:v('nMarca'),p:v('nP'),cant:+v('nCant'),fecha:v('nFecha'),precio:role==='gerencia'?+v('nPrecio'):PROD[v('nP')].base+(PERSP[v('nPers')]||0),pers:v('nPers'),dis:v('nPers')==='Ninguna'?'Aprobado':'Pendiente',est:'Pendiente VB',taller:0,urg:'',vb:null};
    D.orders.push(o);sel=o.id;log(`Registró el pedido #${o.id} (${o.cli}). Espera visto bueno de producción.`);toast('Pedido enviado a producción para visto bueno.')}
  if(e.target.id==='fReq'){const m=mp(document.getElementById('rMp').value);const r=newReq(m.id,+document.getElementById('rCant').value,document.getElementById('rOri').value||'Reposición');log(`Solicitó compra #${r.id}: ${r.cant} ${m.u} de ${m.n}`);toast(r.est==='Solicitado'?`Pedido de MP #${r.id} enviado a gerencia.`:`Pedido de MP #${r.id} aprobado automáticamente (monto bajo).`)}
  save();render()});
document.addEventListener('change',e=>{
  if(e.target.id==='pSel'){sel=+e.target.value;render()}});
try{const su=sessionStorage.getItem('dycflow-user'),x=su&&D.users.find(y=>y.u===su&&y.activo);if(x)login(x)}catch(e){}
