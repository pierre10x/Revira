/* ReVira — idiomas: português (padrão), inglês e espanhol.
   Como funciona:
   - No HTML, data-i18n="chave" troca o texto do elemento; data-i18n-html="chave" troca o HTML interno
     (só para textos fixos deste arquivo, com links); data-i18n-attr="atributo:chave;outro:chave" troca atributos.
   - O texto em português que está escrito no próprio HTML é guardado automaticamente como o original:
     para mudar um texto em português, edite o HTML. Os textos usados pelo JavaScript (mensagens de erro, etc.)
     têm o português definido aqui em "pt".
   - Para traduzir uma chave nova, acrescente-a em "en" e "es". Sem tradução, o site mostra o português.
   - A escolha fica salva no navegador. Na primeira visita usa o idioma do navegador (pt, en ou es; outros caem em pt).
   Carregado no <head>, logo depois de theme.js. */
(function () {
  'use strict';
  var KEY = 'revira:lang';
  var LANGS = ['pt', 'en', 'es'];
  var LOCALES = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' };
  var FULL = { pt: 'Português', en: 'English', es: 'Español' };

  var D = {
    /* ---------- Português: só as chaves usadas pelo JavaScript (o resto vem do HTML) ---------- */
    pt: {
      'lang.label': 'Idioma',
      'cat.buraco': 'Buraco na via',
      'cat.lixo': 'Lixo acumulado',
      'cat.bueiro': 'Bueiro entupido ou aberto',
      'cat.luz': 'Iluminação pública',
      'cat.outro': 'Outro problema',
      'dept.buraco': 'Secretaria de Obras',
      'dept.lixo': 'Limpeza Urbana e Coleta',
      'dept.bueiro': 'Drenagem e Saneamento',
      'dept.luz': 'Serviços Urbanos',
      'dept.outro': 'Ouvidoria da prefeitura',
      'status.recebida': 'Recebida',
      'status.em_andamento': 'Em andamento',
      'status.resolvida': 'Resolvida',
      'note.registered': 'Ocorrência registrada.',
      'note.updated': 'Status atualizado no painel.',
      'note.default': 'Atualização de status',
      'loc.none': 'Localização não informada',
      'loc.outside': 'Esse ponto fica fora do Brasil. Escolha um local dentro do país.',
      'loc.marked': 'Ponto marcado no mapa',
      'loc.adjusted': 'Ponto ajustado no mapa',
      'loc.gps': 'Localização via GPS',
      'loc.getting': 'Obtendo localização...',
      'loc.nogeo': 'Seu navegador não permite localização.',
      'loc.fail': 'Não foi possível obter. Marque no mapa ou informe o endereço acima.',
      'map.nolib': 'O mapa não pôde ser carregado (arquivo vendor/leaflet ausente ou bloqueado).',
      'map.tiles': 'Não foi possível carregar as imagens do mapa (sem internet ou bloqueio de rede).',
      'map.file': ' Você abriu o arquivo direto da pasta (file://): use o Live Server do VS Code ou rode "python -m http.server" na pasta do site e abra http://localhost.',
      'map.fallback': ' Você ainda pode informar o endereço no campo acima ou usar o botão de localização.',
      'err.rate_limit': 'Muitos envios em pouco tempo a partir desta conexão. Aguarde um pouco e tente novamente.',
      'err.outside_country': 'O ponto marcado fica fora do Brasil.',
      'err.invalid_state': 'Escolha um estado (UF) válido.',
      'err.city_required': 'Informe a cidade.',
      'err.city_too_long': 'O nome da cidade passou de 80 caracteres.',
      'err.invalid_location': 'A localização informada é inválida. Limpe o ponto e marque novamente.',
      'err.location_required': 'Informe o endereço ou marque o local no mapa.',
      'err.details_required': 'Descreva o problema ou envie uma foto.',
      'err.invalid_category': 'Escolha o tipo de problema.',
      'err.description_too_long': 'A descrição passou de 1000 caracteres.',
      'err.address_too_long': 'O endereço passou de 300 caracteres.',
      'err.invalid_photo': 'Não foi possível usar essa foto. Tente outra imagem.',
      'err.spam_detected': 'Não foi possível enviar.',
      'err.captcha_failed': 'Confirme a verificação "Não sou um robô" e tente de novo.',
      'err.generic': 'Não foi possível enviar. Verifique sua conexão e tente novamente.',
      'form.cfg': 'Configure a URL e a chave pública do Supabase no arquivo js/config.js antes de enviar.',
      'form.photo.type': 'A foto deve ser JPEG, PNG ou WebP e ter até 25 MB.',
      'form.sending': 'Enviando...',
      'ok.before': 'Ocorrência enviada com sucesso! Seu protocolo é ',
      'ok.after': '. Guarde esse código para acompanhar o atendimento.',
      'ok.photo': ' A foto não pôde ser enviada, mas sua ocorrência foi registrada.',
      'ok.link': 'Acompanhar agora →',
      'trk.checking': 'Consultando...',
      'trk.cfg': 'Configure o Supabase no arquivo js/config.js.',
      'trk.notfound': 'Protocolo não encontrado. Confira o código e tente novamente.',
      'trk.error': 'Erro ao consultar. Verifique se o script SQL foi executado no Supabase.',
      'trk.history': 'Histórico',
      'trk.registered': 'Registrada em'
    },

    /* ---------- English ---------- */
    en: {
      'lang.label': 'Language',
      'brand.tag': "TAKING CARE OF THE CITY IS EVERYONE'S JOB",
      'nav.menu': 'Open menu',
      'nav.home': 'Home',
      'nav.how': 'How it works',
      'nav.report': 'Report a problem',
      'nav.track': 'Track a report',
      'nav.admin': 'Admin panel ↗',
      'footer.initiative': 'A citizen participation initiative.',
      'footer.privacy': 'Privacy Policy (LGPD)',
      'btn.consult': 'Check report →',
      'legal.note': 'The privacy policy is available in Portuguese only, which is the version that applies under Brazilian law (LGPD).',

      'ap.btn': 'Appearance',
      'ap.eyebrow': 'CUSTOMIZE',
      'ap.title': 'Site appearance',
      'ap.close': 'Close',
      'ap.theme': 'Theme',
      'ap.light': 'Light',
      'ap.dark': 'Dark',
      'ap.auto': 'Automatic',
      'ap.accent': 'Accent color',
      'ap.c.verde': 'Green',
      'ap.c.azul': 'Blue',
      'ap.c.roxo': 'Purple',
      'ap.c.laranja': 'Orange',
      'ap.c.vinho': 'Burgundy',
      'ap.size': 'Text size',
      'ap.small': 'Smaller',
      'ap.std': 'Default',
      'ap.large': 'Larger',
      'ap.motion': 'Reduce motion',
      'ap.motion.help': 'Turns off the spinning radar and transitions.',
      'ap.reset': 'Restore defaults',

      'title.index': 'ReVira | Your city in good hands',
      'desc.index': 'Report urban problems and follow the fixes in your city.',
      'hero.eyebrow': 'TAKE PART IN THE CHANGE',
      'hero.h1': "A better city<br>starts with <em>you.</em>",
      'hero.p': 'Found a pothole, piled-up garbage or a street lighting problem? Report it here. Your help lets the city hall identify priorities and take care of public spaces.',
      'hero.cta': 'Report a problem',
      'hero.track': 'Track a report',
      'hero.note': 'Your participation makes a difference.',
      'art.title': 'URBAN RADAR',
      'art.live': 'ACTIVE',
      'art.b1': 'CITIZENSHIP',
      'art.b2': 'CARE',
      'art.b3': 'CHANGE',
      'art.tag': 'Every report matters',
      'strip.1': 'Spot the problem',
      'strip.2': 'Send your report',
      'strip.3': 'Follow the solution',
      'how.eyebrow': 'SIMPLE AND TRANSPARENT',
      'how.h2': 'How can we <em>improve</em> together?',
      'how.p': 'In a few steps, your observation reaches the system and can be followed with the protocol number.',
      'how.s1.h': 'Locate',
      'how.s1.p': 'Enter the address or allow location access to show where the problem is.',
      'how.s2.h': 'Report',
      'how.s2.p': 'Choose a category, describe the situation and, if possible, attach a photo.',
      'how.s3.h': 'Follow',
      'how.s3.p': 'Get a protocol number and check the progress of your report whenever you want.',
      'rep.eyebrow': 'YOUR VOICE ON THE MAP',
      'rep.h2': 'Saw something<br>that needs <em>attention?</em>',
      'rep.p': 'Fill in the form next to this text. The more details you give, the easier it is to identify the problem.',
      'rep.tip.h': 'Important tip',
      'rep.tip.p': 'A photo and an approximate location help the team understand what happened.',
      'rep.privacy': "▣ Your data is used only to handle and follow up on the report. <a class='inline-link' href='privacidade.html'>Privacy Policy (LGPD)</a>.",
      'form.eyebrow': 'NEW REPORT',
      'form.h3': 'Report a problem',
      'form.required': '* Required fields',
      'form.category.label': 'Type of problem *',
      'form.category.ph': 'Select a category',
      'form.state.label': 'State (UF) *',
      'form.city.label': 'City *',
      'form.city.ph': 'E.g.: Campos Belos',
      'form.address.label': 'Address or landmark *',
      'form.address.ph': 'E.g.: Flowers Street, near the square',
      'form.loc.btn': '◎ Use my location',
      'loc.clear': 'Clear point',
      'form.map.aria': 'Map to pick the location of the problem',
      'form.map.help': 'Click the map or drag the marker to point out the exact spot (optional).',
      'form.desc.label': 'Describe the problem *',
      'form.desc.ph': 'Tell us what happened and add details that may help...',
      'form.photo.label': 'Photo (optional)',
      'form.photo.help': 'JPEG, PNG or WebP. The photo is resized automatically and its hidden data (such as the device location) is removed before sending.',
      'form.confirm': "I confirm the information provided is true and authorize its use to handle this report, according to the <a class='inline-link' href='privacidade.html' target='_blank' rel='noopener'>Privacy Policy (LGPD)</a>.",
      'form.submit': 'Submit report',
      'ban.eyebrow': 'TRANSPARENCY AT EVERY STEP',
      'ban.h2': 'Already reported? See what is happening.',
      'ban.p': 'Check the progress using the protocol number you received when you sent your report.',

      'title.track': 'Track a report | ReVira',
      'trk.eyebrow': 'TRACKING',
      'trk.h1': 'Where is my request?',
      'trk.p': 'Enter the protocol number you received to check the status and history of the report.',
      'trk.label': 'Protocol number',
      'trk.ph': 'E.g.: RV-20261115-A1B2',

      'cat.buraco': 'Pothole',
      'cat.lixo': 'Piled-up garbage',
      'cat.bueiro': 'Clogged or open storm drain',
      'cat.luz': 'Street lighting',
      'cat.outro': 'Other problem',
      'dept.buraco': 'Public Works Department',
      'dept.lixo': 'Urban Cleaning and Waste Collection',
      'dept.bueiro': 'Drainage and Sanitation',
      'dept.luz': 'Urban Services',
      'dept.outro': 'City Hall Ombudsman',
      'status.recebida': 'Received',
      'status.em_andamento': 'In progress',
      'status.resolvida': 'Resolved',
      'note.registered': 'Report registered.',
      'note.updated': 'Status updated by the team.',
      'note.default': 'Status update',
      'loc.none': 'Location not provided',
      'loc.outside': 'This point is outside Brazil. Choose a location inside the country.',
      'loc.marked': 'Point marked on the map',
      'loc.adjusted': 'Point adjusted on the map',
      'loc.gps': 'Location via GPS',
      'loc.getting': 'Getting your location...',
      'loc.nogeo': 'Your browser does not support location.',
      'loc.fail': 'Could not get it. Mark the spot on the map or enter the address above.',
      'map.nolib': 'The map could not be loaded (vendor/leaflet file missing or blocked).',
      'map.tiles': 'The map images could not be loaded (no internet or network block).',
      'map.file': ' You opened the file straight from the folder (file://): use the VS Code Live Server or run "python -m http.server" in the site folder and open http://localhost.',
      'map.fallback': ' You can still enter the address in the field above or use the location button.',
      'err.rate_limit': 'Too many submissions in a short time from this connection. Please wait a moment and try again.',
      'err.outside_country': 'The marked point is outside Brazil.',
      'err.invalid_state': 'Choose a valid state (UF).',
      'err.city_required': 'Enter the city.',
      'err.city_too_long': 'The city name is longer than 80 characters.',
      'err.invalid_location': 'The location is invalid. Clear the point and mark it again.',
      'err.location_required': 'Enter the address or mark the spot on the map.',
      'err.details_required': 'Describe the problem or attach a photo.',
      'err.invalid_category': 'Choose the type of problem.',
      'err.description_too_long': 'The description is longer than 1000 characters.',
      'err.address_too_long': 'The address is longer than 300 characters.',
      'err.invalid_photo': 'This photo could not be used. Try another image.',
      'err.spam_detected': 'Could not send.',
      'err.captcha_failed': 'Complete the "I am not a robot" check and try again.',
      'err.generic': 'Could not send. Check your connection and try again.',
      'form.cfg': 'Set the Supabase URL and public key in js/config.js before sending.',
      'form.photo.type': 'The photo must be JPEG, PNG or WebP, up to 25 MB.',
      'form.sending': 'Sending...',
      'ok.before': 'Report sent successfully! Your protocol number is ',
      'ok.after': '. Keep this code to follow the progress of your report.',
      'ok.photo': ' The photo could not be uploaded, but your report was registered.',
      'ok.link': 'Track it now →',
      'trk.checking': 'Checking...',
      'trk.cfg': 'Set up Supabase in js/config.js.',
      'trk.notfound': 'Protocol not found. Check the code and try again.',
      'trk.error': 'Error while checking. Make sure the SQL script was run in Supabase.',
      'trk.history': 'History',
      'trk.registered': 'Registered on'
    },

    /* ---------- Español ---------- */
    es: {
      'lang.label': 'Idioma',
      'brand.tag': 'CUIDAR LA CIUDAD ES TAREA DE TODOS',
      'nav.menu': 'Abrir menú',
      'nav.home': 'Inicio',
      'nav.how': 'Cómo funciona',
      'nav.report': 'Reportar un problema',
      'nav.track': 'Consultar un reporte',
      'nav.admin': 'Panel administrativo ↗',
      'footer.initiative': 'Una iniciativa de participación ciudadana.',
      'footer.privacy': 'Política de Privacidad (LGPD)',
      'btn.consult': 'Consultar protocolo →',
      'legal.note': 'La política de privacidad solo está disponible en portugués, que es la versión válida según la ley brasileña (LGPD).',

      'ap.btn': 'Apariencia',
      'ap.eyebrow': 'PERSONALIZAR',
      'ap.title': 'Apariencia del sitio',
      'ap.close': 'Cerrar',
      'ap.theme': 'Tema',
      'ap.light': 'Claro',
      'ap.dark': 'Oscuro',
      'ap.auto': 'Automático',
      'ap.accent': 'Color de acento',
      'ap.c.verde': 'Verde',
      'ap.c.azul': 'Azul',
      'ap.c.roxo': 'Morado',
      'ap.c.laranja': 'Naranja',
      'ap.c.vinho': 'Burdeos',
      'ap.size': 'Tamaño del texto',
      'ap.small': 'Menor',
      'ap.std': 'Estándar',
      'ap.large': 'Mayor',
      'ap.motion': 'Reducir animaciones',
      'ap.motion.help': 'Desactiva el radar giratorio y las transiciones.',
      'ap.reset': 'Restablecer valores',

      'title.index': 'ReVira | Tu ciudad en buenas manos',
      'desc.index': 'Reporta problemas urbanos y sigue las soluciones en tu ciudad.',
      'hero.eyebrow': 'PARTICIPA EN LA TRANSFORMACIÓN',
      'hero.h1': 'Una ciudad mejor<br>empieza <em>contigo.</em>',
      'hero.p': '¿Encontraste un bache, basura acumulada o un problema de alumbrado? Repórtalo aquí. Tu colaboración ayuda al ayuntamiento a identificar prioridades y a cuidar los espacios públicos.',
      'hero.cta': 'Reportar un problema',
      'hero.track': 'Consultar un reporte',
      'hero.note': 'Tu participación hace la diferencia.',
      'art.title': 'RADAR URBANO',
      'art.live': 'ACTIVO',
      'art.b1': 'CIUDADANÍA',
      'art.b2': 'CUIDADO',
      'art.b3': 'CAMBIO',
      'art.tag': 'Cada reporte importa',
      'strip.1': 'Identifica el problema',
      'strip.2': 'Envía tu reporte',
      'strip.3': 'Sigue la solución',
      'how.eyebrow': 'SIMPLE Y TRANSPARENTE',
      'how.h2': '¿Cómo podemos <em>mejorar</em> juntos?',
      'how.p': 'En pocos pasos, tu observación llega al sistema y puede seguirse con el número de protocolo.',
      'how.s1.h': 'Ubica',
      'how.s1.p': 'Indica la dirección o permite el uso de la ubicación para señalar dónde está el problema.',
      'how.s2.h': 'Reporta',
      'how.s2.p': 'Elige una categoría, describe la situación y, si puedes, envía una fotografía.',
      'how.s3.h': 'Sigue',
      'how.s3.p': 'Recibe un número de protocolo y consulta el avance de la atención cuando quieras.',
      'rep.eyebrow': 'TU VOZ EN EL MAPA',
      'rep.h2': '¿Viste algo que<br>necesita <em>atención?</em>',
      'rep.p': 'Completa el formulario de al lado. Cuantos más detalles des, mejor se podrá identificar el problema.',
      'rep.tip.h': 'Consejo importante',
      'rep.tip.p': 'Una foto y una ubicación aproximada ayudan al equipo a entender lo que pasó.',
      'rep.privacy': "▣ Tus datos se usan solo para tramitar y dar seguimiento al reporte. <a class='inline-link' href='privacidade.html'>Política de Privacidad (LGPD)</a>.",
      'form.eyebrow': 'NUEVO REPORTE',
      'form.h3': 'Reportar un problema',
      'form.required': '* Campos obligatorios',
      'form.category.label': 'Tipo de problema *',
      'form.category.ph': 'Selecciona una categoría',
      'form.state.label': 'Estado (UF) *',
      'form.city.label': 'Ciudad *',
      'form.city.ph': 'Ej.: Campos Belos',
      'form.address.label': 'Dirección o punto de referencia *',
      'form.address.ph': 'Ej.: Calle de las Flores, cerca de la plaza',
      'form.loc.btn': '◎ Usar mi ubicación',
      'loc.clear': 'Quitar punto',
      'form.map.aria': 'Mapa para elegir el lugar del problema',
      'form.map.help': 'Haz clic en el mapa o arrastra el marcador para señalar el lugar exacto (opcional).',
      'form.desc.label': 'Describe el problema *',
      'form.desc.ph': 'Cuéntanos qué pasó y añade detalles que puedan ayudar...',
      'form.photo.label': 'Fotografía (opcional)',
      'form.photo.help': 'JPEG, PNG o WebP. La foto se reduce automáticamente y se eliminan sus datos ocultos (como la ubicación del dispositivo) antes del envío.',
      'form.confirm': "Confirmo que la información proporcionada es verdadera y autorizo su uso para tramitar este reporte, conforme a la <a class='inline-link' href='privacidade.html' target='_blank' rel='noopener'>Política de Privacidad (LGPD)</a>.",
      'form.submit': 'Enviar reporte',
      'ban.eyebrow': 'TRANSPARENCIA EN CADA ETAPA',
      'ban.h2': '¿Ya reportaste? Mira qué está pasando.',
      'ban.p': 'Consulta el avance con el número de protocolo que recibiste al enviar tu reporte.',

      'title.track': 'Consultar un reporte | ReVira',
      'trk.eyebrow': 'SEGUIMIENTO',
      'trk.h1': '¿Cómo va mi solicitud?',
      'trk.p': 'Escribe el protocolo que recibiste para consultar la situación y el historial del reporte.',
      'trk.label': 'Número de protocolo',
      'trk.ph': 'Ej.: RV-20261115-A1B2',

      'cat.buraco': 'Bache en la vía',
      'cat.lixo': 'Basura acumulada',
      'cat.bueiro': 'Alcantarilla obstruida o abierta',
      'cat.luz': 'Alumbrado público',
      'cat.outro': 'Otro problema',
      'dept.buraco': 'Secretaría de Obras',
      'dept.lixo': 'Limpieza Urbana y Recolección',
      'dept.bueiro': 'Drenaje y Saneamiento',
      'dept.luz': 'Servicios Urbanos',
      'dept.outro': 'Defensoría del ayuntamiento',
      'status.recebida': 'Recibida',
      'status.em_andamento': 'En curso',
      'status.resolvida': 'Resuelta',
      'note.registered': 'Reporte registrado.',
      'note.updated': 'Estado actualizado por el equipo.',
      'note.default': 'Actualización de estado',
      'loc.none': 'Ubicación no indicada',
      'loc.outside': 'Ese punto queda fuera de Brasil. Elige un lugar dentro del país.',
      'loc.marked': 'Punto marcado en el mapa',
      'loc.adjusted': 'Punto ajustado en el mapa',
      'loc.gps': 'Ubicación por GPS',
      'loc.getting': 'Obteniendo ubicación...',
      'loc.nogeo': 'Tu navegador no permite la ubicación.',
      'loc.fail': 'No se pudo obtener. Marca el lugar en el mapa o escribe la dirección arriba.',
      'map.nolib': 'No se pudo cargar el mapa (archivo vendor/leaflet ausente o bloqueado).',
      'map.tiles': 'No se pudieron cargar las imágenes del mapa (sin internet o bloqueo de red).',
      'map.file': ' Abriste el archivo directamente desde la carpeta (file://): usa Live Server de VS Code o ejecuta "python -m http.server" en la carpeta del sitio y abre http://localhost.',
      'map.fallback': ' Aún puedes escribir la dirección en el campo de arriba o usar el botón de ubicación.',
      'err.rate_limit': 'Demasiados envíos en poco tiempo desde esta conexión. Espera un momento e inténtalo de nuevo.',
      'err.outside_country': 'El punto marcado queda fuera de Brasil.',
      'err.invalid_state': 'Elige un estado (UF) válido.',
      'err.city_required': 'Indica la ciudad.',
      'err.city_too_long': 'El nombre de la ciudad supera los 80 caracteres.',
      'err.invalid_location': 'La ubicación indicada no es válida. Quita el punto y márcalo de nuevo.',
      'err.location_required': 'Indica la dirección o marca el lugar en el mapa.',
      'err.details_required': 'Describe el problema o envía una foto.',
      'err.invalid_category': 'Elige el tipo de problema.',
      'err.description_too_long': 'La descripción supera los 1000 caracteres.',
      'err.address_too_long': 'La dirección supera los 300 caracteres.',
      'err.invalid_photo': 'No se pudo usar esa foto. Prueba con otra imagen.',
      'err.spam_detected': 'No se pudo enviar.',
      'err.captcha_failed': 'Confirma la verificación "No soy un robot" e inténtalo de nuevo.',
      'err.generic': 'No se pudo enviar. Revisa tu conexión e inténtalo de nuevo.',
      'form.cfg': 'Configura la URL y la clave pública de Supabase en js/config.js antes de enviar.',
      'form.photo.type': 'La foto debe ser JPEG, PNG o WebP y pesar hasta 25 MB.',
      'form.sending': 'Enviando...',
      'ok.before': '¡Reporte enviado con éxito! Tu protocolo es ',
      'ok.after': '. Guarda este código para seguir la atención.',
      'ok.photo': ' La foto no se pudo enviar, pero tu reporte quedó registrado.',
      'ok.link': 'Consultar ahora →',
      'trk.checking': 'Consultando...',
      'trk.cfg': 'Configura Supabase en js/config.js.',
      'trk.notfound': 'Protocolo no encontrado. Revisa el código e inténtalo de nuevo.',
      'trk.error': 'Error al consultar. Verifica que el script SQL se haya ejecutado en Supabase.',
      'trk.history': 'Historial',
      'trk.registered': 'Registrado el'
    }
  };

  function detect() {
    try {
      var saved = localStorage.getItem(KEY);
      if (LANGS.indexOf(saved) !== -1) return saved;
    } catch (e) { /* armazenamento bloqueado: segue sem salvar */ }
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'pt';
    var base = String(nav).slice(0, 2).toLowerCase();
    return LANGS.indexOf(base) !== -1 ? base : 'pt';
  }

  var lang = detect();

  function t(key, vars) {
    var s = D[lang] && D[lang][key] != null ? D[lang][key] : (D.pt[key] != null ? D.pt[key] : key);
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return s;
  }

  /* Guarda o texto original em português (vindo do HTML) na primeira vez que a chave aparece. */
  function remember(key, value) { if (D.pt[key] == null) D.pt[key] = value; }

  function apply() {
    var doc = document, root = doc.documentElement;
    root.lang = LOCALES[lang];

    doc.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      remember(k, el.textContent);
      el.textContent = t(k);
    });
    doc.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-html');
      remember(k, el.innerHTML);
      el.innerHTML = t(k);          // textos fixos deste arquivo (nunca dados de usuários)
    });
    doc.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var i = pair.indexOf(':');
        if (i < 1) return;
        var attr = pair.slice(0, i).trim(), k = pair.slice(i + 1).trim();
        remember(k, el.getAttribute(attr) || '');
        el.setAttribute(attr, t(k));
      });
    });
    doc.querySelectorAll('[data-not-pt]').forEach(function (el) { el.hidden = lang === 'pt'; });

    var tk = root.getAttribute('data-title-key');
    if (tk) { remember(tk, doc.title); doc.title = t(tk); }
    var dk = root.getAttribute('data-desc-key'), meta = doc.querySelector('meta[name=description]');
    if (dk && meta) { remember(dk, meta.getAttribute('content') || ''); meta.setAttribute('content', t(dk)); }

    var sel = doc.getElementById('langSelect');
    if (sel) { sel.value = lang; sel.setAttribute('aria-label', t('lang.label')); }
  }

  function setLang(next) {
    if (LANGS.indexOf(next) === -1 || next === lang) return;
    lang = next;
    try { localStorage.setItem(KEY, lang); } catch (e) { /* ignora */ }
    apply();
    document.dispatchEvent(new CustomEvent('revira:langchange', { detail: { lang: lang } }));
  }

  function build() {
    var bar = document.querySelector('.topbar');
    if (!bar) return;
    var wrap = bar.querySelector('.topbar-actions');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'topbar-actions';
      var toggle = document.getElementById('menuToggle');
      if (toggle) wrap.appendChild(toggle);
      bar.appendChild(wrap);
    }
    var sel = document.createElement('select');
    sel.id = 'langSelect';
    sel.className = 'lang-select';
    LANGS.forEach(function (l) {
      var o = document.createElement('option');
      o.value = l;
      o.textContent = l.toUpperCase();
      o.title = FULL[l];
      o.setAttribute('lang', LOCALES[l]);
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () { setLang(sel.value); });
    wrap.insertBefore(sel, wrap.firstChild);
  }

  window.reviraI18n = {
    t: t,
    setLang: setLang,
    lang: function () { return lang; },
    locale: function () { return LOCALES[lang]; }
  };

  function init() { build(); apply(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
