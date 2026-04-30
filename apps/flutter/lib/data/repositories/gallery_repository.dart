import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../models/gallery.dart';
import '../models/media_item.dart';

class GalleryRepository {
  const GalleryRepository(this._api);
  final ApiClient _api;

  Future<Gallery> getGallery(String galleryId) async {
    final r = await _api.get(Endpoints.gallery(galleryId));
    final data = r.data;
    return Gallery.fromJson(
      data is Map && data['gallery'] != null
          ? data['gallery'] as Map<String, dynamic>
          : data as Map<String, dynamic>,
    );
  }

  Future<List<MediaItem>> listMedia(String galleryId) async {
    final r = await _api.get(Endpoints.galleryMedia(galleryId));
    final data = r.data;
    final items = data is Map ? (data['media'] ?? data['data'] ?? []) : data;
    return (items as List)
        .map((j) => MediaItem.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<String> verifyPassword(String galleryId, String password) async {
    final r = await _api.post(
      Endpoints.verifyGalleryPassword(galleryId),
      data: {'password': password},
    );
    return (r.data as Map<String, dynamic>)['sessionToken'] as String? ?? '';
  }

  Future<String> requestZipDownload(String galleryId, {List<String>? mediaIds}) async {
    final r = await _api.post(
      Endpoints.requestZipDownload(galleryId),
      data: {if (mediaIds != null) 'mediaIds': mediaIds},
    );
    return (r.data as Map<String, dynamic>)['jobId'] as String? ?? '';
  }
}
