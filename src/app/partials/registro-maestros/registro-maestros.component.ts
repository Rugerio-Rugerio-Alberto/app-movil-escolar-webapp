import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FacadeService } from 'src/app/services/facade.service';
import { Location } from '@angular/common';
import { MaestrosService } from 'src/app/services/maestros.service';

@Component({
  selector: 'app-registro-maestros',
  templateUrl: './registro-maestros.component.html',
  styleUrls: ['./registro-maestros.component.scss']
})
export class RegistroMaestrosComponent implements OnInit {

  @Input() rol: string = "";
  @Input() datos_user: any = {};

  //Para contraseñas
  public hide_1: boolean = false;
  public hide_2: boolean = false;
  public inputType_1: string = 'password';
  public inputType_2: string = 'password';

  public maestro:any = {};
  public errors:any = {};
  public editar:boolean = false;
  public token: string = "";
  public idUser: Number = 0;


  //Para el select
  public areas: any[] = [
    {value: '1', viewValue: 'Desarrollo Web'},
    {value: '2', viewValue: 'Programación'},
    {value: '3', viewValue: 'Bases de datos'},
    {value: '4', viewValue: 'Redes'},
    {value: '5', viewValue: 'Matemáticas'},
  ];

  public materias:any[] = [
    {value: '1', nombre: 'Aplicaciones Web'},
    {value: '2', nombre: 'Programación 1'},
    {value: '3', nombre: 'Bases de datos'},
    {value: '4', nombre: 'Tecnologías Web'},
    {value: '5', nombre: 'Minería de datos'},
    {value: '6', nombre: 'Desarrollo móvil'},
    {value: '7', nombre: 'Estructuras de datos'},
    {value: '8', nombre: 'Administración de redes'},
    {value: '9', nombre: 'Ingeniería de Software'},
    {value: '10', nombre: 'Administración de S.O.'},
  ];

  constructor(
    private router: Router,
    private location : Location,
    public activatedRoute: ActivatedRoute,
    private facadeService: FacadeService,
    private maestrosService: MaestrosService
  ) { }

  ngOnInit(): void {
    if(this.activatedRoute.snapshot.params['id'] != undefined){
      this.editar = true;
      this.idUser = this.activatedRoute.snapshot.params['id'];
      this.maestro = this.datos_user;
    }else{
      this.maestro = this.maestrosService.esquemaMaestro();
      this.maestro.rol = this.rol;
      this.token = this.facadeService.getSessionToken();
    }
    // Asegurar estructura de materias
    if (!this.maestro.materias_json) {
      this.maestro.materias_json = [];
    }
    console.log("Maestro: ", this.maestro);
  }

  public regresar(){
    this.location.back();
  }

  //Funciones para password
  showPassword()
  {
    if(this.inputType_1 == 'password'){
      this.inputType_1 = 'text';
      this.hide_1 = true;
    }
    else{
      this.inputType_1 = 'password';
      this.hide_1 = false;
    }
  }

  showPwdConfirmar()
  {
    if(this.inputType_2 == 'password'){
      this.inputType_2 = 'text';
      this.hide_2 = true;
    }
    else{
      this.inputType_2 = 'password';
      this.hide_2 = false;
    }
  }

  public registrar(){
    //Validamos si el formulario está lleno y correcto
    this.errors = {};
    this.errors = this.maestrosService.validarMaestro(this.maestro, this.editar);
    if(Object.keys(this.errors).length > 0){
      return false;
    }

    // Lógica para registrar un nuevo maestro
    if(this.maestro.password == this.maestro.confirmar_password){
      this.maestrosService.registrarMaestro(this.maestro).subscribe(
        (response) => {
          // Redirigir o mostrar mensaje de éxito
          alert("Maestro registrado exitosamente");
          console.log("Maestro registrado: ", response);
          if(this.token && this.token !== ""){
            this.router.navigate(["maestro"]);
          }else{
            this.router.navigate(["/"]);
          }
        },
        (error) => {
          // Manejar errores de la API
          alert("Error al registrar maestro");
          console.error("Error al registrar maestro: ", error);
        }
      );
    }else{
      alert("Las contraseñas no coinciden");
      this.maestro.password="";
      this.maestro.confirmar_password="";
    }
  }

  public actualizar(){
    this.errors = {};
    this.errors = this.maestrosService.validarMaestro(this.maestro, this.editar);
    if(Object.keys(this.errors).length > 0){
      return false;
    }

    const payload: any = { ...this.maestro };
    payload.fecha_nacimiento = this.formatDateToYMD(this.maestro.fecha_nacimiento);
    payload.materias_json = this.normalizeMateriasArray(this.maestro.materias_json);

    if (payload.rfc) payload.rfc = String(payload.rfc).toUpperCase();

    this.maestrosService.actualizarMaestro(payload).subscribe(
      (response) => {
        alert("Maestro actualizado exitosamente");
        console.log("Maestro actualizado: ", response);
        this.router.navigate(["maestro"]);
      },
      (error) => {
        alert("Error al actualizar maestro");
        console.error("Error al actualizar maestro: ", error);
      }
    );
  }


  //Función para detectar el cambio de fecha
  public changeFecha(event :any){
    console.log(event);
    console.log(event.value.toISOString());

    this.maestro.fecha_nacimiento = event.value.toISOString().split("T")[0];
    console.log("Fecha: ", this.maestro.fecha_nacimiento);
  }


  // Funciones para los checkbox
  public checkboxChange(event:any){
    const rawValue = event.source?.value ?? event.target?.value;
    const checked = event.checked;
    if (rawValue === undefined || rawValue === null) { return; }
    if (!Array.isArray(this.maestro.materias_json)) {
      this.maestro.materias_json = [];
    }
    const valueStr = String(rawValue);
    if (checked) {
      if (!this.maestro.materias_json.includes(valueStr)) {
        this.maestro.materias_json.push(valueStr);
      }
    } else {
      this.maestro.materias_json = this.maestro.materias_json.filter((m: any) => String(m) !== valueStr);
    }
  }

  public revisarSeleccion(nombre: string){
    if (!Array.isArray(this.maestro.materias_json)) {
    return false;
  }
  return this.maestro.materias_json.map((m: any) => String(m)).includes(String(nombre));
  }

  private formatDateToYMD(value: any): string | null {
  if (!value) return null;
  const d = (value instanceof Date) ? value : new Date(value);
  if (isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
  }

  private normalizeMateriasArray(input: any): string[] {
    if (!input) return [];
    if (!Array.isArray(input)) {
      try { input = JSON.parse(input); } catch { return []; }
    }
    const mapped: string[] = [];
    for (const item of input) {
      if (item === undefined || item === null) { continue; }
      if (typeof item === 'object') {
        if ('value' in item) {
          mapped.push(String(item.value));
          continue;
        }
      }
      if (typeof item === 'number') {
        mapped.push(String(item));
        continue;
      }
      if (typeof item === 'string') {
        mapped.push(item);
        continue;
      }
    }
    return mapped;
  }

  public soloLetras(event: KeyboardEvent) {
    const charCode = event.key.charCodeAt(0);
    // Permitir solo letras (mayúsculas y minúsculas) y espacio
    if (
      !(charCode >= 65 && charCode <= 90) &&  // Letras mayúsculas
      !(charCode >= 97 && charCode <= 122) && // Letras minúsculas
      charCode !== 32                         // Espacio
    ) {
      event.preventDefault();
    }
  }
}
