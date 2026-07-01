import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hdi_mobile/features/dashboard/data/models/dashboard_models.dart';
import 'package:hdi_mobile/features/dashboard/data/services/dashboard_service.dart';

final dashboardServiceProvider = Provider((ref) => DashboardService());

final dashboardStatsProvider = FutureProvider<DashboardStats>((ref) async {
  final service = ref.watch(dashboardServiceProvider);
  return service.getStats();
});
