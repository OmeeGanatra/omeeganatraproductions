import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/project.dart';
import '../../../models/gallery.dart';

final projectDetailProvider = StateNotifierProvider.family<
    ProjectDetailNotifier, ProjectDetailState, String>((ref, slug) {
  return ProjectDetailNotifier(slug);
});

class ProjectDetailState {
  final Project? project;
  final List<Gallery> galleries;
  final bool isLoading;
  final String? error;

  const ProjectDetailState({
    this.project,
    this.galleries = const [],
    this.isLoading = false,
    this.error,
  });

  ProjectDetailState copyWith({
    Project? project,
    List<Gallery>? galleries,
    bool? isLoading,
    String? error,
  }) {
    return ProjectDetailState(
      project: project ?? this.project,
      galleries: galleries ?? this.galleries,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class ProjectDetailNotifier extends StateNotifier<ProjectDetailState> {
  ProjectDetailNotifier(this.slug) : super(const ProjectDetailState()) {
    load();
  }

  final String slug;

  Future<void> load() async {
    state = state.copyWith(isLoading: true);

    try {
      final projectRes =
          await ApiClient.instance.get(Endpoints.project(slug));
      final projectData = projectRes.data as Map<String, dynamic>;
      final project =
          Project.fromJson(projectData['project'] ?? projectData);

      final galleriesRes =
          await ApiClient.instance.get(Endpoints.projectGalleries(slug));
      final galData = galleriesRes.data;
      final List<dynamic> galItems = galData is Map
          ? (galData['galleries'] ?? galData['data'] ?? [])
          : galData;
      final galleries = galItems
          .map((g) => Gallery.fromJson(g as Map<String, dynamic>))
          .toList();

      state = state.copyWith(
        project: project,
        galleries: galleries,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load project details',
      );
    }
  }
}

class ProjectDetailScreen extends ConsumerWidget {
  const ProjectDetailScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detail = ref.watch(projectDetailProvider(slug));

    return Scaffold(
      backgroundColor: AppColors.scaffoldDark,
      body: detail.isLoading && detail.project == null
          ? _buildLoadingState()
          : detail.project == null
              ? _buildErrorState(detail.error ?? 'Project not found')
              : _buildContent(context, detail),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: CircularProgressIndicator(color: AppColors.gold),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Text(
        error,
        style: GoogleFonts.inter(
          color: AppColors.textSecondary,
          fontSize: 15,
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, ProjectDetailState detail) {
    final project = detail.project!;

    return DefaultTabController(
      length: 3,
      child: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            // ── Collapsible header ─────────────────────────────────
            SliverAppBar(
              expandedHeight: 300,
              pinned: true,
              stretch: true,
              backgroundColor: AppColors.scaffoldDark,
              automaticallyImplyLeading: false,
              titleSpacing: 0,
              title: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Back button
                    GestureDetector(
                      onTap: () => context.go('/projects'),
                      child: Text(
                        '← PROJECTS',
                        style: AppTheme.labelMono(
                            color: AppColors.textSecondary),
                      ),
                    ),
                    // Share button
                    GestureDetector(
                      onTap: () {},
                      child: Text(
                        '↗ SHARE',
                        style: AppTheme.labelMono(
                            color: AppColors.textSecondary),
                      ),
                    ),
                  ],
                ),
              ),
              flexibleSpace: FlexibleSpaceBar(
                stretchModes: const [
                  StretchMode.zoomBackground,
                  StretchMode.blurBackground,
                ],
                background: Stack(
                  fit: StackFit.expand,
                  children: [
                    // 16:9 video player placeholder
                    if (project.coverImageUrl != null)
                      CachedNetworkImage(
                        imageUrl: project.coverImageUrl!,
                        fit: BoxFit.cover,
                        placeholder: (_, __) =>
                            Container(color: AppColors.surfaceDark),
                        errorWidget: (_, __, ___) => Container(
                          color: AppColors.surfaceDark,
                          child: const Icon(Icons.image,
                              size: 60,
                              color: AppColors.textTertiary),
                        ),
                      )
                    else
                      Container(color: AppColors.surfaceDark),

                    // Dark gradient for legibility
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.black.withOpacity(0.45),
                            Colors.transparent,
                            Colors.black.withOpacity(0.75),
                          ],
                          stops: const [0, 0.4, 1],
                        ),
                      ),
                    ),

                    // Play button + progress bar overlay
                    Positioned.fill(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Play button
                          Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.15),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: Colors.white.withOpacity(0.4),
                                width: 1,
                              ),
                            ),
                            child: const Icon(
                              Icons.play_arrow_rounded,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Bottom: progress bar with timecodes
                    Positioned(
                      left: 20,
                      right: 20,
                      bottom: 52,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Progress bar
                          ClipRRect(
                            borderRadius: BorderRadius.circular(2),
                            child: const LinearProgressIndicator(
                              value: 0,
                              backgroundColor: Color(0x55FFFFFF),
                              valueColor: AlwaysStoppedAnimation<Color>(
                                  AppColors.gold),
                              minHeight: 2,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '0:00',
                                style: GoogleFonts.jetBrainsMono(
                                  fontSize: 9,
                                  color: Colors.white.withOpacity(0.6),
                                ),
                              ),
                              Text(
                                '14:32',
                                style: GoogleFonts.jetBrainsMono(
                                  fontSize: 9,
                                  color: Colors.white.withOpacity(0.6),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // Project info: status chip + type, title, subtitle
                    Positioned(
                      left: 20,
                      right: 20,
                      bottom: 100,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              // Status chip
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.gold.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(
                                    color: AppColors.gold.withOpacity(0.4),
                                    width: 0.5,
                                  ),
                                ),
                                child: Text(
                                  _statusLabel(project.status),
                                  style: GoogleFonts.jetBrainsMono(
                                    fontSize: 9,
                                    color: AppColors.gold,
                                    letterSpacing: 0.1 * 9,
                                  ),
                                ),
                              ),
                              if (project.eventType != null) ...[
                                const SizedBox(width: 8),
                                Text(
                                  project.eventType!.toUpperCase(),
                                  style: AppTheme.labelMono(
                                      color: Colors.white
                                          .withOpacity(0.6)),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            project.title,
                            style: GoogleFonts.instrumentSerif(
                              fontSize: 32,
                              fontWeight: FontWeight.w400,
                              color: Colors.white,
                              height: 1.05,
                            ),
                          ),
                          const SizedBox(height: 6),
                          if (project.locationString.isNotEmpty ||
                              project.formattedDate.isNotEmpty)
                            Text(
                              [
                                if (project.formattedDate.isNotEmpty)
                                  project.formattedDate,
                                if (project.locationString.isNotEmpty)
                                  project.locationString,
                              ].join('  ·  '),
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: Colors.white.withOpacity(0.65),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── Tab bar ────────────────────────────────────────────
            SliverPersistentHeader(
              pinned: true,
              delegate: _TabBarDelegate(
                TabBar(
                  labelColor: AppColors.gold,
                  unselectedLabelColor: AppColors.textTertiary,
                  indicatorColor: AppColors.gold,
                  indicatorSize: TabBarIndicatorSize.label,
                  indicatorWeight: 1.5,
                  labelStyle: GoogleFonts.jetBrainsMono(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.12 * 10,
                  ),
                  unselectedLabelStyle: GoogleFonts.jetBrainsMono(
                    fontSize: 10,
                    fontWeight: FontWeight.w400,
                    letterSpacing: 0.12 * 10,
                  ),
                  tabs: const [
                    Tab(text: 'OVERVIEW'),
                    Tab(text: 'SELECTS'),
                    Tab(text: 'FILES'),
                  ],
                ),
              ),
            ),
          ];
        },
        body: TabBarView(
          children: [
            // Overview tab — recent timeline events
            _OverviewTab(project: project),

            // Selects tab — 2-col square gallery grid
            _SelectsTab(
              galleries: detail.galleries,
              projectSlug: slug,
            ),

            // Files tab — deliverables list
            _FilesTab(project: project),
          ],
        ),
      ),
    );
  }

  String _statusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'active':
        return 'READY';
      case 'editing':
        return 'EDITING';
      case 'pending':
        return 'PENDING';
      default:
        return status.toUpperCase();
    }
  }
}

// ── Tab bar delegate ──────────────────────────────────────────────────────────
class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;

