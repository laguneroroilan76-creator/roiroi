import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/rfp_model.dart';
import '../../data/services/rfp_service.dart';

final rfpServiceProvider = Provider((ref) => RfpService());

final rfpListProvider = FutureProvider<List<RfpModel>>((ref) async {
  final service = ref.watch(rfpServiceProvider);
  return service.getRFPs();
});
