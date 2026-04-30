import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';
import '../../models/gallery.dart';
import '../../models/media_item.dart';

class GalleryAdminRepository {
  const GalleryAdminRepository(this._api);
  final ApiClient _api;

  Future<Gallery> getGallery(String galleryId) async {
    final r = await _api.get(Endpoints.adminGallery(galleryId));
    final data = r.data;
    return Gallery.fromJson(
      data is Map && data['gallery'] != null
          ? data['gallery'] as Map<String, dynamic>
          : data as Map<String, dynamic>,
    );
  }

  Future<Gallery> createGallery(String projectId, Map<String, dynamic> body) async {
    final r = await _api.post(
      Endpoints.adminProjectGalleries(projectId),
      data: body,
    );
    final data = r.data;
    return Gallery.fromJson(
      data is Map && data['gallery'] != null
          ? data['gallery'] as Map<String, dynamic>
          : data as Map<String, dynamic>,
    );
  }

  Future<Gallery> updateGallery(String galleryId, Map<String, dynamic> body) async {
    final r = await _api.put(Endpoints.adminGallery(galleryId), data: body);
    final data = r.data;
    return Gallery.fromJson(
      data is Map && data['gallery'] != null
          ? data['gallery'] as Map<String, dynamic>
          : data as Map<String, dynamic>,
    );
  }

  Future<void> deleteGallery(String galleryId) async {
    await _api.delete(Endpoints.adminGallery(galleryId));
  }

  Future<void> publishGallery(String galleryId) async {
    await _api.post(Endpoints.adminGalleryPublish(galleryId));
  }

  Future<List<MediaItem>> listMedia(String galleryId) async {
    final r = await _api.get(Endpoints.adminGalleryMedia(galleryId));
    final data = r.data;
    final items = data is Map ? (data['media'] ?? data['data'] ?? []) : data;
    return (items as List)
        .map((j) => MediaItem.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<void> deleteMediaItem(String mediaId) async {
    await _api.delete(Endpoints.adminMediaItem(mediaId));
  }
}
