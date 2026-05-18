class PrfModel {
  final int id;
  final String prfNo;
  final String date;
  final String requestor;
  final String itemDescription;
  final String status;

  PrfModel({
    required this.id,
    required this.prfNo,
    required this.date,
    required this.requestor,
    required this.itemDescription,
    required this.status,
  });

  factory PrfModel.fromJson(Map<String, dynamic> json) {
    return PrfModel(
      id: json['id'],
      prfNo: json['prfNo'] ?? 'PRF-${json['id']}',
      date: json['date'] ?? '',
      requestor: json['requestor'] ?? '',
      itemDescription: json['itemDescription'] ?? '',
      status: json['status'] ?? 'Pending',
    );
  }
}
