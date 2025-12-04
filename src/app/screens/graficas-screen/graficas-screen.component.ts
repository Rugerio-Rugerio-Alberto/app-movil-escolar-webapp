import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import DatalabelsPlugin from 'chartjs-plugin-datalabels';
import { AdministradoresService } from 'src/app/services/administradores.service';

@Component({
  selector: 'app-graficas-screen',
  templateUrl: './graficas-screen.component.html',
  styleUrls: ['./graficas-screen.component.scss']
})
export class GraficasScreenComponent implements OnInit{

  public total_user: any = {};

  //Histograma
  lineChartData = {
    labels: ["Administradores", "Maestros", "Alumnos"],
    datasets: [
      {
        data:[0, 0, 0],
        label: 'Total de Usuarios',
        backgroundColor: '#F88406'
      }
    ]
  }
  lineChartOption = {
    responsive: true,
    maintainAspectRatio: true
  }
  lineChartPlugins = [ DatalabelsPlugin ];

  //Barras
  barChartData = {
    labels: ["Administradores", "Maestros", "Alumnos"],
    datasets: [
      {
        data:[0, 0, 0],
        label: 'Total de Usuarios',
        backgroundColor: [
          '#F88406',
          '#FCFF44',
          '#82D3FB'
        ]
      }
    ]
  }
  barChartOption = {
    responsive: true,
    maintainAspectRatio: true
  }
  barChartPlugins = [ DatalabelsPlugin ];

  //Circular (Pie)
  pieChartData = {
    labels: ["Administradores", "Maestros", "Alumnos"],
    datasets: [
      {
        data: [0, 0, 0],
        label: 'Registro de usuarios',
        backgroundColor: [
          '#FCFF44',
          '#F1C8F2',
          '#31E731'
        ]
      }
    ]
  }
  pieChartOption = {
    responsive: true,
    maintainAspectRatio: true
  }
  pieChartPlugins = [ DatalabelsPlugin ];

  // Doughnut
  doughnutChartData = {
    labels: ["Administradores", "Maestros", "Alumnos"],
    datasets: [
      {
        data: [0, 0, 0],
        label: 'Registro de usuarios',
        backgroundColor: [
          '#F88406',
          '#FCFF44',
          '#31E7E7'
        ]
      }
    ]
  }
  doughnutChartOption = {
    responsive: true,
    maintainAspectRatio: true
  }
  doughnutChartPlugins = [ DatalabelsPlugin ];

  constructor(
    private administradoresServices: AdministradoresService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.obtenerTotalUsers();
  }

  // Función para obtener el total de usuarios registrados
  public obtenerTotalUsers(){
    this.administradoresServices.getTotalUsuarios().subscribe(
      (response) => {
        this.total_user = response;
        console.log("Total usuarios: ", this.total_user);

        // Mapeo robusto: intenta varias keys posibles y convierte a número
        const Admins = Number(this.total_user.admins ?? this.total_user.total_admins ?? this.total_user.total_Admins ?? 0);
        const Maestros = Number(this.total_user.maestros ?? this.total_user.total_maestros ?? this.total_user.total_Maestros ?? 0);
        const Alumnos = Number(this.total_user.alumnos ?? this.total_user.total_alumnos ?? this.total_user.total_Alumnos ?? 0);

        console.log("Admins:", Admins, "Maestros:", Maestros, "Alumnos:", Alumnos);

        // Actualizar los datos de todas las gráficas
        this.actualizarGraficas(Admins, Maestros, Alumnos);

        // Forzar la detección de cambios
        this.cdr.detectChanges();
      },
      (error) => {
        console.log("Error al obtener total de usuarios ", error);
        alert("No se pudo obtener el total de cada rol de usuarios");
      }
    );
    }

  // Función para actualizar dinámicamente todas las gráficas
  private actualizarGraficas(Admins: number, Maestros: number, Alumnos: number) {
    const datos = [Admins, Maestros, Alumnos];

    // Actualizar gráfica de línea
    this.lineChartData = {
      labels: ["Administradores", "Maestros", "Alumnos"],
      datasets: [{
        data: datos,
        label: 'Total de Usuarios',
        backgroundColor: '#F88406'
      }]
    };

    // Actualizar gráfica de barras
    this.barChartData = {
      labels: ["Administradores", "Maestros", "Alumnos"],
      datasets: [{
        data: datos,
        label: 'Total de Usuarios',
        backgroundColor: [
          '#F88406',
          '#FCFF44',
          '#82D3FB'
        ]
      }]
    };

    // Actualizar gráfica circular (pie)
    this.pieChartData = {
      labels: ["Administradores", "Maestros", "Alumnos"],
      datasets: [{
        data: datos,
        label: 'Registro de usuarios',
        backgroundColor: [
          '#FCFF44',
          '#F1C8F2',
          '#31E731'
        ]
      }]
    };

    // Actualizar gráfica de dona (doughnut)
    this.doughnutChartData = {
      labels: ["Administradores", "Maestros", "Alumnos"],
      datasets: [{
        data: datos,
        label: 'Registro de usuarios',
        backgroundColor: [
          '#F88406',
          '#FCFF44',
          '#31E7E7'
        ]
      }]
    };
  }

}
