import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { FacadeService } from 'src/app/services/facade.service';
import { EventosService } from 'src/app/services/eventos.service';
import { EliminarEventModalComponent } from 'src/app/modals/eliminar-event-modal/eliminar-event-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-eventos-academicos-screen',
  templateUrl: './eventos-academicos-screen.component.html',
  styleUrls: ['./eventos-academicos-screen.component.scss']
})
export class EventosAcademicosScreenComponent implements OnInit, AfterViewInit {
  public name_user: string = "";
  public rol: string = "";
  public token: string = "";
  public lista_eventos: any[] = [];

  //Para la tabla (se ajusta dinámicamente según rol)
  displayedColumns: string[] = ['nombre_evento', 'tipo_evento', 'lugar', 'publico_seleccionado', 'carrera', 'fecha_evento', 'hora_inicio', 'hora_termino', 'responsable', 'descripcion_evento', 'cupo_maximo'];
  dataSource = new MatTableDataSource<DatosUsuario>(this.lista_eventos as DatosUsuario[]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.sortingDataAccessor = (item: any, property: string) => {
      switch (property) {
        case 'nombre_evento': return item.nombre_evento.toLowerCase();
        case 'tipo_evento': return item.tipo_evento.toLowerCase();
        default: return '';
      }
    };
  }

  ngOnInit(): void {
    this.name_user = this.facadeService.getUserCompleteName();
    this.rol = this.facadeService.getUserGroup();
    // Ajustar columnas según rol
    if (this.rol === 'administrador') {
      this.displayedColumns = [...this.displayedColumns, 'editar', 'eliminar'];
    }
    //Validar que haya inicio de sesión
    //Obtengo el token del login
    this.token = this.facadeService.getSessionToken();
    console.log("Token: ", this.token);
    if(this.token == ""){
      this.router.navigate(["/"]);
    }
    //Obtener alumnos
    this.obtenerEventos();
  }

  constructor(
    public facadeService: FacadeService,
    public eventosService: EventosService,
    private router: Router,
    private dialog: MatDialog
  ) { }

  // Consumimos el servicio para obtener los alumnos
    //Obtener alumnos
  public obtenerEventos() {
    this.eventosService.obtenerListaEventos().subscribe(
      (response) => {
        // Filtrar según rol: alumnos solo ven eventos para Estudiantes o Público general
        const raw = Array.isArray(response) ? response : [];
        if (this.rol === 'alumno') {
          this.lista_eventos = raw.filter(e => {
            const pub = (e.publico_seleccionado || '').toLowerCase();
            return pub === 'estudiantes' || pub === 'publico general';
          });
        } else {
          this.lista_eventos = raw;
        }
        console.log("Eventos (filtrados por rol='" + this.rol + "'): ", this.lista_eventos);
        this.dataSource.data = this.lista_eventos as DatosUsuario[];
      }, (error) => {
        console.error("Error al obtener la lista de eventos: ", error);
        alert("No se pudo obtener la lista de eventos");
      }
    );
  }

  applyFilter(event: Event) {
  const filterValue = (event.target as HTMLInputElement).value;
  this.dataSource.filter = filterValue.trim().toLowerCase();
  if (this.paginator) this.paginator.firstPage();
  }

  public goEditar(idEvent: number) {
    if(this.rol !== 'administrador'){
      alert('No tienes permisos para editar este evento');
      return;
    }
    this.router.navigate(["registro-evento/" + idEvent]);
  }

  public delete(idUser: number) {
    // Solo administradores pueden eliminar eventos (ajusta si quieres permitir responsables)
    if (this.rol !== 'administrador') {
      alert('No tienes permisos para eliminar este evento');
      return;
    }
    const dialogRef = this.dialog.open(EliminarEventModalComponent, {
      data: { id: idUser, rol: 'evento' },
      height: '288px',
      width: '328px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result?.isDelete) {
        alert('Evento eliminado correctamente');
        // Refrescar lista sin recargar toda la página
        this.obtenerEventos();
      } else if (result) {
        alert('No se pudo eliminar el evento');
      }
    });
  }

}

//Esto va fuera de la llave que cierra la clase
export interface DatosUsuario {
  id: number,
  nombre_evento: string,
  tipo_evento: string,
  publico_seleccionado: string,
  carrera: string,
  fecha_evento: string,
  hora_inicio: string,
  hora_termino: string,
  lugar: string,
  responsable: string,
  descripcion_evento: string,
  cupo_maximo: number
}
