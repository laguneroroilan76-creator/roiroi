import 'package:hdi_mobile/core/api/api_client.dart';
import 'package:hdi_mobile/features/dashboard/data/models/dashboard_models.dart';

class DashboardService {
  final ApiClient _apiClient = ApiClient();

  Future<DashboardStats> getStats() async {
    try {
      final responses = await Future.wait([
        _apiClient.get('/trip-tickets'),
        _apiClient.get('/prfs'),
        _apiClient.get('/rfps'),
      ]);

      final List<dynamic> tickets = responses[0].data ?? [];
      final List<dynamic> prfs = responses[1].data ?? [];
      final List<dynamic> rrf = responses[2].data ?? [];

      final allDocs = [...tickets, ...prfs, ...rrf];

      final approvedCount = allDocs.where((d) => 
        ['Approved', 'Completed', 'DEPARTED', 'ARRIVED'].contains(d['status'])
      ).length;

      final pendingCount = allDocs.where((d) => 
        ['Pending', 'Pending Endorsement', 'Pending Approval'].contains(d['status']) || d['status'] == null
      ).length;

      return DashboardStats(approved: approvedCount, pending: pendingCount);
    } catch (e) {
      rethrow;
    }
  }
}
