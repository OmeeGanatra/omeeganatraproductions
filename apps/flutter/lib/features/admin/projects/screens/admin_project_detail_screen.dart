import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/ogp_error_view.dart';
import '../../../../shared/widgets/ogp_shimmer.dart';
import '../../../../shared/widgets/label_mono.dart';
import '../providers/admin_projects_provider.dart';

class AdminProjectDetailScreen extends ConsumerWidget {
  const AdminProjectDetailScreen({super.key, required this.projectId});
  final String projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectAsync = ref.watch(adminProjectDetailProvider(projectId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Project'),
        actions: [
          IconButton(icon: const Icon(Icons.edit_outlined), onPressed: () {}),
        ],
      ),
      body: projectAsync.when(
        loading: () => const ShimmerCard(height: 200),
        error: (e, _) => OgpErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(adminProjectDetailProvider(projectId)),
        ),
        data: (project) => ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(project.title, style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            if (project.eventType != null)
              LabelMono(project.eventType!, color: AppColors.gold),
            const SizedBox(height: 12),
            if (project.description != null)
              Text(project.description!, style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 16),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.calendar_today_outlined),
              title: const Text('Event Date'),
              trailing: Text(project.formattedDate),
            ),
            ListTile(
              leading: const Icon(Icons.location_on_outlined),
              title: const Text('Location'),
              trailing: Text(project.locationString),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: const Text('Galleries'),
              trailing: Text('${project.galleryCount}'),
            ),
            ListTile(
              leading: const Icon(Icons.image_outlined),
              title: const Text('Total Media'),
              trailing: Text('${project.totalMediaCount}'),
            ),
            const Divider(),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => context.go('/admin/media-upload?projectId=$projectId'),
              icon: const Icon(Icons.upload_outlined),
              label: const Text('Upload Media'),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.person_add_outlined),
              label: const Text('Assign Client'),
            ),
          ],
        ),
      ),
    );
  }
}
