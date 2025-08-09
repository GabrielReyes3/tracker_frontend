import { Component, OnDestroy, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { isPlatformBrowser } from '@angular/common';

let L: any;

@Component({
  selector: 'app-delivery',
  standalone: true,
  imports: [],
  templateUrl: './delivery.component.html',
  styleUrls: ['./delivery.component.scss']
})
export class DeliveryComponent implements OnInit, OnDestroy {
  private intervalId: any;
  private socket: Socket;

  private map: any;
  private marker: any;
  private path: [number, number][] = [];
  private polyline: any;
  private customIcon: any;

  packages = [
    { id: 1, description: 'Paquete 1', status: 'En tránsito' },
    { id: 2, description: 'Paquete 2', status: 'En tránsito' },
    { id: 3, description: 'Paquete 3', status: 'En tránsito' },
  ];

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.socket = io('http://localhost:3000');
  }

  async ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('No se ejecuta geolocalización en servidor (SSR)');
      return;
    }

    const LModule = (await import('leaflet')).default;
    L = LModule;

    this.initMap();
    this.startSendingLocation();
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
    this.socket.disconnect();
  }

  initMap() {
    // Centrar inicialmente en Querétaro con zoom 13
    this.map = L.map('map').setView([20.5888, -100.3899], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Definir icono personalizado (ajusta la ruta a tu imagen en assets)
    this.customIcon = L.icon({
      iconUrl: 'assets/marker-icon.png',
      iconSize: [22, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      shadowUrl: '',
    });

    // NO agregar marcador fijo aquí

    this.polyline = L.polyline([], { color: 'blue' }).addTo(this.map);

    console.log('Mapa inicializado:', this.map);
  }

  startSendingLocation() {
    if ('geolocation' in navigator) {
      // Obtener ubicación inicial y centrar mapa + marcador
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.updateMapPosition(latitude, longitude);

          // Después de obtener la ubicación inicial, iniciar envío periódico cada 10s
          this.intervalId = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                this.updateMapPosition(lat, lng);
                this.sendLocationToBackend(lat, lng);
                this.emitLocationViaSocket(lat, lng);
              },
              (error) => console.error('Error obteniendo ubicación:', error)
            );
          }, 10000);
        },
        (error) => {
          console.error('Error obteniendo ubicación inicial:', error);
        }
      );
    } else {
      console.warn('Geolocalización no soportada en navegador');
    }
  }

  updateMapPosition(lat: number, lng: number) {
    console.log('Actualizando posición:', lat, lng);

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { icon: this.customIcon }).addTo(this.map);
    }

    this.path.push([lat, lng]);
    this.polyline.setLatLngs(this.path);
    this.map.setView([lat, lng]);
  }

  sendLocationToBackend(lat: number, lng: number) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post('http://localhost:3000/api/locations', { lat, lng }, { headers }).subscribe({
      next: () => console.log('Ubicación enviada a backend:', lat, lng),
      error: err => console.error('Error enviando ubicación al backend:', err)
    });
  }

  emitLocationViaSocket(lat: number, lng: number) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const username = user.username || 'Anónimo';
    const userId = user.id;

    this.socket.emit('location-update', {
      userId,
      username,
      latitude: lat,
      longitude: lng
    });
  }

  updatePackageStatus(pkgId: number, event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const newStatus = selectElement.value;

    const pkg = this.packages.find(p => p.id === pkgId);
    if (pkg) {
      pkg.status = newStatus;
      console.log(`Paquete ${pkgId} actualizado a estado: ${newStatus}`);
    }
  }
}
