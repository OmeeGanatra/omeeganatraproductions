class AnalyticsStats {
  final int totalClients;
  final int totalProjects;
  final int totalGalleries;
  final int totalMedia;
  final int totalDownloads;
  final double storageUsedBytes;
  final List<DownloadStat> recentDownloads;
  final List<ProjectStat> topProjects;

  const AnalyticsStats({
    this.totalClients = 0,
    this.totalProjects = 0,
    this.totalGalleries = 0,
    this.totalMedia = 0,
    this.totalDownloads = 0,
    this.storageUsedBytes = 0,
    this.recentDownloads = const [],
    this.topProjects = const [],
  });

  factory AnalyticsStats.fromJson(Map<String, dynamic> json) {
    return AnalyticsStats(
      totalClients: json['totalClients'] as int? ?? 0,
      totalProjects: json['totalProjects'] as int? ?? 0,
      totalGalleries: json['totalGalleries'] as int? ?? 0,
      totalMedia: json['totalMedia'] as int? ?? 0,
      totalDownloads: json['totalDownloads'] as int? ?? 0,
      storageUsedBytes: (json['storageUsedBytes'] as num?)?.toDouble() ?? 0,
      recentDownloads: (json['recentDownloads'] as List<dynamic>? ?? [])
          .map((e) => DownloadStat.fromJson(e as Map<String, dynamic>))
          .toList(),
      topProjects: (json['topProjects'] as List<dynamic>? ?? [])
          .map((e) => ProjectStat.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  String get formattedStorage {
    if (storageUsedBytes < 1024) return '${storageUsedBytes.toInt()} B';
    if (storageUsedBytes < 1024 * 1024) {
      return '${(storageUsedBytes / 1024).toStringAsFixed(1)} KB';
    }
    if (storageUsedBytes < 1024 * 1024 * 1024) {
      return '${(storageUsedBytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(storageUsedBytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
  }
}

class DownloadStat {
  final String date;
  final int count;

  const DownloadStat({required this.date, required this.count});

  factory DownloadStat.fromJson(Map<String, dynamic> json) {
    return DownloadStat(
      date: json['date'] as String,
      count: json['count'] as int? ?? 0,
    );
  }
}

class ProjectStat {
  final String projectId;
  final String projectTitle;
  final int downloadCount;
  final int viewCount;

  const ProjectStat({
    required this.projectId,
    required this.projectTitle,
    this.downloadCount = 0,
    this.viewCount = 0,
  });

  factory ProjectStat.fromJson(Map<String, dynamic> json) {
    return ProjectStat(
      projectId: json['projectId'] as String,
      projectTitle: json['projectTitle'] as String,
      downloadCount: json['downloadCount'] as int? ?? 0,
      viewCount: json['viewCount'] as int? ?? 0,
    );
  }
}
