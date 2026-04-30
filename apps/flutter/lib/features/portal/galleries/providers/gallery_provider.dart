import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../data/models/gallery.dart';
import '../../../../data/models/media_item.dart';
import '../../../../data/repositories/gallery_repository.dart';

final _repo = GalleryRepository(ApiClient.instance);

final galleryProvider = FutureProvider.family<Gallery, String>((ref, galleryId) async {
  return _repo.getGallery(galleryId);
});

final galleryMediaProvider = FutureProvider.family<List<MediaItem>, String>((ref, galleryId) async {
  return _repo.listMedia(galleryId);
});
