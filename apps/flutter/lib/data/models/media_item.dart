import 'package:cloud_firestore/cloud_firestore.dart';

enum MediaType { photo, video }

class MediaItem {
  final String id;
  final String galleryId;
  final MediaType type;
  final String filenameOriginal;
  final String? thumbnailUrl;
  final String? displayUrl;
  final String? videoUrl;
  final int? width;
  final int? height;
  final int? fileSizeBytes;
  final String? blurhash;
  final bool isHighlight;
  final bool isFavorited;
  final int sortOrder;
  final Map<String, dynamic>? exifData;

  const MediaItem({
    required this.id,
    required this.galleryId,
    required this.type,
    required this.filenameOriginal,
    this.thumbnailUrl,
    this.displayUrl,
    this.videoUrl,
    this.width,
    this.height,
    this.fileSizeBytes,
    this.blurhash,
    this.isHighlight = false,
    this.isFavorited = false,
    this.sortOrder = 0,
    this.exifData,
  });

  factory MediaItem.fromFirestore(DocumentSnapshot doc) {
    final j = doc.data() as Map<String, dynamic>? ?? {};
    return MediaItem(
      id: doc.id,
      galleryId: j['galleryId'] as String? ?? '',
      type: (j['type'] as String?)?.toLowerCase() == 'video'
          ? MediaType.video
          : MediaType.photo,
      filenameOriginal: j['filenameOriginal'] as String? ?? '',
      thumbnailUrl: j['thumbnailUrl'] as String?,
      displayUrl: j['displayUrl'] as String?,
      videoUrl: j['videoUrl'] as String?,
      width: j['width'] as int?,
      height: j['height'] as int?,
      fileSizeBytes: j['fileSizeBytes'] as int?,
      blurhash: j['blurhash'] as String?,
      isHighlight: j['isHighlight'] as bool? ?? false,
      isFavorited: j['isFavorited'] as bool? ?? false,
      sortOrder: j['sortOrder'] as int? ?? 0,
      exifData: j['exifData'] as Map<String, dynamic>?,
    );
  }

  factory MediaItem.fromJson(Map<String, dynamic> j) {
    return MediaItem(
      id: j['id'] as String? ?? '',
      galleryId: j['galleryId'] as String? ?? '',
      type: (j['type'] as String?)?.toLowerCase() == 'video'
          ? MediaType.video
          : MediaType.photo,
      filenameOriginal: j['filenameOriginal'] as String? ?? '',
      thumbnailUrl: j['thumbnailUrl'] as String?,
      displayUrl: j['displayUrl'] as String?,
      videoUrl: j['videoUrl'] as String?,
      width: j['width'] as int?,
      height: j['height'] as int?,
      fileSizeBytes: j['fileSizeBytes'] as int?,
      blurhash: j['blurhash'] as String?,
      isHighlight: j['isHighlight'] as bool? ?? false,
      isFavorited: j['isFavorited'] as bool? ?? false,
      sortOrder: j['sortOrder'] as int? ?? 0,
      exifData: j['exifData'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'galleryId': galleryId,
      'type': type == MediaType.video ? 'video' : 'photo',
      'filenameOriginal': filenameOriginal,
      'thumbnailUrl': thumbnailUrl,
      'displayUrl': displayUrl,
      'videoUrl': videoUrl,
      'width': width,
      'height': height,
      'fileSizeBytes': fileSizeBytes,
      'blurhash': blurhash,
      'isHighlight': isHighlight,
      'isFavorited': isFavorited,
      'sortOrder': sortOrder,
      'exifData': exifData,
    };
  }

  double get aspectRatio {
    if (width != null && height != null && height! > 0) {
      return width! / height!;
    }
    return 1.0;
  }

  String get formattedFileSize {
    if (fileSizeBytes == null) return '';
    final bytes = fileSizeBytes!;
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  String get dimensionsString {
    if (width != null && height != null) return '${width}x$height';
    return '';
  }

  bool get isVideo => type == MediaType.video;
  bool get isPhoto => type == MediaType.photo;

  MediaItem copyWith({bool? isFavorited}) {
    return MediaItem(
      id: id,
      galleryId: galleryId,
      type: type,
      filenameOriginal: filenameOriginal,
      thumbnailUrl: thumbnailUrl,
      displayUrl: displayUrl,
      videoUrl: videoUrl,
      width: width,
      height: height,
      fileSizeBytes: fileSizeBytes,
      blurhash: blurhash,
      isHighlight: isHighlight,
      isFavorited: isFavorited ?? this.isFavorited,
      sortOrder: sortOrder,
      exifData: exifData,
    );
  }
}
