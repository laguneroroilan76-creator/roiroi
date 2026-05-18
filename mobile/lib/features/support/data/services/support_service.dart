import 'package:hdi_mobile/core/api/api_client.dart';
import 'package:hdi_mobile/features/support/data/models/support_model.dart';

class SupportService {
  final ApiClient _apiClient = ApiClient();

  Future<List<SupportModel>> getTickets() async {
    try {
      final response = await _apiClient.get('/support');
      final List<dynamic> data = response.data;
      return data.map((json) => SupportModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> createTicket(Map<String, dynamic> data) async {
    await _apiClient.post('/support', data: data);
  }
}
