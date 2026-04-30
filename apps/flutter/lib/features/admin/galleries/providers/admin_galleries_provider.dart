import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../data/models/gallery.dart';
import '../../../../data/models/media_item.dart';
import '../../../../data/repositories/admin/gallery_admin_repository.dart';

final _repo = GalleryAdminRepository(ApiClient.instance);

final adminGalleryProvider =
    FutureProvider.family<Gallery, String>((ref, galleryId) async {
  return _repo.getGallery(galleryId);
});

final adminGalleryMediaProvider =
    FutureProvider.family<List<MediaItem>, String>((ref, galleryId) async {
  return _repo.listMedia(galleryId);
});
