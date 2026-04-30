import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/media_item.dart';

class MediaRepository {
  final _db = FirebaseFirestore.instance;

  /// Fetches a media item by its Firestore doc ID.
  /// Media lives at projects/{projectId}/galleries/{galleryId}/media/{mediaId}.
  /// Because we only have mediaId here we search via a collection group query.
  Future<MediaItem> getMediaItem(String mediaId) async {
    final snap = await _db
        .collectionGroup('media')
        .where(FieldPath.documentId, isEqualTo: mediaId)
        .limit(1)
        .get();
    if (snap.docs.isEmpty) throw Exception('Media item not found: $mediaId');
    return MediaItem.fromFirestore(snap.docs.first);
  }

  /// Returns the displayUrl stored directly on the media document.
  /// For download-quality URLs use the original `originalUrl` field if present,
  /// otherwise fall back to displayUrl.
  Future<String> getDownloadUrl(String mediaId) async {
    final item = await getMediaItem(mediaId);
    return item.displayUrl ?? '';
  }
}
