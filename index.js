class TodoApp {
    constructor() {
        this.fecha = document.querySelector('#fecha');
        this.lista = document.querySelector('#lista');
        this.input = document.querySelector('#input');
        this.botonEnter = document.querySelector('#boton-enter');
        this.busqueda = document.querySelector('#busqueda');
        this.filtroTodas = document.querySelector('#filtro-todas');
        this.filtroPendientes = document.querySelector('#filtro-pendientes');
        this.filtroTerminadas = document.querySelector('#filtro-terminadas');
        this.check = 'fa-check-circle';
        this.uncheck = 'fa-circle';
        this.lineThrough = 'line-through';
        this.LIST = [];
        this.id = 0;
        this.MAX_LENGTH = 20; // Longitud máxima del nombre de la tarea

        this.init();
    }

    init() {
        this.setFecha();
        this.cargarDesdeLocalStorage();
        this.agregarEventos();
    }

    setFecha() {
        const FECHA = new Date();
        this.fecha.innerHTML = FECHA.toLocaleDateString('es-MX', { weekday: 'long', month: 'short', day: 'numeric' });
    }

    cargarDesdeLocalStorage() {
        const data = localStorage.getItem('TODO');
        if (data) {
            try {
                this.LIST = JSON.parse(data);
                this.id = this.LIST.length;
                this.cargarLista(this.LIST);
            } catch (e) {
                console.error('Error al cargar los datos de Local Storage', e);
                this.LIST = [];
                this.id = 0;
            }
        }
    }

    agregarEventos() {
        this.botonEnter.addEventListener('click', () => this.agregarTareaDesdeInput());
        document.addEventListener('keyup', (event) => this.agregarTareaConEnter(event));
        this.lista.addEventListener('click', (event) => this.gestionarTarea(event));
        this.busqueda.addEventListener('input', () => this.buscarTareas());
        this.filtroTodas.addEventListener('click', () => this.mostrarTodas());
        this.filtroPendientes.addEventListener('click', () => this.mostrarPendientes());
        this.filtroTerminadas.addEventListener('click', () => this.mostrarTerminadas());
    }

    agregarTarea(tarea, id, realizado, eliminado, fechaCreacion) {
        if (eliminado) return;

        const REALIZADO = realizado ? this.check : this.uncheck;
        const LINE = realizado ? this.lineThrough : '';

        const elemento = document.createElement('li');
        elemento.classList.add('task-item'); // Añadir una clase CSS para el contenedor de la tarea
        elemento.innerHTML = `
            <i class="far ${REALIZADO}" data="realizado" id="${id}"></i>
            <div class="task-text ${LINE}">
                <span class="task-name">${tarea}</span>
                <span class="task-date">${fechaCreacion}</span>
            </div>
            <i class="fas fa-edit edit" data="editar" id="${id}"></i>
            <i class="fas fa-trash de" data="eliminado" id="${id}"></i>
        `;
        this.lista.appendChild(elemento);
    }

    tareaRealizada(element) {
        element.classList.toggle(this.check);
        element.classList.toggle(this.uncheck);
        const tareaTexto = element.parentNode.querySelector('.task-text');
        tareaTexto.classList.toggle(this.lineThrough);
        this.LIST[element.id].realizado = !this.LIST[element.id].realizado;
        localStorage.setItem('TODO', JSON.stringify(this.LIST));
    }

    tareaEliminada(element) {
        element.parentNode.remove();
        this.LIST[element.id].eliminado = true;
        localStorage.setItem('TODO', JSON.stringify(this.LIST));
    }

    tareaEditada(element) {
        const tareaTexto = element.parentNode.querySelector('.task-text');
        const tareaId = element.id;
        const tareaNombre = tareaTexto.querySelector('.task-name').textContent;
        const tareaFecha = tareaTexto.querySelector('.task-date').textContent;
    
        // Abrir el modal
        const modal = document.getElementById("editTaskModal");
        const closeBtn = modal.querySelector(".closeBtn");
        const saveBtn = modal.querySelector("#saveTaskChangesBtn");
    
        const inputNombre = modal.querySelector("#editTaskName");
        const inputFecha = modal.querySelector("#editTaskDate");
    
        // Llenar los campos del modal con los valores actuales
        inputNombre.value = tareaNombre;
        inputFecha.value = tareaFecha;
    
        modal.style.display = "block";
    
        // Cerrar el modal cuando se haga clic en la "x"
        closeBtn.onclick = function() {
            modal.style.display = "none";
        };
    
        // Cerrar el modal si se hace clic fuera del contenido del modal
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        };
    
        // Guardar cambios cuando se presione el botón
        saveBtn.onclick = () => {
            const nuevoNombre = inputNombre.value;
            const nuevaFecha = inputFecha.value;
    
            if (nuevoNombre && nuevaFecha) {
                if (!this.validarNombre(nuevoNombre)) {
                    this.mostrarAlerta('Nombre de tarea inválido. Asegúrate de que no sea un enlace, no contenga emojis, y tenga caracteres permitidos.');
                } else if (nuevoNombre.length > this.MAX_LENGTH) {
                    this.mostrarAlerta(`El nombre de la tarea no puede exceder los ${this.MAX_LENGTH} caracteres.`);
                } else if (this.validarFecha(nuevaFecha)) {
                    tareaTexto.querySelector('.task-name').textContent = nuevoNombre;
                    tareaTexto.querySelector('.task-date').textContent = nuevaFecha;
                    this.LIST[tareaId].nombre = nuevoNombre;
                    this.LIST[tareaId].fechaCreacion = nuevaFecha;
                    localStorage.setItem('TODO', JSON.stringify(this.LIST));
                    modal.style.display = "none"; // Cerrar el modal al guardar
                } else {
                    this.mostrarAlerta('Formato de fecha incorrecto. Utiliza dd/mm.');
                }
            }
        };
    }
    
    // Método para mostrar alertas en lugar de alert()
    mostrarAlerta(mensaje) {
        const alertaModal = document.createElement('div');
        alertaModal.className = 'modal';
        alertaModal.style.display = 'block';
        alertaModal.innerHTML = `
            <div class="modal-content">
                <span class="closeBtn">&times;</span>
                <p>${mensaje}</p>
            </div>
        `;
        document.body.appendChild(alertaModal);
    
        const closeBtn = alertaModal.querySelector('.closeBtn');
        closeBtn.onclick = function() {
            alertaModal.style.display = "none";
            document.body.removeChild(alertaModal);
        };
    }

    validarNombre(nombre) {
        // Expresión regular para detectar enlaces
        const linkRegex = /(https?:\/\/[^\s]+)/g;
        // Expresión regular para detectar caracteres permitidos (solo letras, números y espacios)
        const validCharsRegex = /^[a-zA-Z0-9\s]+$/;
        // Expresión regular para eliminar emojis
        const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|\uD83D[\uDC00-\uDDFF]|\uD83E[\uDD00-\uDDFF])/g;

        // Verificar si el nombre es un enlace
        if (linkRegex.test(nombre)) return false;
        // Verificar si el nombre contiene solo espacios o un solo espacio
        if (nombre.trim().length === 0 || nombre.trim().length === 1) return false;
        // Verificar si el nombre contiene caracteres no permitidos
        if (!validCharsRegex.test(nombre)) return false;
        // Eliminar emojis y verificar si queda texto válido
        nombre = nombre.replace(emojiRegex, '');
        if (nombre.trim().length === 0) return false;

        return true;
    }

    validarFecha(fecha) {
        const regex = /^(0?[1-9]|[12][0-9]|3[01])\/(0?[1-9]|1[0-2])$/;
        return regex.test(fecha);
    }

    agregarTareaDesdeInput() {
        const tarea = this.input.value;
        if (tarea) {
            if (!this.validarNombre(tarea)) {
                this.mostrarAlerta('Nombre de tarea inválido. Asegúrate de que no sea un enlace, no contenga emojis, y tenga caracteres permitidos.');
            } else if (tarea.length > this.MAX_LENGTH) {
                this.mostrarAlerta(`El nombre de la tarea no puede exceder los ${this.MAX_LENGTH} caracteres.`);
            } else {
                const fechaCreacion = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
                this.agregarTarea(tarea, this.id, false, false, fechaCreacion);
                this.LIST.push({
                    nombre: tarea,
                    id: this.id,
                    realizado: false,
                    eliminado: false,
                    fechaCreacion: fechaCreacion
                });
                localStorage.setItem('TODO', JSON.stringify(this.LIST));
                this.id++;
                this.input.value = '';
            }
        }
    }

    agregarTareaConEnter(event) {
        if (event.key === 'Enter') {
            this.agregarTareaDesdeInput();
        }
    }

    gestionarTarea(event) {
        const element = event.target;
        const elementData = element.getAttribute('data');

        if (elementData === 'realizado') {
            this.tareaRealizada(element);
        } else if (elementData === 'eliminado') {
            this.tareaEliminada(element);
        } else if (elementData === 'editar') {
            this.tareaEditada(element);
        }
    }

    cargarLista(array) {
        this.lista.innerHTML = '';
        array.forEach(item => {
            this.agregarTarea(item.nombre, item.id, item.realizado, item.eliminado, item.fechaCreacion);
        });
    }

    buscarTareas() {
        const terminoBusqueda = this.busqueda.value.toLowerCase();
        const listaFiltrada = this.LIST.filter(tarea => tarea.nombre.toLowerCase().includes(terminoBusqueda));
        this.cargarLista(listaFiltrada);
    }

    limpiarBusqueda() {
        this.busqueda.value = '';
    }

    mostrarTodas() {
        this.limpiarBusqueda();
        this.cargarLista(this.LIST);
    }

    mostrarPendientes() {
        this.limpiarBusqueda();
        const listaPendientes = this.LIST.filter(tarea => !tarea.realizado && !tarea.eliminado);
        this.cargarLista(listaPendientes);
    }

    mostrarTerminadas() {
        this.limpiarBusqueda();
        const listaTerminadas = this.LIST.filter(tarea => tarea.realizado && !tarea.eliminado);
        this.cargarLista(listaTerminadas);
    }
}

const app = new TodoApp();
