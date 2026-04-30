import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../data/models/gallery.dart';
import '../../../../data/models/media_item.dart';
import '../../../../data/repositories/gallery_repository.dart';

final _repo = GalleryRepository();

/// Params for gallery + media lookups: (projectId, galleryId)
typedef GalleryParams = ({String projectId, String galleryId});

final galleryProvider =
    FutureProvider.family<Gallery, GalleryParams>((ref, params) async {
  return _repo.getGallery(params.projectId, params.galleryId);
});

final galleryMediaProvider =
    FutureProvider.family<List<MediaItem>, GalleryParams>((ref, params) async {
  return _repo.listMedia(params.projectId, params.galleryId);
});
