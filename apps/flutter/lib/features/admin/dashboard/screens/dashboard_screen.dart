import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/ogp_error_view.dart';
import '../../../../shared/widgets/ogp_shimmer.dart';
import '../../../../shared/widgets/label_mono.dart';
import '../providers/dashboard_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(dashboardStatsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard')),
      body: statsAsync.when(
        loading: () => ListView.builder(
          itemCount: 4,
          itemBuilder: (_, __) => const ShimmerCard(height: 100),
        ),
        error: (e, _) => OgpErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(dashboardStatsProvider),
        ),
        data: (stats) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Overview', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.6,
                children: [
                  _StatCard(label: 'Clients', value: '${stats.totalClients}', icon: Icons.people),
                  _StatCard(label: 'Projects', value: '${stats.totalProjects}', icon: Icons.photo_album),
                  _StatCard(label: 'Galleries', value: '${stats.totalGalleries}', icon: Icons.photo_library),
                  _StatCard(label: 'Media', value: '${stats.totalMedia}', icon: Icons.image),
                  _StatCard(label: 'Downloads', value: '${stats.totalDownloads}', icon: Icons.download),
                  _StatCard(label: 'Storage', value: stats.formattedStorage, icon: Icons.storage),
                ],
              ),
              const SizedBox(height: 24),
              if (stats.topProjects.isNotEmpty) ...[
                Text('Top Projects', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                ...stats.topProjects.map(
                  (p) => Card(
                    child: ListTile(
                      title: Text(p.projectTitle),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          LabelMono('${p.downloadCount} downloads', color: AppColors.gold),
                          LabelMono('${p.viewCount} views'),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value, required this.icon});

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(icon, size: 16, color: AppColors.gold),
                const SizedBox(width: 6),
                LabelMono(label, color: AppColors.textTertiary),
              ],
            ),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
