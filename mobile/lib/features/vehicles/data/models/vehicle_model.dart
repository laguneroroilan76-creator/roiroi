class VehicleModel {
  final int id;
  final String name;
  final String plateNumber;
  final String brand;
  final String model;
  final String year;
  final String color;
  final String fuelType;
  final String transmission;
  final String status;

  VehicleModel({
    required this.id,
    required this.name,
    required this.plateNumber,
    required this.brand,
    required this.model,
    required this.year,
    required this.color,
    required this.fuelType,
    required this.transmission,
    required this.status,
  });

  factory VehicleModel.fromJson(Map<String, dynamic> json) {
    return VehicleModel(
      id: json['id'],
      name: json['name'] ?? '',
      plateNumber: json['plateNumber'] ?? '',
      brand: json['brand'] ?? '',
      model: json['model'] ?? '',
      year: json['year']?.toString() ?? '',
      color: json['color'] ?? '',
      fuelType: json['fuelType'] ?? '',
      transmission: json['transmission'] ?? '',
      status: json['status'] ?? 'Active',
    );
  }
}
