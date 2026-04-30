import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../data/models/media_item.dart';
import '../../../../data/repositories/favorites_repository.dart';

final _repo = FavoritesRepository(ApiClient.instance);

class FavoritesNotifier extends StateNotifier<AsyncValue<List<MediaItem>>> {
  FavoritesNotifier() : super(const AsyncValue.loading()) {
    _load();
  }

  Future<void> _load() async {
    state = const AsyncValue.loading();
    try {
      final items = await _repo.listFavorites();
      state = AsyncValue.data(items);
    } catch (e, s) {
      state = AsyncValue.error(e, s);
    }
  }

  Future<void> toggle(MediaItem item) async {
    try {
      if (item.isFavorited) {
        await _repo.removeFavorite(item.id);
      } else {
        await _repo.addFavorite(item.id);
      }
      await _load();
    } catch (_) {}
  }

  Future<void> refresh() => _load();
}

final favoritesProvider =
    StateNotifierProvider<FavoritesNotifier, AsyncValue<List<MediaItem>>>(
  (ref) => FavoritesNotifier(),
);
