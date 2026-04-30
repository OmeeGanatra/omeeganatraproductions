import 'package:cloud_firestore/cloud_firestore.dart';

class ClientModel {
  final String id;
  final String fullName;
  final String email;
  final String? phone;
  final String? avatarUrl;
  final String status;
  final int projectCount;
  final DateTime? createdAt;

  const ClientModel({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone,
    this.avatarUrl,
    this.status = 'active',
    this.projectCount = 0,
    this.createdAt,
  });

  factory ClientModel.fromFirestore(DocumentSnapshot doc) {
    final j = doc.data() as Map<String, dynamic>? ?? {};
    return ClientModel(
      id: doc.id,
      fullName: j['fullName'] as String? ?? j['name'] as String? ?? '',
      email: j['email'] as String? ?? '',
      phone: j['phone'] as String?,
      avatarUrl: j['avatarUrl'] as String?,
      status: j['status'] as String? ?? 'active',
      projectCount: j['projectCount'] as int? ?? 0,
      createdAt: _parseDate(j['createdAt']),
    );
  }

  factory ClientModel.fromJson(Map<String, dynamic> j) {
    return ClientModel(
      id: j['id'] as String? ?? '',
      fullName: j['fullName'] as String? ?? j['name'] as String? ?? '',
      email: j['email'] as String? ?? '',
      phone: j['phone'] as String?,
      avatarUrl: j['avatarUrl'] as String?,
      status: j['status'] as String? ?? 'active',
      projectCount: j['projectCount'] as int? ?? 0,
      createdAt: j['createdAt'] != null
          ? DateTime.tryParse(j['createdAt'] as String)
          : null,
    );
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) return null;
    if (value is Timestamp) return value.toDate();
    if (value is String) return DateTime.tryParse(value);
    return null;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'email': email,
      'phone': phone,
      'avatarUrl': avatarUrl,
      'status': status,
      'projectCount': projectCount,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  String get initials {
    final parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    if (fullName.isNotEmpty) return fullName[0].toUpperCase();
    return email.isNotEmpty ? email[0].toUpperCase() : '?';
  }
}
