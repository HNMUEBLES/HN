/*
=============================================================
HN DESIGNER - MOTOR PARAMÉTRICO REAL PASO 9 (SELECCIÓN DE SECTOR)
=============================================================
*/

let hnScene = null;
let hnCamera = null;
let hnRenderer = null;
let hnControls = null;
let hnAnimationId = null;
let hnRaycaster = new THREE.Raycaster();
let hnMouse = new THREE.Vector2();

let hnModuloActual = {
    moduleId: 'mod_default',
    ancho: 1000,
    alto: 2000,
    profundidad: 500,
    espesor: 18,
    fondo: 3,
    x: 0,
    y: 0,
    z: 0
};

let hnEspaciosActuales = [];
let hnSectoresActuales = [];
let hnElementosActuales = []; 
let hnCajonesActuales = [];
let hnSeleccionActual = null; 
let timerDimensionesMaestras = null;

function abrirHNDesigner() {
    const designer = document.getElementById('hn-designer');
    if (designer) {
        designer.style.display = 'flex';
        initHNDesigner3D();
    }
}

function cerrarHNDesigner() {
    const designer = document.getElementById('hn-designer');
    if (designer) {
        designer.style.display = 'none';
        if (hnAnimationId) {
            cancelAnimationFrame(hnAnimationId);
            hnAnimationId = null;
        }
    }
}

