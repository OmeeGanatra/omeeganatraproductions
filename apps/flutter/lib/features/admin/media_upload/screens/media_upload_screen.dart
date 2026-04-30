import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../shared/widgets/ogp_button.dart';
import '../../../../shared/widgets/label_mono.dart';

class MediaUploadScreen extends ConsumerStatefulWidget {
  const MediaUploadScreen({super.key, this.galleryId, this.projectId});
  final String? galleryId;
  final String? projectId;

  @override
  ConsumerState<MediaUploadScreen> createState() => _MediaUploadScreenState();
}

class _MediaUploadScreenState extends ConsumerState<MediaUploadScreen> {
  final List<PlatformFile> _selectedFiles = [];
  bool _isUploading = false;
  double _progress = 0;

  Future<void> _pickFiles() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.media,
      allowMultiple: true,
      withData: true,
    );
    if (result != null) {
      setState(() => _selectedFiles.addAll(result.files));
    }
  }

  Future<void> _startUpload() async {
    if (_selectedFiles.isEmpty) return;
    setState(() {
      _isUploading = true;
      _progress = 0;
    });
    // Simulate progress for now
    for (int i = 0; i < _selectedFiles.length; i++) {
      await Future.delayed(const Duration(milliseconds: 300));
      setState(() => _progress = (i + 1) / _selectedFiles.length);
    }
    setState(() {
      _isUploading = false;
      _selectedFiles.clear();
      _progress = 0;
    });
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Upload complete!')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Upload Media')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (widget.galleryId != null) ...[
              LabelMono('Gallery: ${widget.galleryId}', color: AppColors.gold),
              const SizedBox(height: 16),
            ],
            GestureDetector(
              onTap: _isUploading ? null : _pickFiles,
              child: Container(
                width: double.infinity,
                height: 200,
                decoration: BoxDecoration(
                  border: Border.all(
                    color: AppColors.gold.withOpacity(0.4),
                    width: 1.5,
                    strokeAlign: BorderSide.strokeAlignInside,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  color: AppColors.gold.withOpacity(0.04),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.cloud_upload_outlined, size: 48, color: AppColors.gold),
                    const SizedBox(height: 12),
                    Text(
                      'Click to select photos & videos',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 4),
                    LabelMono('JPG, PNG, MP4, MOV'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            if (_selectedFiles.isNotEmpty) ...[
              Text(
                '${_selectedFiles.length} file(s) selected',
                style: Theme.of(context).textTheme.titleSmall,
              ),
              const SizedBox(height: 12),
              Expanded(
                child: ListView.builder(
                  itemCount: _selectedFiles.length,
                  itemBuilder: (context, i) {
                    final f = _selectedFiles[i];
                    return ListTile(
                      dense: true,
                      leading: const Icon(Icons.image_outlined, size: 20),
                      title: Text(f.name, style: Theme.of(context).textTheme.bodySmall),
                      trailing: LabelMono(
                        f.size > 1024 * 1024
                            ? '${(f.size / (1024 * 1024)).toStringAsFixed(1)} MB'
                            : '${(f.size / 1024).toStringAsFixed(0)} KB',
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
            ],
            if (_isUploading) ...[
              LinearProgressIndicator(
                value: _progress,
                backgroundColor: AppColors.surfaceDark,
                valueColor: const AlwaysStoppedAnimation<Color>(AppColors.gold),
              ),
              const SizedBox(height: 8),
              Text(
                '${(_progress * 100).toInt()}%',
                style: const TextStyle(color: AppColors.textTertiary),
              ),
              const SizedBox(height: 16),
            ],
            OgpButton(
              label: 'Upload ${_selectedFiles.length} file(s)',
              onPressed: _selectedFiles.isEmpty ? null : _startUpload,
              isLoading: _isUploading,
              isFullWidth: true,
            ),
          ],
        ),
      ),
    );
  }
}
