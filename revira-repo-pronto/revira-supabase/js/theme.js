/* ReVira — aparência: tema (claro/escuro/automático), cor de destaque, tamanho do texto e animações.
   Carregado no <head>, sem defer, para aplicar o tema antes da primeira pintura (sem "flash" branco). */
(function(){
  var KEY='revira:aparencia',DEF={tema:'auto',cor:'verde',tamanho:'m',movimento:'full'};
  var CORES={verde:'#123c32',azul:'#16365c',roxo:'#38235f',laranja:'#6b3410',vinho:'#5c1d34'};
  var root=document.documentElement,mq=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):null;
  var st=load();
  function load(){try{return Object.assign({},DEF,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){return Object.assign({},DEF);}}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(st));}catch(e){}}
  function resolved(){return st.tema==='auto'?(mq&&mq.matches?'dark':'light'):st.tema;}
  function apply(){
    var t=resolved();root.setAttribute('data-theme',t);root.setAttribute('data-accent',st.cor);
    if(st.tamanho==='m')root.removeAttribute('data-size');else root.setAttribute('data-size',st.tamanho);
    root.setAttribute('data-motion',st.movimento==='reduce'?'reduce':'full');
    var m=document.querySelector('meta[name=theme-color]');
    if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m);}
    m.content=t==='dark'?'#0d1411':(CORES[st.cor]||CORES.verde);
  }
  apply();
  if(mq){(mq.addEventListener?mq.addEventListener.bind(mq,'change'):mq.addListener.bind(mq))(function(){if(st.tema==='auto')apply();});}

  var ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/></svg>';
  function opt(group,v,label,extra,key){return '<button type="button" class="ap-opt" data-g="'+group+'" data-v="'+v+'" aria-pressed="false">'+(extra||'')+'<span data-i18n="'+key+'">'+label+'</span></button>';}
  function build(){
    var bar=document.querySelector('.topbar');if(!bar)return;
    var toggle=document.getElementById('menuToggle');
    var wrap=document.createElement('div');wrap.className='topbar-actions';
    var btn=document.createElement('button');btn.type='button';btn.className='aparencia-btn';btn.setAttribute('aria-haspopup','dialog');btn.setAttribute('aria-controls','apPanel');
    btn.innerHTML=ICON+'<span data-i18n="ap.btn">Aparência</span>';
    wrap.appendChild(btn);if(toggle)wrap.appendChild(toggle);bar.appendChild(wrap);

    var box=document.createElement('div');
    box.innerHTML=
    '<div class="ap-backdrop" data-close></div>'+
    '<aside class="ap-panel" id="apPanel" role="dialog" aria-modal="true" aria-labelledby="apTitle">'+
     '<div class="ap-head"><div><span class="eyebrow" data-i18n="ap.eyebrow">PERSONALIZAR</span><h2 id="apTitle" data-i18n="ap.title">Aparência do site</h2></div><button type="button" class="ap-close" data-close aria-label="Fechar" data-i18n-attr="aria-label:ap.close">✕</button></div>'+
     '<div class="ap-body">'+
      '<div class="ap-group"><h3 data-i18n="ap.theme">Tema</h3><div class="ap-seg">'+opt('tema','light','Claro','<span class="ap-prev l"></span>','ap.light')+opt('tema','dark','Escuro','<span class="ap-prev d"></span>','ap.dark')+opt('tema','auto','Automático','<span class="ap-prev a"></span>','ap.auto')+'</div></div>'+
      '<div class="ap-group"><h3 data-i18n="ap.accent">Cor de destaque</h3><div class="ap-swatches">'+['verde','azul','roxo','laranja','vinho'].map(function(c){return '<button type="button" class="ap-sw" data-g="cor" data-v="'+c+'" aria-pressed="false" aria-label="'+c.charAt(0).toUpperCase()+c.slice(1)+'" title="'+c.charAt(0).toUpperCase()+c.slice(1)+'" data-i18n-attr="aria-label:ap.c.'+c+';title:ap.c.'+c+'"></button>';}).join('')+'</div></div>'+
      '<div class="ap-group"><h3 data-i18n="ap.size">Tamanho do texto</h3><div class="ap-seg size">'+opt('tamanho','p','Menor','<span style="font-size:11px">A</span> ','ap.small')+opt('tamanho','m','Padrão','<span style="font-size:15px">A</span> ','ap.std')+opt('tamanho','g','Maior','<span style="font-size:19px">A</span> ','ap.large')+'</div></div>'+
      '<div class="ap-group"><div class="ap-switch"><div><span data-i18n="ap.motion">Reduzir animações</span><small data-i18n="ap.motion.help">Desliga o radar girando e as transições.</small></div><button type="button" class="ap-tg" role="switch" aria-checked="false" aria-label="Reduzir animações" data-i18n-attr="aria-label:ap.motion" data-mtg></button></div></div>'+
      '<button type="button" class="ap-reset" data-reset data-i18n="ap.reset">Restaurar padrão</button>'+
     '</div></aside>';
    while(box.firstChild)document.body.appendChild(box.firstChild);
    var panel=document.getElementById('apPanel'),back=document.querySelector('.ap-backdrop');

    function sync(){
      document.querySelectorAll('[data-g]').forEach(function(b){b.setAttribute('aria-pressed',String(st[b.dataset.g]===b.dataset.v));});
      var tg=panel.querySelector("[data-mtg]");tg.setAttribute('aria-checked',String(st.movimento==='reduce'));
    }
    function open(){root.classList.add('ap-open');panel.querySelector('.ap-close').focus();btn.setAttribute('aria-expanded','true');}
    function close(){root.classList.remove('ap-open');btn.setAttribute('aria-expanded','false');btn.focus();}
    btn.addEventListener('click',open);
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&root.classList.contains('ap-open'))close();});
    document.addEventListener('click',function(e){
      if(e.target.closest&&e.target.closest('[data-close]'))close();
      var b=e.target.closest&&e.target.closest('[data-g]');
      if(b&&panel.contains(b)){st[b.dataset.g]=b.dataset.v;save();apply();sync();}
      if(e.target.closest&&e.target.closest("[data-mtg]")){st.movimento=st.movimento==='reduce'?'full':'reduce';save();apply();sync();}
      if(e.target.closest&&e.target.closest('[data-reset]')){st=Object.assign({},DEF);save();apply();sync();}
    });
    sync();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build);else build();
})();
