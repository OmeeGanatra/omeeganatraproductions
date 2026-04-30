import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../data/models/media_item.dart';
import '../../../../data/repositories/media_repository.dart';

final _repo = MediaRepository(ApiClient.instance);

final mediaItemProvider = FutureProvider.family<MediaItem, String>((ref, mediaId) async {
  return _repo.getMediaItem(mediaId);
});

final mediaDownloadUrlProvider = FutureProvider.family<String, String>((ref, mediaId) async {
  return _repo.getDownloadUrl(mediaId);
});