function initHNDesigner3D() {
    const container = document.getElementById('hn-viewport-3d');
    if (!container) return;

    container.innerHTML = '';

    const width = container.clientWidth;
    const height = container.clientHeight;

    hnScene = new THREE.Scene();
    hnScene.background = new THREE.Color(0xf8fafc);

    hnCamera = new THREE.PerspectiveCamera(45, width / height, 1, 50000);
    hnCamera.position.set(0, 1000, 3000);

    hnRenderer = new THREE.WebGLRenderer({ antialias: true });
    hnRenderer.setSize(width, height);
    hnRenderer.setPixelRatio(window.devicePixelRatio);
    hnRenderer.shadowMap.enabled = true;
    container.appendChild(hnRenderer.domElement);

    hnControls = new THREE.OrbitControls(hnCamera, hnRenderer.domElement);
    hnControls.enableDamping = true;
    hnControls.dampingFactor = 0.05;
    hnControls.target.set(0, 1000, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    hnScene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(1000, 3000, 2000);
    hnScene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dirLight2.position.set(-1000, -1000, -2000);
    hnScene.add(dirLight2);

    const gridHelper = new THREE.GridHelper(5000, 50, 0xd1d5db, 0xe5e7eb);
    gridHelper.position.y = 0;
    hnScene.add(gridHelper);

    container.addEventListener('click', onHNDesignerClick, false);
    window.addEventListener('resize', onHNDesignerResize, false);

    crearModuloNuevoParametrico();
    animateHNDesigner();
}

function animateHNDesigner() {
    hnAnimationId = requestAnimationFrame(animateHNDesigner);
    if (hnControls) hnControls.update();
    if (hnRenderer && hnScene && hnCamera) {
        hnRenderer.render(hnScene, hnCamera);
    }
}

function onHNDesignerResize() {
    const container = document.getElementById('hn-viewport-3d');
    if (!container || document.getElementById('hn-designer').style.display !== 'flex') return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    hnCamera.aspect = width / height;
    hnCamera.updateProjectionMatrix();
    hnRenderer.setSize(width, height);
}

function crearModuloNuevoParametrico() {
    const anchoInput = document.getElementById('hn-master-ancho');
    const altoInput = document.getElementById('hn-master-alto');
    const profInput = document.getElementById('hn-master-prof');
    const espInput = document.getElementById('hn-master-espesor');
    const fondoInput = document.getElementById('hn-master-fondo');

    hnModuloActual.ancho = anchoInput ? parseFloat(anchoInput.value) || 1000 : 1000;
    hnModuloActual.alto = altoInput ? parseFloat(altoInput.value) || 2000 : 2000;
    hnModuloActual.profundidad = profInput ? parseFloat(profInput.value) || 500 : 500;
    hnModuloActual.espesor = espInput ? parseFloat(espInput.value) || 18 : 18;
    hnModuloActual.fondo = fondoInput ? parseFloat(fondoInput.value) || 3 : 3;

    hnEspaciosActuales = [{
        spaceId: 'space_' + Math.random().toString(36).substr(2, 6),
        moduleId: hnModuloActual.moduleId,
        xMin: hnModuloActual.espesor,
        xMax: hnModuloActual.ancho - hnModuloActual.espesor,
        yMin: hnModuloActual.espesor,
        yMax: hnModuloActual.alto - hnModuloActual.espesor,
        profundidad: hnModuloActual.profundidad - hnModuloActual.fondo
    }];

    hnElementosActuales = [];
    hnCajonesActuales = [];
    recalcularSectores();
    reconstruirEscena3DParametrica();
    actualizarSidebarEspacios();
    restaurarPanelDerechoMaestro();
}

function actualizarDimensionesMaestrasDebounced() {
    if (timerDimensionesMaestras) clearTimeout(timerDimensionesMaestras);
    timerDimensionesMaestras = setTimeout(() => {
        ejecutarRecalculoParametricoCompleto();
    }, 250);
}

function ejecutarRecalculoParametricoCompleto() {
    const anchoInput = document.getElementById('hn-master-ancho');
    const altoInput = document.getElementById('hn-master-alto');
    const profInput = document.getElementById('hn-master-prof');
    const espInput = document.getElementById('hn-master-espesor');
    const fondoInput = document.getElementById('hn-master-fondo');

    if (!anchoInput || !altoInput || !profInput || !espInput || !fondoInput) return;

    const nuevoAncho = parseFloat(anchoInput.value) || 1000;
    const nuevoAlto = parseFloat(altoInput.value) || 2000;
    const nuevaProf = parseFloat(profInput.value) || 500;
    const nuevoEsp = parseFloat(espInput.value) || 18;
    const nuevoFondo = parseFloat(fondoInput.value) || 3;

    const factorAncho = nuevoAncho / hnModuloActual.ancho;
    const factorAlto = nuevoAlto / hnModuloActual.alto;

    hnModuloActual.ancho = nuevoAncho;
    hnModuloActual.alto = nuevoAlto;
    hnModuloActual.profundidad = nuevaProf;
    hnModuloActual.espesor = nuevoEsp;
    hnModuloActual.fondo = nuevoFondo;

    hnEspaciosActuales.forEach(esp => {
        esp.xMin = Math.min(esp.xMin * factorAncho, hnModuloActual.ancho - hnModuloActual.espesor);
        esp.xMax = Math.min(esp.xMax * factorAncho, hnModuloActual.ancho - hnModuloActual.espesor);
        esp.yMin = Math.min(esp.yMin * factorAlto, hnModuloActual.alto - hnModuloActual.espesor);
        esp.yMax = Math.min(esp.yMax * factorAlto, hnModuloActual.alto - hnModuloActual.espesor);
        esp.profundidad = hnModuloActual.profundidad - hnModuloActual.fondo;
    });

    hnElementosActuales.forEach(elem => {
        if (elem.tipo === 'montante') {
            elem.x = Math.max(hnModuloActual.espesor, Math.min(elem.x * factorAncho, hnModuloActual.ancho - hnModuloActual.espesor - elem.espesor));
            elem.y = hnModuloActual.alto / 2;
            elem.alto = hnModuloActual.alto - (2 * hnModuloActual.espesor);
            elem.profundidad = hnModuloActual.profundidad - hnModuloActual.fondo;
        } else if (elem.tipo === 'repisa') {
            const espacioAsociado = hnEspaciosActuales.find(e => e.spaceId === elem.spaceId) || hnEspaciosActuales[0];
            if (espacioAsociado) {
                elem.width = espacioAsociado.xMax - espacioAsociado.xMin;
                elem.x = espacioAsociado.xMin + (elem.width / 2);
                elem.profundidad = espacioAsociado.profundidad;
                elem.y = Math.max(espacioAsociado.yMin + (hnModuloActual.espesor / 2), Math.min(elem.y, espacioAsociado.yMax - (hnModuloActual.espesor / 2)));
            }
        }
    });

    recalcularTodosLosCajones();
    recalcularSectores();
    reconstruirEscena3DParametrica();
    actualizarSidebarEspacios();
}

/*
=============================================================
PASO 9 — RECALCULO Y GESTIÓN DE SECTORES VERTICALES
=============================================================
*/
function recalcularSectores() {
    hnSectoresActuales = [];

    hnEspaciosActuales.forEach(space => {
        // Encontrar todas las repisas pertenecientes a este espacio
        // o ubicadas físicamente dentro de sus límites actuales.
        const repisasEnEspacio = hnElementosActuales
            .filter(e => {
                if (e.tipo !== 'repisa') return false;

                const pertenecePorId = e.spaceId === space.spaceId;
                const estaDentro = e.x >= space.xMin && e.x <= space.xMax;

                return pertenecePorId || estaDentro;
            })
            .sort((a, b) => a.y - b.y);

        // Evitar que una misma repisa pueda incorporarse dos veces
        // al cálculo de sectores.
        const repisasUnicas = [];
        const repisasIds = new Set();

        repisasEnEspacio.forEach(repisa => {
            if (!repisasIds.has(repisa.pieceId)) {
                repisasIds.add(repisa.pieceId);
                repisasUnicas.push(repisa);
            }
        });

        // Definir límites verticales según repisas
        let limitesY = [space.yMin];

        repisasUnicas.forEach(r => {
            limitesY.push(r.y - (r.espesor / 2));
            limitesY.push(r.y + (r.espesor / 2));
        });

        limitesY.push(space.yMax);

        // Crear sectores independientes entre repisas consecutivas
        for (let i = 0; i < limitesY.length; i += 2) {
            if (i + 1 < limitesY.length) {
                let yMinSec = limitesY[i];
                let yMaxSec = limitesY[i + 1];

                if (yMaxSec - yMinSec > 10) {
                    let sectorId = 'sec_' + Math.random().toString(36).substr(2, 6);

                    hnSectoresActuales.push({
                        sectorId: sectorId,
                        spaceId: space.spaceId,
                        xMin: space.xMin,
                        xMax: space.xMax,
                        yMin: yMinSec,
                        yMax: yMaxSec,
                        profundidad: space.profundidad
                    });
                }
            }
        }
    });
}

function reconstruirEscena3DParametrica() {
    if (!hnScene) return;

    const objetosAEliminar = [];
    hnScene.traverse(child => {
        if (child.isMesh && child.userData && child.userData.isParametric) {
            objetosAEliminar.push(child);
        }
    });

    objetosAEliminar.forEach(obj => {
        hnScene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else obj.material.dispose();
        }
    });

    const W = hnModuloActual.ancho;
    const H = hnModuloActual.alto;
    const D = hnModuloActual.profundidad;
    const T = hnModuloActual.espesor;
    const F = hnModuloActual.fondo;

    const piezasEstructurales = [
        { type: 'Lateral izquierdo', width: T, height: H, depth: D, x: T / 2, y: H / 2, z: D / 2 },
        { type: 'Lateral derecho', width: T, height: H, depth: D, x: W - (T / 2), y: H / 2, z: D / 2 },
        { type: 'Tapa superior', width: W - (2 * T), height: T, depth: D, x: W / 2, y: H - (T / 2), z: D / 2 },
        { type: 'Base inferior', width: W - (2 * T), height: T, depth: D, x: W / 2, y: T / 2, z: D / 2 },
        { type: 'Fondo', width: W - (2 * T), height: H - (2 * T), depth: F, x: W / 2, y: H / 2, z: F / 2 }
    ];

    piezasEstructurales.forEach(data => {
        const geom = new THREE.BoxGeometry(data.width, data.height, data.depth);
        const mat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.4, metalness: 0.1 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(data.x - (W / 2), data.y, data.z - (D / 2));

        const edges = new THREE.EdgesGeometry(geom);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 1 }));
        mesh.add(line);

        mesh.userData = { isParametric: true, tipo: 'estructura', data: data };
        hnScene.add(mesh);
    });

    // Renderizar mallas interactivas de sectores (PASO 9)
    hnSectoresActuales.forEach(sector => {
        const anchoSec = sector.xMax - sector.xMin;
        const altoSec = sector.yMax - sector.yMin;
        const profSec = sector.profundidad;
        const xSec = sector.xMin + (anchoSec / 2);
        const ySec = sector.yMin + (altoSec / 2);
        const zSec = profSec / 2;

        const isSelected = (hnSeleccionActual && hnSeleccionActual.tipo === 'sector' && hnSeleccionActual.objeto.sectorId === sector.sectorId);
        
        const geom = new THREE.BoxGeometry(anchoSec - 4, altoSec - 4, profSec - 20);
        const mat = new THREE.MeshStandardMaterial({
            color: isSelected ? 0xf59e0b : 0x3b82f6,
            transparent: true,
            opacity: isSelected ? 0.35 : 0.03,
            roughness: 0.5
        });

        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(xSec - (W / 2), ySec, zSec - (D / 2));

        if (isSelected) {
            const edges = new THREE.EdgesGeometry(geom);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xb45309, linewidth: 2 }));
            mesh.add(line);
        }

        mesh.userData = { isParametric: true, tipo: 'sector', sectorData: sector };
        hnScene.add(mesh);
    });

    // Renderizar elementos estándar (Montantes y Repisas)
    hnElementosActuales.forEach(elem => {
        let geom;

        if (elem.tipo === 'montante') {
            geom = new THREE.BoxGeometry(elem.espesor, elem.alto, elem.profundidad);
        } else if (elem.tipo === 'repisa') {
            /*
             * IMPORTANTE:
             * La repisa conserva sus propios datos paramétricos.
             * No se modifica su spaceId, x, width ni profundidad durante
             * la reconstrucción visual. La reconstrucción solamente dibuja
             * el estado existente del modelo.
             */
            geom = new THREE.BoxGeometry(elem.width, elem.espesor, elem.profundidad);
        } else {
            return;
        }

        const isSelected = (hnSeleccionActual && hnSeleccionActual.objeto.pieceId === elem.pieceId);
        const mat = new THREE.MeshStandardMaterial({
            color: isSelected ? 0xf59e0b : 0xfafafa,
            roughness: 0.4,
            metalness: 0.1
        });

        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(elem.x - (W / 2), elem.y, elem.z - (D / 2));

        const edges = new THREE.EdgesGeometry(geom);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: isSelected ? 0xb45309 : 0x94a3b8, linewidth: 1 }));
        mesh.add(line);

        mesh.userData = { isParametric: true, tipo: elem.tipo, elementoData: elem };
        hnScene.add(mesh);
    });

    // Renderizar piezas independientes de cada cajón
    hnCajonesActuales.forEach(cajon => {
        if (cajon.piezas && Array.isArray(cajon.piezas)) {
            cajon.piezas.forEach(pieza => {
                const geom = new THREE.BoxGeometry(pieza.ancho, pieza.alto, pieza.profundidad);
                const isSelected = (hnSeleccionActual && hnSeleccionActual.objeto.pieceId === pieza.pieceId);
                const mat = new THREE.MeshStandardMaterial({
                    color: isSelected ? 0xf59e0b : 0xfef3c7,
                    roughness: 0.3,
                    metalness: 0.1
                });
                const mesh = new THREE.Mesh(geom, mat);
                mesh.position.set(pieza.x - (W / 2), pieza.y, pieza.z - (D / 2));

                const edges = new THREE.EdgesGeometry(geom);
                const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: isSelected ? 0xb45309 : 0xd97706, linewidth: 1 }));
                mesh.add(line);

                mesh.userData = { isParametric: true, tipo: 'cajon_pieza', elementoData: pieza, drawerId: cajon.drawerId };
                hnScene.add(mesh);
            });
        }
    });

    if (hnControls) {
        hnControls.target.set(0, H / 2, 0);
    }
}

