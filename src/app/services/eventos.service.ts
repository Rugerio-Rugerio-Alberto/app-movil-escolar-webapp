import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FacadeService } from './facade.service';
import { ErrorsService } from './tools/errors.service';
import { ValidatorService } from './tools/validator.service';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
  providedIn: 'root'
})
export class EventosService {

  constructor(
    private http: HttpClient,
    private validatorService: ValidatorService,
    private errorService: ErrorsService,
    private facadeService: FacadeService
  ) { }

  public esquemaEvento() {
    return {
      'nombre_evento': '',
      'tipo_evento': '',
      'fecha_evento': '',
      'hora_inicio': '',
      'hora_termino': '',
      'lugar': '',
      'publico_seleccionado': '',
      'carrera': '',
      'responsable': '',
      'descripcion_evento': '',
      'cupo_maximo': ''
    };
  }

  // Validación para el formulario de evento
  public validarEvento(data: any, editar: boolean) {
    let error: any = {};

    if (!this.validatorService.required(data['nombre_evento'])) {
      error['nombre_evento'] = this.errorService.required;
    }

    if (!this.validatorService.required(data['tipo_evento'])) {
      error['tipo_evento'] = this.errorService.required;
    }

    if (!this.validatorService.required(data['fecha_evento'])) {
      error['fecha_evento'] = this.errorService.required;
    }

    if (!this.validatorService.required(data['hora_inicio'])) {
      error['hora_inicio'] = this.errorService.required;
    }

    if (!this.validatorService.required(data['lugar'])) {
      error['lugar'] = this.errorService.required;
    }

    if (!this.validatorService.required(data['publico_seleccionado'])) {
      error['publico_seleccionado'] = this.errorService.required;
    }

    // Si el público es Estudiantes, carrera es obligatoria
    if (data['publico_seleccionado'] === 'Estudiantes' && !this.validatorService.required(data['carrera'])) {
      error['carrera'] = this.errorService.required;
    }

    // Descripción: máximo 300 caracteres
    // Descripción: ahora obligatoria y con máximo 300 caracteres
    if (!this.validatorService.required(data['descripcion_evento'])) {
      error['descripcion_evento'] = this.errorService.required;
    } else {
      if (!this.validatorService.max(data['descripcion_evento'], 300)) {
        error['descripcion_evento'] = this.errorService.max(300);
      }
    }

    // Cupo máximo: ahora obligatorio, debe ser numérico entero entre 1 y 999
    if (!this.validatorService.required(data['cupo_maximo'])) {
      error['cupo_maximo'] = this.errorService.required;
    } else {
      if (!this.validatorService.numeric(data['cupo_maximo'])) {
        error['cupo_maximo'] = 'El cupo máximo debe ser numérico';
      } else {
        const num = Number(data['cupo_maximo']);
        if (!Number.isInteger(num) || num < 1 || num > 999) {
          error['cupo_maximo'] = 'El cupo máximo debe ser un entero entre 1 y 999';
        }
      }
    }

    // Responsable: debe estar presente (objeto o id)
    if (!this.validatorService.required(data['responsable'])) {
      error['responsable'] = this.errorService.required;
    }

    return error;
  }

  // Servicios HTTP
  public registrarEvento(data: any): Observable<any> {
      // Verificamos si existe el token de sesión
      const token = this.facadeService.getSessionToken();
      let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      if (token) {
        headers = headers.set('Authorization', 'Token ' + token);
      }
    return this.http.post<any>(`${environment.url_api}/evento/`, data, { headers });
  }

  // Petición para obtener la lista de alumnos
  public obtenerListaEventos(): Observable<any> {
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      console.log("No se encontró el token del usuario");

    }
    return this.http.get<any>(`${environment.url_api}/lista-eventos/`, { headers });
  }

  // Petición para obtener un alumno por su ID
  public obtenerEventoPorID(idEvento: number): Observable<any>{
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      console.log("No se encontró el token del usuario");
    }
    return this.http.get<any>(`${environment.url_api}/evento/?id=${idEvento}`, { headers });
  }

  public actualizarEvento(data: any): Observable<any>{
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      console.log("No se encontró el token del usuario");
    }
    return this.http.put<any>(`${environment.url_api}/evento/`, data, { headers });
  }

  // Petición para eliminar un evento
  public eliminarEvento(idEvento: number): Observable<any> {
    const token = this.facadeService.getSessionToken();
    let headers: HttpHeaders;
    if (token) {
      headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
    } else {
      headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      console.log("No se encontró el token del usuario");
    }
    return this.http.delete<any>(`${environment.url_api}/evento/?id=${idEvento}`, { headers });
  }


}
