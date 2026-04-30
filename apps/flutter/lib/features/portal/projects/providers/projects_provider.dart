import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../data/models/project.dart';
import '../../../../data/models/gallery.dart';
import '../../../../data/repositories/project_repository.dart';

final _repo = ProjectRepository();

final projectsProvider = FutureProvider<List<Project>>((ref) async {
  return _repo.listProjects();
});

final projectDetailProvider =
    FutureProvider.family<Project, String>((ref, slug) async {
  return _repo.getProject(slug);
});

final projectGalleriesProvider =
    FutureProvider.family<List<Gallery>, String>((ref, slug) async {
  return _repo.listGalleries(slug);
});
