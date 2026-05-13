import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/services/storage_service.dart';

class FacilitatorDashboardScreen extends StatefulWidget {
  const FacilitatorDashboardScreen({super.key});

  @override
  State<FacilitatorDashboardScreen> createState() =>
      _FacilitatorDashboardScreenState();
}

class _FacilitatorDashboardScreenState extends State<FacilitatorDashboardScreen> {
  String _facilitatorName = 'Facilitator';
  int _selectedTabIndex = 0;
  final List<Map<String, dynamic>> _notifications = [
    {
      'id': 1,
      'studentName': 'Juan Dela Cruz',
      'assessment': 'PHQ-9 (Depression)',
      'score': 18,
      'riskLevel': 'High',
      'timestamp': '2 hours ago',
    },
    {
      'id': 2,
      'studentName': 'Maria Santos',
      'assessment': 'GAD-7 (Anxiety)',
      'score': 14,
      'riskLevel': 'Moderate',
      'timestamp': '5 hours ago',
    },
    {
      'id': 3,
      'studentName': 'Pedro Rodriguez',
      'assessment': 'DASS-21 (Stress)',
      'score': 22,
      'riskLevel': 'High',
      'timestamp': '1 day ago',
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadFacilitatorInfo();
    _showWelcomeDialog();
  }

  Future<void> _loadFacilitatorInfo() async {
    final String? name =
        await StorageService.getString('facilitator_name');
    if (mounted) {
      setState(() {
        _facilitatorName = name ?? 'Facilitator';
      });
    }
  }

  void _showWelcomeDialog() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) => AlertDialog(
          backgroundColor: Colors.white,
          content: SizedBox(
            width: double.maxFinite,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Align(
                  alignment: Alignment.topRight,
                  child: IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
                Container(
                  width: 100,
                  height: 100,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.primaryRed,
                  ),
                  child: const Icon(
                    Icons.person,
                    size: 60,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'Welcome, $_facilitatorName',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryRed,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Facilitator Dashboard',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryRed,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Text(
                      'Continue',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    });
  }

  Future<void> _onLogout() async {
    await StorageService.clearToken();
    if (!mounted) return;
    context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Facilitator Portal'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.primaryRed,
        foregroundColor: Colors.white,
        actions: <Widget>[
          IconButton(
            onPressed: _onLogout,
            icon: const Icon(Icons.logout),
            tooltip: 'Logout',
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: <Widget>[
              // Tab Navigation
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: <Widget>[
                    _buildTabButton('Notifications', 0),
                    const SizedBox(width: 8),
                    _buildTabButton('Analytics', 1),
                  ],
                ),
              ),
              const Divider(),
              // Tab Content
              if (_selectedTabIndex == 0)
                _buildNotificationsTab()
              else
                _buildAnalyticsTab(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabButton(String label, int index) {
    final bool isSelected = _selectedTabIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTabIndex = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color:
                    isSelected ? AppColors.primaryRed : Colors.transparent,
                width: 3,
              ),
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              color: isSelected ? AppColors.primaryRed : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNotificationsTab() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Text(
            'Assessment Notifications',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          if (_notifications.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: Text('No notifications yet'),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _notifications.length,
              itemBuilder: (BuildContext context, int index) {
                final notification = _notifications[index];
                return _buildNotificationCard(notification);
              },
            ),
        ],
      ),
    );
  }

  Widget _buildNotificationCard(Map<String, dynamic> notification) {
    final Color riskColor = notification['riskLevel'] == 'High'
        ? Colors.red
        : notification['riskLevel'] == 'Moderate'
            ? Colors.orange
            : Colors.green;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: <Widget>[
                Text(
                  notification['studentName'],
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: riskColor.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    notification['riskLevel'],
                    style: TextStyle(
                      color: riskColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${notification['assessment']} - Score: ${notification['score']}',
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              notification['timestamp'],
              style: const TextStyle(
                fontSize: 12,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnalyticsTab() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          _buildAnalyticsSection(
            title: 'Descriptive Analytics',
            description:
                'Analyze current student wellness patterns and trends',
            features: <String>[
              'Cohort Analysis (by college, year level, program)',
              'Rolling Window Summaries (7-day, 14-day, 30-day)',
              'Control Charts (mood, stress, energy baselines)',
              'Risk Distribution Dashboards',
            ],
            color: Colors.blue,
          ),
          const SizedBox(height: 16),
          _buildAnalyticsSection(
            title: 'Predictive Analytics',
            description: 'Forecast student mental health risks',
            features: <String>[
              'XGBoost Predictive Model',
              'SHAP Explainability (behavioral factors)',
              'Baseline Logistic Regression',
              'Risk Probability Scores',
            ],
            color: Colors.purple,
          ),
          const SizedBox(height: 16),
          _buildAnalyticsSection(
            title: 'Prescriptive Analytics',
            description:
                'Get actionable intervention recommendations',
            features: <String>[
              'Decision Tree Pathways',
              'Rule-Based Intervention Engine',
              'Facilitator-Supervised Actions',
              'Referral Recommendations',
            ],
            color: Colors.teal,
          ),
        ],
      ),
    );
  }

  Widget _buildAnalyticsSection({
    required String title,
    required String description,
    required List<String> features,
    required Color color,
  }) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        description,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ...features.map(
              (String feature) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: <Widget>[
                    Icon(
                      Icons.check_circle,
                      size: 20,
                      color: color,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        feature,
                        style: const TextStyle(fontSize: 14),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('$title will be available soon'),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: color,
                ),
                child: const Text(
                  'View Details',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
