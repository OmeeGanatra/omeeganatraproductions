import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../data/models/analytics_stats.dart';
import '../../../../data/repositories/admin/analytics_repository.dart';

final _repo = AnalyticsRepository(ApiClient.instance);

final dashboardStatsProvider = FutureProvider<AnalyticsStats>((ref) async {
  return _repo.getDashboard();
});
