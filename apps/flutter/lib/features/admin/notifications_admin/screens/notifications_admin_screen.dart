import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/repositories/admin/notification_admin_repository.dart';
import '../../../../shared/widgets/ogp_button.dart';
import '../../../../shared/widgets/ogp_text_field.dart';

class NotificationsAdminScreen extends ConsumerStatefulWidget {
  const NotificationsAdminScreen({super.key});

  @override
  ConsumerState<NotificationsAdminScreen> createState() =>
      _NotificationsAdminScreenState();
}

class _NotificationsAdminScreenState
    extends ConsumerState<NotificationsAdminScreen> {
  final _repo = NotificationAdminRepository(ApiClient.instance);
  final _titleCtrl = TextEditingController();
  final _bodyCtrl = TextEditingController();
  bool _isBroadcast = true;
  bool _isSending = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _bodyCtrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_titleCtrl.text.isEmpty || _bodyCtrl.text.isEmpty) return;
    setState(() => _isSending = true);
    try {
      if (_isBroadcast) {
        await _repo.broadcast(
          title: _titleCtrl.text.trim(),
          body: _bodyCtrl.text.trim(),
        );
      }
      if (mounted) {
        _titleCtrl.clear();
        _bodyCtrl.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Notification sent!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Send Notifications')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 600),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Compose', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 16),
              Row(
                children: [
                  FilterChip(
                    label: const Text('Broadcast'),
                    selected: _isBroadcast,
                    onSelected: (v) => setState(() => _isBroadcast = true),
                    selectedColor: AppColors.gold.withOpacity(0.2),
                  ),
                  const SizedBox(width: 8),
                  FilterChip(
                    label: const Text('Specific Client'),
                    selected: !_isBroadcast,
                    onSelected: (v) => setState(() => _isBroadcast = false),
                    selectedColor: AppColors.gold.withOpacity(0.2),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              OgpTextField(
                controller: _titleCtrl,
                label: 'Title',
                hint: 'Notification title',
              ),
              const SizedBox(height: 12),
              OgpTextField(
                controller: _bodyCtrl,
                label: 'Message',
                hint: 'Your message here...',
                maxLines: 4,
              ),
              const SizedBox(height: 24),
              OgpButton(
                label: _isBroadcast ? 'Broadcast to All' : 'Send to Client',
                onPressed: _send,
                isLoading: _isSending,
                isFullWidth: true,
                icon: Icons.send_outlined,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
