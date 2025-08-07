import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { io } from 'socket.io-client';

let L: any;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  deliveries: any[] = [];
  selectedUserId: string | null = null;

  private map: any;
  private socket = io('http://localhost:3000');
  private allMarkers: { [userId: string]: any } = {};
  private allPaths: { [userId: string]: [number, number][] } = {};
  private allPolylines: { [userId: string]: any } = {};
  private userColors: { [userId: string]: string } = {};

  private displayedMarker: any = null;
  private displayedPolyline: any = null;

  private colorPalette = [
    'red', 'blue', 'green', 'purple', 'orange', 'brown', 'teal', 'pink', 'cyan', 'black'
  ];
  private colorIndex = 0;

  async ngOnInit(): Promise<void> {
    if (typeof window === 'undefined') return;

    const leaflet = await import('leaflet');
    L = leaflet;

    this.initMap();
    this.listenForLocations();
  }

  private initMap(): void {
    this.map = L.map('map').setView([20.0, -100.0], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  private listenForLocations(): void {
    this.socket.on('location-update', (data: { userId: string; latitude: number; longitude: number; username?: string; status?: string }) => {
      const { userId, latitude, longitude, username, status } = data;

      if (!this.userColors[userId]) {
        this.userColors[userId] = this.colorPalette[this.colorIndex % this.colorPalette.length];
        this.colorIndex++;
      }

      // Guarda las ubicaciones
      if (!this.allPaths[userId]) this.allPaths[userId] = [];
      this.allPaths[userId].push([latitude, longitude]);

      // Actualiza lista de deliveries
      const existingIndex = this.deliveries.findIndex(d => d.userId === userId);
      const updatedData = {
        userId,
        username: username ?? `Delivery ${userId.slice(0, 4)}`,
        status: status ?? 'working',
        lat: latitude,
        lng: longitude
      };

      if (existingIndex > -1) {
        this.deliveries[existingIndex] = updatedData;
      } else {
        this.deliveries.push(updatedData);
      }

      // Si el delivery está seleccionado, actualizar el mapa
      if (userId === this.selectedUserId) {
        this.updateDisplayedRoute(userId);
      }
    });
  }

  selectDelivery(userId: string): void {
    this.selectedUserId = userId;
    this.updateDisplayedRoute(userId);
  }

  private updateDisplayedRoute(userId: string): void {
    // Limpia marcador anterior
    if (this.displayedMarker) {
      this.map.removeLayer(this.displayedMarker);
      this.displayedMarker = null;
    }

    // Limpia ruta anterior
    if (this.displayedPolyline) {
      this.map.removeLayer(this.displayedPolyline);
      this.displayedPolyline = null;
    }

    const path = this.allPaths[userId];
    if (!path || path.length === 0) return;

    const lastCoord = path[path.length - 1];

    // Agrega nuevo marcador
    this.displayedMarker = L.marker(lastCoord).addTo(this.map);

    // Agrega nueva polyline
    this.displayedPolyline = L.polyline(path, {
      color: this.userColors[userId] || 'blue'
    }).addTo(this.map);

    this.map.setView(lastCoord, 15);
  }

  openAssignPackagesModal(userId: string) {
    alert(`Asignar paquetes a: ${userId}`);
  }
}
