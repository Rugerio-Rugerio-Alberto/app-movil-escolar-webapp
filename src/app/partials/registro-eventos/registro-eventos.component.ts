import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { EditarEventModalComponent } from 'src/app/modals/editar-event-modal/editar-event-modal.component';
import { Location } from '@angular/common';
import { AdministradoresService } from 'src/app/services/administradores.service';
import { MaestrosService } from 'src/app/services/maestros.service';
import { FacadeService } from 'src/app/services/facade.service';
import { EventosService } from '../../services/eventos.service';

@Component({
  selector: 'app-registro-eventos',
  templateUrl: './registro-eventos.component.html',
  styleUrls: ['./registro-eventos.component.scss']
})
export class RegistroEventosComponent implements OnInit {

  public evento: any = {};
  public errors: any = {};
  @Input() editar: boolean = false; // se recibe desde el padre cuando es edición
  @Input() idEvento: number | null = null; // ID del evento a editar

  public lista_maestros: any[] = [];
  public lista_admins: any[] = [];
  public lista_responsables: any[] = []; // unificada para el select de responsables

  public tipos: any[] = [
    {value: '1', viewValue: 'Conferencia'},
    {value: '2', viewValue: 'Taller'},
    {value: '3', viewValue: 'Seminario'},
    {value: '4', viewValue: 'Concurso'},
  ];

  public publicos:any[] = [
    {value: '1', opciones: 'Estudiantes'},
    {value: '2', opciones: 'Profesores'},
    {value: '3', opciones: 'Publico general'},
  ];

public carreras: any[] = [
  {value: '1', viewValue: 'Ingeniería en Ciencias de la Computación'},
  {value: '2', viewValue: 'Licenciatura en Ciencias de la Computación'},
  {value: '3', viewValue: 'Ingeniería en Tecnologías de la Información'},
];

  constructor(
    public facadeService: FacadeService,
    private administradoresService: AdministradoresService,
    public maestrosService: MaestrosService,
    private location: Location,
    public activatedRoute: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private eventosService: EventosService
  ) { }

  ngOnInit(): void {
    // Inicializar esquema base
    this.evento = this.eventosService.esquemaEvento();

    // Backward compatibility: si no vino por Input intentar tomarlo de la ruta
    if (this.idEvento == null) {
      const idRuta = this.activatedRoute.snapshot.params['id'];
      if (idRuta !== undefined) {
        this.idEvento = Number(idRuta);
      }
    }

    this.obtenerAdmins();
    this.obtenerMaestros();

    // Si estamos en modo edición y tenemos ID, cargar datos del evento
    if (this.editar && this.idEvento) {
      this.cargarEvento();
    }
  }

  public changeFecha(event :any){
    console.log(event);
    console.log(event.value.toISOString());

    this.evento.fecha_evento = event.value.toISOString().split("T")[0];
    console.log("Fecha: ", this.evento.fecha_evento);
  }

  public regresar() {
    this.location.back();
  }


  public soloAlfanumericos(event: KeyboardEvent) {
    const charCode = event.key.charCodeAt(0);
    // Permitir letras mayúsculas (A-Z), minúsculas (a-z), números (0-9) y espacio
    if (
      !(charCode >= 65 && charCode <= 90) &&   // Letras mayúsculas
      !(charCode >= 97 && charCode <= 122) &&  // Letras minúsculas
      !(charCode >= 48 && charCode <= 57) &&   // Números
      charCode !== 32                          // Espacio
    ) {
      event.preventDefault();
    }
  }

  // Permite letras (incluye acentos), números y signos de puntuación básicos en textarea
  public soloDescripcion(event: KeyboardEvent) {
    const key = event.key;
    // Permitir teclas de control como Backspace, Delete, Arrow keys, Enter, Tab
    const controlKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', 'Tab'];
    if (controlKeys.includes(key)) {
      return; // dejar pasar
    }

    // Limitar longitud a 300 caracteres
    const current = this.evento.descripcion_evento || '';
    if (current.length >= 300) {
      event.preventDefault();
      return;
    }

    // Permitir letras (incluye acentos), números, espacios y signos básicos: . , ; : ? ! ' " ( ) - _ /
    const allowed = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s\.,;:\?\!\'"()\-_\/]+$/;
    if (!allowed.test(key)) {
      event.preventDefault();
    }
  }

