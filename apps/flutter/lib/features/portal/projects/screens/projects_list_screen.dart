import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/cached_image.dart';
import '../../../../shared/widgets/ogp_empty_state.dart';
import '../../../../shared/widgets/ogp_error_view.dart';
import '../../../../shared/widgets/ogp_shimmer.dart';
import '../../../../shared/widgets/label_mono.dart';
import '../providers/projects_provider.dart';

class ProjectsListScreen extends ConsumerWidget {
  const ProjectsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectsAsync = ref.watch(projectsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Events')),
      body: projectsAsync.when(
        loading: () => ListView.builder(
          itemCount: 5,
          itemBuilder: (_, __) => const ShimmerCard(height: 140),
        ),
        error: (e, _) => OgpErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(projectsProvider),
        ),
        data: (projects) {
          if (projects.isEmpty) {
            return const OgpEmptyState(
              message: 'No events yet.\nCheck back soon.',
              icon: Icons.photo_album_outlined,
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: projects.length,
            itemBuilder: (context, i) {
              final p = projects[i];
              return Card(
                child: InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () => context.go('/portal/projects/${p.slug}'),
                  child: SizedBox(
                    height: 140,
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: const BorderRadius.horizontal(
                            left: Radius.circular(16),
                          ),
                          child: p.coverImageUrl != null
                              ? CachedImage(
                                  url: p.coverImageUrl!,
                                  width: 120,
                                  height: 140,
                                )
                              : Container(
                                  width: 120,
                                  height: 140,
                                  color: AppColors.surfaceDark,
                                  child: const Icon(
                                    Icons.photo_outlined,
                                    color: AppColors.textTertiary,
                                  ),
                                ),
                        ),
                        Expanded(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                if (p.eventType != null)
                                  LabelMono(p.eventType!, color: AppColors.gold),
                                const SizedBox(height: 4),
                                Text(
                                  p.title,
                                  style: Theme.of(context).textTheme.titleMedium,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4),
                                if (p.formattedDate.isNotEmpty)
                                  Text(
                                    p.formattedDate,
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                if (p.locationString.isNotEmpty)
                                  Text(
                                    p.locationString,
                                    style: Theme.of(context).textTheme.bodySmall,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                const SizedBox(height: 8),
                                LabelMono('${p.galleryCount} galleries  •  ${p.totalMediaCount} photos'),
                              ],
                            ),
                          ),
                        ),
                        const Padding(
                          padding: EdgeInsets.only(right: 12),
                          child: Icon(Icons.chevron_right, color: AppColors.textTertiary),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
