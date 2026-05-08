import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/services/api_service.dart';

class ContentDetailScreen extends StatefulWidget {
  final String contentId;

  const ContentDetailScreen({required this.contentId, super.key});

  @override
  State<ContentDetailScreen> createState() => _ContentDetailScreenState();
}

class _ContentDetailScreenState extends State<ContentDetailScreen> {
  Map<String, dynamic>? _content;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadContent();
  }

  Future<void> _loadContent() async {
    try {
      final ApiService api = ApiService();
      final dynamic resp = await api.get('/ginhawa/content/${widget.contentId}');
      if (resp is Map<String, dynamic> && resp['data'] != null) {
        setState(() {
          _content = resp['data'] as Map<String, dynamic>;
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

  Future<void> _launchUrl(String url) async {
    try {
      if (await canLaunchUrl(Uri.parse(url))) {
        await launchUrl(Uri.parse(url));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open URL: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Resource Detail'),
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(child: Text(_errorMessage!))
              : _content == null
                  ? const Center(child: Text('Content not found'))
                  : _buildContent(),
    );
  }

  Widget _buildContent() {
    final Map<String, dynamic> content = _content!;
    final String title = content['title'] as String? ?? 'Untitled';
    final String description = content['description'] as String? ?? '';
    final String contentType = content['contentType'] as String? ?? 'article';
    final String contentUrl = content['contentUrl'] as String? ?? '';
    final String category = content['category'] as String? ?? 'General';
    final List<dynamic> riskLevels = content['riskLevels'] as List? ?? [];

    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            // Title
            Text(
              title,
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),

            // Metadata
            Row(
              children: <Widget>[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.redAccent.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    contentType.toUpperCase(),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  category,
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Risk levels
            if (riskLevels.isNotEmpty)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Text(
                    'For Risk Levels:',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: riskLevels.map((level) {
                      final String riskLevel = level.toString();
                      return Chip(
                        label: Text(riskLevel),
                        side: const BorderSide(color: Colors.redAccent),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                ],
              ),

            // Description/Content
            if (description.isNotEmpty)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Text(
                    'Description',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    description,
                    style: const TextStyle(fontSize: 14, height: 1.6),
                  ),
                  const SizedBox(height: 16),
                ],
              ),

            // External link button
            if (contentUrl.isNotEmpty)
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.redAccent,
                  ),
                  icon: const Icon(Icons.open_in_new),
                  onPressed: () => _launchUrl(contentUrl),
                  label: Text(
                    _getLinkLabel(contentType),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _getLinkLabel(String contentType) {
    switch (contentType.toLowerCase()) {
      case 'video':
        return 'Watch Video';
      case 'article':
        return 'Read Article';
      case 'brochure':
        return 'Download Brochure';
      case 'exercise':
        return 'View Exercise';
      default:
        return 'Open Resource';
    }
  }
}