function agregarMontanteParametricoModal() {
    const posX = hnModuloActual.ancho / 2;
    if (posX <= hnModuloActual.espesor || posX >= hnModuloActual.ancho - hnModuloActual.espesor) return;

    const pieceId = 'mont_' + Math.random().toString(36).substr(2, 6);
    const nuevoMontante = {
        pieceId: pieceId,
        moduleId: hnModuloActual.moduleId,
        tipo: 'montante',
        espesor: hnModuloActual.espesor,
        alto: hnModuloActual.alto - (2 * hnModuloActual.espesor),
        profundidad: hnModuloActual.profundidad - hnModuloActual.fondo,
        x: posX,
        y: hnModuloActual.alto / 2,
        z: (hnModuloActual.profundidad - hnModuloActual.fondo) / 2,
        material: 'Blanco'
    };

    hnElementosActuales.push(nuevoMontante);
    recalcularEspaciosYElementosPorMontante(pieceId, posX);
    recalcularSectores();
    reconstruirEscena3DParametrica();
    actualizarSidebarEspacios();
    seleccionarElementoPorId(pieceId);
}

function recalcularEspaciosYElementosPorMontante(movMontantePieceId = null, posXForzada = null) {
    if (movMontantePieceId && posXForzada !== null) {
        const mObj = hnElementosActuales.find(e => e.pieceId === movMontantePieceId);
        if (mObj) mObj.x = posXForzada;
    }

    const montantes = hnElementosActuales
        .filter(e => e.tipo === 'montante')
        .sort((a, b) => a.x - b.x);

    let limitesX = [hnModuloActual.espesor];

    montantes.forEach(m => {
        limitesX.push(m.x - (hnModuloActual.espesor / 2));
        limitesX.push(m.x + (hnModuloActual.espesor / 2));
    });

    limitesX.push(hnModuloActual.ancho - hnModuloActual.espesor);

    let nuevosEspacios = [];

    for (let i = 0; i < limitesX.length; i += 2) {
        if (i + 1 < limitesX.length) {
            let xMin = limitesX[i];
            let xMax = limitesX[i + 1];

            if (xMax - xMin > 10) {
                let espacioExistente = hnEspaciosActuales.find(e =>
                    Math.abs(e.xMin - xMin) < 5 &&
                    Math.abs(e.xMax - xMax) < 5
                );

                let spaceId = espacioExistente
                    ? espacioExistente.spaceId
                    : ('space_' + Math.random().toString(36).substr(2, 6));

                nuevosEspacios.push({
                    spaceId: spaceId,
                    moduleId: hnModuloActual.moduleId,
                    xMin: xMin,
                    xMax: xMax,
                    yMin: hnModuloActual.espesor,
                    yMax: hnModuloActual.alto - hnModuloActual.espesor,
                    profundidad: hnModuloActual.profundidad - hnModuloActual.fondo
                });
            }
        }
    }

    /*
     * IMPORTANTE:
     * Los elementos existentes NO se reasignan ni se reconstruyen aquí.
     *
     * Antes, al agregar/mover un montante, las repisas eran forzadas a
     * buscar uno de los nuevos espacios y se modificaban sus:
     * - spaceId
     * - width
     * - x
     *
     * Eso hacía que una operación sobre un montante modificara datos de
     * repisas que ya existían.
     *
     * Ahora los nuevos espacios se calculan independientemente y los
     * elementos existentes conservan sus propios datos paramétricos.
     * El nuevo montante se agrega sin destruir ni reemplazar repisas.
     */
    hnEspaciosActuales = nuevosEspacios;

    recalcularTodosLosCajones();
    recalcularSectores();
}

