import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/ogp_error_view.dart';
import '../../../../shared/widgets/ogp_shimmer.dart';
import '../../../../shared/widgets/label_mono.dart';
import '../../dashboard/providers/dashboard_provider.dart';

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(dashboardStatsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Analytics')),
      body: statsAsync.when(
        loading: () => ListView.builder(
          itemCount: 4,
          itemBuilder: (_, __) => const ShimmerCard(height: 100),
        ),
        error: (e, _) => OgpErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(dashboardStatsProvider),
        ),
        data: (stats) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('Storage', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    const Icon(Icons.storage_outlined, color: AppColors.gold),
                    const SizedBox(width: 16),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        LabelMono('Total Storage Used'),
                        const SizedBox(height: 4),
                        Text(
                          stats.formattedStorage,
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text('Downloads', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    const Icon(Icons.download_outlined, color: AppColors.gold),
                    const SizedBox(width: 16),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        LabelMono('Total Downloads'),
                        const SizedBox(height: 4),
                        Text(
                          '${stats.totalDownloads}',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            if (stats.recentDownloads.isNotEmpty) ...[
              Text('Recent Downloads', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              ...stats.recentDownloads.map(
                (d) => ListTile(
                  leading: const Icon(Icons.calendar_today_outlined, size: 16),
                  title: Text(d.date),
                  trailing: Text(
                    '${d.count}',
                    style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
            if (stats.topProjects.isNotEmpty) ...[
              const SizedBox(height: 24),
              Text('Top Projects', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 12),
              ...stats.topProjects.map(
                (p) => Card(
                  child: ListTile(
                    title: Text(p.projectTitle),
                    subtitle: LabelMono('${p.viewCount} views'),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('${p.downloadCount}', style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.w600)),
                        LabelMono('downloads'),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
