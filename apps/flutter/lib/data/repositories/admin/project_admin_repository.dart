import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';
import '../../models/project.dart';
import '../../models/gallery.dart';

class ProjectAdminRepository {
  const ProjectAdminRepository(this._api);
  final ApiClient _api;

  Future<List<Project>> listProjects() async {
    final r = await _api.get(Endpoints.adminProjects);
    final data = r.data;
    final items = data is Map ? (data['projects'] ?? data['data'] ?? []) : data;
    return (items as List)
        .map((j) => Project.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<Project> getProject(String id) async {
    final r = await _api.get(Endpoints.adminProject(id));
    final data = r.data;
    final json = data is Map && data['project'] != null
        ? data['project'] as Map<String, dynamic>
        : data as Map<String, dynamic>;
    return Project.fromJson(json);
  }

  Future<Project> createProject(Map<String, dynamic> body) async {
    final r = await _api.post(Endpoints.adminProjects, data: body);
    final data = r.data;
    final json = data is Map && data['project'] != null
        ? data['project'] as Map<String, dynamic>
        : data as Map<String, dynamic>;
    return Project.fromJson(json);
  }

  Future<Project> updateProject(String id, Map<String, dynamic> body) async {
    final r = await _api.put(Endpoints.adminProject(id), data: body);
    final data = r.data;
    final json = data is Map && data['project'] != null
        ? data['project'] as Map<String, dynamic>
        : data as Map<String, dynamic>;
    return Project.fromJson(json);
  }

  Future<void> deleteProject(String id) async {
    await _api.delete(Endpoints.adminProject(id));
  }

  Future<List<Gallery>> listGalleries(String projectId) async {
    final r = await _api.get(Endpoints.adminProjectGalleries(projectId));
    final data = r.data;
    final items = data is Map ? (data['galleries'] ?? data['data'] ?? []) : data;
    return (items as List)
        .map((j) => Gallery.fromJson(j as Map<String, dynamic>))
        .toList();
  }

  Future<void> assignClient(String projectId, String clientId) async {
    await _api.post(Endpoints.adminAssignClient(projectId), data: {'clientId': clientId});
  }

  Future<void> removeClient(String projectId, String clientId) async {
    await _api.delete(Endpoints.adminRemoveClient(projectId, clientId));
  }
}
