class RfpModel {
  final int id;
  final String rrfNo;
  final String date;
  final String payTo;
  final String amount;
  final String status;
  final String? approvedBy;
  final String? archivedBy;

  RfpModel({
    required this.id,
    required this.rrfNo,
    required this.date,
    required this.payTo,
    required this.amount,
    required this.status,
    this.approvedBy,
    this.archivedBy,
  });

  factory RfpModel.fromJson(Map<String, dynamic> json) {
    return RfpModel(
      id: json['id'],
      rrfNo: json['rrfNo'] ?? 'RRF-${json['id']}',
      date: json['date'] ?? '',
      payTo: json['payTo'] ?? '',
      amount: json['amount']?.toString() ?? '0.00',
      status: json['status'] ?? 'Pending',
      approvedBy: json['approvedBy'],
      archivedBy: json['archivedBy'],
    );
  }
}
