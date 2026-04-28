import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/endpoints.dart';
import '../../../core/theme/app_theme.dart';

class TimelineEvent {
  final String id;
  final String time;
  final String title;
  final String? description;
  final String? location;
  final String eventType;
  final IconData icon;
  final Color color;

  const TimelineEvent({
    required this.id,
    required this.time,
    required this.title,
    this.description,
    this.location,
    required this.eventType,
    required this.icon,
    required this.color,
  });

  factory TimelineEvent.fromJson(Map<String, dynamic> json) {
    final type = json['eventType'] as String? ?? 'other';
    return TimelineEvent(
      id: json['id'] as String? ?? '',
      time: json['time'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      location: json['location'] as String?,
      eventType: type,
      icon: _iconForType(type),
      color: _colorForType(type),
    );
  }

  static IconData _iconForType(String type) {
    switch (type.toLowerCase()) {
      case 'haldi':
        return Icons.spa_outlined;
      case 'mehendi':
        return Icons.brush_outlined;
      case 'sangeet':
        return Icons.music_note_outlined;
      case 'wedding':
      case 'ceremony':
        return Icons.favorite_outline;
      case 'reception':
        return Icons.celebration_outlined;
      case 'baraat':
        return Icons.directions_walk_outlined;
      case 'vidaai':
        return Icons.sentiment_satisfied_alt_outlined;
      case 'pheras':
        return Icons.local_fire_department_outlined;
      case 'cocktail':
        return Icons.wine_bar_outlined;
      case 'lunch':
      case 'dinner':
        return Icons.restaurant_outlined;
      case 'getting_ready':
        return Icons.auto_awesome_outlined;
      default:
        return Icons.event_outlined;
    }
  }

  static Color _colorForType(String type) {
    switch (type.toLowerCase()) {
      case 'haldi':
        return AppColors.haldiYellow;
      case 'mehendi':
        return AppColors.mehendiGreen;
      case 'sangeet':
        return const Color(0xFF7E57C2);
      case 'wedding':
      case 'ceremony':
      case 'pheras':
        return AppColors.weddingGold;
      case 'reception':
        return AppColors.receptionPink;
      case 'baraat':
        return const Color(0xFF42A5F5);
      case 'cocktail':
        return const Color(0xFFAB47BC);
      default:
        return AppColors.textSecondary;
    }
  }
}

final timelineProvider = StateNotifierProvider.family<TimelineNotifier,
    TimelineState, String>((ref, slug) {
  return TimelineNotifier(slug);
});

class TimelineState {
  final List<TimelineEvent> events;
  final bool isLoading;
  final String? error;

  const TimelineState({
    this.events = const [],
    this.isLoading = false,
    this.error,
  });

  TimelineState copyWith({
    List<TimelineEvent>? events,
    bool? isLoading,
    String? error,
  }) {
    return TimelineState(
      events: events ?? this.events,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class TimelineNotifier extends StateNotifier<TimelineState> {
  TimelineNotifier(this.slug) : super(const TimelineState()) {
    load();
  }

  final String slug;

  Future<void> load() async {
    state = state.copyWith(isLoading: true);

    try {
      final response =
          await ApiClient.instance.get(Endpoints.timeline(slug));
      final data = response.data;
      final List<dynamic> items = data is Map
          ? (data['events'] ?? data['timeline'] ?? data['data'] ?? [])
          : data;
      final events = items
          .map((e) => TimelineEvent.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(events: events, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load timeline',
      );
    }
  }
}

class TimelineScreen extends ConsumerWidget {
  const TimelineScreen({super.key, required this.projectSlug});

  final String projectSlug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timeline = ref.watch(timelineProvider(projectSlug));

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Timeline',
          style: GoogleFonts.playfairDisplay(
            fontSize: 20,
            fontWeight: FontWeight.w600,
          ),
        ),
        leading: IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.arrow_back_ios, size: 18),
        ),
      ),
      body: timeline.isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.gold),
            )
          : timeline.error != null
              ? Center(
                  child: Text(
                    timeline.error!,
                    style: GoogleFonts.inter(color: AppColors.textSecondary),
                  ),
                )
              : timeline.events.isEmpty
                  ? _buildEmptyState()
                  : _buildTimeline(context, timeline.events),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.timeline_outlined,
            size: 56,
            color: AppColors.gold.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          Text(
            'Timeline not available',
            style: GoogleFonts.playfairDisplay(
              fontSize: 20,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Event timeline will appear here\nwhen it\'s ready',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppColors.textTertiary,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeline(BuildContext context, List<TimelineEvent> events) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
      itemCount: events.length,
      itemBuilder: (context, index) {
        final event = events[index];
        final isLeft = index % 2 == 0;
        final isFirst = index == 0;
        final isLast = index == events.length - 1;

        return _TimelineItem(
          event: event,
          isLeft: isLeft,
          isFirst: isFirst,
          isLast: isLast,
        );
      },
    );
  }
}

