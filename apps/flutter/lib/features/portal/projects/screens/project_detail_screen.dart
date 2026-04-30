import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/cached_image.dart';
import '../../../../shared/widgets/ogp_error_view.dart';
import '../../../../shared/widgets/ogp_shimmer.dart';
import '../../../../shared/widgets/label_mono.dart';
import '../providers/projects_provider.dart';

class ProjectDetailScreen extends ConsumerWidget {
  const ProjectDetailScreen({super.key, required this.slug});
  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectAsync = ref.watch(projectDetailProvider(slug));
    final galleriesAsync = ref.watch(projectGalleriesProvider(slug));

    return Scaffold(
      body: projectAsync.when(
        loading: () => const CustomScrollView(
          slivers: [
            SliverAppBar(expandedHeight: 240, flexibleSpace: FlexibleSpaceBar()),
            SliverToBoxAdapter(child: ShimmerCard(height: 100)),
          ],
        ),
        error: (e, _) => OgpErrorView(
          message: e.toString(),
          onRetry: () {
            ref.invalidate(projectDetailProvider(slug));
            ref.invalidate(projectGalleriesProvider(slug));
          },
        ),
        data: (project) {
          return CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 260,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(project.title),
                  background: project.coverImageUrl != null
                      ? CachedImage(url: project.coverImageUrl!, fit: BoxFit.cover)
                      : Container(color: AppColors.surfaceDark),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (project.eventType != null)
                        LabelMono(project.eventType!, color: AppColors.gold),
                      const SizedBox(height: 8),
                      if (project.formattedDate.isNotEmpty)
                        Row(
                          children: [
                            const Icon(Icons.calendar_today_outlined, size: 14, color: AppColors.textTertiary),
                            const SizedBox(width: 6),
                            Text(project.formattedDate, style: Theme.of(context).textTheme.bodySmall),
                          ],
                        ),
                      if (project.locationString.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined, size: 14, color: AppColors.textTertiary),
                            const SizedBox(width: 6),
                            Expanded(child: Text(project.locationString, style: Theme.of(context).textTheme.bodySmall)),
                          ],
                        ),
                      ],
                      if (project.description != null) ...[
                        const SizedBox(height: 12),
                        Text(project.description!, style: Theme.of(context).textTheme.bodyMedium),
                      ],
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          OutlinedButton.icon(
                            onPressed: () => context.go('/portal/projects/$slug/timeline'),
                            icon: const Icon(Icons.timeline, size: 16),
                            label: const Text('Timeline'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                  child: Text('Galleries', style: Theme.of(context).textTheme.titleMedium),
                ),
              ),
              galleriesAsync.when(
                loading: () => const SliverToBoxAdapter(child: ShimmerCard(height: 100)),
                error: (e, _) => SliverToBoxAdapter(
                  child: OgpErrorView(message: e.toString()),
                ),
                data: (galleries) => SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, i) {
                      final g = galleries[i];
                      return Card(
                        child: ListTile(
                          leading: g.coverImageUrl != null
                              ? CachedImage(
                                  url: g.coverImageUrl!,
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
                                  child: const Icon(Icons.photo_library_outlined),
                                ),
                          title: Text(g.title),
                          subtitle: LabelMono('${g.mediaCount} items'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => context.go('/portal/projects/$slug/galleries/${g.id}'),
                        ),
                      );
                    },
                    childCount: galleries.length,
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 32)),
            ],
          );
        },
      ),
    );
  }
}
