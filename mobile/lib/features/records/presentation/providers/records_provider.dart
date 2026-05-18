import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hdi_mobile/features/records/data/models/rfp_model.dart';
import 'package:hdi_mobile/features/records/data/models/prf_model.dart';
import 'package:hdi_mobile/features/records/data/services/rfp_service.dart';
import 'package:hdi_mobile/features/records/data/services/prf_service.dart';

final rfpServiceProvider = Provider((ref) => RfpService());
final prfServiceProvider = Provider((ref) => PrfService());

final rfpListProvider = FutureProvider<List<RfpModel>>((ref) async {
  return ref.watch(rfpServiceProvider).getRFPs();
});

final prfListProvider = FutureProvider<List<PrfModel>>((ref) async {
  return ref.watch(prfServiceProvider).getPRFs();
});

class UnifiedRecord {
  final String id;
  final String type;
  final String status;
  final String detail;
  final String amount;
  final String date;

  UnifiedRecord({
    required this.id,
    required this.type,
    required this.status,
    required this.detail,
    required this.amount,
    required this.date,
  });
}

final unifiedRecordsProvider = FutureProvider<List<UnifiedRecord>>((ref) async {
  final rfps = await ref.watch(rfpListProvider.future);
  final prfs = await ref.watch(prfListProvider.future);

  final List<UnifiedRecord> unified = [];

  for (var r in rfps) {
    unified.add(UnifiedRecord(
      id: r.rrfNo,
      type: 'Request for Payment',
      status: r.status,
      detail: r.payTo,
      amount: '₱ ${r.amount}',
      date: r.date,
    ));
  }

  for (var p in prfs) {
    unified.add(UnifiedRecord(
      id: p.prfNo,
      type: 'Purchase Request',
      status: p.status,
      detail: p.requestor,
      amount: p.itemDescription,
      date: p.date,
    ));
  }

  return unified;
});
