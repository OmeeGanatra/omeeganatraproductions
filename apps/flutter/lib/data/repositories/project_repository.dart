import '../../core/api/api_client.dart';
import '../../core/api/endpoints.dart';
import '../models/project.dart';
import '../models/gallery.dart';
import '../models/timeline_event.dart';

class ProjectRepository {
  const ProjectRepository(this._api);
  final ApiClient _api;

  Future<List<Project>> listProjects() async {
    final r = await _api.get(Endpoints.projects);
    final data = r.data;
    final items = data is Map ? (data['projects'] ?? data['data'] ?? []) : data;
    return (items as List)
        .map((j) => Project.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<Project> getProject(String slug) async {
    final r = await _api.get(Endpoints.project(slug));
    final data = r.data;
    final json = data is Map && data['project'] != null
        ? data['project'] as Map<String, dynamic>
        : data as Map<String, dynamic>;
    return Project.fromJson(json);
  }

  Future<List<Gallery>> listGalleries(String slug) async {
    final r = await _api.get(Endpoints.projectGalleries(slug));
    final data = r.data;
    final items = data is Map ? (data['galleries'] ?? data['data'] ?? []) : data;
    return (items as List)
        .map((j) => Gallery.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<List<TimelineEvent>> getTimeline(String slug) async {
    final r = await _api.get(Endpoints.timeline(slug));
    final data = r.data;
    final items = data is Map ? (data['events'] ?? data['data'] ?? []) : data;
    return (items as List)
        .map((j) => TimelineEvent.fromJson(j as Map<String, dynamic>))
        .toList();
  }
}
