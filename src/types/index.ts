export interface Route {
  route_id: string;
  route_name: string;
  route_distance_km: number;
  average_delivery_time_min: number;
  number_of_stops: number;
  area_served: string;
  vehicle_type_recommendation: string;
  typical_start_time: string;
  typical_end_time: string;
  // Campos Enriquecidos de Propuesta de Solución
  vehicle_id?: string;             // id_movil (Identificador único de transporte/auto)
  vehicle_type_name?: string;      // tipo_movil (Categoría técnica del transporte)
  max_weight_capacity_kg?: number; // Peso máximo que puede trasladar el vehículo (kg)
  max_volume_capacity_m3?: number; // Volumen máximo que puede trasladar el vehículo (m³)
  temp_control_type?: string;      // Rango de temperatura que maneja el vehículo
}

export interface Delivery {
  delivery_id: string;
  order_date: string;
  delivery_date: string;
  delivery_time_min: number;
  route_id: string;
  driver_id: string;
  customer_id: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  package_weight_kg: number | null;
  status: 'Delivered' | 'Delayed' | 'Cancelled' | null;
  reason_for_delay: string | null;
  // Campos Enriquecidos de Propuesta de Solución
  vehicle_id?: string;               // id_movil asignado al despacho
  vehicle_type?: string;             // tipo_movil asignado
  package_volume_m3?: number | null; // Volumen real del paquete (m³)
  required_temp?: string | null;      // Temperatura que requiere el alimento ('Congelado (-18°C)', 'Refrigerado (4°C - 8°C)', 'Ambiente')
  is_capacity_exceeded?: boolean;    // Alerta si excede capacidad máxima de peso o volumen
}

export interface DelayByRoute {
  route_id: string;
  route_name: string;
  average_delivery_time_min: number;
  avg_actual_delivery_time: number;
  avg_delay_diff_min: number;
  total_deliveries: number;
  delayed_deliveries_count: number;
}

export interface DriverStop {
  driver_id: string;
  total_deliveries_handled: number;
  routes_assigned_count: number;
  avg_stops_per_route: number;
  max_stops: number;
  delayed_count: number;
}

export interface DelayReason {
  reason_for_delay: string;
  total_incident_count: number;
  avg_delivery_time: number;
  min_delivery_time: number;
  max_delivery_time: number;
}

export interface Anomaly {
  delivery_id: string;
  route_id: string;
  driver_id: string;
  status: string | null;
  anomaly_type: string;
}

export interface SqlQueryItem {
  id: string;
  title: string;
  description: string;
  sql: string;
  category: 'Retrasos' | 'Vehículos' | 'Conductores' | 'Causas Raíz' | 'Integridad de Datos';
}
