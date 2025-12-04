import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EventosService } from 'src/app/services/eventos.service';
import { FacadeService } from 'src/app/services/facade.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-editar-event-modal',
  templateUrl: './editar-event-modal.component.html',
  styleUrls: ['./editar-event-modal.component.scss']
})
export class EditarEventModalComponent {

  public loading = false;

  constructor(
    private eventosService: EventosService,
    private facadeService: FacadeService,
    private router: Router,
    private dialogRef: MatDialogRef<EditarEventModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { idEvento: number | null, evento: any }
  ) {}

  public cerrar_modal(){
    this.dialogRef.close({ isEdit: false });
  }

  public editarrEvent(){
    // Ejecuta la actualización como lo hacía el botón Actualizar
    this.loading = true;

    const evento = { ...this.data.evento };

    // Incluir el ID del evento en el payload (algunos backends lo requieren)
    if (this.data.idEvento != null) {
      (evento as any).id = this.data.idEvento;
    }

    // Normalizar fecha si es Date
    if (evento.fecha_evento instanceof Date) {
      evento.fecha_evento = evento.fecha_evento.toISOString().split('T')[0];
    }
    // Normalizar horas a HH:mm:00
    const toTime = (t: string) => {
      if (!t) return t;
      const s = String(t).trim();
      // Si viene en HH:mm o HH:mm:ss sin AM/PM
      const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
      if (m && !/[AaPp][Mm]/.test(s)) {
        const hh = m[1].padStart(2, '0');
        const mm = m[2].padStart(2, '0');
        return `${hh}:${mm}:00`;
      }
      // Soporte para AM/PM
      const ampm = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])$/);
      if (ampm) {
        let hh = parseInt(ampm[1], 10);
        const mm = parseInt(ampm[2], 10);
        const tag = ampm[4].toUpperCase();
        if (tag === 'PM' && hh !== 12) hh += 12;
        if (tag === 'AM' && hh === 12) hh = 0;
        return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`;
      }
      return t;
    };
    evento.hora_inicio = toTime(evento.hora_inicio);
    evento.hora_termino = toTime(evento.hora_termino);

    // Validación simple: hora_inicio < hora_termino para evitar 400 del backend
    const toMinutes = (val: string | undefined) => {
      if (!val) return NaN;
      const parts = String(val).split(':');
      if (parts.length < 2) return NaN;
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (isNaN(h) || isNaN(m)) return NaN;
      return h * 60 + m;
    };
    const startMin = toMinutes(evento.hora_inicio);
    const endMin = toMinutes(evento.hora_termino);
    if (!isNaN(startMin) && !isNaN(endMin) && startMin >= endMin) {
      alert('La hora de inicio debe ser menor que la hora de término');
      this.loading = false;
      this.dialogRef.close({ isEdit: false });
      return;
    }

    // Verificar sesión
    const token = this.facadeService.getSessionToken();
    if (!token) {
      alert('Debes iniciar sesión para actualizar un evento');
      this.router.navigate(['/login']);
      this.loading = false;
      this.dialogRef.close({ isEdit: false });
      return;
    }

    this.eventosService.actualizarEvento(evento).subscribe({
      next: (resp) => {
        alert('Evento actualizado con éxito');
        this.loading = false;
        this.dialogRef.close({ isEdit: true });
      },
      error: (err) => {
        console.error('Error al actualizar evento', err);
        // Mostrar mensaje específico si backend retorna errores de campo
        if (err?.error) {
          const e = err.error;
          const detalle = e.message || e.detail || e.error || JSON.stringify(e);
          alert(`Error al actualizar el evento: ${detalle}`);
        } else {
          alert('Error al actualizar el evento');
        }
        this.loading = false;
        this.dialogRef.close({ isEdit: false });
      }
    });
  }

}
