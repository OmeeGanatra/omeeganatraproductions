import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../data/models/project.dart';
import '../../../../data/repositories/admin/project_admin_repository.dart';

final _repo = ProjectAdminRepository(ApiClient.instance);

final adminProjectsProvider = FutureProvider<List<Project>>((ref) async {
  return _repo.listProjects();
});

final adminProjectDetailProvider =
    FutureProvider.family<Project, String>((ref, id) async {
  return _repo.getProject(id);
});
