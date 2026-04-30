import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../data/models/timeline_event.dart';
import '../../../../data/repositories/project_repository.dart';

final _repo = ProjectRepository(ApiClient.instance);

final timelineProvider =
    FutureProvider.family<List<TimelineEvent>, String>((ref, slug) async {
  return _repo.getTimeline(slug);
});