class _TimelineItem extends StatefulWidget {
  const _TimelineItem({
    required this.event,
    required this.isLeft,
    required this.isFirst,
    required this.isLast,
  });

  final TimelineEvent event;
  final bool isLeft;
  final bool isFirst;
  final bool isLast;

  @override
  State<_TimelineItem> createState() => _TimelineItemState();
}

class _TimelineItemState extends State<_TimelineItem>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
    );
    _slideAnimation = Tween<Offset>(
      begin: Offset(widget.isLeft ? -0.2 : 0.2, 0),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
    ));

    // Delay based on index for stagger effect
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final event = widget.event;
    final screenWidth = MediaQuery.of(context).size.width;
    final cardWidth = (screenWidth - 80) / 2;

    return SizedBox(
      height: 130,
      child: Row(
        children: [
          // Left side
          SizedBox(
            width: cardWidth,
            child: widget.isLeft
                ? _buildCard(event)
                : _buildTime(event.time),
          ),

          // Center line
          SizedBox(
            width: 40,
            child: Column(
              children: [
                // Line above
                if (!widget.isFirst)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: AppColors.gold.withOpacity(0.3),
                    ),
                  )
                else
                  const Expanded(child: SizedBox()),

                // Dot
                Container(
                  width: 14,
                  height: 14,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: event.color,
                    border: Border.all(
                      color: AppColors.scaffoldDark,
                      width: 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: event.color.withOpacity(0.4),
                        blurRadius: 8,
                        spreadRadius: 1,
                      ),
                    ],
                  ),
                ),

                // Line below
                if (!widget.isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: AppColors.gold.withOpacity(0.3),
                    ),
                  )
                else
                  const Expanded(child: SizedBox()),
              ],
            ),
          ),

          // Right side
          SizedBox(
            width: cardWidth,
            child: widget.isLeft
                ? _buildTime(event.time)
                : _buildCard(event),
          ),
        ],
      ),
    );
  }

  Widget _buildTime(String time) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Align(
        alignment:
            widget.isLeft ? Alignment.centerRight : Alignment.centerLeft,
        child: Text(
          time,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppColors.gold,
          ),
        ),
      ),
    );
  }

  Widget _buildCard(TimelineEvent event) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: SlideTransition(
        position: _slideAnimation,
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 4),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surfaceDark,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: event.color.withOpacity(0.2),
              width: 0.5,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: event.color.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      event.icon,
                      size: 14,
                      color: event.color,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      event.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                ],
              ),
              if (event.description != null) ...[
                const SizedBox(height: 6),
                Text(
                  event.description!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.textTertiary,
                    height: 1.3,
                  ),
                ),
              ],
              if (event.location != null) ...[
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(
                      Icons.location_on_outlined,
                      size: 11,
                      color: AppColors.textTertiary.withOpacity(0.7),
                    ),
                    const SizedBox(width: 3),
                    Expanded(
                      child: Text(
                        event.location!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: AppColors.textTertiary.withOpacity(0.7),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
