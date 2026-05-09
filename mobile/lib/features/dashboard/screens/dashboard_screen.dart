import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/storage_service.dart';
import '../widgets/crisis_hotline_sheet.dart';
import '../widgets/mood_energy_chart.dart';
import '../widgets/risk_badge_widget.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<double> _last7Mood = <double>[3.5, 2.8, 3.1, 2.5, 2.2, 2.7, 3.0];
  List<double> _last7Energy = <double>[3.8, 3.2, 2.9, 2.4, 2.0, 2.6, 2.9];
  List<String> _dayLabels = <String>['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  String _riskLevel = 'Unknown';
  bool _hasShownCrisisSheet = false;

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    try {
      final ApiService api = ApiService();
      final dynamic resp = await api.get('/student/dashboard');
      if (resp is Map<String, dynamic> && resp['data'] != null) {
        final data = resp['data'];
        final String name = data['name']?.toString() ?? '';
        final String risk = data['riskLevel']?.toString() ?? data['risk_level']?.toString() ?? 'Unknown';
        final List<dynamic> esm = data['esm'] is List ? List<dynamic>.from(data['esm']) : [];

        setState(() {
          _riskLevel = risk;
          if (esm.isNotEmpty) {
            _last7Mood = esm.map<double>((e) => (e['mood'] as num).toDouble()).toList();
            _last7Energy = esm.map<double>((e) => (e['energy'] as num).toDouble()).toList();
            _dayLabels = List<String>.generate(_last7Mood.length, (index) => '${index + 1}');
          }
        });

        // update provider student name
        if (name.isNotEmpty) {
          await StorageService.setString('student_name', name);
          if (!mounted) return;
          try {
            await context.read<AuthProvider>().initialize();
          } catch (_) {}
        }

        if (_riskLevel == 'Crisis' && !_hasShownCrisisSheet) {
          _hasShownCrisisSheet = true;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            CrisisHotlineSheet.show(context);
          });
        }
      }
    } catch (_) {
      // ignore
    }
  }

  @override
  Widget build(BuildContext context) {
    final AuthProvider auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Logout',
            onPressed: () async {
              await context.read<AuthProvider>().logout();
              if (!context.mounted) {
                return;
              }
              context.go('/login');
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'Welcome, ${auth.studentName}',
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            const Text(
              'Current Risk Level',
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 8),
            RiskBadgeWidget(riskLevel: _riskLevel),
            const SizedBox(height: 20),
            Card(
              color: Colors.white,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    const Text(
                      'Last 7 Days Mood and Energy',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: const <Widget>[
                        _LegendDot(color: AppColors.primaryRed, label: 'Mood'),
                        SizedBox(width: 12),
                        _LegendDot(color: Color(0xFF0288D1), label: 'Energy'),
                      ],
                    ),
                    const SizedBox(height: 12),
                    MoodEnergyChart(
                      moodValues: _last7Mood,
                      energyValues: _last7Energy,
                      dayLabels: _dayLabels,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primaryRed,
                  foregroundColor: Colors.white,
                ),
                onPressed: () => context.go('/dass21'),
                child: const Text('Take DASS-21'),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => context.go('/esm'),
                child: const Text('Daily Check-in'),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                ),
                onPressed: () => context.go('/ginhawa'),
                child: const Text('Wellness Resources'),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => context.go('/ginhawa/safety-plan'),
                child: const Text('My Safety Plan'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(label),
      ],
    );
  }
}