  public checkboxChange(event: any, nombre: string) {
    if (event.checked) {
      // Guardar solo la opción seleccionada
      this.evento.publico_seleccionado = nombre;
      // Si la opción seleccionada no es Estudiantes, limpiar la carrera
      if (nombre !== 'Estudiantes') {
        this.evento.carrera = null;
      }
    } else {
      // Si se desmarca, limpiar la selección y la carrera
      this.evento.publico_seleccionado = '';
      this.evento.carrera = null;
    }
  }

  //Obtener lista de usuarios
  public obtenerAdmins() {
    this.administradoresService.obtenerListaAdmins().subscribe(
      (response) => {
        this.lista_admins = response;
        this.buildResponsables();
        console.log("Lista users: ", this.lista_admins);
      }, (error) => {
        alert("No se pudo obtener la lista de administradores");
      }
    );
  }

  //Permite solo numeros enteros
  public soloNumeros(event: KeyboardEvent) {
    const key = event.key;
    const controlKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (controlKeys.includes(key)) return; // permitir control

    // permitir solo un dígito 0-9
    if (!/^[0-9]$/.test(key)) {
      event.preventDefault();
      return;
    }

    // controlar la longitud resultante considerando selección
    const input = event.target as HTMLInputElement;
    const val = input?.value ?? '';
    const selStart = input.selectionStart ?? val.length;
    const selEnd = input.selectionEnd ?? val.length;
    const newLen = val.length - (selEnd - selStart) + 1; // +1 por el nuevo dígito
    if (newLen > 3) {
      event.preventDefault();
      return;
    }
  }

  // Manejar pegado en el campo cupo_maximo: limpiar y truncar a 3 dígitos
  public onCupoPaste(event: ClipboardEvent) {
    const paste = event.clipboardData?.getData('text') ?? '';
    const digits = paste.replace(/\D/g, '').slice(0, 3);
    if (!digits) {
      event.preventDefault();
      return;
    }
    const input = event.target as HTMLInputElement;
    const before = input.value.slice(0, input.selectionStart ?? 0);
    const after = input.value.slice(input.selectionEnd ?? 0);
    const newVal = (before + digits + after).replace(/\D/g, '').slice(0, 3);
    this.evento.cupo_maximo = Number(newVal);
    event.preventDefault();
  }

  //Obtener lista de maestros
  public obtenerMaestros() {
    this.maestrosService.obtenerListaMaestros().subscribe(
      (response) => {
        this.lista_maestros = response;
        this.buildResponsables();
        console.log("Lista maestros: ", this.lista_maestros);
      }, (error) => {
        alert("No se pudo obtener la lista de maestros");
      }
    );
  }

  // Construye lista unificada de responsables a partir de admins y maestros
  private buildResponsables() {
    const responsables: any[] = [];
    if (Array.isArray(this.lista_admins)) {
      this.lista_admins.forEach((a: any) => {
        // a.user contiene el objeto user en la respuesta
        const name = a.user ? `${a.user.first_name} ${a.user.last_name}` : (a.first_name ? `${a.first_name} ${a.last_name}` : 'Administrador');
        responsables.push({
          id: a.user?.id ?? a.id,
          type: 'administrador',
          name,
          original: a
        });
      });
    }
    if (Array.isArray(this.lista_maestros)) {
      this.lista_maestros.forEach((m: any) => {
        const name = m.user ? `${m.user.first_name} ${m.user.last_name}` : (m.first_name ? `${m.first_name} ${m.last_name}` : 'Maestro');
        responsables.push({
          id: m.user?.id ?? m.id,
          type: 'maestro',
          name,
          original: m
        });
      });
    }
    this.lista_responsables = responsables;
  }

// recibe valor del timepicker (formato "HH:mm" o "H:mm")
  public onHoraInicioSet(time: string) {
    const t24 = this.normalizeTimeTo24(time);
    // Guardar en modelo sin segundos para que el timepicker no falle
    this.evento.hora_inicio = t24 ? t24.slice(0,5) : time;
    this.validateHoras();
  }

