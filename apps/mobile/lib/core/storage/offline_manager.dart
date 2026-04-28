import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import '../../models/media_item.dart';
import '../api/api_client.dart';
import '../api/endpoints.dart';

class DownloadedItem {
  final String mediaId;
  final String filename;
  final String localPath;
  final String? thumbnailUrl;
  final String projectTitle;
  final String galleryTitle;
  final int sizeBytes;
  final DateTime downloadedAt;

  const DownloadedItem({
    required this.mediaId,
    required this.filename,
    required this.localPath,
    this.thumbnailUrl,
    required this.projectTitle,
    required this.galleryTitle,
    required this.sizeBytes,
    required this.downloadedAt,
  });

  String get formattedDate {
    final months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return '${downloadedAt.day} ${months[downloadedAt.month - 1]}';
  }

  Map<String, dynamic> toJson() {
    return {
      'mediaId': mediaId,
      'filename': filename,
      'localPath': localPath,
      'thumbnailUrl': thumbnailUrl,
      'projectTitle': projectTitle,
      'galleryTitle': galleryTitle,
      'sizeBytes': sizeBytes,
      'downloadedAt': downloadedAt.toIso8601String(),
    };
  }

  factory DownloadedItem.fromJson(Map<String, dynamic> json) {
    return DownloadedItem(
      mediaId: json['mediaId'] as String,
      filename: json['filename'] as String,
      localPath: json['localPath'] as String,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      projectTitle: json['projectTitle'] as String? ?? '',
      galleryTitle: json['galleryTitle'] as String? ?? '',
      sizeBytes: json['sizeBytes'] as int? ?? 0,
      downloadedAt: DateTime.parse(json['downloadedAt'] as String),
    );
  }
}

typedef DownloadProgressCallback = void Function(
    String mediaId, double progress);

class OfflineManager {
  OfflineManager._();

  static final OfflineManager instance = OfflineManager._();

  // In-memory cache of downloaded items (in production, use Isar DB)
  final Map<String, DownloadedItem> _downloadedItems = {};
  final Map<String, CancelToken> _activeDownloads = {};

  /// Download a media item for offline viewing
  Future<DownloadedItem?> downloadMedia(
    MediaItem mediaItem, {
    String projectTitle = '',
    String galleryTitle = '',
    DownloadProgressCallback? onProgress,
  }) async {
    if (_activeDownloads.containsKey(mediaItem.id)) {
      return null; // Already downloading
    }

    try {
      final dir = await _getDownloadDirectory();
      final filePath = '${dir.path}/${mediaItem.id}_${mediaItem.filenameOriginal}';

      final cancelToken = CancelToken();
      _activeDownloads[mediaItem.id] = cancelToken;

      await ApiClient.instance.download(
        Endpoints.mediaDownload(mediaItem.id),
        filePath,
        onReceiveProgress: (received, total) {
          if (total > 0) {
            final progress = received / total;
            onProgress?.call(mediaItem.id, progress);
          }
        },
        cancelToken: cancelToken,
      );

      final file = File(filePath);
      final fileSize = await file.length();

      final item = DownloadedItem(
        mediaId: mediaItem.id,
        filename: mediaItem.filenameOriginal,
        localPath: filePath,
        thumbnailUrl: mediaItem.thumbnailUrl,
        projectTitle: projectTitle,
        galleryTitle: galleryTitle,
        sizeBytes: fileSize,
        downloadedAt: DateTime.now(),
      );

      _downloadedItems[mediaItem.id] = item;
      _activeDownloads.remove(mediaItem.id);

      return item;
    } catch (e) {
      _activeDownloads.remove(mediaItem.id);
      return null;
    }
  }

  /// Cancel an active download
  void cancelDownload(String mediaId) {
    _activeDownloads[mediaId]?.cancel('User cancelled');
    _activeDownloads.remove(mediaId);
  }

  /// Delete a downloaded media item
  Future<void> deleteMedia(String mediaId) async {
    final item = _downloadedItems[mediaId];
    if (item != null) {
      final file = File(item.localPath);
      if (await file.exists()) {
        await file.delete();
      }
      _downloadedItems.remove(mediaId);
    }
  }

  /// Check if a media item is downloaded
  bool isDownloaded(String mediaId) {
    return _downloadedItems.containsKey(mediaId);
  }

  /// Check if a media item is currently downloading
  bool isDownloading(String mediaId) {
    return _activeDownloads.containsKey(mediaId);
  }

  /// Get all downloaded media items
  Future<List<DownloadedItem>> getDownloadedMedia() async {
    // Verify files still exist
    final validItems = <DownloadedItem>[];
    final toRemove = <String>[];

    for (final entry in _downloadedItems.entries) {
      final file = File(entry.value.localPath);
      if (await file.exists()) {
        validItems.add(entry.value);
      } else {
        toRemove.add(entry.key);
      }
    }

    for (final id in toRemove) {
      _downloadedItems.remove(id);
    }

    validItems.sort((a, b) => b.downloadedAt.compareTo(a.downloadedAt));
    return validItems;
  }

  /// Get total storage used by downloads
  Future<int> getTotalStorageUsed() async {
    int total = 0;
    for (final item in _downloadedItems.values) {
      final file = File(item.localPath);
      if (await file.exists()) {
        total += await file.length();
      }
    }
    return total;
  }

  /// Get the local file path for a downloaded media item
  String? getLocalPath(String mediaId) {
    return _downloadedItems[mediaId]?.localPath;
  }

  /// Get the download directory
  Future<Directory> _getDownloadDirectory() async {
    final appDir = await getApplicationDocumentsDirectory();
    final downloadDir = Directory('${appDir.path}/ogp_downloads');
    if (!await downloadDir.exists()) {
      await downloadDir.create(recursive: true);
    }
    return downloadDir;
  }
}
