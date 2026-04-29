import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/theme/app_theme.dart';
import '../../../models/project.dart';

final projectsProvider =
    StateNotifierProvider<ProjectsNotifier, ProjectsState>((ref) {
  return ProjectsNotifier();
});

class ProjectsState {
  final List<Project> projects;
  final bool isLoading;
  final String? error;

  const ProjectsState({
    this.projects = const [],
    this.isLoading = false,
    this.error,
  });

  ProjectsState copyWith({
    List<Project>? projects,
    bool? isLoading,
    String? error,
  }) {
    return ProjectsState(
      projects: projects ?? this.projects,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class ProjectsNotifier extends StateNotifier<ProjectsState> {
  ProjectsNotifier() : super(const ProjectsState()) {
    loadProjects();
  }

  Future<void> loadProjects() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await ApiClient.instance.get(Endpoints.projects);
      final data = response.data;
      final List<dynamic> items =
          data is Map ? (data['projects'] ?? data['data'] ?? []) : data;
      final projects = items
          .map((json) => Project.fromJson(json as Map<String, dynamic>))
          .toList();
      state = state.copyWith(projects: projects, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load events. Pull to retry.',
      );
    }
  }
}

class ProjectsListScreen extends ConsumerWidget {
  const ProjectsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final projectsState = ref.watch(projectsProvider);
    final authState = ref.watch(authProvider);
    final user = authState.user;

    // Today's date formatted as "SAT 29 APR"
    final now = DateTime.now();
    final dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    final monthNames = [
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
    ];
    final dayLabel =
        '${dayNames[now.weekday - 1]} ${now.day} ${monthNames[now.month - 1]}';
    final firstName = user?.fullName.split(' ').first ?? 'Client';