  _TabBarDelegate(this.tabBar);

  @override
  double get minExtent => tabBar.preferredSize.height;

  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(
      color: AppColors.scaffoldDark,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(covariant _TabBarDelegate oldDelegate) => false;
}

// ── Overview tab ──────────────────────────────────────────────────────────────
class _OverviewTab extends StatelessWidget {
  const _OverviewTab({required this.project});

  final Project project;

  // Synthesised timeline events derived from project data
  List<Map<String, String>> _buildEvents() {
    final events = <Map<String, String>>[];

    if (project.eventDate != null) {
      events.add({
        'title': 'Event day',
        'date': project.formattedDate,
        'description': project.locationString.isNotEmpty
            ? project.locationString
            : 'Main event recorded',
      });
    }

    if (project.status.toLowerCase() == 'editing') {
      events.add({
        'title': 'Post-production',
        'date': '',
        'description': 'Colour grading and edit in progress',
      });
    }

    if (project.status.toLowerCase() == 'delivered' ||
        project.status.toLowerCase() == 'active') {
      events.add({
        'title': 'Delivery ready',
        'date': '',
        'description':
            '${project.totalMediaCount} selects delivered in 4K',
      });
    }

    if (project.galleryCount > 0) {
      events.add({
        'title': 'Galleries published',
        'date': '',
        'description': '${project.galleryCount} galleries available',
      });
    }

    return events;
  }

