import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/ogp_empty_state.dart';
import '../../../../shared/widgets/ogp_error_view.dart';
import '../../../../shared/widgets/ogp_shimmer.dart';
import '../providers/timeline_provider.dart';

class TimelineScreen extends ConsumerWidget {
  const TimelineScreen({super.key, required this.projectSlug});
  final String projectSlug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timelineAsync = ref.watch(timelineProvider(projectSlug));

    return Scaffold(
      appBar: AppBar(title: const Text('Timeline')),
      body: timelineAsync.when(
        loading: () => ListView.builder(
          itemCount: 5,
          itemBuilder: (_, __) => const ShimmerCard(height: 100),
        ),
        error: (e, _) => OgpErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(timelineProvider(projectSlug)),
        ),
        data: (events) {
          if (events.isEmpty) {
            return const OgpEmptyState(
              message: 'No timeline events yet.',
              icon: Icons.timeline,
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: events.length,
            itemBuilder: (context, i) {
              final e = events[i];
              final isLast = i == events.length - 1;
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Column(
                    children: [
                      Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: e.isCompleted ? AppColors.gold : AppColors.textTertiary,
                          border: Border.all(
                            color: e.isCompleted ? AppColors.gold : AppColors.textTertiary,
                            width: 2,
                          ),
                        ),
                      ),
                      if (!isLast)
                        Container(
                          width: 2,
                          height: 80,
                          color: AppColors.surfaceDark,
                        ),
                    ],
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            e.formattedDate,
                            style: const TextStyle(
                              color: AppColors.textTertiary,
                              fontSize: 11,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            e.title,
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          if (e.description != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              e.description!,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              );
            },
          );
        },
      ),
    );
  }
}
