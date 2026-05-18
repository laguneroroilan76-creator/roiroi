class SupportModel {
  final int id;
  final String subject;
  final String description;
  final String category;
  final String priority;
  final String status;
  final String createdAt;
  final String authorName;

  SupportModel({
    required this.id,
    required this.subject,
    required this.description,
    required this.category,
    required this.priority,
    required this.status,
    required this.createdAt,
    required this.authorName,
  });

  factory SupportModel.fromJson(Map<String, dynamic> json) {
    return SupportModel(
      id: json['id'],
      subject: json['subject'] ?? '',
      description: json['description'] ?? '',
      category: json['category'] ?? 'Others',
      priority: json['priority'] ?? 'Medium',
      status: json['status'] ?? 'Pending',
      createdAt: json['createdAt'] ?? '',
      authorName: json['author']?['name'] ?? 'Unknown User',
    );
  }
}
