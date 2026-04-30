import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/ogp_avatar.dart';
import '../../../../shared/widgets/ogp_empty_state.dart';
import '../../../../shared/widgets/ogp_error_view.dart';
import '../../../../shared/widgets/ogp_shimmer.dart';
import '../../../../shared/widgets/label_mono.dart';

final _teamProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final snap = await FirebaseFirestore.instance
      .collection('users')
      .orderBy('createdAt', descending: true)
      .get();
  return snap.docs.map((d) => {'id': d.id, ...d.data()}).toList();
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
          IconButton(
              icon: const Icon(Icons.person_add_outlined), onPressed: () {}),
        ],
      ),
      body: teamAsync.when(
        loading: () => ListView.builder(
          itemCount: 4,
          itemBuilder: (_, p) => const ShimmerCard(height: 72),
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
              final name =
                  m['fullName'] as String? ?? m['name'] as String? ?? '';
              final email = m['email'] as String? ?? '';
              final role = m['role'] as String? ?? 'admin';
              final initials = name.isNotEmpty ? name[0].toUpperCase() : '?';
              return Card(
                child: ListTile(
                  leading: OgpAvatar(initials: initials, size: 44),
                  title: Text(name),
                  subtitle: Text(email),
                  trailing: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.gold.withValues(alpha: 0.1),
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
