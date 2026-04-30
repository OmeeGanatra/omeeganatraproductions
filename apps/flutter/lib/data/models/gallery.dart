import 'package:cloud_firestore/cloud_firestore.dart';

class Gallery {
  final String id;
  final String projectId;
  final String title;
  final String slug;
  final String? coverImageUrl;
  final int mediaCount;
  final String status;
  final bool downloadEnabled;
  final bool watermarkEnabled;
  final int sortOrder;
  final DateTime? createdAt;

  const Gallery({
    required this.id,
    required this.projectId,
    required this.title,
    required this.slug,
    this.coverImageUrl,
    this.mediaCount = 0,
    this.status = 'active',
    this.downloadEnabled = true,
    this.watermarkEnabled = false,
    this.sortOrder = 0,
    this.createdAt,
  });

  factory Gallery.fromFirestore(DocumentSnapshot doc) {
    final j = doc.data() as Map<String, dynamic>? ?? {};
    return Gallery(
      id: doc.id,
      projectId: j['projectId'] as String? ?? '',
      title: j['title'] as String? ?? '',
      slug: j['slug'] as String? ?? doc.id,
      coverImageUrl: j['coverImageUrl'] as String?,
      mediaCount: j['mediaCount'] as int? ?? 0,
      status: j['status'] as String? ?? 'active',
      downloadEnabled: j['downloadEnabled'] as bool? ?? true,
      watermarkEnabled: j['watermarkEnabled'] as bool? ?? false,
      sortOrder: j['sortOrder'] as int? ?? 0,
      createdAt: _parseDate(j['createdAt']),
    );
  }

  factory Gallery.fromJson(Map<String, dynamic> j) {
    return Gallery(
      id: j['id'] as String? ?? '',
      projectId: j['projectId'] as String? ?? '',
      title: j['title'] as String? ?? '',
      slug: j['slug'] as String? ?? '',
      coverImageUrl: j['coverImageUrl'] as String?,
      mediaCount: j['mediaCount'] as int? ?? 0,
      status: j['status'] as String? ?? 'active',
      downloadEnabled: j['downloadEnabled'] as bool? ?? true,
      watermarkEnabled: j['watermarkEnabled'] as bool? ?? false,
      sortOrder: j['sortOrder'] as int? ?? 0,
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
      'projectId': projectId,
      'title': title,
      'slug': slug,
      'coverImageUrl': coverImageUrl,
      'mediaCount': mediaCount,
      'status': status,
      'downloadEnabled': downloadEnabled,
      'watermarkEnabled': watermarkEnabled,
      'sortOrder': sortOrder,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}
