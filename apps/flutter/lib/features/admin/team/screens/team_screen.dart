import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/endpoints.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/ogp_avatar.dart';
import '../../../../shared/widgets/ogp_empty_state.dart';
import '../../../../shared/widgets/ogp_error_view.dart';
import '../../../../shared/widgets/ogp_shimmer.dart';
import '../../../../shared/widgets/label_mono.dart';

final _teamProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final r = await ApiClient.instance.get(Endpoints.adminTeam);
  final data = r.data;
  final items = data is Map ? (data['team'] ?? data['members'] ?? data['data'] ?? []) : data;
  return (items as List).cast<Map<String, dynamic>>();
});

class TeamScreen extends ConsumerWidget {
  const TeamScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final teamAsync = ref.watch(_teamProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Team'),
        actions: [
          IconButton(icon: const Icon(Icons.person_add_outlined), onPressed: () {}),
        ],
      ),
      body: teamAsync.when(
        loading: () => ListView.builder(
          itemCount: 4,
          itemBuilder: (_, __) => const ShimmerCard(height: 72),
        ),
        error: (e, _) => OgpErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(_teamProvider),
        ),
        data: (members) {
          if (members.isEmpty) {
            return const OgpEmptyState(
              message: 'No team members yet.',
              icon: Icons.group_outlined,
            );
          }
          return ListView.builder(
            itemCount: members.length,
            itemBuilder: (context, i) {
              final m = members[i];
              final name = m['fullName'] as String? ?? m['name'] as String? ?? '';
              final email = m['email'] as String? ?? '';
              final role = m['role'] as String? ?? 'member';
              final initials = name.isNotEmpty ? name[0].toUpperCase() : '?';
              return Card(
                child: ListTile(
                  leading: OgpAvatar(initials: initials, size: 44),
                  title: Text(name),
                  subtitle: Text(email),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.gold.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: LabelMono(role, color: AppColors.gold),
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
