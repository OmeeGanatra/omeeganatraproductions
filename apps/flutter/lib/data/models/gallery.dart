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

  factory Gallery.fromJson(Map<String, dynamic> json) {
    return Gallery(
      id: json['id'] as String,
      projectId: json['projectId'] as String,
      title: json['title'] as String,
      slug: json['slug'] as String,
      coverImageUrl: json['coverImageUrl'] as String?,
      mediaCount: json['mediaCount'] as int? ?? 0,
      status: json['status'] as String? ?? 'active',
      downloadEnabled: json['downloadEnabled'] as bool? ?? true,
      watermarkEnabled: json['watermarkEnabled'] as bool? ?? false,
      sortOrder: json['sortOrder'] as int? ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
    );
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