function agregarRepisaParametricaPrompt() {
    if (hnEspaciosActuales.length === 0) {
        alert('Primero debes tener al menos un espacio creado.');
        return;
    }

    let espacioDestino = hnEspaciosActuales[0];

    if (hnSeleccionActual && hnSeleccionActual.tipo === 'sector') {
        espacioDestino = hnEspaciosActuales.find(e => e.spaceId === hnSeleccionActual.objeto.spaceId) || hnEspaciosActuales[0];
    } else if (hnSeleccionActual && hnSeleccionActual.tipo === 'espacio') {
        espacioDestino = hnSeleccionActual.objeto;
    } else if (hnSeleccionActual && hnSeleccionActual.tipo === 'repisa') {
        espacioDestino = hnEspaciosActuales.find(e => e.spaceId === hnSeleccionActual.objeto.spaceId) || hnEspaciosActuales[0];
    }

    let cantidadStr = prompt(`¿Cuántas repisas deseas agregar en el espacio seleccionado?`, "1");
    if (!cantidadStr) return;

    let cantidad = parseInt(cantidadStr);

    if (isNaN(cantidad) || cantidad <= 0) {
        alert('Cantidad inválida.');
        return;
    }

    const yMin = espacioDestino.yMin;
    const yMax = espacioDestino.yMax;
    const alturaUtil = yMax - yMin;
    let separacion = alturaUtil / (cantidad + 1);

    for (let i = 1; i <= cantidad; i++) {
        let posY = yMin + (separacion * i);
        let pieceId = 'rep_' + Math.random().toString(36).substr(2, 6);
        let anchoEspacio = espacioDestino.xMax - espacioDestino.xMin;

        let nuevaRepisa = {
            pieceId: pieceId,
            moduleId: hnModuloActual.moduleId,
            spaceId: espacioDestino.spaceId,
            tipo: 'repisa',
            width: anchoEspacio,
            espesor: hnModuloActual.espesor,
            profundidad: espacioDestino.profundidad,
            x: espacioDestino.xMin + (anchoEspacio / 2),
            y: posY,
            z: espacioDestino.profundidad / 2,
            material: 'Blanco'
        };

        hnElementosActuales.push(nuevaRepisa);
    }

    recalcularSectores();
    reconstruirEscena3DParametrica();
    actualizarSidebarEspacios();
}

function agregarCajonParametricoPrompt() {
    if (hnEspaciosActuales.length === 0) {
        alert('Primero debes tener al menos un espacio creado para insertar cajones.');
        return;
    }

    let espacioDestino = hnEspaciosActuales[0];

    if (hnSeleccionActual && hnSeleccionActual.tipo === 'sector') {
        espacioDestino = hnEspaciosActuales.find(e => e.spaceId === hnSeleccionActual.objeto.spaceId) || hnEspaciosActuales[0];
    } else if (hnSeleccionActual && hnSeleccionActual.tipo === 'espacio') {
        espacioDestino = hnSeleccionActual.objeto;
    } else if (hnSeleccionActual && hnSeleccionActual.tipo === 'repisa') {
        espacioDestino = hnEspaciosActuales.find(e => e.spaceId === hnSeleccionActual.objeto.spaceId) || hnEspaciosActuales[0];
    }

    let cantidadStr = prompt(`¿Cuántos cajones deseas crear en el espacio seleccionado?`, "3");
    if (!cantidadStr) return;

    let cantidad = parseInt(cantidadStr);

    if (isNaN(cantidad) || cantidad <= 0) {
        alert('Cantidad inválida.');
        return;
    }

    generarConjuntoCajonesEnEspacio(espacioDestino, cantidad);
    reconstruirEscena3DParametrica();
    actualizarSidebarEspacios();
}

