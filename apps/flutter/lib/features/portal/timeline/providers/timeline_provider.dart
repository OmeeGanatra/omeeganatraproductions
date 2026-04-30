import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../data/models/timeline_event.dart';
import '../../../../data/repositories/project_repository.dart';

final _repo = ProjectRepository();

final timelineProvider =
    FutureProvider.family<List<TimelineEvent>, String>((ref, slug) async {
  return _repo.getTimeline(slug);
});
