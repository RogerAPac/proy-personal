$(document).ready(function() {

    // 1. RELOJ
    function updateClock() {
        $('#liveClock').text(new Date().toLocaleTimeString('es-ES'));
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 2. DATOS DEL CATÁLOGO
    const catalogData = {
        'pino': [
            { name: 'Tabla 2x4 Pulgada', icon: 'bi-rulers' },
            { name: 'Tabla 1x6 Pulgada', icon: 'bi-rulers' },
            { name: 'Vigas 4x4', icon: 'bi-border-width' },
            { name: 'Triplex 18mm', icon: 'bi-layers' }
        ],
        'roble': [
            { name: 'Tabla Lisa 3m', icon: 'bi-rulers' },
            { name: 'Tabla Lisa 2m', icon: 'bi-rulers' },
            { name: 'Molduras Roble', icon: 'bi-border-all' }
        ],
        'cedro': [
            { name: 'Tabla Fina 1m', icon: 'bi-rulers' },
            { name: 'Tabla Gruesa 2m', icon: 'bi-border-width' },
            { name: 'Postes Cedro', icon: 'bi-distribute-vertical' }
        ],
        'accesorios': [
            { name: 'Caja de Clavos', icon: 'bi-hammer' },
            { name: 'Barniz Brillante', icon: 'bi-brush' },
            { name: 'Lija para Madera', icon: 'bi-grid' },
            { name: 'Pegamento Carpintero', icon: 'bi-droplet' }
        ]
    };

    let currentService = '', currentPricePerHour = 0, currentStation = '';
    let timerInterval, modalInstance = null;

    // 3. SELECCIÓN DE MENÚ (Delegación de eventos)
    $('#mainMenu').off('click', '.giant-btn').on('click', '.giant-btn', function() {
        currentService = $(this).data('target');
        
        if (currentService === 'pino') currentPricePerHour = 150;
        if (currentService === 'roble') currentPricePerHour = 350;
        if (currentService === 'cedro') currentPricePerHour = 280;
        if (currentService === 'accesorios') currentPricePerHour = 20;

        $('#mainMenu').fadeOut('fast', function() {
            $('#catalogSection').fadeIn('fast').css('display', 'flex');
            $('#catalogTitle').text(currentService.toUpperCase());
            
            if (currentService === 'accesorios') {
                $('#stationView').hide();
                $('#gameView').css('display', 'flex');
                loadGames('accesorios');
            } else {
                $('#stationView').css('display', 'block');
                $('#gameView').hide();
                generateStations(currentService);
            }
        });
    });

    // 4. GENERAR LOTES DISPONIBLES
    function generateStations(service) {
        let grid = $('#stationGrid');
        grid.empty();
        let prefix = service.toUpperCase();
        
        for (let i = 1; i <= 10; i++) {
            let isBusy = Math.random() < 0.3; 
            let statusClass = isBusy ? 'busy' : 'available';
            let statusText = isBusy ? 'Agotado' : 'Disponible';
            
            grid.append(`
                <div class="station-card ${statusClass}" data-station="${prefix}-${i}">
                    <i class="bi bi-box-seam"></i>
                    <h4>Lote ${prefix}-${i}</h4>
                    <span>${statusText}</span>
                </div>
            `);
        }
    }

    // Delegación de eventos en lotes
    $('#stationGrid').off('click', '.station-card.available').on('click', '.station-card.available', function() {
        currentStation = $(this).data('station');
        $('#stationView').fadeOut('fast', function() {
            $('#gameView').css('display', 'flex').hide().fadeIn('fast');
            loadGames(currentService);
        });
    });

    // 5. CARGAR PRODUCTOS (Con Lazy Loading)
    function loadGames(service) {
        let grid = $('#gameGrid');
        grid.empty();

        catalogData[service].forEach(game => {
            // ✅ Imágenes con loading="lazy" para no saturar la red inicial
            grid.append(`
                <div class="game-card" data-name="${game.name.toLowerCase()}">
                    <img src="https://picsum.photos/seed/${game.name.replace(/\s/g, '')}/100/100" loading="lazy" width="64" height="64" style="border-radius: 8px; margin-bottom: 5px;" alt="${game.name}">
                    <i class="bi ${game.icon} d-none"></i>
                    <span>${game.name}</span>
                </div>
            `);
        });

        $('#actionPanel').show();
        if(service !== 'accesorios') {
            $('#currentStationName').text(currentStation);
            $('#startPrice').text(currentPricePerHour);
        } else {
            $('#currentStationName').text("Accesorios de Carpintería");
            $('#startPrice').text("20");
        }
    }

    // VOLVER ATRÁS
    $('#btnBack').off('click').on('click', function() {
        if (currentService === 'accesorios') {
            $('#catalogSection').fadeOut('fast', () => $('#mainMenu').fadeIn('fast').css('display', 'flex'));
        } else {
            if ($('#gameView').is(':visible')) {
                $('#gameView').fadeOut('fast', () => $('#stationView').fadeIn('fast').css('display', 'block'));
            } else {
                $('#stationView').fadeOut('fast', () => $('#mainMenu').fadeIn('fast').css('display', 'flex'));
            }
        }
    });

    // 6. RESERVAR LOTE
    $('#btnReservar').off('click').on('click', function() {
        $('#modalActionType').text('Reserva de Lote');
        $('#modalConsoleName').text(currentStation !== "" ? currentStation : "Accesorios Varios");
        $('#hrsInput').val(1);
        calcularTotalReserva();
        $('#timerContainer').show();

        modalInstance = new bootstrap.Modal(document.getElementById('reservaModal'));
        modalInstance.show();

        let timeLeft = 300;
        $('#timerDisplay').text('05:00');
        clearInterval(timerInterval);
        timerInterval = setInterval(function() {
            timeLeft--;
            let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
            $('#timerDisplay').text(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                modalInstance.hide();
                $('#toastAlert').html('<i class="bi bi-exclamation-triangle-fill text-warning me-2"></i> Tiempo de reserva expirado.').slideDown('fast').delay(3000).fadeOut('fast');
            }
        }, 1000);
    });

    $('#hrsInput').off('input').on('input', calcularTotalReserva);
    function calcularTotalReserva() {
        let hrs = $('#hrsInput').val();
        if (hrs < 1) { $('#hrsInput').val(1); hrs = 1; }
        $('#totalPay').text(hrs * currentPricePerHour);
    }

    // 7. COMPRAR YA
    $('#btnEmpezar').off('click').on('click', function() {
        $('#modalActionType').text('Compra Directa');
        $('#modalConsoleName').text(currentStation !== "" ? currentStation : "Accesorios Varios");
        $('#hrsInput').val(1);
        calcularTotalReserva();
        $('#timerContainer').hide(); 
        clearInterval(timerInterval);

        modalInstance = new bootstrap.Modal(document.getElementById('reservaModal'));
        modalInstance.show();
    });

    // PROCESAR PAGO
    $('#btnConfirm').off('click').on('click', function() {
        clearInterval(timerInterval);
        if(modalInstance) modalInstance.hide();
        
        let action = $('#modalActionType').text();
        let cant = $('#hrsInput').val();
        let total = $('#totalPay').text();

        $('#toastAlert').slideDown('fast').delay(3000).fadeOut('fast');
        addLog(action.toUpperCase(), `${currentStation} - Cant: ${cant} - Total: ${total} BOB`);
        
        if(currentStation !== "") {
            $(`.station-card[data-station="${currentStation}"]`).removeClass('available').addClass('busy').find('span').text('Agotado');
        }
    });

    // 8. BITÁCORA (Con Prevención XSS)
    function addLog(tipo, mensaje) {
        let hora = new Date().toLocaleTimeString();
        
        // 🛡️ PREVENCIÓN XSS: Usamos .text() para evitar que inyecten código
        let $div = $('<div>');
        let $hora = $('<span>').addClass('text-warning').text(`[${hora}] `);
        let $tipo = $('<span>').addClass('text-info').text(`${tipo}: `);
        let $mensaje = document.createTextNode(mensaje); // Nodo de texto puro
        
        $div.append($hora, $tipo, $mensaje);
        $('#logOutput').append($div);
        $('#logOutput').scrollTop($('#logOutput')[0].scrollHeight);
    }

    // 9. MENÚ ENGRANAJE
    $('#btnSettings').off('click').on('click', function(e) {
        e.stopPropagation();
        $('#settingsMenu').slideToggle('fast');
    });

    $('#menuBitacora').off('click').on('click', function(e) {
        e.preventDefault();
        $('#settingsMenu').slideUp('fast'); 
        setTimeout(function() {
            let bitacoraModal = new bootstrap.Modal(document.getElementById('bitacoraModal'));
            bitacoraModal.show();
        }, 300); 
    });

    $(document).off('click.settings').on('click.settings', function(e) {
        if (!$(e.target).closest('.brand-box').length && !$(e.target).closest('#settingsMenu').length) {
            $('#settingsMenu').slideUp('fast');
        }
    });

    // 10. BUSCADOR (Optimizado)
    $('#gameSearch').off('keyup').on('keyup', function() {
        let val = $(this).val().toLowerCase();
        $('#gameGrid .game-card').each(function() {
            $(this).data('name').includes(val) ? $(this).show() : $(this).hide();
        });
    });
      // ============================================================
    // 11. BOTÓN SIMULACIÓN SMOKE TEST DOM (Guía Parte 2)
    // ============================================================
    $('#btnSmokeTest').off('click').on('click', function() {
        const imgsSinAlt = document.querySelectorAll('img:not([alt]), img[alt=""]').length;
        const enlacesVacios = document.querySelectorAll('a[href=""], a:not([href])').length;
        const botones = document.querySelectorAll('button').length;
        const scriptsRotos = Array.from(document.querySelectorAll('script[src]'))
            .filter(s => !s.complete && s.src).length;

        $('#salidaAudit').text(
            `Smoke Test OK · Botones: ${botones} | Imágenes sin alt: ${imgsSinAlt} | ` +
            `Enlaces vacíos: ${enlacesVacios} | Scripts sin cargar: ${scriptsRotos}`
        );

        if (imgsSinAlt > 0 || enlacesVacios > 0 || scriptsRotos > 0) {
            $('#salidaAudit').addClass('text-danger').removeClass('text-warning');
        } else {
            $('#salidaAudit').addClass('text-warning').removeClass('text-danger');
        }
    });

    // ============================================================
    // 12. BOTÓN SIMULACIÓN AUDITORÍA SEMÁNTICA (Guía de Cierre)
    // ============================================================
    $('#btnAuditarA11Y').off('click').on('click', function() {
        const zonas = document.querySelectorAll('header, nav, main, article, footer').length;
        const sinAlt = document.querySelectorAll('img:not([alt]), img[alt=""]').length;
        const h1 = document.querySelectorAll('h1').length;
        const ariaLabels = document.querySelectorAll('[aria-label]').length;

        $('#salidaAudit').text(
            `Auditoría en vivo: ${zonas} etiquetas semánticas HTML5 detectadas | ` +
            `Imágenes sin alt: ${sinAlt} | h1 en página: ${h1} | aria-label: ${ariaLabels}.`
        );

        if (sinAlt > 0 || h1 !== 1) {
            $('#salidaAudit').addClass('text-danger').removeClass('text-warning');
        } else {
            $('#salidaAudit').addClass('text-warning').removeClass('text-danger');
        }
    });
});
