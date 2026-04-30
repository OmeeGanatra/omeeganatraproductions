import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';
import '../../models/analytics_stats.dart';

class AnalyticsRepository {
  const AnalyticsRepository(this._api);
  final ApiClient _api;

  Future<AnalyticsStats> getDashboard() async {
    final r = await _api.get(Endpoints.adminAnalyticsDashboard);
    final data = r.data;
    final json = data is Map && data['stats'] != null
        ? data['stats'] as Map<String, dynamic>
        : data as Map<String, dynamic>;
    return AnalyticsStats.fromJson(json);
  }

  Future<List<DownloadStat>> getDownloadStats() async {
    final r = await _api.get(Endpoints.adminAnalyticsDownloads);
    final data = r.data;
    final items = data is Map ? (data['downloads'] ?? data['data'] ?? []) : data;
    return (items as List)
        .map((j) => DownloadStat.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, dynamic>> getStorageStats() async {
    final r = await _api.get(Endpoints.adminAnalyticsStorage);
    return r.data as Map<String, dynamic>;
  }
}
