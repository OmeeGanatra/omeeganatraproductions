import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/ogp_avatar.dart';
import '../../../../shared/widgets/ogp_empty_state.dart';
import '../../../../shared/widgets/ogp_error_view.dart';
import '../../../../shared/widgets/ogp_shimmer.dart';
import '../../../../shared/widgets/label_mono.dart';
import '../providers/clients_provider.dart';

class ClientsScreen extends ConsumerWidget {
  const ClientsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final clientsAsync = ref.watch(adminClientsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Clients'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_outlined),
            onPressed: () => context.go('/admin/clients/new'),
          ),
        ],
      ),
      body: clientsAsync.when(
        loading: () => ListView.builder(
          itemCount: 6,
          itemBuilder: (_, __) => const ShimmerCard(height: 72),
        ),
        error: (e, _) => OgpErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(adminClientsProvider),
        ),
        data: (clients) {
          if (clients.isEmpty) {
            return const OgpEmptyState(
              message: 'No clients yet.',
              icon: Icons.people_outline,
            );
          }
          return ListView.builder(
            itemCount: clients.length,
            itemBuilder: (context, i) {
              final c = clients[i];
              return Card(
                child: ListTile(
                  leading: OgpAvatar(
                    imageUrl: c.avatarUrl,
                    initials: c.initials,
                    size: 44,
                  ),
                  title: Text(c.fullName),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(c.email),
                      LabelMono('${c.projectCount} projects'),
                    ],
                  ),
                  isThreeLine: true,
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: c.status == 'active'
                          ? AppColors.success.withOpacity(0.15)
                          : AppColors.textTertiary.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: LabelMono(
                      c.status,
                      color: c.status == 'active' ? AppColors.success : AppColors.textTertiary,
                    ),
                  ),
                  onTap: () => context.go('/admin/clients/${c.id}'),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