function generarConjuntoCajonesEnEspacio(espacio, cantidad) {
    const anchoUtil = espacio.xMax - espacio.xMin;
    const altoUtil = espacio.yMax - espacio.yMin;
    const profUtil = espacio.profundidad;
    const T = hnModuloActual.espesor;
    const juegoHolguraLateral = 26;
    const holguraAltura = 10;

    const alturaTotalCajones = altoUtil - ((cantidad + 1) * holguraAltura);
    const alturaCajonIndividual = alturaTotalCajones / cantidad;

    for (let i = 0; i < cantidad; i++) {
        const drawerId = 'drw_' + Math.random().toString(36).substr(2, 6);
        const yBaseCajon = espacio.yMin + holguraAltura + (i * (alturaCajonIndividual + holguraAltura));

        const piezasCajon = [];
        const matEsp = T;

        const anchoFrente = anchoUtil - 4;
        const altoFrente = alturaCajonIndividual - 4;

        const piezaFrente = {
            pieceId: 'p_' + Math.random().toString(36).substr(2, 6),
            drawerId: drawerId,
            spaceId: espacio.spaceId,
            moduleId: hnModuloActual.moduleId,
            tipo: 'cajon_frente',
            ancho: anchoFrente,
            alto: altoFrente,
            profundidad: matEsp,
            espesor: matEsp,
            x: espacio.xMin + (anchoUtil / 2),
            y: yBaseCajon + (altoFrente / 2),
            z: profUtil - (matEsp / 2)
        };

        piezasCajon.push(piezaFrente);

        const profLateral = profUtil - 40;
        const altoLateral = altoFrente - 30;

        const piezaLatIzq = {
            pieceId: 'p_' + Math.random().toString(36).substr(2, 6),
            drawerId: drawerId,
            spaceId: espacio.spaceId,
            moduleId: hnModuloActual.moduleId,
            tipo: 'cajon_lateral_izq',
            ancho: matEsp,
            alto: altoLateral,
            profundidad: profLateral,
            espesor: matEsp,
            x: espacio.xMin + (matEsp / 2) + 10,
            y: yBaseCajon + (altoFrente / 2),
            z: (profLateral / 2) + 20
        };

        piezasCajon.push(piezaLatIzq);

        const piezaLatDer = {
            pieceId: 'p_' + Math.random().toString(36).substr(2, 6),
            drawerId: drawerId,
            spaceId: espacio.spaceId,
            moduleId: hnModuloActual.moduleId,
            tipo: 'cajon_lateral_der',
            ancho: matEsp,
            alto: altoLateral,
            profundidad: profLateral,
            espesor: matEsp,
            x: espacio.xMax - (matEsp / 2) - 10,
            y: yBaseCajon + (altoFrente / 2),
            z: (profLateral / 2) + 20
        };

        piezasCajon.push(piezaLatDer);

        const anchoTrasera = anchoUtil - juegoHolguraLateral - (2 * matEsp);

        const piezaTrasera = {
            pieceId: 'p_' + Math.random().toString(36).substr(2, 6),
            drawerId: drawerId,
            spaceId: espacio.spaceId,
            moduleId: hnModuloActual.moduleId,
            tipo: 'cajon_trasera',
            ancho: anchoTrasera,
            alto: altoLateral,
            profundidad: matEsp,
            espesor: matEsp,
            x: espacio.xMin + (anchoUtil / 2),
            y: yBaseCajon + (altoFrente / 2),
            z: matEsp / 2 + 10
        };

        piezasCajon.push(piezaTrasera);

        const piezaBase = {
            pieceId: 'p_' + Math.random().toString(36).substr(2, 6),
            drawerId: drawerId,
            spaceId: espacio.spaceId,
            moduleId: hnModuloActual.moduleId,
            tipo: 'cajon_fondo',
            ancho: anchoTrasera,
            alto: hnModuloActual.fondo,
            profundidad: profLateral - matEsp,
            espesor: hnModuloActual.fondo,
            x: espacio.xMin + (anchoUtil / 2),
            y: yBaseCajon + (hnModuloActual.fondo / 2) + 5,
            z: ((profLateral - matEsp) / 2) + 20
        };

        piezasCajon.push(piezaBase);

        hnCajonesActuales.push({
            drawerId: drawerId,
            spaceId: espacio.spaceId,
            moduleId: hnModuloActual.moduleId,
            cantidadEnGrupo: cantidad,
            piezas: piezasCajon
        });
    }
}

function recalcularTodosLosCajones() {
    let cajonesAntiguos = [...hnCajonesActuales];
    hnCajonesActuales = [];

    let mapaEspaciosCajones = {};

    cajonesAntiguos.forEach(c => {
        if (!mapaEspaciosCajones[c.spaceId]) {
            mapaEspaciosCajones[c.spaceId] = 0;
        }

        mapaEspaciosCajones[c.spaceId]++;
    });

    for (let spaceId in mapaEspaciosCajones) {
        let espacioReal = hnEspaciosActuales.find(e => e.spaceId === spaceId);

        if (espacioReal) {
            let cantidad = mapaEspaciosCajones[spaceId];
            generarConjuntoCajonesEnEspacio(espacioReal, cantidad);
        } else {
            if (hnEspaciosActuales.length > 0) {
                let espacioFallback = hnEspaciosActuales[0];
                generarConjuntoCajonesEnEspacio(espacioFallback, 1);
            }
        }
    }
}

