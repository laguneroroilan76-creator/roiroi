import 'package:hdi_mobile/core/api/api_client.dart';
import 'package:hdi_mobile/features/records/data/models/rfp_model.dart';

class RfpService {
  final ApiClient _apiClient = ApiClient();

  Future<List<RfpModel>> getRFPs() async {
    try {
      final response = await _apiClient.get('/rfp');
      final List<dynamic> data = response.data;
      return data.map((json) => RfpModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<RfpModel> createRFP(Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.post('/rfp', data: data);
      return RfpModel.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }
}