    return Scaffold(
      backgroundColor: AppColors.scaffoldDark,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.gold,
          backgroundColor: AppColors.surfaceDark,
          onRefresh: () =>
              ref.read(projectsProvider.notifier).loadProjects(),
          child: CustomScrollView(
            slivers: [
              // ── Header ──────────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              dayLabel,
                              style: AppTheme.labelMono(),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              firstName,
                              style: GoogleFonts.instrumentSerif(
                                fontSize: 28,
                                fontWeight: FontWeight.w400,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Gold avatar circle with initial
                      Container(
                        width: 40,
                        height: 40,
                        decoration: const BoxDecoration(
                          color: AppColors.gold,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            user?.initials.isNotEmpty == true
                                ? user!.initials[0]
                                : '?',
                            style: GoogleFonts.instrumentSerif(
                              fontSize: 18,
                              fontWeight: FontWeight.w400,
                              color: AppColors.scaffoldDark,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // ── Body ────────────────────────────────────────────────
              SliverToBoxAdapter(
                child: _buildBody(context, projectsState),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBody(BuildContext context, ProjectsState state) {
    if (state.isLoading && state.projects.isEmpty) {
      return _buildShimmer();
    }

    if (state.error != null && state.projects.isEmpty) {
      return _buildErrorState(state.error!);
    }

    if (state.projects.isEmpty) {
      return _buildEmptyState();
    }

    final hero = state.projects.first;
    final rest = state.projects.skip(1).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 28),

        // ── Hero card ────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: _HeroCard(project: hero),
        ),

        if (rest.isNotEmpty) ...[
          const SizedBox(height: 32),

          // "PROJECTS" section label
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Text(
              'PROJECTS',
              style: AppTheme.labelMono(),
            ),
          ),
          const SizedBox(height: 12),

          // Project rows
          ...rest.map((p) => _ProjectRow(project: p)),
        ],

        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildShimmer() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const SizedBox(height: 28),
          Shimmer.fromColors(
            baseColor: AppColors.surfaceDark,
            highlightColor: AppColors.elevatedDark,
            child: Container(
              height: 240,
              decoration: BoxDecoration(
                color: AppColors.surfaceDark,
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
          const SizedBox(height: 20),
          ...List.generate(
            3,
            (_) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Shimmer.fromColors(
                baseColor: AppColors.surfaceDark,
                highlightColor: AppColors.elevatedDark,
                child: Container(
                  height: 72,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceDark,
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 48),
            Icon(
              Icons.cloud_off_outlined,
              size: 48,
              color: AppColors.textTertiary.withOpacity(0.4),
            ),
            const SizedBox(height: 16),
            Text(
              error,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(48),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 48),
            Icon(
              Icons.photo_library_outlined,
              size: 48,
              color: AppColors.gold.withOpacity(0.25),
            ),
            const SizedBox(height: 16),
            Text(
              'No projects yet',
              style: GoogleFonts.instrumentSerif(
                fontSize: 20,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your deliveries will appear here',
              style: GoogleFonts.inter(
                fontSize: 13,
                color: AppColors.textTertiary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Hero card (first project, 16:10 ratio) ───────────────────────────────────
class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.project});

  final Project project;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.go('/projects/${project.slug}'),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: AppColors.surfaceDark,
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 16:10 cover image
            AspectRatio(
              aspectRatio: 16 / 10,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (project.coverImageUrl != null)
                    CachedNetworkImage(
                      imageUrl: project.coverImageUrl!,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Shimmer.fromColors(
                        baseColor: AppColors.surfaceDark,
                        highlightColor: AppColors.elevatedDark,
                        child: Container(color: AppColors.surfaceDark),
                      ),
                      errorWidget: (_, __, ___) => Container(
                        color: AppColors.surfaceDark,
                        child: const Icon(Icons.image_outlined,
                            color: AppColors.textTertiary, size: 48),
                      ),
                    )
                  else
                    Container(
                      color: AppColors.surfaceDark,
                      child: const Icon(Icons.image_outlined,
                          color: AppColors.textTertiary, size: 48),
                    ),

                  // Subtle gradient
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withOpacity(0.45),
                        ],
                        stops: const [0.5, 1.0],
                      ),
                    ),
                  ),

                  // Play button overlay (56×56)
                  Center(
                    child: Container(
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
                  ),

                  // "READY · 4K · 14:32" top-left badge
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.55),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        _buildBadgeLabel(project),
                        style: GoogleFonts.jetBrainsMono(
                          fontSize: 9,
                          color: Colors.white.withOpacity(0.9),
                          letterSpacing: 0.08 * 9,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Below-image info
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'YOUR LATEST DELIVERY',
                    style: AppTheme.labelMono(),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    project.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.instrumentSerif(
                      fontSize: 24,
                      fontWeight: FontWeight.w400,
                      color: AppColors.textPrimary,
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      if (project.eventType != null) ...[
                        Text(
                          project.eventType!.toUpperCase(),
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: AppColors.gold,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        if (project.formattedDate.isNotEmpty)
                          Text(
                            '  ·  ',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: AppColors.textTertiary,
                            ),
                          ),
                      ],
                      if (project.formattedDate.isNotEmpty)
                        Text(
                          project.formattedDate,
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: AppColors.textTertiary,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _buildBadgeLabel(Project project) {
    final parts = <String>[];
    if (project.status.toUpperCase() == 'ACTIVE' ||
        project.status.toUpperCase() == 'DELIVERED') {
      parts.add('READY');
    } else {
      parts.add(project.status.toUpperCase());
    }
    parts.add('4K');
    return parts.join(' · ');
  }
}

// ── Project list row (subsequent projects) ────────────────────────────────────
class _ProjectRow extends StatelessWidget {
  const _ProjectRow({required this.project});

  final Project project;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.go('/projects/${project.slug}'),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Row(
                children: [
                  // 56×56 thumbnail
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: SizedBox(
                      width: 56,
                      height: 56,
                      child: project.coverImageUrl != null
                          ? CachedNetworkImage(
                              imageUrl: project.coverImageUrl!,
                              fit: BoxFit.cover,
                              placeholder: (_, __) => Shimmer.fromColors(
                                baseColor: AppColors.surfaceDark,
                                highlightColor: AppColors.elevatedDark,
                                child: Container(color: AppColors.surfaceDark),
                              ),
                              errorWidget: (_, __, ___) => Container(
                                color: AppColors.surfaceDark,
                                child: const Icon(Icons.image_outlined,
                                    color: AppColors.textTertiary, size: 22),
                              ),
                            )
                          : Container(
                              color: AppColors.surfaceDark,
                              child: const Icon(Icons.image_outlined,
                                  color: AppColors.textTertiary, size: 22),
                            ),
                    ),
                  ),
                  const SizedBox(width: 14),

                  // Title + type/date + progress bar
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          project.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          [
                            if (project.eventType != null)
                              project.eventType!.toUpperCase(),
                            if (project.formattedDate.isNotEmpty)
                              project.formattedDate,
                          ].join(' · '),
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: AppColors.textTertiary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        // Progress bar
                        ClipRRect(
                          borderRadius: BorderRadius.circular(2),
                          child: LinearProgressIndicator(
                            value: _progressForStatus(project.status),
                            backgroundColor: const Color(0xFF2A2A2A),
                            valueColor: const AlwaysStoppedAnimation<Color>(
                                AppColors.gold),
                            minHeight: 2,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Status label
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.gold.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(4),
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
                ],
              ),
            ),
            const Divider(
              height: 1,
              thickness: 0.5,
              color: Color(0xFF1E1E1E),
            ),
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

  double _progressForStatus(String status) {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'active':
        return 1.0;
      case 'editing':
        return 0.6;
      case 'pending':
        return 0.2;
      default:
        return 0.5;
    }
  }
}
