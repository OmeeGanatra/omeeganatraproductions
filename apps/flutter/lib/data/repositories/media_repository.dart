import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../models/media_item.dart';

class MediaRepository {
  const MediaRepository(this._api);
  final ApiClient _api;

  Future<MediaItem> getMediaItem(String mediaId) async {
    final r = await _api.get(Endpoints.mediaItem(mediaId));
    final data = r.data;
    final json = data is Map && data['media'] != null
        ? data['media'] as Map<String, dynamic>
        : data as Map<String, dynamic>;
    return MediaItem.fromJson(json);
  }

  Future<String> getDownloadUrl(String mediaId) async {
    final r = await _api.get(Endpoints.mediaDownloadUrl(mediaId));
    final data = r.data as Map<String, dynamic>;
    return data['url'] as String? ?? data['downloadUrl'] as String? ?? '';
  }
}