function actualizarSidebarEspacios() {
    const container = document.getElementById('hn-lista-espacios-sidebar');
    if (!container) return;

    container.innerHTML = '';

    hnEspaciosActuales.forEach((esp, idx) => {
        const anchoUtil = esp.xMax - esp.xMin;
        const altoUtil = esp.yMax - esp.yMin;
        const sectoresEnEspacio = hnSectoresActuales.filter(s => s.spaceId === esp.spaceId).length;

        const div = document.createElement('div');
        div.className = 'hn-tool-item';
        div.style.flexDirection = 'column';
        div.style.alignItems = 'flex-start';
        div.style.gap = '2px';
        div.style.cursor = 'pointer';
        div.onclick = () => seleccionarEspacioPorId(esp.spaceId);

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                <strong>Espacio #${idx + 1}</strong>
                <span class="hn-note">${anchoUtil.toFixed(0)} x ${altoUtil.toFixed(0)} mm (${sectoresEnEspacio} sectores)</span>
            </div>
            <div style="font-size:0.7rem; color:#6b7280;">X: [${esp.xMin.toFixed(0)} - ${esp.xMax.toFixed(0)}]</div>
        `;

        container.appendChild(div);
    });
}

function onHNDesignerClick(event) {
    const container = document.getElementById('hn-viewport-3d');
    if (!container) return;

    const rect = container.getBoundingClientRect();

    hnMouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    hnMouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

    hnRaycaster.setFromCamera(hnMouse, hnCamera);
    
    const meshes = [];

    hnScene.traverse(child => {
        if (
            child.isMesh &&
            child.userData &&
            child.userData.isParametric &&
            child.userData.tipo !== 'estructura'
        ) {
            meshes.push(child);
        }
    });

    const intersects = hnRaycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
        const intersectedMesh = intersects[0].object;
        const tipo = intersectedMesh.userData.tipo;
        const elementoData = intersectedMesh.userData.elementoData;
        const sectorData = intersectedMesh.userData.sectorData;
        const drawerId = intersectedMesh.userData.drawerId;

        if (tipo === 'sector' && sectorData) {
            if (
                hnSeleccionActual &&
                hnSeleccionActual.tipo === 'sector' &&
                hnSeleccionActual.objeto.sectorId === sectorData.sectorId
            ) {
                restaurarPanelDerechoMaestro();
            } else {
                seleccionarSectorPorId(sectorData.sectorId);
            }
        } else if (drawerId) {
            seleccionarPiezaCajonPorId(drawerId, elementoData.pieceId);
        } else if (elementoData) {
            seleccionarElementoPorId(elementoData.pieceId);
        }
    } else {
        restaurarPanelDerechoMaestro();
    }
}

function seleccionarSectorPorId(sectorId) {
    const sec = hnSectoresActuales.find(s => s.sectorId === sectorId);
    if (!sec) return;

    hnSeleccionActual = { tipo: 'sector', objeto: sec };

    reconstruirEscena3DParametrica();
    mostrarPropiedadesSector(sec);
}

function seleccionarElementoPorId(pieceId) {
    const elem = hnElementosActuales.find(e => e.pieceId === pieceId);
    if (!elem) return;

    hnSeleccionActual = { tipo: elem.tipo, objeto: elem };

    reconstruirEscena3DParametrica();

    if (elem.tipo === 'montante') {
        mostrarPropiedadesMontante(elem);
    } else if (elem.tipo === 'repisa') {
        mostrarPropiedadesRepisa(elem);
    }
}

function seleccionarPiezaCajonPorId(drawerId, pieceId) {
    const cajon = hnCajonesActuales.find(c => c.drawerId === drawerId);
    if (!cajon) return;

    const pieza = cajon.piezas.find(p => p.pieceId === pieceId);
    if (!pieza) return;

    hnSeleccionActual = { tipo: 'cajon', objeto: pieza, drawerId: drawerId };

    reconstruirEscena3DParametrica();
    mostrarPropiedadesPiezaCajon(cajon, pieza);
}

function seleccionarEspacioPorId(spaceId) {
    const esp = hnEspaciosActuales.find(e => e.spaceId === spaceId);
    if (!esp) return;

    hnSeleccionActual = { tipo: 'espacio', objeto: esp };
    mostrarPropiedadesEspacio(esp);
}

function mostrarPropiedadesSector(sec) {
    const titleText = document.getElementById('hn-prop-title-text');
    const selectedBadge = document.getElementById('hn-selected-badge');
    const container = document.getElementById('hn-properties-content-container');

    if (!titleText || !container) return;

    titleText.innerText = "SECTOR SELECCIONADO";

    if (selectedBadge) {
        selectedBadge.innerText = 'Naranja / Ámbar';
        selectedBadge.style.background = '#fef3c7';
        selectedBadge.style.color = '#d97706';
    }

    const anchoUtil = sec.xMax - sec.xMin;
    const altoUtil = sec.yMax - sec.yMin;

    container.innerHTML = `
        <div class="hn-prop-row">
            <label>ID del Sector</label>
            <input type="text" value="${sec.sectorId}" readonly style="background:#f3f4f6; color:#6b7280; font-size:0.75rem;">
        </div>
        <div class="hn-prop-row">
            <label>ID del Espacio Padre</label>
            <input type="text" value="${sec.spaceId}" readonly style="background:#f3f4f6; color:#6b7280; font-size:0.75rem;">
        </div>
        <div class="hn-prop-row">
            <label>Ancho útil (mm)</label>
            <input type="number" value="${anchoUtil.toFixed(1)}" readonly>
        </div>
        <div class="hn-prop-row">
            <label>Alto útil (mm)</label>
            <input type="number" value="${altoUtil.toFixed(1)}" readonly>
        </div>
        <div class="hn-prop-row">
            <label>Límites Y [Min - Max] (mm)</label>
            <input type="text" value="${sec.yMin.toFixed(0)} - ${sec.yMax.toFixed(0)}" readonly style="background:#f3f4f6;">
        </div>
        <div class="hn-properties-divider"></div>
        <button type="button" class="btn-primary-modern full-btn" style="padding: 8px; font-size: 0.85rem; background:#10b981; border:none;" onclick="agregarRepisaParametricaPrompt()">
            + Agregar Repisa
        </button>
        <button type="button" class="btn-primary-modern full-btn" style="padding: 8px; font-size: 0.85rem; margin-top:6px; background:#d97706; border:none;" onclick="agregarCajonParametricoPrompt()">
            + Agregar Cajón
        </button>
        <button type="button" class="btn-primary-modern full-btn" style="padding: 8px; font-size: 0.85rem; margin-top:6px;" onclick="restaurarPanelDerechoMaestro()">
            Deseleccionar Sector
        </button>
    `;
}

function mostrarPropiedadesEspacio(esp) {
    const titleText = document.getElementById('hn-prop-title-text');
    const selectedBadge = document.getElementById('hn-selected-badge');
    const container = document.getElementById('hn-properties-content-container');

    if (!titleText || !container) return;

    titleText.innerText = "ESPACIO INTERNO";

    if (selectedBadge) {
        selectedBadge.innerText = 'Espacio';
        selectedBadge.style.background = '#dcfce7';
        selectedBadge.style.color = '#166534';
    }

    const anchoUtil = esp.xMax - esp.xMin;
    const altoUtil = esp.yMax - esp.yMin;

    container.innerHTML = `
        <div class="hn-prop-row">
            <label>ID del Espacio</label>
            <input type="text" value="${esp.spaceId}" readonly style="background:#f3f4f6; color:#6b7280; font-size:0.75rem;">
        </div>
        <div class="hn-prop-row">
            <label>Ancho útil (mm)</label>
            <input type="number" value="${anchoUtil.toFixed(1)}" readonly>
        </div>
        <div class="hn-prop-row">
            <label>Alto útil (mm)</label>
            <input type="number" value="${altoUtil.toFixed(1)}" readonly>
        </div>
        <div class="hn-properties-divider"></div>
        <button type="button" class="btn-primary-modern full-btn" style="padding: 8px; font-size: 0.85rem; background:#10b981; border:none;" onclick="agregarRepisaParametricaPrompt()">
            + Agregar Repisa
        </button>
        <button type="button" class="btn-primary-modern full-btn" style="padding: 8px; font-size: 0.85rem; margin-top:6px; background:#d97706; border:none;" onclick="agregarCajonParametricoPrompt()">
            + Agregar Cajón
        </button>
        <button type="button" class="btn-primary-modern full-btn" style="padding: 8px; font-size: 0.85rem; margin-top:6px;" onclick="restaurarPanelDerechoMaestro()">
            Volver a Dimensiones Maestras
        </button>
    `;
}

function mostrarPropiedadesMontante(elem) {
    const titleText = document.getElementById('hn-prop-title-text');
    const selectedBadge = document.getElementById('hn-selected-badge');
    const container = document.getElementById('hn-properties-content-container');

    if (!titleText || !container) return;

    titleText.innerText = "MONTANTE VERTICAL";

    if (selectedBadge) selectedBadge.innerText = 'Seleccionado';

    container.innerHTML = `
        <div class="hn-prop-row">
            <label>ID de Pieza (pieceId)</label>
            <input type="text" value="${elem.pieceId}" readonly style="background:#f3f4f6; color:#6b7280; font-size:0.75rem;">
        </div>
        <div class="hn-prop-row">
            <label>Posición X (mm)</label>
            <input type="number" id="hn-edit-pos-montante" value="${elem.x.toFixed(1)}" oninput="actualizarPosicionMontanteManual('${elem.pieceId}', this.value)">
        </div>
        <div id="hn-validacion-error" style="color: #ef4444; font-size: 0.75rem; margin-top: 2px;"></div>
        <div class="hn-prop-row">
            <label>Espesor (mm)</label>
            <input type="number" value="${elem.espesor}" readonly>
        </div>
        <div class="hn-properties-divider"></div>
        <button type="button" class="btn-primary-modern full-btn" style="padding: 8px; font-size: 0.85rem; background:#ef4444; border:none;" onclick="eliminarElementoParametrico('${elem.pieceId}')">
            Eliminar Montante
        </button>
        <button type="button" class="btn-primary-modern full-btn" style="padding: 8px; font-size: 0.85rem; margin-top:6px;" onclick="restaurarPanelDerechoMaestro()">
            Volver a Dimensiones Maestras
        </button>
    `;
}

function mostrarPropiedadesRepisa(elem) {
    const titleText = document.getElementById('hn-prop-title-text');
    const selectedBadge = document.getElementById('hn-selected-badge');
    const container = document.getElementById('hn-properties-content-container');

    if (!titleText || !container) return;

    titleText.innerText = "REPISA";

    if (selectedBadge) selectedBadge.innerText = 'Seleccionado';

    const espAsociado = hnEspaciosActuales.find(e => e.spaceId === elem.spaceId);
    const yMinValid = espAsociado ? espAsociado.yMin : hnModuloActual.espesor;
    const yMaxValid = espAsociado ? espAsociado.yMax : hnModuloActual.alto - hnModuloActual.espesor;

    container.innerHTML = `
        <div class="hn-prop-row">
            <label>ID de Pieza (pieceId)</label>
            <input type="text" value="${elem.pieceId}" readonly style="background:#f3f4f6; color:#6b7280; font-size:0.75rem;">
        </div>
        <div class="hn-prop-row">
            <label>Espacio (spaceId)</label>
            <input type="text" value="${elem.spaceId}" readonly style="background:#f3f4f6; color:#6b7280; font-size:0.75rem;">
        </div>
        <div class="hn-prop-row">
            <label>Ancho actual (mm)</label>
            <input type="number" value="${elem.width.toFixed(1)}" readonly style="background:#f3f4f6;">
        </div>
        <div class="hn-prop-row">
            <label>Posición Y / Altura (mm)</label>
            <input type="number" id="hn-edit-pos-repisa" value="${elem.y.toFixed(1)}" oninput="actualizarPosicionRepisaManual('${elem.pieceId}', this.value)">
        </div>
        <div id="hn-validacion-error" style="color: #ef4444; font-size: 0.75rem; margin-top: 2px;">Rango válido: [${yMinValid.toFixed(0)} - ${yMaxValid.toFixed(0)}] mm</div>
        <div class="hn-properties-divider"></div>
        <button type="button" class="btn-primary-modern full-btn" style="padding: 8px; font-size: 0.85rem; background:#ef4444; border:none;" onclick="eliminarElementoParametrico('${elem.pieceId}')">
            Eliminar Repisa
        </button>
        <button type="button" class="btn-primary-modern full-btn" style="padding: 8px; font-size: 0.85rem; margin-top:6px;" onclick="restaurarPanelDerechoMaestro()">
            Volver a Dimensiones Maestras
        </button>
    `;
}

function mostrarPropiedadesPiezaCajon(cajon, pieza) {
    const titleText = document.getElementById('hn-prop-title-text');
    const selectedBadge = document.getElementById('hn-selected-badge');
    const container = document.getElementById('hn-properties-content-container');

    if (!titleText || !container) return;

    titleText.innerText = "PIEZA DE CAJÓN";

    if (selectedBadge) selectedBadge.innerText = 'Cajón';

    container.innerHTML = `
        <div class="hn-prop-row">
            <label>ID de Pieza (pieceId)</label>
            <input type="text" value="${pieza.pieceId}" readonly style="background:#f3f4f6; color:#6b7280; font-size:0.75rem;">
        </div>
        <div class="hn-prop-row">
            <label>ID del Cajón (drawerId)</label>
            <input type="text" value="${pieza.drawerId}" readonly style="background:#f3f4f6; color:#6b7280; font-size:0.75rem;">
        </div>
        <div class="hn-prop-row">
            <label>Tipo de pieza</label>
            <input type="text" value="${pieza.tipo}" readonly style="background:#f3f4f6;">
        </div>
        <div class="hn-prop-row">
            <label>Ancho (mm)</label>
            <input type="number" value="${pieza.ancho.toFixed(1)}" readonly>
        </div>
        <div class="hn-prop-row">
            <label>Alto (mm)</label>
            <input type="number" value="${pieza.alto.toFixed(1)}" readonly>
        </div>
        <div class="hn-prop-row">
            <label>Profundidad (mm)</label>
            <input type="number" value="${pieza.profundidad.toFixed(1)}" readonly>
        </div>
        <div class="hn-properties-divider"></div>
        <button type="button" class="btn-primary-modern full-btn" style="padding: 8px; font-size: 0.85rem; background:#ef4444; border:none;" onclick="eliminarCajonParametrico('${cajon.drawerId}')">
            Eliminar Cajón Completo
        </button>
        <button type="button" class="btn-primary-modern full-btn" style="padding: 8px; font-size: 0.85rem; margin-top:6px;" onclick="restaurarPanelDerechoMaestro()">
            Volver a Dimensiones Maestras
        </button>
    `;
}

function eliminarCajonParametrico(drawerId) {
    hnCajonesActuales = hnCajonesActuales.filter(c => c.drawerId !== drawerId);
    restaurarPanelDerechoMaestro();
    reconstruirEscena3DParametrica();
    actualizarSidebarEspacios();
}

function actualizarPosicionMontanteManual(pieceId, nuevoValorStr) {
    const val = parseFloat(nuevoValorStr);
    const errorDiv = document.getElementById('hn-validacion-error');

    if (isNaN(val)) return;

    if (
        val > hnModuloActual.espesor + 50 &&
        val < hnModuloActual.ancho - hnModuloActual.espesor - 50
    ) {
        if (errorDiv) errorDiv.innerText = '';

        recalcularEspaciosYElementosPorMontante(pieceId, val);
        recalcularSectores();
        reconstruirEscena3DParametrica();
        actualizarSidebarEspacios();
    } else {
        if (errorDiv) errorDiv.innerText = 'Posición fuera de los límites estructurales válidos.';
    }
}

function actualizarPosicionRepisaManual(pieceId, nuevoValorStr) {
    const val = parseFloat(nuevoValorStr);
    const errorDiv = document.getElementById('hn-validacion-error');

    if (isNaN(val)) return;

    const elem = hnElementosActuales.find(e => e.pieceId === pieceId);
    if (!elem) return;

    const esp = hnEspaciosActuales.find(e => e.spaceId === elem.spaceId);
    if (!esp) return;

    if (val >= esp.yMin && val <= esp.yMax) {
        if (errorDiv) {
            errorDiv.innerText = `Rango válido: [${esp.yMin.toFixed(0)} - ${esp.yMax.toFixed(0)}] mm`;
        }

        elem.y = val;
        recalcularSectores();
        reconstruirEscena3DParametrica();
    } else {
        if (errorDiv) {
            errorDiv.innerText = 'La repisa debe permanecer estrictamente dentro de su espacio.';
        }
    }
}

function eliminarElementoParametrico(pieceId) {
    const elem = hnElementosActuales.find(e => e.pieceId === pieceId);

    if (elem && elem.tipo === 'montante') {
        hnElementosActuales = hnElementosActuales.filter(e => e.pieceId !== pieceId);
        recalcularEspaciosYElementosPorMontante();
    } else {
        hnElementosActuales = hnElementosActuales.filter(e => e.pieceId !== pieceId);
    }

    recalcularSectores();
    restaurarPanelDerechoMaestro();
    reconstruirEscena3DParametrica();
    actualizarSidebarEspacios();
}

function restaurarPanelDerechoMaestro() {
    hnSeleccionActual = null;
    reconstruirEscena3DParametrica();

    const titleText = document.getElementById('hn-prop-title-text');
    const selectedBadge = document.getElementById('hn-selected-badge');
    const container = document.getElementById('hn-properties-content-container');

    if (!titleText || !container) return;

    titleText.innerText = "DIMENSIONES MAESTRAS";

    if (selectedBadge) {
        selectedBadge.innerText = 'Módulo';
        selectedBadge.style.background = '#dcfce7';
        selectedBadge.style.color = '#166534';
    }

    container.innerHTML = `
        <div class="hn-prop-row">
            <label>Ancho (mm)</label>
            <input type="number" value="${hnModuloActual.ancho}" id="hn-master-ancho" oninput="actualizarDimensionesMaestrasDebounced()">
        </div>
        <div class="hn-prop-row">
            <label>Alto (mm)</label>
            <input type="number" value="${hnModuloActual.alto}" id="hn-master-alto" oninput="actualizarDimensionesMaestrasDebounced()">
        </div>
        <div class="hn-prop-row">
            <label>Profundidad (mm)</label>
            <input type="number" value="${hnModuloActual.profundidad}" id="hn-master-prof" oninput="actualizarDimensionesMaestrasDebounced()">
        </div>
        <div class="hn-prop-row">
            <label>Espesor estructural (mm)</label>
            <input type="number" value="${hnModuloActual.espesor}" id="hn-master-espesor" oninput="actualizarDimensionesMaestrasDebounced()">
        </div>
        <div class="hn-prop-row">
            <label>Fondo (mm)</label>
            <input type="number" value="${hnModuloActual.fondo}" id="hn-master-fondo" oninput="actualizarDimensionesMaestrasDebounced()">
        </div>
        <div class="hn-properties-divider"></div>
        <div style="font-size: 0.75rem; color: #6b7280; text-align: center;">
            Modifica las dimensiones maestras para recalcular estructura, espacios y elementos automáticamente.
        </div>
    `;
}


/*
=============================================================
EJECUCIÓN DIRECTA DEL HN DESIGNER INDEPENDIENTE
=============================================================
*/

// El Designer se ejecuta directamente como página independiente.
abrirHNDesigner();


/*
=============================================================
NAVEGACIÓN DEL HN DESIGNER INDEPENDIENTE
=============================================================
*/
function cerrarHNDesigner() {
    window.location.href = 'index.html';
}

/*
=============================================================
ESC PARA CERRAR EL DESIGNER
=============================================================
*/
document.addEventListener(
  "keydown",
  function(event) {
    if (event.key !== "Escape") return;

    const designer = document.getElementById("hn-designer");

    if (designer) {
      cerrarHNDesigner();
    }
  }
);
