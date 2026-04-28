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
  });

  factory Project.fromJson(Map<String, dynamic> json) {
    return Project(
      id: json['id'] as String,
      title: json['title'] as String,
      slug: json['slug'] as String,
      description: json['description'] as String?,
      eventDate: json['eventDate'] != null
          ? DateTime.parse(json['eventDate'] as String)
          : null,
      eventType: json['eventType'] as String?,
      venue: json['venue'] as String?,
      city: json['city'] as String?,
      coverImageUrl: json['coverImageUrl'] as String?,
      status: json['status'] as String? ?? 'active',
      galleryCount: json['galleryCount'] as int? ?? 0,
      totalMediaCount: json['totalMediaCount'] as int? ?? 0,
    );
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
    };
  }

  String get formattedDate {
    if (eventDate == null) return '';
    final months = [
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
