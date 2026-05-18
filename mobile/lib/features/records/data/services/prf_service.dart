import 'package:hdi_mobile/core/api/api_client.dart';
import 'package:hdi_mobile/features/records/data/models/prf_model.dart';

class PrfService {
  final ApiClient _apiClient = ApiClient();

  Future<List<PrfModel>> getPRFs() async {
    try {
      final response = await _apiClient.get('/prfs');
      final List<dynamic> data = response.data;
      return data.map((json) => PrfModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }
}
