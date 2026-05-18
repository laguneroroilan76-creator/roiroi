import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hdi_mobile/features/support/data/models/support_model.dart';
import 'package:hdi_mobile/features/support/data/services/support_service.dart';

final supportServiceProvider = Provider((ref) => SupportService());

final supportListProvider = FutureProvider<List<SupportModel>>((ref) async {
  return ref.watch(supportServiceProvider).getTickets();
});
