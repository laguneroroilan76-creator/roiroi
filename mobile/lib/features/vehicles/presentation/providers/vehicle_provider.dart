import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hdi_mobile/features/vehicles/data/models/vehicle_model.dart';
import 'package:hdi_mobile/features/vehicles/data/services/vehicle_service.dart';

final vehicleServiceProvider = Provider((ref) => VehicleService());

final vehicleListProvider = FutureProvider<List<VehicleModel>>((ref) async {
  return ref.watch(vehicleServiceProvider).getVehicles();
});