  public onHoraTerminoSet(time: string) {
    const t24 = this.normalizeTimeTo24(time);
    this.evento.hora_termino = t24 ? t24.slice(0,5) : time;
    this.validateHoras();
  }

  // Normaliza cadenas de hora a formato 24h HH:MM
  private normalizeTimeTo24(input: string | undefined | null): string | null {
    if (!input) return null;
    let s = String(input).trim();

    // Si ya está en formato HH:MM o HH:MM:SS sin AM/PM
    const basic24 = /^\d{1,2}:\d{2}(:\d{2})?$/.test(s) && !/[AaPp][Mm]/.test(s);
    if (basic24) {
      const parts = s.split(':');
      const hh = parseInt(parts[0], 10);
      const mm = parseInt(parts[1] || '0', 10);
      if (isNaN(hh) || isNaN(mm)) return null;
      // Asegurar formato con segundos para compatibilidad con el TimeField del backend
      return this.pad2(hh) + ':' + this.pad2(mm) + ':00';
    }

    // Manejo AM/PM: ej. "9:30 PM", "09:30AM"
    const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])?$/);
    if (!m) return null;
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ampm = (m[4] || '').toUpperCase();
    if (ampm === 'PM' && hh !== 12) hh += 12;
    if (ampm === 'AM' && hh === 12) hh = 0;
    if (isNaN(hh) || isNaN(mm)) return null;
    // Devolver con segundos para evitar errores de formato en el servidor
    return this.pad2(hh) + ':' + this.pad2(mm) + ':00';
  }

  private pad2(n: number): string { return n < 10 ? '0' + n : String(n); }

  private parseTimeToMinutes(t: string): number {
    if (!t) return NaN;

    // Limpiar espacios
    t = t.trim();

    // Verificar si contiene AM/PM
    const isAM = t.toUpperCase().includes('AM');
    const isPM = t.toUpperCase().includes('PM');

    // Remover AM/PM del string
    let timeStr = t.replace(/\s*(AM|PM|am|pm)\s*/g, '').trim();

    const parts = timeStr.split(':').map(p => parseInt(p, 10));
    if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return NaN;

    let hours = parts[0];
    const minutes = parts[1];

    // Convertir a formato 24 horas si tiene AM/PM
    if (isPM && hours !== 12) {
      hours += 12;
    }
    if (isAM && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  }


  private validateHoras() {
    // reset errores previos
    delete this.errors.hora_inicio;
    delete this.errors.hora_termino;

    const start = this.parseTimeToMinutes(this.evento.hora_inicio);
    const end = this.parseTimeToMinutes(this.evento.hora_termino);

    if (!isNaN(start) && !isNaN(end)) {
      if (start >= end) {
        this.errors.hora_inicio = 'La hora de inicio debe ser menor que la hora de término';
        this.errors.hora_termino = 'La hora de término debe ser mayor que la hora de inicio';
      }
    }
  }

  public validarHorasCompletas(): boolean {
    const start = this.parseTimeToMinutes(this.evento.hora_inicio);
    const end = this.parseTimeToMinutes(this.evento.hora_termino);

    // Validar que ambas horas estén definidas
    if (isNaN(start) || isNaN(end)) {
      this.errors.hora_inicio = 'La hora de inicio es requerida';
      this.errors.hora_termino = 'La hora de término es requerida';
      return false;
    }

    // Validar que inicio < término
    if (start >= end) {
      this.errors.hora_inicio = 'La hora de inicio debe ser menor que la hora de término';
      this.errors.hora_termino = 'La hora de término debe ser mayor que la hora de inicio';
      return false;
    }

    return true;
  }

  public registrar(){

  if (!this.validarHorasCompletas()) {
    return;
  }

    this.errors = {};
    this.errors = this.eventosService.validarEvento(this.evento, this.editar);
    if(Object.keys(this.errors).length > 0){
      return false;
    }

    const token = this.facadeService.getSessionToken();
    if (!token) {
      alert('Debes iniciar sesión para crear un evento');
      this.router.navigate(['/login']); // o mostrar modal/login
      return;
    }

      // Normalizar fecha a string YYYY-MM-DD antes de enviar si es Date
      if (this.evento.fecha_evento instanceof Date) {
        this.evento.fecha_evento = this.evento.fecha_evento.toISOString().split('T')[0];
      }

    // Asegurar que las horas se envíen en un formato aceptado por Django TimeField
    if (this.evento.hora_inicio) {
      const ni = this.normalizeTimeTo24(this.evento.hora_inicio);
      if (ni) this.evento.hora_inicio = ni;
    }
    if (this.evento.hora_termino) {
      const nt = this.normalizeTimeTo24(this.evento.hora_termino);
      if (nt) this.evento.hora_termino = nt;
    }

    // Consumir servicio para registrar administradores
    this.eventosService.registrarEvento(this.evento).subscribe({
      next: (response:any) => {
        //Aquí va la ejecución del servicio si todo es correcto
        alert('Evento registrado con éxito');
        console.log("Evento registrado",response);
        // Redirigir a la pantalla de eventos académicos después del registro
        this.router.navigate(['eventos-academicos']);

      },
      error: (error:any) => {
        if(error.status === 422){
          this.errors = error.error.errors;
        }else if(error.status === 401){
          alert('No tienes permisos para registrar un evento');
          this.router.navigate(['/login']);
        } else {
          alert('Error al registrar el evento');
          console.log("Error al registrar el evento", error);
        }
      }
    });
  }

  public actualizar(){
    // Abrir modal de edición; el modal ejecuta la actualización
    const dialogRef = this.dialog.open(EditarEventModalComponent, {
      data: { idEvento: this.idEvento, evento: this.evento },
      height: '288px',
      width: '328px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.isEdit) {
        // tras editar, ir a lista
        this.router.navigate(['eventos-academicos']);
      }
    });
  }

  // Cargar evento por ID para modo edición
  private cargarEvento() {
    this.eventosService.obtenerEventoPorID(this.idEvento!).subscribe({
      next: (response: any) => {
        // Asignar directamente y normalizar fecha si viene en formato string
        this.evento = { ...response };
        if (response.fecha_evento) {
          // Convertir a Date para que el datepicker lo muestre correctamente
          this.evento.fecha_evento = new Date(response.fecha_evento);
        }
        // Ajustar horas al formato esperado por el timepicker (HH:mm)
        const toHHMM = (t: any) => {
          if (!t) return t;
          const s = String(t).trim();
          const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
          if (m) {
            const hh = m[1].padStart(2, '0');
            const mm = m[2].padStart(2, '0');
            return `${hh}:${mm}`;
          }
          // Si viene con AM/PM u otro formato, intentar normalizar y luego quitar segundos
          const norm = this.normalizeTimeTo24(s);
          if (norm) {
            const parts = norm.split(':');
            return `${parts[0]}:${parts[1]}`;
          }
          return s;
        };
        this.evento.hora_inicio = toHHMM(response.hora_inicio);
        this.evento.hora_termino = toHHMM(response.hora_termino);
        // Marcar modo edición por si no estaba
        this.editar = true;
        console.log('Evento cargado para edición:', this.evento);
      },
      error: (error: any) => {
        console.error('No se pudo cargar el evento', error);
        alert('No se pudo cargar el evento seleccionado');
      }
    });
  }

}
