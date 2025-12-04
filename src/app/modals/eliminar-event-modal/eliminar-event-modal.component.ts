import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EventosService } from 'src/app/services/eventos.service';

@Component({
  selector: 'app-eliminar-event-modal',
  templateUrl: './eliminar-event-modal.component.html',
  styleUrls: ['./eliminar-event-modal.component.scss']
})
export class EliminarEventModalComponent implements OnInit {

  public rol: string = "";

  constructor(
    private eventosService: EventosService,
    private dialogRef: MatDialogRef<EliminarEventModalComponent>,
    @Inject (MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit(): void {
    this.rol = this.data.rol;
  }

  public cerrar_modal(){
    this.dialogRef.close({isDelete:false});
  }

  public eliminarUser(){
    // Eliminar evento por ID recibido en data
    this.eventosService.eliminarEvento(this.data.id).subscribe({
      next: (resp) => {
        console.log('Evento eliminado', resp);
        this.dialogRef.close({ isDelete: true });
      },
      error: (err) => {
        console.error('Error al eliminar evento', err);
        this.dialogRef.close({ isDelete: false });
      }
    });
  }

}
