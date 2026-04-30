import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/ogp_avatar.dart';
import '../../../../shared/widgets/ogp_error_view.dart';
import '../../../../shared/widgets/ogp_shimmer.dart';
import '../../../../shared/widgets/label_mono.dart';
import '../providers/clients_provider.dart';

class ClientDetailScreen extends ConsumerWidget {
  const ClientDetailScreen({super.key, required this.clientId});
  final String clientId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final clientAsync = ref.watch(adminClientDetailProvider(clientId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Client'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: clientAsync.when(
        loading: () => const ShimmerCard(height: 200),
        error: (e, _) => OgpErrorView(
          message: e.toString(),
          onRetry: () => ref.invalidate(adminClientDetailProvider(clientId)),
        ),
        data: (client) => ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Center(
              child: Column(
                children: [
                  OgpAvatar(
                    imageUrl: client.avatarUrl,
                    initials: client.initials,
                    size: 72,
                  ),
                  const SizedBox(height: 12),
                  Text(client.fullName, style: Theme.of(context).textTheme.headlineSmall),
                  const SizedBox(height: 4),
                  Text(client.email, style: Theme.of(context).textTheme.bodyMedium),
                  if (client.phone != null) ...[
                    const SizedBox(height: 4),
                    Text(client.phone!, style: Theme.of(context).textTheme.bodySmall),
                  ],
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: client.status == 'active'
                          ? AppColors.success.withOpacity(0.15)
                          : AppColors.textTertiary.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: LabelMono(client.status,
                        color: client.status == 'active'
                            ? AppColors.success
                            : AppColors.textTertiary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.photo_album_outlined),
              title: const Text('Projects'),
              trailing: Text('${client.projectCount}',
                  style: const TextStyle(color: AppColors.gold)),
            ),
            if (client.createdAt != null) ...[
              const Divider(),
              ListTile(
                leading: const Icon(Icons.calendar_today_outlined),
                title: const Text('Member since'),
                trailing: Text(
                  '${client.createdAt!.day}/${client.createdAt!.month}/${client.createdAt!.year}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
