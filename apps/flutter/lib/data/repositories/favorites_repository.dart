import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../models/media_item.dart';

class FavoritesRepository {
  const FavoritesRepository(this._api);
  final ApiClient _api;

  Future<List<MediaItem>> listFavorites() async {
    final r = await _api.get(Endpoints.favorites);
    final data = r.data;
    final items = data is Map ? (data['favorites'] ?? data['data'] ?? []) : data;
    return (items as List)
        .map((j) => MediaItem.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<void> addFavorite(String mediaItemId) async {
    await _api.post(Endpoints.addFavorite, data: {'mediaItemId': mediaItemId});
  }

  Future<void> removeFavorite(String mediaItemId) async {
    await _api.delete(Endpoints.removeFavorite(mediaItemId));
  }
}
