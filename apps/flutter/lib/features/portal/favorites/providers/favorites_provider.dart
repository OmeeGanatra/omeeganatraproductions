import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../data/repositories/favorites_repository.dart';

final _repo = FavoritesRepository();

class FavoritesNotifier extends StateNotifier<AsyncValue<List<String>>> {
  FavoritesNotifier() : super(const AsyncValue.loading()) {
    _load();
  }

  Future<void> _load() async {
    state = const AsyncValue.loading();
    try {
      final ids = await _repo.listFavoriteIds();
      state = AsyncValue.data(ids);
    } catch (e, s) {
      state = AsyncValue.error(e, s);
    }
  }

  Future<void> addFavorite(
    String mediaId, {
    String? projectId,
    String? galleryId,
  }) async {
    await _repo.addFavorite(mediaId, projectId: projectId, galleryId: galleryId);
    await _load();
  }

  Future<void> removeFavorite(String mediaId) async {
    await _repo.removeFavorite(mediaId);
    await _load();
  }

  bool isFavorited(String mediaId) {
    return state.valueOrNull?.contains(mediaId) ?? false;
  }

  Future<void> toggle(
    String mediaId, {
    String? projectId,
    String? galleryId,
  }) async {
    if (isFavorited(mediaId)) {
      await removeFavorite(mediaId);
    } else {
      await addFavorite(mediaId, projectId: projectId, galleryId: galleryId);
    }
  }

  Future<void> refresh() => _load();
}

final favoritesProvider =
    StateNotifierProvider<FavoritesNotifier, AsyncValue<List<String>>>(
  (ref) => FavoritesNotifier(),
);
