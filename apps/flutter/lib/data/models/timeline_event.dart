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

  factory TimelineEvent.fromJson(Map<String, dynamic> json) {
    return TimelineEvent(
      id: json['id'] as String,
      projectId: json['projectId'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      eventDate: DateTime.parse(json['eventDate'] as String),
      type: json['type'] as String?,
      imageUrl: json['imageUrl'] as String?,
      isCompleted: json['isCompleted'] as bool? ?? false,
      sortOrder: json['sortOrder'] as int? ?? 0,
    );
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
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${eventDate.day} ${months[eventDate.month - 1]} ${eventDate.year}';
  }
}
