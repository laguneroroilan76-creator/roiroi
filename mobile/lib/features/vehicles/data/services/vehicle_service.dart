import 'package:hdi_mobile/core/api/api_client.dart';
import 'package:hdi_mobile/features/vehicles/data/models/vehicle_model.dart';

class VehicleService {
  final ApiClient _apiClient = ApiClient();

  Future<List<VehicleModel>> getVehicles() async {
    try {
      final response = await _apiClient.get('/vehicles');
      final List<dynamic> data = response.data;
      return data.map((json) => VehicleModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteVehicle(int id) async {
    await _apiClient.delete('/vehicles/$id');
  }
}
