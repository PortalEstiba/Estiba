// src/modules/oraculo.js
const Oraculo = {
  render(container) {
    container.innerHTML = `
      <div class="card">
        <h2>🔮 El Oráculo</h2>
        <p class="muted">Calculadora predictiva de jornadas</p>

        <label class="muted">Tu número de chapa</label>
        <input 
          id="oracle-chapa" 
          type="number" 
          placeholder="Ej: 245"
          style="margin-bottom:12px;"
        >

        <button id="oracle-start" class="primary">
          Iniciar Oráculo
        </button>

        <div id="oracle-content" style="margin-top:12px;"></div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const btn = document.getElementById('oracle-start');
    if (!btn) return;

    btn.addEventListener('click', () => {
      this.start();
    });
  },
  
start() {
  const chapaInput = document.getElementById('oracle-chapa');
  const content = document.getElementById('oracle-content');

  if (!chapaInput || !content) return;

  const chapa = parseInt(chapaInput.value);

  if (!chapa || chapa <= 0) {
    content.innerHTML = `
      <div class="card danger">
        ⚠️ Introduce un número de chapa válido
      </div>
    `;
    return;
  }

  // 👉 Guardamos la chapa seleccionada
  window.oracleChapaSeleccionada = chapa;

  content.innerHTML = `
    <div class="card muted">
      🔄 Cargando previsión para la chapa ${chapa}...
    </div>
  `;

  // 👉 Iniciamos la carga real
  startOracleDataLoad();
}
};

export default Oraculo;

// =============================================================================
// CALCULADORA PREDICTIVA - EL ORACULO
// =============================================================================

window.updateStepper = function(inputId, change) {
  var input = document.getElementById(inputId);
  if (input) {
    var val = parseInt(input.value) || 0;
    val += change;
    if (val < 0) val = 0;
    input.value = val;
  }
};

// Funcion para parsear HTML de prevision de demanda de Noray
function parsePrevisionDemandaHTML(html) {
  var demandas = {
    '08-14': { gruas: 0, coches: 0 },
    '14-20': { gruas: 0, coches: 0 },
    '20-02': { gruas: 0, coches: 0 }
  };

  // Normalizar el HTML para facilitar el parsing
  var htmlNorm = html.replace(/&nbsp;?/gi, ' ').replace(/\s+/g, ' ');

  // Buscar las secciones de cada jornada usando los marcadores de jornada
  // Formato: TDazul>08/14 H o similar
  var jornada0814Match = htmlNorm.match(/TDazul[^>]*>\s*0?8[\/-]14[^]*?(?:TDverde|class\s*=\s*['"]?TDverde)/i);
  var jornada1420Match = htmlNorm.match(/TDverde[^>]*>\s*14[\/-]20[^]*?(?:TDrojo|class\s*=\s*['"]?TDrojo)/i);
  var jornada2002Match = htmlNorm.match(/TDrojo[^>]*>\s*20[\/-]0?2[^]*?(?:<\/TABLE>|Equipos\s+Previstos|$)/i);

  // Funcion auxiliar para extraer gruas de una seccion
  function extractGruas(seccion) {
    if (!seccion) return 0;

    // Patron 1: GRUAS seguido de celdas TD y un TH con el valor de ASIGNADOS
    // El valor de ASIGNADOS esta en <Th> despues de varias <TD>
    var gruasMatch = seccion.match(/GRUAS[^T]*(?:<TD[^>]*>[^<]*)+<Th[^>]*>(\d+)/i);
    if (gruasMatch) {
      return parseInt(gruasMatch[1]) || 0;
    }

    // Patron 2: buscar GRUAS y luego el TH mas cercano con un numero
    var altMatch = seccion.match(/GRUAS[^]*?<Th[^>]*>(\d+)/i);
    if (altMatch) {
      return parseInt(altMatch[1]) || 0;
    }

    // Patron 3: buscar la fila completa de GRUAS (formato de la tabla real)
    // TR con GRUAS, luego columnas de numeros, y el valor en negrita/Th
    var rowMatch = seccion.match(/GRUAS<TD[^>]*>(\d*)<TD[^>]*>(\d*)<TD[^>]*>(\d*)<TD[^>]*>(\d*)<TD[^>]*>(\d*)<Th[^>]*>(\d+)/i);
    if (rowMatch) {
      return parseInt(rowMatch[6]) || 0;
    }

    return 0;
  }

  // Funcion auxiliar para extraer coches (GRUPO III con ROLON) de una seccion
  function extractCoches(seccion) {
    if (!seccion) return 0;

    // Buscar fila de GRUPO III - el ROLON es la 4ta columna de numeros despues del nombre
    // GRUPO III <TD>CONT <TD>LO-LO <TD>GRANEL <TD>ROLON <TD>R/E <Th>ASIGNADOS
    var grupo3Match = seccion.match(/GRUPO\s*III<TD[^>]*>(\d*)<TD[^>]*>(\d*)<TD[^>]*>(\d*)<TD[^>]*>(\d*)/i);
    if (grupo3Match) {
      // grupo3Match[4] es ROLON
      return parseInt(grupo3Match[4]) || 0;
    }

    // Alternativa: buscar cualquier numero en columna ROLON despues de GRUPO III
    var altMatch = seccion.match(/GRUPO\s*III[^G]*?GRANEL[^<]*<TD[^>]*>(\d*)/i);
    if (altMatch) {
      return parseInt(altMatch[1]) || 0;
    }

    return 0;
  }

  demandas['08-14'].gruas = extractGruas(jornada0814Match ? jornada0814Match[0] : '');
  demandas['08-14'].coches = extractCoches(jornada0814Match ? jornada0814Match[0] : '');

  demandas['14-20'].gruas = extractGruas(jornada1420Match ? jornada1420Match[0] : '');
  demandas['14-20'].coches = extractCoches(jornada1420Match ? jornada1420Match[0] : '');

  demandas['20-02'].gruas = extractGruas(jornada2002Match ? jornada2002Match[0] : '');
  demandas['20-02'].coches = extractCoches(jornada2002Match ? jornada2002Match[0] : '');

  console.log('Demandas parseadas localmente:', demandas);
  return demandas;
}

// Funcion para parsear HTML del chapero (fijos no contratados)
function parseChaperoHTML(html) {
  // Buscar "No contratado (XXX)" en el HTML
  var noContratadoMatch = html.match(/No\s*contratado\s*\((\d+)\)/i);
  if (noContratadoMatch) {
    return parseInt(noContratadoMatch[1]) || 0;
  }

  // Alternativa: contar elementos con clase 'nocontratado' y fondo chapab.jpg
  var countMatch = html.match(/background='imagenes\/chapab\.jpg'/gi);
  if (countMatch) {
    return countMatch.length;
  }

  return 0;
}

// Funcion para mostrar el modal de carga manual de datos Noray
function mostrarModalCargarNoray() {
  var modal = document.getElementById('modal-noray');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-noray';
    modal.className = 'modal-overlay';
    modal.innerHTML = '<div class="modal-content" style="max-width: 500px;">' +
      '<div class="modal-header"><h3>Cargar datos de Noray</h3>' +
      '<button class="modal-close" onclick="cerrarModalNoray()">&times;</button></div>' +
      '<div class="modal-body" style="padding: 1rem;">' +
      '<p style="margin-bottom: 1rem; font-size: 0.9rem; color: #666;">' +
      'Noray tiene proteccion Cloudflare. Abre los enlaces y copia los datos:</p>' +
      '<div style="margin-bottom: 1rem;">' +
      '<label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">' +
      '<a href="https://noray.cpevalencia.com/Chapero.asp" target="_blank" style="color: #3b82f6;">1. Abrir Chapero â</a></label>' +
      '<p style="font-size: 0.8rem; color: #888; margin-bottom: 0.5rem;">Busca "No contratado (X)" al final de la pagina</p>' +
      '<input type="number" id="noray-fijos-manual" placeholder="Ej: 151" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;"></div>' +
      '<div style="margin-bottom: 1rem;">' +
      '<label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">' +
      '<a href="https://noray.cpevalencia.com/PrevisionDemanda.asp" target="_blank" style="color: #3b82f6;">2. Abrir Prevision â</a></label>' +
      '<p style="font-size: 0.8rem; color: #888; margin-bottom: 0.5rem;">Copia GRUAS (columna ASIGNADOS) y COCHES (columna ROLON de GRUPO III)</p>' +
      '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem;">' +
      '<div style="text-align: center; font-size: 0.8rem; font-weight: 600;">08-14</div>' +
      '<div style="text-align: center; font-size: 0.8rem; font-weight: 600;">14-20</div>' +
      '<div style="text-align: center; font-size: 0.8rem; font-weight: 600;">20-02</div>' +
      '<input type="number" id="noray-gruas-0814" placeholder="Gruas" style="padding: 0.4rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem;">' +
      '<input type="number" id="noray-gruas-1420" placeholder="Gruas" style="padding: 0.4rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem;">' +
      '<input type="number" id="noray-gruas-2002" placeholder="Gruas" style="padding: 0.4rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem;">' +
      '<input type="number" id="noray-coches-0814" placeholder="Coches" style="padding: 0.4rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem;">' +
      '<input type="number" id="noray-coches-1420" placeholder="Coches" style="padding: 0.4rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem;">' +
      '<input type="number" id="noray-coches-2002" placeholder="Coches" style="padding: 0.4rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.9rem;">' +
      '</div></div>' +
      '<button onclick="aplicarDatosNorayManual()" style="width: 100%; padding: 0.75rem; background: #10b981; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer;">Aplicar datos</button>' +
      '</div></div>';
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
}

window.cerrarModalNoray = function() {
  var modal = document.getElementById('modal-noray');
  if (modal) modal.style.display = 'none';
};

window.aplicarDatosNorayManual = function() {
  var fijos = parseInt(document.getElementById('noray-fijos-manual').value) || 0;
  var gruas0814 = parseInt(document.getElementById('noray-gruas-0814').value) || 0;
  var gruas1420 = parseInt(document.getElementById('noray-gruas-1420').value) || 0;
  var gruas2002 = parseInt(document.getElementById('noray-gruas-2002').value) || 0;
  var coches0814 = parseInt(document.getElementById('noray-coches-0814').value) || 0;
  var coches1420 = parseInt(document.getElementById('noray-coches-1420').value) || 0;
  var coches2002 = parseInt(document.getElementById('noray-coches-2002').value) || 0;

  // Guardar datos globalmente para uso en orÃ¡culo OC
  window.demandasNoray = {
    '08-14': { gruas: gruas0814, coches: coches0814 },
    '14-20': { gruas: gruas1420, coches: coches1420 },
    '20-02': { gruas: gruas2002, coches: coches2002 }
  };

  var fijosInput = document.getElementById('calc-fijos');
  if (fijosInput) fijosInput.value = fijos;

  var gruas1 = document.getElementById('calc-gruas-1');
  var coches1 = document.getElementById('calc-coches-1');
  if (gruas1) gruas1.value = gruas0814;
  if (coches1) coches1.value = coches0814;

  var gruas2 = document.getElementById('calc-gruas-2');
  var coches2 = document.getElementById('calc-coches-2');
  if (gruas2) gruas2.value = gruas1420;
  if (coches2) coches2.value = coches1420;

  var gruas3 = document.getElementById('calc-gruas-3');
  var coches3 = document.getElementById('calc-coches-3');
  if (gruas3) gruas3.value = gruas2002;
  if (coches3) coches3.value = coches2002;

  var statusDiv = document.getElementById('noray-status');
  if (statusDiv) {
    var horaStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    statusDiv.innerHTML = '<span style="color: #10b981;">Datos cargados ' + horaStr + '</span>';
    statusDiv.style.display = 'block';
  }

  localStorage.setItem('noray_datos_manual', JSON.stringify({
    fijos: fijos, gruas0814: gruas0814, gruas1420: gruas1420, gruas2002: gruas2002,
    coches0814: coches0814, coches1420: coches1420, coches2002: coches2002,
    timestamp: Date.now()
  }));

  cerrarModalNoray();
  console.log('Datos Noray aplicados manualmente:', { fijos: fijos, gruas0814: gruas0814, gruas1420: gruas1420, gruas2002: gruas2002 });
};

// Funcion para cargar datos automaticamente desde Noray
window.cargarDatosNoray = async function() {
  var btnCargar = document.getElementById('btn-cargar-noray');
  var statusDiv = document.getElementById('noray-status');

  if (btnCargar) {
    btnCargar.disabled = true;
    btnCargar.innerHTML = '<span class="loading-spinner"></span> Cargando...';
  }

  try {
    var data = null;

    // Intentar cargar desde el scraper de Render primero
    try {
      console.log('Intentando cargar desde scraper de Render...');
      // AÃ±adir timestamp para evitar cachÃ©
      var renderUrl = 'https://noray-scraper.onrender.com/api/all?t=' + Date.now();
      var renderResponse = await fetch(renderUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      var renderData = await renderResponse.json();

      if (renderData.success && renderData.demandas) {
        console.log('Datos obtenidos desde scraper de Render:', renderData);
        data = renderData;
      }
    } catch (renderError) {
      console.warn('Error cargando desde Render, intentando Apps Script...', renderError);
    }

    // Si el scraper de Render falla, usar Google Apps Script como fallback
    if (!data) {
      console.log('Usando Apps Script como fallback...');
      var url = 'https://script.google.com/macros/s/AKfycbyv6swXpt80WOfTyRhm0n4IBGqcxqeBZCxR1x8bwrhGBRz34I7zZjBzlaJ8lXgHcbDS/exec?action=all';
      var response = await fetch(url);
      data = await response.json();
      console.log('Respuesta raw del Apps Script:', data);
    }

    if (data.success) {
      // Verificar si los datos son validos (no todos en 0)
      var datosValidos = false;

      // Verificar fijos
      if (data.fijos !== undefined && data.fijos > 0) {
        datosValidos = true;
        console.log('Fijos validos desde Apps Script:', data.fijos);
      }

      // Verificar demandas
      if (data.demandas) {
        for (var jornada in data.demandas) {
          if (data.demandas[jornada].gruas > 0 || data.demandas[jornada].coches > 0) {
            datosValidos = true;
            console.log('Demandas validas desde Apps Script para jornada', jornada, ':', data.demandas[jornada]);
            break;
          }
        }
      }

      // Si los datos del Apps Script estan vacios, verificar si es por Cloudflare
      if (!datosValidos) {
        console.log('Datos del Apps Script vacios o no validos');

        // Verificar si el HTML contiene "Just a moment" (Cloudflare challenge)
        var esCloudflare = (data.htmlPrevision && data.htmlPrevision.indexOf('Just a moment') !== -1) ||
                          (data.htmlChapero && data.htmlChapero.indexOf('Just a moment') !== -1);

        // Intentar parsear HTML si estÃ¡ disponible (aunque no pase validaciÃ³n inicial)
        if (data.htmlPrevision && data.htmlChapero && !esCloudflare) {
          console.log('Parseando HTML crudo proporcionado por el Apps Script...');
          var demandasParseadas = parsePrevisionDemandaHTML(data.htmlPrevision);
          data.demandas = demandasParseadas;
          data.fijos = parseChaperoHTML(data.htmlChapero);
          console.log('Datos parseados localmente:', { fijos: data.fijos, demandas: data.demandas });

          // Verificar si el parseo fue exitoso
          if (data.fijos > 0 || (data.demandas['08-14'].gruas > 0 || data.demandas['14-20'].gruas > 0 || data.demandas['20-02'].gruas > 0)) {
            datosValidos = true;
          }
        }  

        // Si sigue sin ser vÃ¡lido, intentar cargar datos guardados o mostrar modal
        if (!datosValidos) {
          console.warn('No se pudieron obtener datos vÃ¡lidos. Intentando cargar datos guardados o mostrando modal.');

          // Intentar cargar datos guardados localmente
          var datosGuardados = localStorage.getItem('noray_datos_manual');
          if (datosGuardados) {
            var saved = JSON.parse(datosGuardados);
            // Si los datos tienen menos de 6 horas, usarlos
            if (Date.now() - saved.timestamp < 6 * 60 * 60 * 1000) {
              console.log('Usando datos guardados localmente');
              data.fijos = saved.fijos;
              data.demandas = {
                '08-14': { gruas: saved.gruas0814, coches: saved.coches0814 },
                '14-20': { gruas: saved.gruas1420, coches: saved.coches1420 },
                '20-02': { gruas: saved.gruas2002, coches: saved.coches2002 }
              };
              datosValidos = true;
            }
          }

          // Si no hay datos guardados validos, mostrar modal
          if (!datosValidos) {
            console.log('Mostrando modal para introducir datos manualmente');
            mostrarModalCargarNoray();
            if (statusDiv) {
              statusDiv.innerHTML = '<span style="color: #f59e0b;">Introduce los datos manualmente</span>';
              statusDiv.style.display = 'block';
            }
            if (btnCargar) {
              btnCargar.disabled = false;
              btnCargar.innerHTML = 'Cargar datos Noray';
            }
            return;
          }
        }
      }

      // Rellenar fijos
      if (data.fijos !== undefined) {
        var fijosInput = document.getElementById('calc-fijos');
        if (fijosInput) {
          fijosInput.value = data.fijos;
        }
      }

      // Rellenar gruas y coches por jornada
      if (data.demandas) {
        // Guardar datos de demanda globalmente para uso en orÃ¡culo OC
        window.demandasNoray = data.demandas;

        // Jornada 1: 08-14
        var gruas1 = document.getElementById('calc-gruas-1');
        var coches1 = document.getElementById('calc-coches-1');
        if (gruas1 && data.demandas['08-14']) {
          gruas1.value = data.demandas['08-14'].gruas || 0;
        }
        if (coches1 && data.demandas['08-14']) {
          coches1.value = data.demandas['08-14'].coches || 0;
        }

        // Jornada 2: 14-20
        var gruas2 = document.getElementById('calc-gruas-2');
        var coches2 = document.getElementById('calc-coches-2');
        if (gruas2 && data.demandas['14-20']) {
          gruas2.value = data.demandas['14-20'].gruas || 0;
        }
        if (coches2 && data.demandas['14-20']) {
          coches2.value = data.demandas['14-20'].coches || 0;
        }

        // Jornada 3: 20-02
        var gruas3 = document.getElementById('calc-gruas-3');
        var coches3 = document.getElementById('calc-coches-3');
        if (gruas3 && data.demandas['20-02']) {
          gruas3.value = data.demandas['20-02'].gruas || 0;
        }
        if (coches3 && data.demandas['20-02']) {
          coches3.value = data.demandas['20-02'].coches || 0;
        }
      }

      // Mostrar estado
      if (statusDiv) {
        var fecha = new Date(data.timestamp || Date.now());
        var horaStr = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        statusDiv.innerHTML = '<span style="color: #10b981;">Datos cargados ' + horaStr + '</span>';
        statusDiv.style.display = 'block';
      }

      console.log('Datos Noray cargados:', data);

    } else {
      throw new Error(data.error || 'Error desconocido');
    }

  } catch (error) {
    console.error('Error cargando datos de Noray:', error);
    if (statusDiv) {
      statusDiv.innerHTML = '<span style="color: #ef4444;">Error al cargar datos</span>';
      statusDiv.style.display = 'block';
    }
  } finally {
    if (btnCargar) {
      btnCargar.disabled = false;
      btnCargar.innerHTML = 'Cargar datos Noray';
    }
  }
};

// ============================================================================
// NUEVAS FUNCIONES PARA CARGAR DATOS POR SEPARADO (EVITAR BLOQUEO CLOUDFLARE)
// ============================================================================

// FunciÃ³n auxiliar para bloquear/desbloquear botones mutuamente
function setLoadingState(activeButton, inactiveButton, isLoading) {
  var loadingInfo = document.getElementById('noray-loading-info');

  if (isLoading) {
    // Deshabilitar ambos botones
    activeButton.disabled = true;
    inactiveButton.disabled = true;

    // Aplicar estilo visual de "bloqueado" al botÃ³n inactivo
    inactiveButton.style.opacity = '0.5';
    inactiveButton.style.cursor = 'not-allowed';

    // Mostrar mensaje informativo
    if (loadingInfo) {
      loadingInfo.style.display = 'block';
    }
  } else {
    // Rehabilitar solo el botÃ³n activo (el inactivo se rehabilitarÃ¡ cuando termine)
    activeButton.disabled = false;
    inactiveButton.disabled = false;

    // Restaurar estilo del botÃ³n inactivo
    inactiveButton.style.opacity = '1';
    inactiveButton.style.cursor = 'pointer';

    // Ocultar mensaje informativo
    if (loadingInfo) {
      loadingInfo.style.display = 'none';
    }
  }
}

// FunciÃ³n para cargar solo la previsiÃ³n (demandas de grÃºas y coches)
window.cargarPrevisionNoray = async function() {
  var btnPrevision = document.getElementById('btn-cargar-prevision');
  var btnFijos = document.getElementById('btn-cargar-fijos');
  var statusDiv = document.getElementById('noray-status-prevision');

  if (btnPrevision) {
    btnPrevision.innerHTML = '<span class="loading-spinner"></span> Cargando...';
    // Bloquear ambos botones mientras carga
    setLoadingState(btnPrevision, btnFijos, true);
  }

  try {
    console.log('ð Cargando previsiÃ³n desde scraper de Render...');
    // AÃ±adir timestamp para evitar cachÃ©
    var renderUrl = 'https://noray-scraper.onrender.com/api/prevision?t=' + Date.now();
    var response = await fetch(renderUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    var data = await response.json();

    if (data.success && data.demandas) {
      console.log('â PrevisiÃ³n obtenida:', data.demandas);

      // Guardar datos globalmente para uso en orÃ¡culo OC
      window.demandasNoray = data.demandas;

      // Rellenar gruas y coches por jornada
      // Jornada 1: 08-14
      var gruas1 = document.getElementById('calc-gruas-1');
      var coches1 = document.getElementById('calc-coches-1');
      if (gruas1 && data.demandas['08-14']) {
        gruas1.value = data.demandas['08-14'].gruas || 0;
      }
      if (coches1 && data.demandas['08-14']) {
        coches1.value = data.demandas['08-14'].coches || 0;
      }

      // Jornada 2: 14-20
      var gruas2 = document.getElementById('calc-gruas-2');
      var coches2 = document.getElementById('calc-coches-2');
      if (gruas2 && data.demandas['14-20']) {
        gruas2.value = data.demandas['14-20'].gruas || 0;
      }
      if (coches2 && data.demandas['14-20']) {
        coches2.value = data.demandas['14-20'].coches || 0;
      }

      // Jornada 3: 20-02
      var gruas3 = document.getElementById('calc-gruas-3');
      var coches3 = document.getElementById('calc-coches-3');
      if (gruas3 && data.demandas['20-02']) {
        gruas3.value = data.demandas['20-02'].gruas || 0;
      }
      if (coches3 && data.demandas['20-02']) {
        coches3.value = data.demandas['20-02'].coches || 0;
      }

      // Mostrar estado exitoso
      if (statusDiv) {
        var fecha = new Date(data.timestamp || Date.now());
        var horaStr = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        statusDiv.innerHTML = 'â PrevisiÃ³n cargada ' + horaStr;
        statusDiv.style.display = 'block';
      }

      console.log('â PrevisiÃ³n aplicada correctamente');

    } else {
      throw new Error(data.error || 'No se encontraron demandas');
    }

  } catch (error) {
    console.error('â Error cargando previsiÃ³n:', error);
    if (statusDiv) {
      statusDiv.innerHTML = 'â Error al cargar previsiÃ³n';
      statusDiv.style.display = 'block';
    }
  } finally {
    if (btnPrevision && btnFijos) {
      btnPrevision.innerHTML = 'ð Cargar PrevisiÃ³n';
      // Desbloquear ambos botones
      setLoadingState(btnPrevision, btnFijos, false);
    }
  }
};

// FunciÃ³n para cargar solo los fijos (chapero)
window.cargarFijosNoray = async function() {
  var btnFijos = document.getElementById('btn-cargar-fijos');
  var btnPrevision = document.getElementById('btn-cargar-prevision');
  var statusDiv = document.getElementById('noray-status-fijos');

  if (btnFijos) {
    btnFijos.innerHTML = '<span class="loading-spinner"></span> Cargando...';
    // Bloquear ambos botones mientras carga
    setLoadingState(btnFijos, btnPrevision, true);
  }

  try {
    console.log('ð¥ Cargando fijos desde scraper de Render...');
    // AÃ±adir timestamp para evitar cachÃ©
    var renderUrl = 'https://noray-scraper.onrender.com/api/chapero?t=' + Date.now();
    var response = await fetch(renderUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    var data = await response.json();

    if (data.success && data.fijos !== undefined) {
      console.log('â Fijos obtenidos:', data.fijos);

      // Rellenar fijos
      var fijosInput = document.getElementById('calc-fijos');
      if (fijosInput) {
        fijosInput.value = data.fijos;
      }

      // Mostrar estado exitoso
      if (statusDiv) {
        var fecha = new Date(data.timestamp || Date.now());
        var horaStr = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        statusDiv.innerHTML = 'â Fijos cargados ' + horaStr;
        statusDiv.style.display = 'block';
      }

      console.log('â Fijos aplicados correctamente');

    } else {
      throw new Error(data.error || 'No se encontraron fijos');
    }

  } catch (error) {
    console.error('â Error cargando fijos:', error);
    if (statusDiv) {
      statusDiv.innerHTML = 'â Error al cargar fijos';
      statusDiv.style.display = 'block';
    }
  } finally {
    if (btnFijos && btnPrevision) {
      btnFijos.innerHTML = 'ð¥ Cargar Fijos';
      // Desbloquear ambos botones
      setLoadingState(btnFijos, btnPrevision, false);
    }
  }
};

// ============================================================================
// FUNCIONES PARA DISEÃO COMPACTO DEL ORÃCULO CON CARGA MANUAL
// ============================================================================

// FunciÃ³n para iniciar la carga de datos manualmente
window.startOracleDataLoad = function() {
  // Ocultar botÃ³n de inicio y mostrar secciÃ³n de carga
  const startSection = document.getElementById('oracle-start-section');
  const loadingSection = document.getElementById('oracle-loading-section');

  if (startSection) startSection.style.display = 'none';
  if (loadingSection) loadingSection.style.display = 'block';

  // Cerrar modal si estÃ¡ abierto
  closeOracleManualModal();

  // Iniciar carga
  autoLoadOracleData();
};

// FunciÃ³n para cargar datos con barra de progreso fluida
window.autoLoadOracleData = async function() {
  const statusText = document.getElementById('oracle-status-text');
  const statusDetail = document.getElementById('oracle-status-detail');
  const progressBar = document.getElementById('oracle-progress-bar');
  const progressText = document.getElementById('oracle-progress-text');
  const loadingSection = document.getElementById('oracle-loading-section');
  const summaryDiv = document.getElementById('oracle-data-summary');

  let previsionSuccess = false;
  let fijosSuccess = false;
  let currentProgress = 0;
  let progressInterval = null;

  // FunciÃ³n para animar el progreso suavemente
  const animateProgress = (targetPercent, duration) => {
    return new Promise((resolve) => {
      const startPercent = currentProgress;
      const diff = targetPercent - startPercent;
      const startTime = Date.now();

      clearInterval(progressInterval);
      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        currentProgress = startPercent + (diff * progress);

        if (progressBar) progressBar.style.width = currentProgress + '%';
        if (progressText) progressText.textContent = Math.round(currentProgress) + '%';

        if (progress >= 1) {
          clearInterval(progressInterval);
          resolve();
        }
      }, 50);
    });
  };

  // FunciÃ³n para actualizar progreso con texto
  const updateProgress = async (percent, text, duration = 1000) => {
    if (statusDetail) statusDetail.textContent = text;
    await animateProgress(percent, duration);
  };

  try {
    // PASO 1: Inicio (0% - 10%)
    await updateProgress(5, 'Conectando con Noray...', 500);
    if (statusText) statusText.textContent = 'Cargando previsiÃ³n de demanda';

    console.log('ð Cargando previsiÃ³n...');
    const previsionUrl = 'https://noray-scraper.onrender.com/api/prevision?t=' + Date.now();

    await updateProgress(10, 'Consultando datos de demanda...', 500);

    // Iniciar fetch y simular progreso continuo mientras espera (10% - 45%)
    const previsionPromise = fetch(previsionUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    // Animar progreso mientras espera respuesta
    const progressAnimation1 = updateProgress(45, 'Esperando respuesta del servidor...', 8000);
    const previsionResponse = await Promise.race([previsionPromise, progressAnimation1]).then(() => previsionPromise);

    await updateProgress(48, 'Procesando datos de grÃºas y coches...', 500);
    const previsionData = await previsionResponse.json();

    if (previsionData.success && previsionData.demandas) {
      console.log('â PrevisiÃ³n cargada:', previsionData.demandas);

      // Guardar datos globalmente para uso en orÃ¡culo OC
      window.demandasNoray = previsionData.demandas;

      // Rellenar gruas y coches por jornada
      if (previsionData.demandas['08-14']) {
        const gruas1 = document.getElementById('calc-gruas-1');
        const coches1 = document.getElementById('calc-coches-1');
        if (gruas1) gruas1.value = previsionData.demandas['08-14'].gruas || 0;
        if (coches1) coches1.value = previsionData.demandas['08-14'].coches || 0;
      }
      if (previsionData.demandas['14-20']) {
        const gruas2 = document.getElementById('calc-gruas-2');
        const coches2 = document.getElementById('calc-coches-2');
        if (gruas2) gruas2.value = previsionData.demandas['14-20'].gruas || 0;
        if (coches2) coches2.value = previsionData.demandas['14-20'].coches || 0;
      }
      if (previsionData.demandas['20-02']) {
        const gruas3 = document.getElementById('calc-gruas-3');
        const coches3 = document.getElementById('calc-coches-3');
        if (gruas3) gruas3.value = previsionData.demandas['20-02'].gruas || 0;
        if (coches3) coches3.value = previsionData.demandas['20-02'].coches || 0;
      }

      previsionSuccess = true;
      await updateProgress(50, 'PrevisiÃ³n cargada correctamente â', 800);
    }

    // PequeÃ±a pausa
    await new Promise(resolve => setTimeout(resolve, 300));

    // PASO 2: Cargar Fijos (50% - 100%)
    await updateProgress(52, 'Conectando con sistema de fijos...', 500);
    if (statusText) statusText.textContent = 'Cargando fijos disponibles';

    console.log('ð¥ Cargando fijos...');
    const fijosUrl = 'https://noray-scraper.onrender.com/api/chapero?t=' + Date.now();

    await updateProgress(55, 'Consultando trabajadores no contratados...', 500);

    // Iniciar fetch y simular progreso continuo mientras espera (55% - 90%)
    const fijosPromise = fetch(fijosUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    // Animar progreso mientras espera respuesta
    const progressAnimation2 = updateProgress(90, 'Esperando respuesta del servidor...', 8000);
    const fijosResponse = await Promise.race([fijosPromise, progressAnimation2]).then(() => fijosPromise);

    await updateProgress(93, 'Procesando datos de fijos...', 500);
    const fijosData = await fijosResponse.json();

    if (fijosData.success && fijosData.fijos !== undefined) {
      console.log('â Fijos cargados:', fijosData.fijos);

      const fijosInput = document.getElementById('calc-fijos');
      if (fijosInput) {
        fijosInput.value = fijosData.fijos;
      }

      fijosSuccess = true;
      await updateProgress(96, 'Fijos cargados correctamente â', 400);
    }

    // PASO 3: Finalizar
    if (previsionSuccess && fijosSuccess) {
      await updateProgress(100, 'Â¡Datos cargados con Ã©xito!', 500);
      if (statusText) statusText.textContent = 'â Carga completada';

      // Actualizar resumen y mostrarlo
      updateOracleSummary();

      // Esperar un momento para que se vea el 100%
      await new Promise(resolve => setTimeout(resolve, 600));

      if (summaryDiv) summaryDiv.style.display = 'block';
      if (loadingSection) loadingSection.style.display = 'none';
      await loadCalculadora();

    } else {
      throw new Error('No se pudieron cargar todos los datos');
    }

  } catch (error) {
    console.error('â Error en carga:', error);
    clearInterval(progressInterval);
    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = '0%';
    if (statusText) statusText.textContent = 'â ï¸ Error en la carga';
    if (statusDetail) statusDetail.innerHTML = '<button onclick="startOracleDataLoad()" class="btn-glass" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; margin: 0.5rem 0.25rem;">ð Reintentar</button><button onclick="openOracleManualModal()" class="btn-glass" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; margin: 0.5rem 0.25rem;">âï¸ Introducir manualmente</button>';
  }
};

// FunciÃ³n para actualizar el resumen de datos cargados
window.updateOracleSummary = function() {
  // Obtener valores de los inputs
  const fijos = document.getElementById('calc-fijos')?.value || '-';
  const g1 = document.getElementById('calc-gruas-1')?.value || '-';
  const c1 = document.getElementById('calc-coches-1')?.value || '-';
  const g2 = document.getElementById('calc-gruas-2')?.value || '-';
  const c2 = document.getElementById('calc-coches-2')?.value || '-';
  const g3 = document.getElementById('calc-gruas-3')?.value || '-';
  const c3 = document.getElementById('calc-coches-3')?.value || '-';

  // Actualizar valores en las tarjetas de resumen
  const summaryFijos = document.getElementById('summary-fijos');
  if (summaryFijos) summaryFijos.textContent = fijos;

  const summaryG1 = document.getElementById('summary-g1');
  const summaryC1 = document.getElementById('summary-c1');
  if (summaryG1) summaryG1.textContent = g1;
  if (summaryC1) summaryC1.textContent = c1;

  const summaryG2 = document.getElementById('summary-g2');
  const summaryC2 = document.getElementById('summary-c2');
  if (summaryG2) summaryG2.textContent = g2;
  if (summaryC2) summaryC2.textContent = c2;

  const summaryG3 = document.getElementById('summary-g3');
  const summaryC3 = document.getElementById('summary-c3');
  if (summaryG3) summaryG3.textContent = g3;
  if (summaryC3) summaryC3.textContent = c3;
};

// FunciÃ³n para abrir el modal de ediciÃ³n manual
window.openOracleManualModal = function() {
  const modal = document.getElementById('oracle-manual-modal');
  if (modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
};

// FunciÃ³n para cerrar el modal de ediciÃ³n manual
window.closeOracleManualModal = function() {
  const modal = document.getElementById('oracle-manual-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.style.pointerEvents = 'none';
  }
  document.body.style.overflow = '';
};

// FunciÃ³n para guardar cambios manuales
window.saveManualOracleData = function() {
  // Actualizar el resumen con los nuevos valores
  updateOracleSummary();

  // Ocultar secciones de inicio y carga
  const startSection = document.getElementById('oracle-start-section');
  const loadingSection = document.getElementById('oracle-loading-section');
  const summaryDiv = document.getElementById('oracle-data-summary');

  if (startSection) startSection.style.display = 'none';
  if (loadingSection) loadingSection.style.display = 'none';
  if (summaryDiv) summaryDiv.style.display = 'block';

  // Cerrar el modal
  closeOracleManualModal();

  console.log('â Datos manuales guardados');
};

// FunciÃ³n para recargar datos (simplemente llama a startOracleDataLoad)
window.reloadOracleData = function() {
  startOracleDataLoad();
};

// ============================================================================
// FIN NUEVAS FUNCIONES
// ============================================================================

function calcularResultadoJornada(posicionRestante) {
  // posicionRestante: cuantas posiciones faltan para llegar al usuario
  // Si es <= 0, el usuario ya esta dentro (sale contratado)
  var clase, mensaje;

  if (posicionRestante <= 0) {
    clase = 'probability-high';
    mensaje = 'Calienta que sales';
  } else if (posicionRestante <= 10) {
    clase = 'probability-medium';
    mensaje = 'Va a estar justo';
  } else {
    clase = 'probability-low';
    mensaje = 'No sales';
  }

  return { clase: clase, mensaje: mensaje, posicionRestante: posicionRestante };
}

function detectarSiguienteJornada(puertas) {
  // Orden de contratacion de jornadas
  var ordenJornadas = ['02-08', '08-14', '14-20', '20-02'];
  var siguienteJornada = null;

  // La ultima jornada que tiene datos ES la siguiente a contratar
  // (el dato de puerta indica desde donde se va a empezar a contratar)
  for (var i = 0; i < ordenJornadas.length; i++) {
    var jornada = ordenJornadas[i];
    var puertaData = puertas.find(function(p) { return p.jornada === jornada; });

    if (puertaData) {
      var puertaSP = puertaData.puertaSP;
      var puertaOC = puertaData.puertaOC;
      // Si tiene algun dato valido, esta es la siguiente jornada a contratar
      if ((puertaSP && puertaSP.trim() !== '' && parseInt(puertaSP) > 0) ||
          (puertaOC && puertaOC.trim() !== '' && parseInt(puertaOC) > 0)) {
        siguienteJornada = jornada;
      }
    }
  }

  // Si no hay ninguna con datos, asumimos que la siguiente es 02-08
  if (siguienteJornada === null) {
    return '02-08';
  }

  return siguienteJornada;
}

if (!window.oracleChapaSeleccionada) {
  console.warn('Oráculo iniciado sin chapa seleccionada');
}
async function loadCalculadora() {
  var btnCalcular = document.getElementById('btn-calcular-probabilidad');
  var resultadoDiv = document.getElementById('calc-resultado');

  if (resultadoDiv) resultadoDiv.classList.add('hidden');

// ============================================================================
  // CARGA MANUAL DE DATOS (El usuario debe hacer clic en "Cargar Datos")
  // ============================================================================
  // Ya no se carga automÃ¡ticamente, el usuario inicia la carga manualmente
  console.log('â¹ï¸ Esperando a que el usuario inicie la carga de datos...');
  // ============================================================================

  // Constantes del censo
  var LIMITE_SP = 455;
  var INICIO_OC = 456;
  var FIN_OC = 519;
  var TAMANO_SP = 455; // Posiciones 1-455
  var TAMANO_OC = 64;  // Posiciones 456-519 (519-456+1 = 64)

  // ============================================================================
  // âï¸ CONFIGURACIÃN: FACTOR DE DISPONIBILIDAD EN SEGUNDA VUELTA DEL DÃA
  // ============================================================================
  // Cuando el censo da una vuelta completa en el mismo dÃ­a (vuelve a pasar por
  // la puerta inicial), solo una parte de la gente puede trabajar un segundo turno.
  //
  // VALORES SUGERIDOS:
  // - 2.0  = Mitad de gente disponible (muy restrictivo)
  // - 1.5  = 2/3 de gente disponible (moderado)
  // - 1.25 = 80% de gente disponible (permisivo)
  // - 1.0  = Toda la gente disponible (sin restricciÃ³n)
  //
  // FÃRMULA: disponibilidad_segunda_vuelta = disponibilidad_normal / FACTOR
  // Ejemplo: Si FACTOR = 2.0, un verde (1.0) pasa a valer 0.5 en segunda vuelta
  // ============================================================================
  var FACTOR_SEGUNDA_VUELTA = 2.0;  // <-- MODIFICA ESTE VALOR

  // Obtener posicion del usuario
  let posicionUsuario;

if (window.oracleChapaSeleccionada) {
  posicionUsuario = await SheetsAPI.getPosicionChapa(window.oracleChapaSeleccionada);
} else {
  posicionUsuario = await SheetsAPI.getPosicionChapa(AppState.currentUser);
}
  var esUsuarioOC = posicionUsuario > LIMITE_SP;

  // Obtener censo para calcular rojos (no disponibles)
  var censoData = await SheetsAPI.getCenso();

  // Separar censo SP y OC
  var censoSP = censoData.filter(function(item) { return item.posicion <= LIMITE_SP; });
  var censoOC = censoData.filter(function(item) { return item.posicion > LIMITE_SP; });

  // Obtener puertas para detectar siguiente jornada
  var puertasResult = await SheetsAPI.getPuertas();
  var puertas = puertasResult.puertas;
  var puertasLaborables = puertas.filter(function(p) { return p.jornada !== 'Festivo'; });

  // Detectar siguiente jornada a contratar
  var siguienteJornada = detectarSiguienteJornada(puertasLaborables);
  console.log('Siguiente jornada a contratar:', siguienteJornada);

  // Determinar que jornadas mostrar segun el caso
  // SP: solo 3 jornadas (08-14, 14-20, 20-02) - los inputs van de 1 a 3
  // OC: 4 jornadas con demanda fija (08-14=15, 14-20=15, 20-02=15, 02-08=5)
  var jornadasConfigSP = {
    '08-14': [
      { id: '1', nombre: 'Manana (08-14)', codigo: '08-14', activa: true, pedirFijos: true },
      { id: '2', nombre: 'Tarde (14-20)', codigo: '14-20', activa: true, pedirFijos: false },
      { id: '3', nombre: 'Noche (20-02)', codigo: '20-02', activa: true, pedirFijos: false }
    ],
    '14-20': [
      { id: '1', nombre: 'Tarde (14-20)', codigo: '14-20', activa: true, pedirFijos: true },
      { id: '2', nombre: 'Noche (20-02)', codigo: '20-02', activa: true, pedirFijos: false }
    ],
    '20-02': [
      { id: '1', nombre: 'Noche (20-02)', codigo: '20-02', activa: true, pedirFijos: true }
    ],
    '02-08': [
      { id: '1', nombre: 'Manana (08-14)', codigo: '08-14', activa: true, pedirFijos: true },
      { id: '2', nombre: 'Tarde (14-20)', codigo: '14-20', activa: true, pedirFijos: false },
      { id: '3', nombre: 'Noche (20-02)', codigo: '20-02', activa: true, pedirFijos: false }
    ]
  };

  var jornadasConfigOC = {
    '08-14': [
      { nombre: 'Manana (08-14)', codigo: '08-14', activa: true, demandaOC: 15 },
      { nombre: 'Tarde (14-20)', codigo: '14-20', activa: true, demandaOC: 15 },
      { nombre: 'Noche (20-02)', codigo: '20-02', activa: true, demandaOC: 15 }
    ],
    '14-20': [
      { nombre: 'Tarde (14-20)', codigo: '14-20', activa: true, demandaOC: 15 },
      { nombre: 'Noche (20-02)', codigo: '20-02', activa: true, demandaOC: 15 }
    ],
    '20-02': [
      { nombre: 'Noche (20-02)', codigo: '20-02', activa: true, demandaOC: 15 }
    ],
    '02-08': [
      { nombre: 'Manana (08-14)', codigo: '08-14', activa: true, demandaOC: 15 },
      { nombre: 'Tarde (14-20)', codigo: '14-20', activa: true, demandaOC: 15 },
      { nombre: 'Noche (20-02)', codigo: '20-02', activa: true, demandaOC: 15 }
    ]
  };

  var jornadasConfig = esUsuarioOC ? jornadasConfigOC : jornadasConfigSP;

  var jornadasAMostrar = jornadasConfig[siguienteJornada] || jornadasConfig['08-14'];

  // Para OC: ocultar inputs de demanda y mostrar mensaje
  var fijosCard = document.querySelector('.calculator-card');
  var jornadaCards = document.querySelectorAll('.jornada-input-card');

  if (esUsuarioOC) {
    // Ocultar card de fijos para OC
    var fijosInput = document.getElementById('calc-fijos');
    if (fijosInput) {
      var fijosGrid = fijosInput.closest('.calc-grid');
      if (fijosGrid) fijosGrid.style.display = 'none';
    }
    // Ocultar completamente los inputs de demanda para OC
    jornadaCards.forEach(function(card) {
      card.style.display = 'none';
    });
  } else {
    // SP: Mostrar inputs normalmente y limpiar mensajes de OC si existian
    var fijosInput = document.getElementById('calc-fijos');
    if (fijosInput) {
      var fijosGrid = fijosInput.closest('.calc-grid');
      if (fijosGrid) fijosGrid.style.display = '';
    }
    // Mostrar cards y limpiar mensajes de OC
    jornadaCards.forEach(function(card) {
      card.style.display = '';
      card.querySelectorAll('input').forEach(function(input) {
        input.disabled = false;
        input.style.opacity = '1';
      });
      card.querySelectorAll('.step-btn').forEach(function(btn) {
        btn.disabled = false;
      });
      // Eliminar mensaje de OC si existe
      var ocMsg = card.querySelector('.oc-info');
      if (ocMsg) {
        ocMsg.remove();
      }
    });
  }

  // Actualizar UI para marcar jornadas inactivas (ya contratadas)
  jornadasAMostrar.forEach(function(jornada, index) {
    var card = jornadaCards[index];
    if (card) {
      if (!jornada.activa) {
        card.classList.add('jornada-contratada');
        card.querySelectorAll('input').forEach(function(input) {
          input.disabled = true;
          input.value = 0;
        });
        card.querySelectorAll('.step-btn').forEach(function(btn) {
          btn.disabled = true;
        });
      } else if (!esUsuarioOC) {
        card.classList.remove('jornada-contratada');
        card.querySelectorAll('input').forEach(function(input) {
          input.disabled = false;
        });
        card.querySelectorAll('.step-btn').forEach(function(btn) {
          btn.disabled = false;
        });
      }
    }
  });

  if (btnCalcular) {
    var newBtn = btnCalcular.cloneNode(true);
    btnCalcular.parentNode.replaceChild(newBtn, btnCalcular);

    newBtn.addEventListener('click', async function() {
      var fijos = parseInt(document.getElementById('calc-fijos').value) || 0;

      newBtn.innerHTML = 'Calculando...';
      newBtn.disabled = true;

      try {
        // Obtener puerta actual y posicion del usuario
        var puertaActual = 0;
        var puertaData = puertasLaborables.find(function(p) { return p.jornada === siguienteJornada; });
        if (puertaData) {
          puertaActual = parseInt(esUsuarioOC ? puertaData.puertaOC : puertaData.puertaSP) || 0;
        }

        var tamanoCenso = esUsuarioOC ? TAMANO_OC : TAMANO_SP;
        var censoActual = esUsuarioOC ? censoOC : censoSP;

        // Limites del censo actual
        var limiteInicio = esUsuarioOC ? INICIO_OC : 1;
        var limiteFin = esUsuarioOC ? FIN_OC : LIMITE_SP;

        // Funcion para obtener posicion absoluta
        function getPosAbsoluta(item) {
          return item.posicion;
        }

        // Funcion para verificar si una posicion esta disponible
        function estaDisponible(posicion) {
          var item = censoActual.find(function(c) { return c.posicion === posicion; });
          return item && item.color !== 'red';
        }

        // Funcion para obtener el peso de disponibilidad segun el color
        function getPesoDisponibilidad(posicion) {
          var item = censoActual.find(function(c) { return c.posicion === posicion; });
          if (!item) return 0;

          // Pesos segun disponibilidad:
          // red (0 jornadas): 0
          // orange (1 jornada): 1/4 = 0.25
          // yellow (2 jornadas): 2/4 = 0.50
          // blue (3 jornadas): 3/4 = 0.75
          // green (todas las jornadas): 1.00
          switch(item.color) {
            case 'red': return 0;
            case 'orange': return 0.25;
            case 'yellow': return 0.50;
            case 'blue': return 0.75;
            case 'green': return 1.00;
            default: return 0;
          }
        }

        // Contar total de rojos en el censo
        var totalRojos = censoActual.filter(function(item) { return item.color === 'red'; }).length;
        var totalDisponibles = tamanoCenso - totalRojos;

        // Funcion para contar disponibles entre dos posiciones (en posiciones absolutas)
        // Ahora tiene en cuenta fracciones segun el color de disponibilidad
        function contarDisponiblesEntre(desde, hasta) {
          var disponibles = 0;

          if (desde <= hasta) {
            // Rango directo
            for (var pos = desde + 1; pos <= hasta; pos++) {
              disponibles += getPesoDisponibilidad(pos);
            }
          } else {
            // Rango con vuelta: desde -> fin + inicio -> hasta
            for (var pos = desde + 1; pos <= limiteFin; pos++) {
              disponibles += getPesoDisponibilidad(pos);
            }
            for (var pos = limiteInicio; pos <= hasta; pos++) {
              disponibles += getPesoDisponibilidad(pos);
            }
          }

          return disponibles;
        }

        // Funcion para calcular distancia efectiva hasta usuario (considerando pesos de disponibilidad)
        // IMPORTANTE: Ahora sumamos el peso de disponibilidad del usuario segun su color
        function calcularDistanciaEfectiva(puerta, usuario) {
          var distancia;
          if (usuario > puerta) {
            // Usuario esta delante
            distancia = contarDisponiblesEntre(puerta, usuario);
          } else if (usuario < puerta) {
            // Usuario esta detras, hay que dar la vuelta
            distancia = contarDisponiblesEntre(puerta, limiteFin) + contarDisponiblesEntre(limiteInicio - 1, usuario);
          } else {
            // Misma posicion
            return 0;
          }

          // Sumar el peso de disponibilidad del propio usuario
          // Esto incluye al usuario en el conteo con su peso correspondiente
          var pesoUsuario = getPesoDisponibilidad(usuario);
          distancia += pesoUsuario;

          return distancia;
        }

        // Funcion para detectar si el usuario esta "justo detras" de la puerta
        // Es decir, la puerta acaba de pasar al usuario (diferencia pequena en sentido circular)
        function usuarioJustoDetras(puerta, usuario, umbral) {
          umbral = umbral || 10; // Por defecto, considerar "justo detras" si esta a menos de 10 posiciones
          if (usuario < puerta) {
            // Usuario detras de la puerta en el mismo ciclo
            var distanciaDirecta = puerta - usuario;
            return distanciaDirecta <= umbral;
          } else if (usuario > puerta) {
            // Usuario delante, verificar si la puerta acaba de dar la vuelta
            // ej: puerta en 5, usuario en 440, la puerta paso de 443 a 1
            var distanciaVuelta = (limiteFin - usuario) + (puerta - limiteInicio) + 1;
            return distanciaVuelta <= umbral;
          }
          return true; // Misma posicion
        }

        // Funcion para verificar si el usuario sale contratado
        // Avanza posicion por posicion, contando solo disponibles
        // IMPORTANTE: Detecta si la puerta PASA por el usuario, este disponible o no
        function verificarContratacion(puertaInicio, demanda, usuario, puertaInicialDia) {
          var posActual = puertaInicio;
          var contratados = 0;
          var vueltas = 0;
          var usuarioAlcanzado = false;
          var puertaPasoPorUsuario = false; // Nueva variable: la puerta paso por la posicion del usuario
          var maxIteraciones = tamanoCenso * 3;
          var iteraciones = 0;
          var yaEsSegundaVuelta = false; // Para controlar cuando empezamos a aplicar el factor

          // CASO ESPECIAL: Si el usuario esta justo en la puerta de inicio,
          // debemos detectarlo ANTES de empezar el bucle
          if (posActual === usuario) {
            puertaPasoPorUsuario = true;
            var pesoInicial = getPesoDisponibilidad(usuario);
            if (pesoInicial > 0) {
              usuarioAlcanzado = true;
            }
          }

          while (contratados < demanda && iteraciones < maxIteraciones) {
            posActual++;
            if (posActual > limiteFin) {
              posActual = limiteInicio;
              vueltas++;
            }

            // ============================================================================
            // DETECCIÃN DE SEGUNDA VUELTA DEL DÃA
            // ============================================================================
            // La segunda vuelta se activa cuando:
            // 1. Ya se ha dado al menos UNA vuelta completa del censo (vueltas > 0)
            // 2. La puerta vuelve a pasar por la puerta inicial del dÃ­a (02-08)
            //
            // Ejemplo: Si puerta inicial del dÃ­a es 334
            // - Primera pasada: 334 -> 443 -> 1 -> 333 (aÃºn primera vuelta)
            // - Al llegar a 334 otra vez: AHORA empieza segunda vuelta
            //
            // En segunda vuelta: disponibilidad se divide por FACTOR_SEGUNDA_VUELTA
            // ============================================================================
            if (!yaEsSegundaVuelta && vueltas > 0 && posActual >= puertaInicialDia) {
              yaEsSegundaVuelta = true;
            }

            // Verificar si la puerta pasa por la posicion del usuario (este o no disponible)
            if (posActual === usuario) {
              puertaPasoPorUsuario = true;
            }

            // Obtener peso de disponibilidad (0, 0.25, 0.5, 0.75, 1.0)
            var pesoDisponibilidad = getPesoDisponibilidad(posActual);

            // Si es segunda vuelta del dia, aplicar factor de reducciÃ³n
            // (solo una parte de la gente puede trabajar un segundo turno)
            if (yaEsSegundaVuelta && pesoDisponibilidad > 0) {
              pesoDisponibilidad = pesoDisponibilidad / FACTOR_SEGUNDA_VUELTA;
            }

            // Sumar peso fraccional de disponibilidad
            if (pesoDisponibilidad > 0) {
              contratados += pesoDisponibilidad;

              // Si llegamos al usuario y tiene disponibilidad, lo alcanzamos
              if (posActual === usuario && pesoDisponibilidad > 0) {
                usuarioAlcanzado = true;
              }
            }
            // Si esta en rojo (peso 0), la puerta avanza pero no cuenta como contratado

            iteraciones++;
          }

          return {
            alcanzado: usuarioAlcanzado,
            puertaPasoPorUsuario: puertaPasoPorUsuario, // La puerta paso por el usuario aunque este en rojo
            puertaFinal: posActual,
            vueltas: vueltas,
            contratados: contratados,
            yaEsSegundaVuelta: yaEsSegundaVuelta
          };
        }

        var resultadosHTML = '';
        var esPrimeraJornadaActiva = true;
        var puertaPrevista = puertaActual;
        var puertaInicialDia = puertaActual; // Guardar puerta al inicio del dia

        // Posicion del usuario para calculos (posicion REAL, no relativa)
        var posUsuarioCalc = posicionUsuario;

        // Acumulador de demanda para saber cuando da la vuelta
        var demandaAcumulada = 0;

        // Array para guardar puntuaciones de cada jornada (luego normalizamos a 100%)
        var puntuacionesJornadas = [];

        for (var i = 0; i < jornadasAMostrar.length; i++) {
          var jornada = jornadasAMostrar[i];

          // Si la jornada ya se contrato, NO mostrar
          if (!jornada.activa) {
            continue;
          }

          // Obtener demanda
          var demandaTotal;
          if (esUsuarioOC) {
            // Para OC: usar demanda OC de la previsiÃ³n automÃ¡tica
            // IMPORTANTE: Para el calculo se usa solo la MITAD de los fijos disponibles
            var demandaBase = jornada.demandaOC;

            // DEBUG: Ver datos cargados
            console.log('DEBUG Jornada ' + jornada.codigo + ':', {
              demandaBaseOriginal: demandaBase,
              demandasNoray: window.demandasNoray
            });

            // Verificar si hay datos del scraper que indiquen festivo (0 grÃºas y 0 coches)
            if (window.demandasNoray && window.demandasNoray[jornada.codigo]) {
              var demandaScrap = window.demandasNoray[jornada.codigo];
              console.log('DEBUG Scraper para ' + jornada.codigo + ':', demandaScrap);

              if (demandaScrap.gruas === 0 && demandaScrap.coches === 0) {
                // Festivo detectado: forzar demanda a 0
                console.log('FESTIVO DETECTADO para ' + jornada.codigo + ' - Forzando demanda a 0');
                demandaBase = 0;
              }
            } else {
              console.log('NO hay datos del scraper para ' + jornada.codigo);
            }

            var ajusteFijos = 0;
            var fijosParaCalculoOC = Math.floor(fijos / 2); // Usar solo la mitad de fijos para el calculo

            // Solo ajustar la primera jornada activa
            if (esPrimeraJornadaActiva) {
              if (fijosParaCalculoOC > 50) {
                ajusteFijos = 10;
              } else if (fijosParaCalculoOC > 25) {
                ajusteFijos = 5;
              }
            }

            demandaTotal = Math.max(0, demandaBase - ajusteFijos);
          } else {
            // Para SP: usar inputs manuales del usuario
            // Mapear codigo de jornada a numero de input fijo
            var inputMap = {
              '08-14': '1',
              '14-20': '2',
              '20-02': '3'
            };
            var inputNum = inputMap[jornada.codigo];
            var gruas = parseInt(document.getElementById('calc-gruas-' + inputNum).value) || 0;
            var coches = parseInt(document.getElementById('calc-coches-' + inputNum).value) || 0;
            demandaTotal = (gruas * 7) + coches;
          }

          // Si demanda es 0, es un dÃ­a festivo/no hÃ¡bil - No hay contrataciÃ³n
          if (demandaTotal === 0) {
            puntuacionesJornadas.push({
              jornada: jornada,
              puntuacion: 0,
              sinDatos: true,
              sinContratacion: true,
              puertaAntes: puertaPrevista,
              puertaDespues: puertaPrevista,
              distanciaNecesaria: 0,
              demandaEventuales: 0,
              vuelta: 1,
              saleContratado: false,
              margen: 0
            });
            continue;
          }

          // Calcular demanda para eventuales (restar fijos solo en primera jornada activa, solo SP)
          // IMPORTANTE: Para el calculo se usa solo la MITAD de los fijos disponibles
          // porque historicamente solo la mitad de los fijos realmente se presentan
          var demandaEventuales;
          if (!esUsuarioOC && esPrimeraJornadaActiva) {
            var fijosParaCalculo = Math.floor(fijos / 2); // Usar solo la mitad de fijos para el calculo
            demandaEventuales = Math.max(0, demandaTotal - fijosParaCalculo);
            esPrimeraJornadaActiva = false;
          } else {
            demandaEventuales = demandaTotal;
            if (esUsuarioOC && esPrimeraJornadaActiva) {
              esPrimeraJornadaActiva = false;
            }
          }

          console.log('DEBUG demandaEventuales para ' + jornada.codigo + ':', {
            esUsuarioOC: esUsuarioOC,
            demandaTotal: demandaTotal,
            demandaEventuales: demandaEventuales
          });

          // Guardar puerta antes del avance
          var puertaAntes = puertaPrevista;

          // Verificar si el usuario sale contratado usando la funcion que recorre el censo
          // Pasamos puertaInicialDia para detectar cuando empieza la segunda vuelta del dÃ­a
          var resultadoContratacion = verificarContratacion(puertaAntes, demandaEventuales, posUsuarioCalc, puertaInicialDia);

          puertaPrevista = resultadoContratacion.puertaFinal;
          var vuelta = resultadoContratacion.vueltas + 1;
          var saleContratado = resultadoContratacion.alcanzado;
          var puertaPasoPorUsuario = resultadoContratacion.puertaPasoPorUsuario;
          var esSegundaVueltaDia = resultadoContratacion.yaEsSegundaVuelta;

          // Calcular cuantas posiciones disponibles faltan para llegar al usuario
          var distanciaNecesaria = calcularDistanciaEfectiva(puertaAntes, posUsuarioCalc);

          // Acumular demanda
          demandaAcumulada += demandaEventuales;

          // IMPORTANTE: Para el calculo de probabilidades, usamos puertaPasoPorUsuario
          // Esto hace que usuarios en rojo tengan la misma probabilidad que si estuvieran disponibles
          // porque la puerta pasa igualmente por su posicion
          var usarLogicaContratado = saleContratado || puertaPasoPorUsuario;

          // Calcular margen
          var margen;
          if (usarLogicaContratado) {
            var posicionesHastaUsuario = calcularDistanciaEfectiva(puertaAntes, posUsuarioCalc);
            margen = demandaEventuales - posicionesHastaUsuario;
          } else {
            margen = demandaEventuales - distanciaNecesaria;
          }

          // Calcular probabilidad BASE de salir en esta jornada (0 a 1)
          // Usamos una funcion suave basada en el margen
          var probBaseSalir;

          // Detectar si es DOBLE TURNO REAL (segunda vuelta del censo en el dia)
          // Esto ocurre cuando la puerta ya ha recorrido todo el censo una vez
          // y vuelve a pasar por las mismas posiciones
          var esSegundaVueltaCenso = vuelta >= 3;

          // CASO ESPECIAL: Si el usuario esta "justo detras" de la puerta al inicio de esta jornada,
          // significa que en jornadas anteriores la puerta paso justo por delante del usuario.
          // En este caso, la demanda de esta jornada lo alcanzara casi seguro.
          var estaJustoDetras = usuarioJustoDetras(puertaAntes, posUsuarioCalc, 15);
          var distanciaDirectaDetras = 0;
          if (posUsuarioCalc < puertaAntes) {
            distanciaDirectaDetras = puertaAntes - posUsuarioCalc;
          }

          if (usarLogicaContratado) {
            // La puerta pasa por el usuario: probabilidad usando formula continua y suave
            // Basada en el ratio margen/demanda para ser proporcional
            // Esto evita saltos bruscos entre posiciones contiguas
            var ratioMargen = margen / Math.max(1, demandaEventuales);

            // Formula sigmoide suavizada: va de ~40% (ratio=0) a ~85% (ratio=1)
            // prob = 0.40 + 0.45 * (ratio / (ratio + 0.3))
            // Esto da una curva suave sin saltos
            if (ratioMargen >= 1) {
              // Margen >= demanda, muy seguro pero nunca 100%
              probBaseSalir = 0.82 + Math.min(0.06, (ratioMargen - 1) * 0.03);
            } else if (ratioMargen >= 0) {
              // Formula suave: 42% base + hasta 40% segun ratio
              probBaseSalir = 0.42 + 0.40 * (ratioMargen / (ratioMargen + 0.25));
            } else {
              // Margen negativo (muy justo)
              probBaseSalir = 0.38;
            }

            // Ajuste para OC con margen pequeÃ±o
            if (esUsuarioOC && margen <= 3) {
              probBaseSalir = Math.min(probBaseSalir, 0.45 + margen * 0.02);
            }
          } else {
            // No sale contratado segun la simulacion directa
            // La puerta NO pasa por el usuario en esta jornada
            // Calcular probabilidad segun lo cerca que se queda

            // IMPORTANTE: Calcular ratio de cobertura (cuÃ¡nto de la distancia cubre la demanda)
            var ratioCobertura = demandaEventuales / Math.max(1, distanciaNecesaria);

            // LÃGICA DIFERENTE para OC vs SP
            if (esUsuarioOC) {
              // ========================================================================
              // LÃGICA PARA USUARIOS DE OC
              // ========================================================================
              // Para OC, la probabilidad debe basarse en:
              // 1. La distancia desde donde EMPIEZA la jornada hasta el usuario (distanciaNecesaria)
              // 2. El ratio de cobertura (demanda / distancia)
              // Cuanto mÃ¡s cerca estÃ© la puerta del usuario AL INICIO, mayor la probabilidad
              // Cuanto mayor sea el ratio de cobertura, mayor la probabilidad

              // Base de probabilidad segÃºn el ratio de cobertura
              if (ratioCobertura >= 0.90) {
                // La demanda cubre el 90% o mÃ¡s de la distancia â muy alta probabilidad
                probBaseSalir = 0.70 + (ratioCobertura - 0.90) * 0.80; // 70-78%
              } else if (ratioCobertura >= 0.70) {
                // 70-90% de cobertura â alta probabilidad
                probBaseSalir = 0.52 + (ratioCobertura - 0.70) * 0.90; // 52-70%
              } else if (ratioCobertura >= 0.50) {
                // 50-70% de cobertura â probabilidad media-alta
                probBaseSalir = 0.35 + (ratioCobertura - 0.50) * 0.85; // 35-52%
              } else if (ratioCobertura >= 0.30) {
                // 30-50% de cobertura â probabilidad media
                probBaseSalir = 0.20 + (ratioCobertura - 0.30) * 0.75; // 20-35%
              } else if (ratioCobertura >= 0.15) {
                // 15-30% de cobertura â probabilidad baja
                probBaseSalir = 0.08 + (ratioCobertura - 0.15) * 0.80; // 8-20%
              } else {
                // < 15% de cobertura â probabilidad muy baja
                probBaseSalir = Math.max(0.01, ratioCobertura * 0.50); // 0.5-7.5%
              }

              // Ajuste adicional segÃºn la distancia absoluta
              // Si la distancia es muy pequeÃ±a, incluso con ratio bajo puede haber probabilidad razonable
              if (distanciaNecesaria <= 5) {
                // Muy cerca (1-5 posiciones)
                probBaseSalir = Math.max(probBaseSalir, 0.55 + (5 - distanciaNecesaria) * 0.05); // mÃ­nimo 55-80%
              } else if (distanciaNecesaria <= 10) {
                // Cerca (6-10 posiciones)
                probBaseSalir = Math.max(probBaseSalir, 0.40 + (10 - distanciaNecesaria) * 0.03); // mÃ­nimo 40-55%
              } else if (distanciaNecesaria <= 20) {
                // Relativamente cerca (11-20 posiciones)
                probBaseSalir = Math.max(probBaseSalir, 0.25 + (20 - distanciaNecesaria) * 0.015); // mÃ­nimo 25-40%
              }

            } else {
              // ========================================================================
              // LÃGICA PARA USUARIOS DE SP (sin cambios)
              // ========================================================================
              var posicionRestante = posUsuarioCalc - puertaPrevista;
              if (posicionRestante < 0) {
                // La puerta pasÃ³ de largo (dio vuelta), calcular distancia real
                posicionRestante = (limiteFin - puertaPrevista) + (posUsuarioCalc - limiteInicio) + 1;
              }

              // PROBABILIDAD SUAVE Y PROGRESIVA segÃºn distancia
              // Ajustada para ser mÃ¡s realista con distancias cortas
              if (posicionRestante <= 10) {
                // Muy cerca (1-10 posiciones), prob muy alta
                probBaseSalir = 0.60 + (10 - posicionRestante) * 0.015; // 60-75%
              } else if (posicionRestante <= 30) {
                // Cerca (11-30 posiciones), prob alta
                probBaseSalir = 0.45 + (30 - posicionRestante) * 0.0075; // 45-60%
              } else if (posicionRestante <= 50) {
                // Rango cercano-medio (31-50 posiciones), prob media-alta
                probBaseSalir = 0.32 + (50 - posicionRestante) * 0.0065; // 32-45%
              } else if (posicionRestante <= 80) {
                // Algo lejos (51-80 posiciones), prob media
                probBaseSalir = 0.18 + (80 - posicionRestante) * 0.0047; // 18-32%
              } else if (posicionRestante <= 120) {
                // Lejos (81-120 posiciones), prob media-baja
                probBaseSalir = 0.08 + (120 - posicionRestante) * 0.0025; // 8-18%
              } else if (posicionRestante <= 180) {
                // Muy lejos (121-180 posiciones), prob baja
                probBaseSalir = Math.min(0.05, Math.max(0.02, ratioCobertura * 0.15)); // 2-5%
              } else {
                // Extremadamente lejos (>180 posiciones), prob muy baja
                probBaseSalir = Math.min(0.02, Math.max(0.005, ratioCobertura * 0.08)); // 0.5-2%
              }

              // PENALIZACIÃN por cobertura insuficiente (AJUSTADA)
              // Solo penalizar si la puerta se quedÃ³ MUY lejos (>80 posiciones)
              // Si se quedÃ³ cerca (<50 posiciones), NO penalizar porque la demanda fue efectiva
              if (ratioCobertura < 1.0 && posicionRestante > 80) {
                // La demanda NO alcanza Y la puerta se quedÃ³ MUY lejos
                // Penalizar segÃºn quÃ© tan lejos quedÃ³
                var factorPenalizacion = Math.max(0.20, Math.min(0.75, ratioCobertura * 0.85));
                probBaseSalir = probBaseSalir * factorPenalizacion;
              } else if (ratioCobertura < 0.7 && posicionRestante > 50 && posicionRestante <= 80) {
                // Distancia media (50-80) con demanda muy baja (<70% de cobertura)
                // PenalizaciÃ³n moderada
                var factorPenalizacion = Math.max(0.50, ratioCobertura * 1.2);
                probBaseSalir = probBaseSalir * factorPenalizacion;
              }
              // Si posicionRestante <= 50: NO penalizar, la demanda fue suficiente para llegar cerca
            }
          }

          // IMPORTANTE: Dar prioridad a la jornada inmediatamente siguiente
          // Si esta NO es la primera jornada y hay probabilidad residual de jornadas anteriores,
          // esta jornada (la siguiente) deberia capturar la mayor parte de esa probabilidad.
          // Guardamos el indice para aplicar este ajuste despues del bucle

          // NOTA: Ya no penalizamos por "segunda vuelta" aqui
          // La segunda vuelta solo aplica si YA trabajaste en el dia (doble turno)
          // Eso se maneja en otro lugar, no en el calculo de probabilidad base

          // IMPORTANTE: Asegurar que probBaseSalir este siempre en rango valido [0, 0.99]
          probBaseSalir = Math.max(0, Math.min(0.99, probBaseSalir));

          // Guardar datos de esta jornada
          puntuacionesJornadas.push({
            jornada: jornada,
            probBaseSalir: probBaseSalir,
            sinDatos: false,
            puertaAntes: puertaAntes,
            puertaDespues: puertaPrevista,
            distanciaNecesaria: distanciaNecesaria,
            demandaEventuales: demandaEventuales,
            vuelta: vuelta,
            saleContratado: saleContratado,
            puertaPasoPorUsuario: puertaPasoPorUsuario,
            usarLogicaContratado: usarLogicaContratado,
            margen: margen,
            esSegundaVueltaDia: esSegundaVueltaDia
          });
        }

        // SISTEMA SIMPLIFICADO DE PROBABILIDADES
        // PRIORIDAD: Si la puerta PASA por el usuario en una jornada, esa debe tener prob muy alta

        var demandaTotalDia = 0;
        var primeraJornadaConDatos = -1;
        var primeraJornadaQueAlcanza = -1; // Primera jornada donde la puerta pasa por el usuario

        for (var j = 0; j < puntuacionesJornadas.length; j++) {
          if (!puntuacionesJornadas[j].sinDatos) {
            demandaTotalDia += puntuacionesJornadas[j].demandaEventuales;
            if (primeraJornadaConDatos === -1) {
              primeraJornadaConDatos = j;
            }
            // Detectar primera jornada que alcanza al usuario
            if (primeraJornadaQueAlcanza === -1 && puntuacionesJornadas[j].usarLogicaContratado) {
              primeraJornadaQueAlcanza = j;
            }
          }
        }

        // Distancia inicial desde la puerta al usuario (primera jornada)
        var distanciaInicial = primeraJornadaConDatos >= 0 ?
          puntuacionesJornadas[primeraJornadaConDatos].distanciaNecesaria : 999;

        // Cobertura total: cuantas veces la demanda del dia cubre la distancia al usuario
        var coberturaTotalDia = demandaTotalDia / Math.max(1, distanciaInicial);

        // Probabilidades condicionales mejoradas
        var probabilidadesFinales = [];
        var probAcumuladaNoSalir = 1.0;

        for (var j = 0; j < puntuacionesJornadas.length; j++) {
          var datos = puntuacionesJornadas[j];

          if (datos.sinDatos) {
            probabilidadesFinales.push({
              datos: datos,
              probabilidad: 0,
              sinDatos: true
            });
            continue;
          }

          var probBaseSalirAjustada = datos.probBaseSalir;

          // ============================================================================
          // AJUSTE SUAVE Y PROGRESIVO: Distribuir probabilidad cuando hay transiciÃ³n cerca
          // Si una jornada se quedÃ³ cerca pero no llega, y la siguiente pasa pero por poco,
          // las probabilidades deben ser similares (progresiÃ³n suave)
          // ============================================================================

          // BOOST para Ãºltima jornada cuando la cobertura total es alta
          // Si es la Ãºltima jornada con datos y la cobertura >= 1.0, significa que
          // al final del dÃ­a la puerta pasarÃ¡ al usuario, asÃ­ que esta jornada
          // debe capturar la probabilidad residual
          var esUltimaJornada = (j === puntuacionesJornadas.length - 1) ||
                                (j < puntuacionesJornadas.length - 1 && puntuacionesJornadas[j+1].sinDatos);

          if (esUltimaJornada && !datos.usarLogicaContratado && coberturaTotalDia >= 1.0) {
            // La puerta pasarÃ¡ al usuario al final del dÃ­a, pero no en esta jornada especÃ­fica
            // Aumentar la probabilidad proporcionalmente a la cobertura
            var boostUltimaJornada = Math.min(0.55, 0.20 + (coberturaTotalDia - 1.0) * 0.20);
            probBaseSalirAjustada = Math.max(probBaseSalirAjustada, boostUltimaJornada);
          }

          // Detectar si la jornada ANTERIOR se quedÃ³ relativamente cerca pero no llegÃ³
          var jornadaAnteriorCerca = false;
          var distanciaFaltanteAnterior = 0;
          if (j > 0 && !puntuacionesJornadas[j-1].sinDatos && !puntuacionesJornadas[j-1].usarLogicaContratado) {
            var anterior = puntuacionesJornadas[j-1];
            // La distancia que falta es la distanciaNecesaria de la jornada actual
            // (desde donde empieza esta jornada hasta el usuario)
            distanciaFaltanteAnterior = datos.distanciaNecesaria;

            // Considerar "cerca" solo hasta 35 posiciones efectivas (muy restrictivo)
            // Este sistema de equilibrio solo debe aplicarse en casos EXTREMADAMENTE ajustados
            if (distanciaFaltanteAnterior <= 35) {
              jornadaAnteriorCerca = true;
            }
          }

          // CASO 1: Esta jornada SÃ alcanza al usuario
          if (datos.usarLogicaContratado) {
            // Si la anterior se quedÃ³ cerca Y esta pasa por poco margen
            // Margen <= 8 significa que esta jornada pasa por MUY poco (extremadamente restrictivo)
            if (jornadaAnteriorCerca && datos.margen <= 8) {
              // Ambas estÃ¡n en zona de transiciÃ³n â equilibrar probabilidades
              // Cuanto mÃ¡s cerca se quedÃ³ la anterior y menos margen tiene esta, mÃ¡s reducir
              var ratioEquilibrio = distanciaFaltanteAnterior / Math.max(1, datos.margen);

              // IMPORTANTE: Solo equilibrar si el ratio indica transiciÃ³n MUY real
              // Este sistema fue diseÃ±ado para casos EXTREMADAMENTE ajustados
              // Si ratio < 0.75: esta jornada tiene bastante margen, NO reducir
              // Si ratio > 1.35: la anterior fallÃ³ por suficiente diferencia, NO reducir
              // Solo equilibrar si ratio estÃ¡ entre 0.75 y 1.35 (zona crÃ­tica)
              if (ratioEquilibrio >= 0.75 && ratioEquilibrio <= 1.35) {
                // Reducir proporcionalmente al ratio
                // Ratio alto (anterior muy cerca, esta con poco margen) = reducir mÃ¡s
                // Si ratio â 1: factor 0.85 (reducir 15%)
                // Si ratio â 1.3: factor 0.75 (reducir 25%)
                // Si ratio < 1: factor 0.92 (reducir 8%)
                var factorReduccion = Math.max(0.70, Math.min(0.95, 0.88 - (ratioEquilibrio - 1) * 0.12));
                probBaseSalirAjustada = datos.probBaseSalir * factorReduccion;
              }
            }
          }
          // CASO 2: Esta jornada NO alcanza
          else {
            // Ver si la SIGUIENTE jornada sÃ­ alcanza y por poco
            if (j < puntuacionesJornadas.length - 1 && !puntuacionesJornadas[j+1].sinDatos) {
              var siguiente = puntuacionesJornadas[j+1];
              var distanciaFaltante = datos.distanciaNecesaria;

              // Si la siguiente SÃ alcanza con poco margen Y nosotros nos quedamos cerca
              // Considerar "cerca" solo hasta 35 posiciones efectivas (muy restrictivo)
              // Margen <= 8 significa que la siguiente pasa por MUY poco (extremadamente restrictivo)
              if (siguiente.usarLogicaContratado && siguiente.margen <= 8 && distanciaFaltante <= 35) {
                // Calcular ratio para verificar si realmente estÃ¡n en zona de transiciÃ³n
                var ratioEquilibrio = distanciaFaltante / Math.max(1, siguiente.margen);

                // IMPORTANTE: Solo equilibrar si el ratio indica transiciÃ³n MUY real
                // Este sistema fue diseÃ±ado para casos EXTREMADAMENTE ajustados
                // Si ratio > 1.25: esta jornada fallÃ³ por suficiente diferencia, NO aumentar
                // Si ratio < 0.75: la siguiente tiene mucho margen, NO aumentar
                // Solo equilibrar si ratio estÃ¡ entre 0.75 y 1.25 (zona crÃ­tica)
                if (ratioEquilibrio >= 0.75 && ratioEquilibrio <= 1.25) {
                  // Aumentar probabilidad de esta jornada para equilibrar
                  // Aumentar mÃ¡s cuando estamos muy cerca y la siguiente tiene poco margen
                  // Si distanciaFaltante â margen siguiente: aumentar moderadamente
                  var factorAumento = Math.max(1.15, Math.min(1.50, 1.30 + (1 - ratioEquilibrio) * 0.25));
                  probBaseSalirAjustada = Math.min(0.58, datos.probBaseSalir * factorAumento);
                }
              }
            }
          }

          // Asegurar rango valido
          probBaseSalirAjustada = Math.max(0, Math.min(0.95, probBaseSalirAjustada));

          // Probabilidad de salir en esta jornada
          var probEstaJornada = probAcumuladaNoSalir * probBaseSalirAjustada;

          // Actualizar probabilidad acumulada de no salir
          probAcumuladaNoSalir = probAcumuladaNoSalir * (1 - probBaseSalirAjustada);
          probAcumuladaNoSalir = Math.max(0, probAcumuladaNoSalir);

          probabilidadesFinales.push({
            datos: datos,
            probabilidad: probEstaJornada,
            sinDatos: false
          });
        }

        // La probabilidad de no trabajar
        var probNoTrabajar = probAcumuladaNoSalir;

        // Si la cobertura total es muy alta, forzar prob de no trabajar a ser baja
        // Cobertura >= 1.0 significa que al final del dÃ­a la puerta pasarÃ¡ al usuario
        if (coberturaTotalDia >= 2.5) {
          probNoTrabajar = Math.min(probNoTrabajar, 0.015); // 1.5% mÃ¡ximo
        } else if (coberturaTotalDia >= 2.0) {
          probNoTrabajar = Math.min(probNoTrabajar, 0.02); // 2% mÃ¡ximo
        } else if (coberturaTotalDia >= 1.7) {
          probNoTrabajar = Math.min(probNoTrabajar, 0.03); // 3% mÃ¡ximo
        } else if (coberturaTotalDia >= 1.5) {
          probNoTrabajar = Math.min(probNoTrabajar, 0.04); // 4% mÃ¡ximo
        } else if (coberturaTotalDia >= 1.2) {
          probNoTrabajar = Math.min(probNoTrabajar, 0.06); // 6% mÃ¡ximo
        } else if (coberturaTotalDia >= 1.0) {
          probNoTrabajar = Math.min(probNoTrabajar, 0.08); // 8% mÃ¡ximo
        }

        // Normalizar para que sumen 100%
        var sumaProbs = probNoTrabajar;
        for (var j = 0; j < probabilidadesFinales.length; j++) {
          if (!probabilidadesFinales[j].sinDatos) {
            sumaProbs += probabilidadesFinales[j].probabilidad;
          }
        }

        // Proteger contra sumaProbs muy pequena o invalida
        if (sumaProbs < 0.001 || isNaN(sumaProbs)) {
          sumaProbs = 1;
        }

        // Convertir a porcentajes
        var mejorJornada = null;
        var mejorProbabilidad = 0;

        for (var j = 0; j < probabilidadesFinales.length; j++) {
          var item = probabilidadesFinales[j];
          var datos = item.datos;

          if (item.sinDatos) {
            var mensaje = datos.sinContratacion ? 'No hay contrataciÃ³n' : 'Sin datos';
            resultadosHTML += '<div class="calc-resultado-item probability-none" style="padding: 0.75rem;"><div style="display: flex; justify-content: space-between; align-items: center;"><span class="resultado-jornada" style="font-size: 0.9rem; font-weight: 600;">' + datos.jornada.nombre + '</span><span style="font-size: 0.75rem; color: #94a3b8;">' + mensaje + '</span></div></div>';
            continue;
          }

          // Calcular probabilidad normalizada como porcentaje
          var probabilidad = Math.round((item.probabilidad / sumaProbs) * 100);

          // Asegurar que el porcentaje este en rango valido [0, 100]
          probabilidad = Math.max(0, Math.min(100, probabilidad));

          // Determinar clase y mensaje segun rangos:
          // 80-100: Calienta que sales (verde claro)
          // 60-80: Bastante probable (verde oscuro)
          // 40-60: Va a estar justo (amarillo)
          // 20-40: Poco probable (naranja)
          // 0-20: Dificil (rojo)
          var clase, mensaje;
          if (probabilidad >= 80) {
            clase = 'probability-very-high';
            mensaje = 'Calienta que sales';
          } else if (probabilidad >= 60) {
            clase = 'probability-high';
            mensaje = 'Bastante probable';
          } else if (probabilidad >= 40) {
            clase = 'probability-medium';
            mensaje = 'Va a estar justo';
          } else if (probabilidad >= 20) {
            clase = 'probability-low-medium';
            mensaje = 'Poco probable';
          } else {
            clase = 'probability-low';
            mensaje = 'Dificil';
          }

          if (probabilidad > mejorProbabilidad) {
            mejorProbabilidad = probabilidad;
            mejorJornada = datos.jornada.nombre;
          }

          // Crear HTML compacto del resultado
          var v2Badge = datos.esSegundaVueltaDia ? '<span style="background: rgba(139, 92, 246, 0.2); color: #8b5cf6; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.65rem; font-weight: 600; margin-left: 0.25rem;">2Âª V</span>' : '';

          resultadosHTML += '<div class="calc-resultado-item ' + clase + '" style="padding: 0.75rem; margin-bottom: 0.5rem;">';
          resultadosHTML += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">';
          resultadosHTML += '<div style="display: flex; align-items: center;"><span class="resultado-jornada" style="font-size: 0.95rem; font-weight: 600;">' + datos.jornada.nombre + '</span>' + v2Badge + '</div>';
          resultadosHTML += '<div style="display: flex; align-items: center; gap: 0.5rem;"><span class="resultado-mensaje" style="font-size: 0.8rem; color: inherit; opacity: 0.9;">' + mensaje + '</span><span class="resultado-prob" style="font-size: 1.1rem; font-weight: 700;">' + probabilidad + '%</span></div>';
          resultadosHTML += '</div>';
          resultadosHTML += '<div style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.7); display: flex; flex-wrap: wrap; gap: 0.75rem;">';
          resultadosHTML += '<span>ðª ' + datos.puertaAntes + 'â' + datos.puertaDespues + '</span>';
          resultadosHTML += '<span>ð¤ Pos: ' + posUsuarioCalc + '</span>';
          resultadosHTML += '<span>ð Faltan: ' + Math.round(datos.distanciaNecesaria) + '</span>';
          resultadosHTML += '<span>ðï¸ Dem: ' + datos.demandaEventuales + '</span>';
          resultadosHTML += '</div>';
          resultadosHTML += '</div>';
        }

        // Calcular probabilidad de no trabajar (ya calculada arriba, convertir a porcentaje)
        var probNoTrabajarPct = Math.round((probNoTrabajar / sumaProbs) * 100);

        // Asegurar que el porcentaje de no trabajar este en rango valido [0, 100]
        probNoTrabajarPct = Math.max(0, Math.min(100, probNoTrabajarPct));

        // Resumen del dia compacto
        var resumenMensaje = '';
        var resumenIcon = '';
        if (mejorProbabilidad >= 35) {
          resumenMensaje = 'Mejor opciÃ³n: <strong>' + mejorJornada + '</strong> (' + mejorProbabilidad + '%)';
          resumenIcon = 'ð¯';
        } else if (mejorProbabilidad >= 15) {
          resumenMensaje = 'Posibilidades en: <strong>' + mejorJornada + '</strong> (' + mejorProbabilidad + '%)';
          resumenIcon = 'ð¤';
        } else {
          resumenMensaje = 'Hoy lo tienes difÃ­cil (' + probNoTrabajarPct + '% no trabajar)';
          resumenIcon = 'ð';
        }

        // HTML compacto del resumen
        var resumenHTML = '<div class="calc-resumen-dia" style="padding: 1.25rem; margin-bottom: 1rem;">';
        resumenHTML += '<div style="text-align: center; margin-bottom: 1rem;">';
        resumenHTML += '<div style="font-size: 3rem; margin-bottom: 0.5rem;">' + resumenIcon + '</div>';
        resumenHTML += '<div style="font-size: 1.1rem; font-weight: 600; line-height: 1.4;">' + resumenMensaje + '</div>';
        resumenHTML += '</div>';
        resumenHTML += '<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; font-size: 0.75rem;">';
        resumenHTML += '<div style="background: rgba(139, 92, 246, 0.15); padding: 0.5rem; border-radius: 0.5rem; text-align: center;"><div style="color: rgba(255, 255, 255, 0.7); font-size: 0.65rem; margin-bottom: 0.125rem;">Tu PosiciÃ³n</div><div style="font-weight: 700; font-size: 0.9rem;">' + posicionUsuario + '</div></div>';
        resumenHTML += '<div style="background: rgba(59, 130, 246, 0.15); padding: 0.5rem; border-radius: 0.5rem; text-align: center;"><div style="color: rgba(255, 255, 255, 0.7); font-size: 0.65rem; margin-bottom: 0.125rem;">Puerta</div><div style="font-weight: 700; font-size: 0.9rem;">' + puertaActual + '</div></div>';
        resumenHTML += '<div style="background: rgba(239, 68, 68, 0.15); padding: 0.5rem; border-radius: 0.5rem; text-align: center;"><div style="color: rgba(255, 255, 255, 0.7); font-size: 0.65rem; margin-bottom: 0.125rem;">No Trabajar</div><div style="font-weight: 700; font-size: 0.9rem;">' + probNoTrabajarPct + '%</div></div>';
        resumenHTML += '</div>';
        resumenHTML += '</div>';

        resultadoDiv.innerHTML = resumenHTML + resultadosHTML;
        resultadoDiv.classList.remove('hidden');
        resultadoDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });

      } catch (error) {
        console.error('Error:', error);
        alert('Error al calcular: ' + error.message);
      } finally {
        newBtn.innerHTML = 'Â¿Cuando voy a trabajar?';
        newBtn.disabled = false;
      }
    });
  }
}
