import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/cached_image.dart';
import '../../../../shared/widgets/ogp_empty_state.dart';
import '../../../../shared/widgets/ogp_error_view.dart';
import '../../../../shared/widgets/ogp_shimmer.dart';
import '../../../../shared/widgets/label_mono.dart';
import '../providers/admin_projects_provider.dart';

class AdminProjectsScreen extends ConsumerWidget {
  const AdminProjectsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectsAsync = ref.watch(adminProjectsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Projects'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => context.go('/admin/projects/new'),
          ),
        ],
      ),
      body: projectsAsync.when(
        loading: () => ListView.builder(
          itemCount: 5,
          itemBuilder: (_, __) => const ShimmerCard(height: 120),
        ),
        error: (e, _) => OgpErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(adminProjectsProvider),
        ),
        data: (projects) {
          if (projects.isEmpty) {
            return const OgpEmptyState(
              message: 'No projects yet.',
              icon: Icons.photo_album_outlined,
              actionLabel: 'Create Project',
            );
          }
          return ListView.builder(
            itemCount: projects.length,
            itemBuilder: (context, i) {
              final p = projects[i];
              return Card(
                child: ListTile(
                  leading: p.coverImageUrl != null
                      ? CachedImage(
                          url: p.coverImageUrl!,
                          width: 56,
                          height: 56,
                          borderRadius: 8,
                        )
                      : Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: AppColors.surfaceDark,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.photo_album_outlined),
                        ),
                  title: Text(p.title),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (p.formattedDate.isNotEmpty) Text(p.formattedDate),
                      LabelMono('${p.galleryCount} galleries'),
                    ],
                  ),
                  isThreeLine: p.formattedDate.isNotEmpty,
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.gold.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: LabelMono(p.status, color: AppColors.gold),
                  ),
                  onTap: () => context.go('/admin/projects/${p.id}'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
