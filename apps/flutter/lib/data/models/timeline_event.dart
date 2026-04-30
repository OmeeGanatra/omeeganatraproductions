import 'package:cloud_firestore/cloud_firestore.dart';

class TimelineEvent {
  final String id;
  final String projectId;
  final String title;
  final String? description;
  final DateTime eventDate;
  final String? type;
  final String? imageUrl;
  final bool isCompleted;
  final int sortOrder;

  const TimelineEvent({
    required this.id,
    required this.projectId,
    required this.title,
    this.description,
    required this.eventDate,
    this.type,
    this.imageUrl,
    this.isCompleted = false,
    this.sortOrder = 0,
  });

  factory TimelineEvent.fromFirestore(DocumentSnapshot doc) {
    final j = doc.data() as Map<String, dynamic>? ?? {};
    return TimelineEvent(
      id: doc.id,
      projectId: j['projectId'] as String? ?? '',
      title: j['title'] as String? ?? '',
      description: j['description'] as String?,
      eventDate: _parseDate(j['eventTime'] ?? j['eventDate']) ?? DateTime.now(),
      type: j['type'] as String?,
      imageUrl: j['imageUrl'] as String?,
      isCompleted: j['isCompleted'] as bool? ?? false,
      sortOrder: j['sortOrder'] as int? ?? 0,
    );
  }

  factory TimelineEvent.fromJson(Map<String, dynamic> j) {
    return TimelineEvent(
      id: j['id'] as String? ?? '',
      projectId: j['projectId'] as String? ?? '',
      title: j['title'] as String? ?? '',
      description: j['description'] as String?,
      eventDate: DateTime.tryParse(j['eventDate'] as String? ?? '') ?? DateTime.now(),
      type: j['type'] as String?,
      imageUrl: j['imageUrl'] as String?,
      isCompleted: j['isCompleted'] as bool? ?? false,
      sortOrder: j['sortOrder'] as int? ?? 0,
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
      'description': description,
      'eventDate': eventDate.toIso8601String(),
      'type': type,
      'imageUrl': imageUrl,
      'isCompleted': isCompleted,
      'sortOrder': sortOrder,
    };
  }

  String get formattedDate {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${eventDate.day} ${months[eventDate.month - 1]} ${eventDate.year}';
  }
}
