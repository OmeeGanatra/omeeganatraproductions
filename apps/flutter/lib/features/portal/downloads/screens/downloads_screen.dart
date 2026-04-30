import 'package:flutter/material.dart';
import '../../../../shared/widgets/ogp_empty_state.dart';

class DownloadsScreen extends StatelessWidget {
  const DownloadsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Downloads')),
      body: const OgpEmptyState(
        message: 'No active downloads.',
        icon: Icons.download_outlined,
      ),
    );
  }
}