  @override
  Widget build(BuildContext context) {
    final events = _buildEvents();

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('RECENT', style: AppTheme.labelMono()),
          const SizedBox(height: 20),

          if (events.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 32),
                child: Text(
                  'No timeline events yet',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: AppColors.textTertiary,
                  ),
                ),
              ),
            )
          else
            ...events.asMap().entries.map((entry) {
              final isLast = entry.key == events.length - 1;
              final event = entry.value;
              return _TimelineEvent(
                title: event['title'] ?? '',
                date: event['date'] ?? '',
                description: event['description'] ?? '',
                isLast: isLast,
              );
            }),
        ],
      ),
    );
  }
}

class _TimelineEvent extends StatelessWidget {
  const _TimelineEvent({
    required this.title,
    required this.date,
    required this.description,
    required this.isLast,
  });

  final String title;
  final String date;
  final String description;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Dot + line
          Column(
            children: [
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(top: 4),
                decoration: const BoxDecoration(
                  color: AppColors.gold,
                  shape: BoxShape.circle,
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 1,
                    color: const Color(0xFF2A2A2A),
                    margin: const EdgeInsets.symmetric(vertical: 4),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 16),

          // Content
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      if (date.isNotEmpty)
                        Text(
                          date,
                          style: AppTheme.labelMono(),
                        ),
                    ],
                  ),
                  if (description.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppColors.textTertiary,
                        height: 1.5,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Selects tab (2-column square gallery grid) ────────────────────────────────
class _SelectsTab extends StatelessWidget {
  const _SelectsTab({
    required this.galleries,
    required this.projectSlug,
  });

  final List<Gallery> galleries;
  final String projectSlug;

  @override
  Widget build(BuildContext context) {
    if (galleries.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.collections_outlined,
              size: 40,
              color: AppColors.textTertiary.withOpacity(0.3),
            ),
            const SizedBox(height: 12),
            Text(
              'Selects coming soon',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.textTertiary,
              ),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 1, // square tiles
        mainAxisSpacing: 4,
        crossAxisSpacing: 4,
      ),
      itemCount: galleries.length,
      itemBuilder: (context, index) {
        final gallery = galleries[index];
        return GestureDetector(
          onTap: () => context.go(
            '/projects/$projectSlug/galleries/${gallery.id}',
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (gallery.coverImageUrl != null)
                CachedNetworkImage(
                  imageUrl: gallery.coverImageUrl!,
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Shimmer.fromColors(
                    baseColor: AppColors.surfaceDark,
                    highlightColor: AppColors.elevatedDark,
                    child: Container(color: AppColors.surfaceDark),
                  ),
                  errorWidget: (_, __, ___) => Container(
                    color: AppColors.surfaceDark,
                    child: const Icon(Icons.image,
                        color: AppColors.textTertiary),
                  ),
                )
              else
                Container(
                  color: AppColors.surfaceDark,
                  child: const Icon(Icons.collections_outlined,
                      color: AppColors.textTertiary),
                ),

              // Bottom label
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withOpacity(0.7),
                      ],
                    ),
                  ),
                  child: Text(
                    gallery.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ── Files tab ────────────────────────────────────────────────────────────────
class _FilesTab extends StatelessWidget {
  const _FilesTab({required this.project});

  final Project project;

  // Synthesise file entries from project metadata
  List<Map<String, String>> _buildFiles() {
    final files = <Map<String, String>>[];
    if (project.totalMediaCount > 0) {
      files.add({
        'name': '${project.title} — 4K Master',
        'format': 'MP4 · 4K UHD',
      });
      files.add({
        'name': '${project.title} — Highlight Reel',
        'format': 'MP4 · 1080p',
      });
    }
    if (project.galleryCount > 0) {
      files.add({
        'name': 'Photo Selects Archive',
        'format': 'ZIP · JPEG',
      });
    }
    return files;
  }

  @override
  Widget build(BuildContext context) {
    final files = _buildFiles();

    if (files.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Text(
            'No files available yet',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppColors.textTertiary,
            ),
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
      itemCount: files.length,
      separatorBuilder: (_, __) => const Divider(
        height: 1,
        thickness: 0.5,
        color: Color(0xFF1E1E1E),
      ),
      itemBuilder: (context, index) {
        final file = files[index];
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Row(
            children: [
              // File icon
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.surfaceDark,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: const Color(0xFF2A2A2A),
                    width: 0.5,
                  ),
                ),
                child: const Icon(
                  Icons.insert_drive_file_outlined,
                  color: AppColors.textTertiary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 14),

              // Name + format
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      file['name'] ?? '',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      file['format'] ?? '',
                      style: AppTheme.labelMono(),
                    ),
                  ],
                ),
              ),

              // Download button
              GestureDetector(
                onTap: () {},
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.gold.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: AppColors.gold.withOpacity(0.3),
                      width: 0.5,
                    ),
                  ),
                  child: Text(
                    '↓',
                    style: GoogleFonts.jetBrainsMono(
                      fontSize: 13,
                      color: AppColors.gold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
