import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../data/models/gallery.dart';
import '../../../../data/models/media_item.dart';
import '../../../../data/repositories/admin/gallery_admin_repository.dart';

final _repo = GalleryAdminRepository();

/// Params for admin gallery lookups: (projectId, galleryId)
typedef AdminGalleryParams = ({String projectId, String galleryId});

final adminGalleryProvider =
    FutureProvider.family<Gallery, AdminGalleryParams>((ref, params) async {
  return _repo.getGallery(params.projectId, params.galleryId);
});

final adminGalleryMediaProvider =
    FutureProvider.family<List<MediaItem>, AdminGalleryParams>((ref, params) async {
  return _repo.listMedia(params.projectId, params.galleryId);
});
