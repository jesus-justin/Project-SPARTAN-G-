import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/services/api_service.dart';
import '../widgets/content_card_widget.dart';

class GinhawaHomeScreen extends StatefulWidget {
  const GinhawaHomeScreen({super.key});

  @override
  State<GinhawaHomeScreen> createState() => _GinhawaHomeScreenState();
}

class _GinhawaHomeScreenState extends State<GinhawaHomeScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, List<Map<String, dynamic>>> _contentByCategory = {};
  bool _isLoading = true;
  String? _errorMessage;
  Set<String> _selectedCategories = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadContent();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadContent() async {
    try {
      final ApiService api = ApiService();
      final dynamic resp = await api.get('/ginhawa/content');
      if (resp is Map<String, dynamic> && resp['data'] != null) {
        final Map<String, dynamic> data = resp['data'] as Map<String, dynamic>;
        final Map<String, dynamic> grouped = data['grouped'] as Map<String, dynamic>;

        setState(() {
          _contentByCategory = {};
          grouped.forEach((key, value) {
            if (value is List) {
              _contentByCategory[key] = value.map((e) => Map<String, dynamic>.from(e as Map)).toList();
            }
          });
          _selectedCategories = Set.from(_contentByCategory.keys);
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load content: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('GINHAWA - Wellness Resources'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const <Widget>[
            Tab(text: 'Resources'),
            Tab(text: 'Safety Plan'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(child: Text(_errorMessage!))
              : TabBarView(
                  controller: _tabController,
                  children: <Widget>[
                    _buildResourcesTab(),
                    _buildSafetyPlanTab(),
                  ],
                ),
    );
  }

  Widget _buildResourcesTab() {
    if (_contentByCategory.isEmpty) {
      return const Center(child: Text('No resources available'));
    }

    final List<String> categories = _contentByCategory.keys.toList();

    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            // Category filter chips
            Wrap(
              spacing: 8,
              children: categories.map((cat) {
                final bool isSelected = _selectedCategories.contains(cat);
                return FilterChip(
                  selected: isSelected,
                  label: Text(cat),
                  onSelected: (bool selected) {
                    setState(() {
                      if (selected) {
                        _selectedCategories.add(cat);
                      } else {
                        _selectedCategories.remove(cat);
                      }
                    });
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 20),
            // Content cards
            ..._contentByCategory.entries
                .where((e) => _selectedCategories.contains(e.key))
                .expand((entry) {
              return [
                Text(
                  entry.key,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 12),
                ...entry.value.map((content) {
                  return ContentCardWidget(
                    contentId: content['contentId'] as String? ?? '',
                    title: content['title'] as String? ?? 'Untitled',
                    category: content['category'] as String? ?? 'General',
                    contentType: content['contentType'] as String? ?? 'article',
                    onTap: () => context.push('/ginhawa/content/${content['contentId']}', extra: content),
                  );
                }),
                const SizedBox(height: 20),
              ];
            }).toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildSafetyPlanTab() {
    return SafetyPlanLoadingScreen(
      onDataLoaded: () {
        // Refresh can happen here
      },
    );
  }
}

class SafetyPlanLoadingScreen extends StatefulWidget {
  final VoidCallback onDataLoaded;

  const SafetyPlanLoadingScreen({required this.onDataLoaded, super.key});

  @override
  State<SafetyPlanLoadingScreen> createState() => _SafetyPlanLoadingScreenState();
}

class _SafetyPlanLoadingScreenState extends State<SafetyPlanLoadingScreen> {
  Map<String, String> _plan = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPlan();
  }

  Future<void> _loadPlan() async {
    try {
      final ApiService api = ApiService();
      final dynamic resp = await api.get('/ginhawa/safety-plan');
      if (resp is Map<String, dynamic> && resp['data'] != null) {
        final Map<String, dynamic> data = resp['data'] as Map<String, dynamic>;
        setState(() {
          _plan = {
            'warningSigns': data['warningSigns'] as String? ?? '',
            'copingStrategies': data['copingStrategies'] as String? ?? '',
            'socialSupports': data['socialSupports'] as String? ?? '',
            'professionalContacts': data['professionalContacts'] as String? ?? '',
            'safeEnvironment': data['safeEnvironment'] as String? ?? '',
            'reasonsToLive': data['reasonsToLive'] as String? ?? '',
            'emergencyContacts': data['emergencyContacts'] as String? ?? '',
          };
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load safety plan: $e')),
        );
      }
    }
  }

  Future<void> _savePlan(Map<String, String> planData) async {
    try {
      final ApiService api = ApiService();
      final Map<String, dynamic> body = {
        'warningSigns': planData['warningSigns'],
        'copingStrategies': planData['copingStrategies'],
        'socialSupports': planData['socialSupports'],
        'professionalContacts': planData['professionalContacts'],
        'safeEnvironment': planData['safeEnvironment'],
        'reasonsToLive': planData['reasonsToLive'],
        'emergencyContacts': planData['emergencyContacts'],
      };
      await api.post('/ginhawa/safety-plan', body: body);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Safety plan saved successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save safety plan: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return SafetyPlanForm(
      warningSigns: _plan['warningSigns'] ?? '',
      copingStrategies: _plan['copingStrategies'] ?? '',
      socialSupports: _plan['socialSupports'] ?? '',
      professionalContacts: _plan['professionalContacts'] ?? '',
      safeEnvironment: _plan['safeEnvironment'] ?? '',
      reasonsToLive: _plan['reasonsToLive'] ?? '',
      emergencyContacts: _plan['emergencyContacts'] ?? '',
      onSave: _savePlan,
    );
  }
}
