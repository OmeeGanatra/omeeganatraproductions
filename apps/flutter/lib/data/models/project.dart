import 'package:cloud_firestore/cloud_firestore.dart';

class Project {
  final String id;
  final String title;
  final String slug;
  final String? description;
  final DateTime? eventDate;
  final String? eventType;
  final String? venue;
  final String? city;
  final String? coverImageUrl;
  final String status;
  final int galleryCount;
  final int totalMediaCount;
  final List<String> clientIds;

  const Project({
    required this.id,
    required this.title,
    required this.slug,
    this.description,
    this.eventDate,
    this.eventType,
    this.venue,
    this.city,
    this.coverImageUrl,
    this.status = 'active',
    this.galleryCount = 0,
    this.totalMediaCount = 0,
    this.clientIds = const [],
  });

  factory Project.fromFirestore(DocumentSnapshot doc) {
    final j = doc.data() as Map<String, dynamic>? ?? {};
    return Project(
      id: doc.id,
      title: j['title'] as String? ?? '',
      slug: j['slug'] as String? ?? doc.id,
      description: j['description'] as String?,
      eventDate: _parseDate(j['eventDate']),
      eventType: j['eventType'] as String?,
      venue: j['venue'] as String?,
      city: j['city'] as String?,
      coverImageUrl: j['coverImageUrl'] as String?,
      status: j['status'] as String? ?? 'active',
      galleryCount: j['galleryCount'] as int? ?? 0,
      totalMediaCount: j['totalMediaCount'] as int? ?? 0,
      clientIds: List<String>.from(j['clientIds'] as List<dynamic>? ?? []),
    );
  }

  factory Project.fromJson(Map<String, dynamic> j) {
    return Project(
      id: j['id'] as String? ?? '',
      title: j['title'] as String? ?? '',
      slug: j['slug'] as String? ?? '',
      description: j['description'] as String?,
      eventDate: j['eventDate'] != null
          ? DateTime.tryParse(j['eventDate'] as String)
          : null,
      eventType: j['eventType'] as String?,
      venue: j['venue'] as String?,
      city: j['city'] as String?,
      coverImageUrl: j['coverImageUrl'] as String?,
      status: j['status'] as String? ?? 'active',
      galleryCount: j['galleryCount'] as int? ?? 0,
      totalMediaCount: j['totalMediaCount'] as int? ?? 0,
      clientIds: List<String>.from(j['clientIds'] as List<dynamic>? ?? []),
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
      'title': title,
      'slug': slug,
      'description': description,
      'eventDate': eventDate?.toIso8601String(),
      'eventType': eventType,
      'venue': venue,
      'city': city,
      'coverImageUrl': coverImageUrl,
      'status': status,
      'galleryCount': galleryCount,
      'totalMediaCount': totalMediaCount,
      'clientIds': clientIds,
    };
  }

  String get formattedDate {
    if (eventDate == null) return '';
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${eventDate!.day} ${months[eventDate!.month - 1]} ${eventDate!.year}';
  }

  String get locationString {
    final parts = <String>[];
    if (venue != null && venue!.isNotEmpty) parts.add(venue!);
    if (city != null && city!.isNotEmpty) parts.add(city!);
    return parts.join(', ');
  }
}
